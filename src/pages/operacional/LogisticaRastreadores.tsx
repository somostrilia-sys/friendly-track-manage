import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useDespachos, useInsertDespacho, useUpdateDespacho, useDeleteDespacho,
  useEquipamentos, useInsertEquipamento, useUpdateEquipamento, useBulkInsertEquipamentos,
  useRealtimeSubscription,
} from "@/hooks/useSupabaseData";
import type { DbDespacho, DbEquipamento } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Package, Truck, CheckCircle, Clock, Plus, Search, Upload, Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { preparando: "Preparando", postado: "Postado", em_transito: "Em Transito", entregue: "Entregue", devolvido: "Devolvido" };
const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = { preparando: "outline", postado: "secondary", em_transito: "secondary", entregue: "default", devolvido: "destructive" };

const LogisticaRastreadores = () => {
  const { data: despachos = [], isLoading: loadingDespachos } = useDespachos();
  const insertDespacho = useInsertDespacho();
  const updateDespacho = useUpdateDespacho();
  const deleteDespacho = useDeleteDespacho();

  const { data: equipamentos = [], isLoading: loadingEquipamentos } = useEquipamentos();
  const insertEquipamento = useInsertEquipamento();
  const updateEquipamento = useUpdateEquipamento();
  const bulkInsertEquipamentos = useBulkInsertEquipamentos();

  useRealtimeSubscription("despachos_rastreadores", ["despachos_rastreadores"]);
  useRealtimeSubscription("equipamentos", ["equipamentos"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [filtroEquip, setFiltroEquip] = useState("");
  const [form, setForm] = useState({ rastreador_modelo: "J16 4G", serial: "", imei: "", destinatario: "", endereco_destino: "", cidade_destino: "", codigo_rastreio: "", unidade_destino: "", observacoes: "" });

  const [importModal, setImportModal] = useState(false);
  const [importForm, setImportForm] = useState({ imei: "", simCard: "", modelo: "J16 4G Arqia", localizacao: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Equipamentos em estoque (disponivel)
  const emEstoque = equipamentos.filter(e => e.tipo === "rastreador" && e.status === "disponivel");
  const emEstoqueFiltrados = emEstoque.filter(e =>
    (e.imei || "").toLowerCase().includes(filtroEquip.toLowerCase()) ||
    e.modelo.toLowerCase().includes(filtroEquip.toLowerCase()) ||
    e.serial.toLowerCase().includes(filtroEquip.toLowerCase())
  );

  const filtrados = despachos.filter(d =>
    d.serial.toLowerCase().includes(filtro.toLowerCase()) ||
    d.destinatario.toLowerCase().includes(filtro.toLowerCase()) ||
    d.codigo_rastreio.toLowerCase().includes(filtro.toLowerCase())
  );

  const salvar = async () => {
    if (!form.serial || !form.destinatario) { toast.error("Preencha serial e destinatario"); return; }
    try {
      await insertDespacho.mutateAsync({ ...form, codigo: `DSP-${Date.now()}`, data_envio: new Date().toISOString().split("T")[0], status_entrega: "preparando" });
      // Try to mark matching equipamento as installed (dispatched)
      const match = equipamentos.find(e => e.serial === form.serial && e.status === "disponivel");
      if (match) {
        await updateEquipamento.mutateAsync({ id: match.id, status: "instalado" });
      }
      setModalOpen(false);
      setForm({ rastreador_modelo: "J16 4G", serial: "", imei: "", destinatario: "", endereco_destino: "", cidade_destino: "", codigo_rastreio: "", unidade_destino: "", observacoes: "" });
      toast.success("Despacho registrado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const atualizarStatus = async (id: string, status: DbDespacho["status_entrega"]) => {
    try {
      await updateDespacho.mutateAsync({ id, status_entrega: status });
      toast.success("Status atualizado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const excluirDespacho = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDespacho.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
      toast.success("Despacho excluido!");
    } catch (e: any) { toast.error(e.message); }
  };

  const entregues = despachos.filter(d => d.status_entrega === "entregue").length;
  const emTransito = despachos.filter(d => d.status_entrega === "em_transito" || d.status_entrega === "postado").length;
  const preparando = despachos.filter(d => d.status_entrega === "preparando").length;

  const salvarRastreador = async () => {
    if (!importForm.imei) { toast.error("Preencha o IMEI"); return; }
    try {
      await insertEquipamento.mutateAsync({
        tipo: "rastreador",
        modelo: importForm.modelo,
        marca: "",
        serial: importForm.imei,
        imei: importForm.imei,
        sim_card: importForm.simCard || null,
        iccid: null,
        custo: 0,
        preco: 0,
        quantidade: 1,
        status: "disponivel",
        localizacao: importForm.localizacao || "Estoque",
        cliente_id: null,
      });
      setImportModal(false);
      setImportForm({ imei: "", simCard: "", modelo: "J16 4G Arqia", localizacao: "" });
      toast.success("Rastreador cadastrado no estoque!");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const novos: Partial<DbEquipamento>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/);
        if (cols.length < 1 || !cols[0].trim()) continue;
        const imei = cols[0].trim();
        const simCard = cols.length > 1 ? cols[1].trim() : "";
        const modelo = cols.length > 2 && cols[2].trim() ? cols[2].trim() : "J16 4G Arqia";
        const localizacao = cols.length > 3 && cols[3].trim() ? cols[3].trim() : "Estoque";
        novos.push({
          tipo: "rastreador",
          modelo,
          marca: "",
          serial: imei,
          imei,
          sim_card: simCard || null,
          iccid: null,
          custo: 0,
          preco: 0,
          quantidade: 1,
          status: "disponivel",
          localizacao,
          cliente_id: null,
        });
      }
      if (novos.length === 0) { toast.error("Nenhum rastreador encontrado no CSV"); return; }
      try {
        await bulkInsertEquipamentos.mutateAsync(novos);
        toast.success(`${novos.length} rastreadores importados para o estoque!`);
      } catch (err: any) {
        toast.error(`Erro ao importar: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const gerarCSVPlataforma = () => {
    if (emEstoque.length === 0) { toast.error("Nenhum rastreador em estoque"); return; }
    const headers = "name,imei,icon_id,users,timezone,sim_number,device_model,plate_number";
    const rows = emEstoque.map((r, i) => `Rastreador ${i + 1},${r.imei},1,,America/Sao_Paulo,${r.sim_card || ""},${r.modelo},`);
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `importacao-plataforma-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV para plataforma gerado!");
  };

  const isLoading = loadingDespachos || loadingEquipamentos;

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Logistica de Rastreadores" subtitle="Controle de despacho, entrega e importacao de dispositivos" />
      <TableSkeleton rows={5} cols={8} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Logistica de Rastreadores" subtitle="Controle de despacho, entrega e importacao de dispositivos" />
      <Tabs defaultValue="despachos" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="despachos">Despachos</TabsTrigger>
          <TabsTrigger value="importacao">Estoque Rastreadores</TabsTrigger>
        </TabsList>

        {/* === DESPACHOS TAB === */}
        <TabsContent value="despachos">
          <div className="space-y-6">
            <div className="flex items-center justify-end"><Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Despacho</Button></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Despachos" value={despachos.length} icon={Package} accent="primary" />
              <StatCard label="Em Transito" value={emTransito} icon={Truck} accent="warning" />
              <StatCard label="Entregues" value={entregues} icon={CheckCircle} accent="success" />
              <StatCard label="Preparando" value={preparando} icon={Clock} accent="muted" />
            </div>
            <Card className="p-4 card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por serial, destinatario ou rastreio..." value={filtro} onChange={e => setFiltro(e.target.value)} className="max-w-sm" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead><TableHead>Modelo</TableHead><TableHead>Destinatario</TableHead>
                    <TableHead>Unidade</TableHead><TableHead>Codigo Rastreio</TableHead><TableHead>Data Envio</TableHead>
                    <TableHead>Status</TableHead><TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.serial}</TableCell>
                      <TableCell>{d.rastreador_modelo}</TableCell>
                      <TableCell>{d.destinatario}</TableCell>
                      <TableCell className="text-sm">{d.unidade_destino}</TableCell>
                      <TableCell className="font-mono text-sm">{d.codigo_rastreio}</TableCell>
                      <TableCell>{d.data_envio}</TableCell>
                      <TableCell><Badge variant={statusVariants[d.status_entrega]}>{statusLabels[d.status_entrega]}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {d.status_entrega === "preparando" && <Button size="sm" variant="outline" onClick={() => atualizarStatus(d.id, "postado")}>Postar</Button>}
                          {d.status_entrega === "postado" && <Button size="sm" variant="outline" onClick={() => atualizarStatus(d.id, "em_transito")}>Em Transito</Button>}
                          {d.status_entrega === "em_transito" && <Button size="sm" onClick={() => atualizarStatus(d.id, "entregue")}>Entregue</Button>}
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(d.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        {/* === ESTOQUE / IMPORTACAO TAB === */}
        <TabsContent value="importacao">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
                <Button variant="outline" onClick={gerarCSVPlataforma} disabled={emEstoque.length === 0}><Download className="w-4 h-4 mr-2" /> Gerar CSV Plataforma</Button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVUpload} />
              </div>
              <Button onClick={() => setImportModal(true)}><Plus className="w-4 h-4 mr-2" /> Cadastro Individual</Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Em Estoque" value={emEstoque.length} icon={Package} accent="primary" />
              <StatCard label="Total Equipamentos" value={equipamentos.filter(e => e.tipo === "rastreador").length} icon={Package} accent="muted" />
              <StatCard label="Despachados" value={equipamentos.filter(e => e.tipo === "rastreador" && e.status === "instalado").length} icon={Truck} accent="success" />
            </div>

            <Card className="p-4 card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por IMEI, modelo ou serial..." value={filtroEquip} onChange={e => setFiltroEquip(e.target.value)} className="max-w-sm" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">CSV de entrada: IMEI;SIM;Modelo;Localizacao</p>
              {emEstoque.length === 0 ? (
                <div className="py-12 text-center"><FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhum rastreador em estoque.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>IMEI</TableHead><TableHead>SIM</TableHead><TableHead>Modelo</TableHead><TableHead>Localizacao</TableHead><TableHead>Serial</TableHead></TableRow></TableHeader>
                  <TableBody>{emEstoqueFiltrados.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.imei}</TableCell>
                      <TableCell className="font-mono text-sm">{r.sim_card}</TableCell>
                      <TableCell>{r.modelo}</TableCell>
                      <TableCell>{r.localizacao}</TableCell>
                      <TableCell className="font-mono text-sm">{r.serial}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* === NOVO DESPACHO MODAL === */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Despacho</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Modelo</Label>
              <Select value={form.rastreador_modelo} onValueChange={v => setForm(f => ({ ...f, rastreador_modelo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="J16 4G">J16 4G</SelectItem><SelectItem value="ST4955">ST4955</SelectItem><SelectItem value="GV300">GV300</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Serial</Label><Input value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))} /></div>
            <div><Label>IMEI</Label><Input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>Destinatario</Label><Input value={form.destinatario} onChange={e => setForm(f => ({ ...f, destinatario: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Endereco Destino</Label><Input value={form.endereco_destino} onChange={e => setForm(f => ({ ...f, endereco_destino: e.target.value }))} /></div>
            <div><Label>Cidade</Label><Input value={form.cidade_destino} onChange={e => setForm(f => ({ ...f, cidade_destino: e.target.value }))} /></div>
            <div><Label>Unidade Destino</Label><Input value={form.unidade_destino} onChange={e => setForm(f => ({ ...f, unidade_destino: e.target.value }))} /></div>
            <div><Label>Codigo Rastreio</Label><Input value={form.codigo_rastreio} onChange={e => setForm(f => ({ ...f, codigo_rastreio: e.target.value }))} /></div>
            <div><Label>Observacoes</Label><Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={salvar}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === CADASTRO INDIVIDUAL MODAL === */}
      <Dialog open={importModal} onOpenChange={setImportModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastro Individual de Rastreador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>IMEI</Label><Input value={importForm.imei} onChange={e => setImportForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>Numero SIM</Label><Input value={importForm.simCard} onChange={e => setImportForm(f => ({ ...f, simCard: e.target.value }))} /></div>
            <div><Label>Modelo</Label>
              <Select value={importForm.modelo} onValueChange={v => setImportForm(f => ({ ...f, modelo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="J16 4G Arqia">J16 4G Arqia</SelectItem><SelectItem value="ST4955 Suntech">ST4955 Suntech</SelectItem><SelectItem value="GV300 Queclink">GV300 Queclink</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Localizacao</Label><Input placeholder="Estoque" value={importForm.localizacao} onChange={e => setImportForm(f => ({ ...f, localizacao: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setImportModal(false)}>Cancelar</Button><Button onClick={salvarRastreador}>Cadastrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === DELETE CONFIRMATION MODAL === */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusao</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este despacho? Esta acao nao pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={excluirDespacho}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogisticaRastreadores;
