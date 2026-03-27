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
import { useDespachos, useInsertDespacho, useUpdateDespacho } from "@/hooks/useSupabaseData";
import type { DbDespacho } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Package, Truck, CheckCircle, Clock, Plus, Search, Upload, Download, FileSpreadsheet } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface RastreadorImport { id: string; imei: string; simNumber: string; modelo: string; usuarioDestino: string; dataCadastro: string; }
interface HistoricoImport { id: string; data: string; quantidade: number; arquivo: string; }

const statusLabels: Record<string, string> = { preparando: "Preparando", postado: "Postado", em_transito: "Em Transito", entregue: "Entregue", devolvido: "Devolvido" };
const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = { preparando: "outline", postado: "secondary", em_transito: "secondary", entregue: "default", devolvido: "destructive" };

const LogisticaRastreadores = () => {
  const { data: despachos = [], isLoading } = useDespachos();
  const insertDespacho = useInsertDespacho();
  const updateDespacho = useUpdateDespacho();

  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [form, setForm] = useState({ rastreador_modelo: "J16 4G", serial: "", imei: "", destinatario: "", endereco_destino: "", cidade_destino: "", codigo_rastreio: "", unidade_destino: "", observacoes: "" });

  const [rastreadores, setRastreadores] = useState<RastreadorImport[]>([]);
  const [importModal, setImportModal] = useState(false);
  const [importForm, setImportForm] = useState({ imei: "", simNumber: "", modelo: "J16 4G Arqia", usuarioDestino: "" });
  const [historico, setHistorico] = useState<HistoricoImport[]>([
    { id: "IMP-001", data: "2024-03-05", quantidade: 15, arquivo: "lote-sp-marco.csv" },
    { id: "IMP-002", data: "2024-03-07", quantidade: 8, arquivo: "lote-rj-marco.csv" },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtrados = despachos.filter(d =>
    d.serial.toLowerCase().includes(filtro.toLowerCase()) ||
    d.destinatario.toLowerCase().includes(filtro.toLowerCase()) ||
    d.codigo_rastreio.toLowerCase().includes(filtro.toLowerCase())
  );

  const salvar = async () => {
    if (!form.serial || !form.destinatario) { toast.error("Preencha serial e destinatario"); return; }
    try {
      await insertDespacho.mutateAsync({ ...form, codigo: `DSP-${Date.now()}`, data_envio: new Date().toISOString().split("T")[0], status_entrega: "preparando" });
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

  const entregues = despachos.filter(d => d.status_entrega === "entregue").length;
  const emTransito = despachos.filter(d => d.status_entrega === "em_transito" || d.status_entrega === "postado").length;
  const preparando = despachos.filter(d => d.status_entrega === "preparando").length;

  const salvarRastreador = () => {
    if (!importForm.imei || !importForm.usuarioDestino) { toast.error("Preencha IMEI e usuario destino"); return; }
    setRastreadores(prev => [...prev, { ...importForm, id: `RAT-${Date.now()}`, dataCadastro: new Date().toISOString().split("T")[0] }]);
    setImportModal(false);
    setImportForm({ imei: "", simNumber: "", modelo: "J16 4G Arqia", usuarioDestino: "" });
    toast.success("Rastreador cadastrado!");
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const novos: RastreadorImport[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/);
        if (cols.length < 4) continue;
        novos.push({ id: `RAT-${Date.now()}-${i}`, imei: cols[0].trim(), simNumber: cols[1].trim(), modelo: cols[2].trim(), usuarioDestino: cols[3].trim(), dataCadastro: new Date().toISOString().split("T")[0] });
      }
      setRastreadores(prev => [...prev, ...novos]);
      setHistorico(prev => [...prev, { id: `IMP-${Date.now()}`, data: new Date().toISOString().split("T")[0], quantidade: novos.length, arquivo: file.name }]);
      toast.success(`${novos.length} rastreadores importados!`);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const gerarCSVPlataforma = () => {
    if (rastreadores.length === 0) { toast.error("Nenhum rastreador cadastrado"); return; }
    const headers = "name,imei,icon_id,users,timezone,sim_number,device_model,plate_number";
    const rows = rastreadores.map((r, i) => `Rastreador ${i + 1},${r.imei},1,${r.usuarioDestino},America/Sao_Paulo,${r.simNumber},${r.modelo},`);
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `importacao-plataforma-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV para plataforma gerado!");
  };

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
          <TabsTrigger value="importacao">Importacao em Massa</TabsTrigger>
          <TabsTrigger value="historico">Historico Importacoes</TabsTrigger>
        </TabsList>
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
                        {d.status_entrega === "preparando" && <Button size="sm" variant="outline" onClick={() => atualizarStatus(d.id, "postado")}>Postar</Button>}
                        {d.status_entrega === "postado" && <Button size="sm" variant="outline" onClick={() => atualizarStatus(d.id, "em_transito")}>Em Transito</Button>}
                        {d.status_entrega === "em_transito" && <Button size="sm" onClick={() => atualizarStatus(d.id, "entregue")}>Entregue</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="importacao">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
                <Button variant="outline" onClick={gerarCSVPlataforma} disabled={rastreadores.length === 0}><Download className="w-4 h-4 mr-2" /> Gerar CSV Plataforma</Button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVUpload} />
              </div>
              <Button onClick={() => setImportModal(true)}><Plus className="w-4 h-4 mr-2" /> Cadastro Individual</Button>
            </div>
            <Card className="p-4 card-shadow">
              <p className="text-xs text-muted-foreground mb-3">CSV de entrada: IMEI;SIM;Modelo;UsuarioDestino</p>
              {rastreadores.length === 0 ? (
                <div className="py-12 text-center"><FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhum rastreador cadastrado.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>IMEI</TableHead><TableHead>SIM</TableHead><TableHead>Modelo</TableHead><TableHead>Usuario Destino</TableHead><TableHead>Data Cadastro</TableHead></TableRow></TableHeader>
                  <TableBody>{rastreadores.map(r => (<TableRow key={r.id}><TableCell className="font-mono text-sm">{r.imei}</TableCell><TableCell className="font-mono text-sm">{r.simNumber}</TableCell><TableCell>{r.modelo}</TableCell><TableCell>{r.usuarioDestino}</TableCell><TableCell>{r.dataCadastro}</TableCell></TableRow>))}</TableBody>
                </Table>
              )}
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="historico">
          <Card className="card-shadow">
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Data</TableHead><TableHead>Quantidade</TableHead><TableHead>Arquivo</TableHead></TableRow></TableHeader>
              <TableBody>{historico.map(h => (<TableRow key={h.id}><TableCell className="font-mono text-sm">{h.id}</TableCell><TableCell>{h.data}</TableCell><TableCell><Badge variant="secondary">{h.quantidade} dispositivos</Badge></TableCell><TableCell className="font-mono text-sm">{h.arquivo}</TableCell></TableRow>))}</TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
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
      <Dialog open={importModal} onOpenChange={setImportModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastro Individual de Rastreador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>IMEI</Label><Input value={importForm.imei} onChange={e => setImportForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>Numero SIM</Label><Input value={importForm.simNumber} onChange={e => setImportForm(f => ({ ...f, simNumber: e.target.value }))} /></div>
            <div><Label>Modelo</Label>
              <Select value={importForm.modelo} onValueChange={v => setImportForm(f => ({ ...f, modelo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="J16 4G Arqia">J16 4G Arqia</SelectItem><SelectItem value="ST4955 Suntech">ST4955 Suntech</SelectItem><SelectItem value="GV300 Queclink">GV300 Queclink</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Usuario Destino</Label><Input value={importForm.usuarioDestino} onChange={e => setImportForm(f => ({ ...f, usuarioDestino: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setImportModal(false)}>Cancelar</Button><Button onClick={salvarRastreador}>Cadastrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogisticaRastreadores;
