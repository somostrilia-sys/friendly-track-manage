import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEquipamentosCompletos, useInsertEquipamento, useUpdateEquipamento, useDeleteEquipamento, useInsertMovimentacao, useInsertComodato, useTecnicos, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbEquipamento, DbMovimentacao, DbComodato } from "@/types/database";
import { Plus, Package, CheckCircle, AlertTriangle, XCircle, Eye, Search, Upload, Download, Inbox } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { FilialSelect } from "@/components/FilialSelect";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  disponivel: { label: "Disponivel", variant: "default" },
  instalado: { label: "Instalado", variant: "secondary" },
  manutencao: { label: "Manutencao", variant: "outline" },
  defeito: { label: "Defeito", variant: "destructive" },
};
const tipoMap: Record<string, string> = { rastreador: "Rastreador", sensor: "Sensor", camera: "Camera", bloqueador: "Bloqueador", acessorio: "Acessorio", sim: "SIM Card" };

const emptyForm = { tipo: "rastreador" as DbEquipamento["tipo"], modelo: "", marca: "", serial: "", imei: "", sim_card: "", iccid: "", custo: 0, preco: 0, quantidade: 1, status: "disponivel" as DbEquipamento["status"], localizacao: "Estoque Central SP" };

type EquipComDetalhes = DbEquipamento & { movimentacoes: DbMovimentacao[]; comodatos: DbComodato[] };

const Estoque = () => {
  const { data: equipamentos = [], isLoading } = useEquipamentosCompletos();
  const { data: tecnicos = [] } = useTecnicos();
  const insertEquipamento = useInsertEquipamento();
  const updateEquipamento = useUpdateEquipamento();
  const deleteEquipamento = useDeleteEquipamento();
  const insertMovimentacao = useInsertMovimentacao();
  const insertComodato = useInsertComodato();

  useRealtimeSubscription("equipamentos", ["equipamentos", "equipamentos_completos"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [comodatoModal, setComodatoModal] = useState(false);
  const [detalhe, setDetalhe] = useState<EquipComDetalhes | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [buscaImei, setBuscaImei] = useState("");
  const [comodatoForm, setComodatoForm] = useState({ destino_tipo: "tecnico" as "tecnico" | "filial", destino_nome: "", quantidade: 1, codigo_rastreio: "" });
  const [comodatoEquipId, setComodatoEquipId] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const eqs = equipamentos as EquipComDetalhes[];
  const disponivel = eqs.filter(e => e.status === "disponivel").length;
  const instalado = eqs.filter(e => e.status === "instalado").length;
  const manutencao = eqs.filter(e => e.status === "manutencao").length;
  const defeito = eqs.filter(e => e.status === "defeito").length;

  const filtrado = buscaImei
    ? eqs.filter(e => e.imei?.includes(buscaImei) || e.serial.includes(buscaImei) || e.iccid?.includes(buscaImei))
    : eqs;

  const abrirEdicao = (eq: EquipComDetalhes) => {
    setForm({ tipo: eq.tipo, modelo: eq.modelo, marca: eq.marca, serial: eq.serial, imei: eq.imei || "", sim_card: eq.sim_card || "", iccid: eq.iccid || "", custo: eq.custo, preco: eq.preco, quantidade: eq.quantidade, status: eq.status, localizacao: eq.localizacao });
    setEditId(eq.id);
    setEditMode(true);
    setModalOpen(true);
    setDetalhe(null);
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este equipamento?")) return;
    try {
      await deleteEquipamento.mutateAsync(id);
      setDetalhe(null);
      toast.success("Equipamento excluido!");
    } catch (e: any) { toast.error(e.message); }
  };

  const salvar = async () => {
    if (!form.modelo || !form.marca) { toast.error("Preencha modelo e marca"); return; }
    try {
      if (editMode && editId) {
        await updateEquipamento.mutateAsync({ id: editId, ...form } as any);
        toast.success("Equipamento atualizado!");
      } else {
        const serial = form.serial || `${form.tipo.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        await insertEquipamento.mutateAsync({ ...form, serial });
        toast.success("Produto adicionado ao estoque!");
      }
      setForm(emptyForm);
      setEditMode(false);
      setEditId(null);
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const abrirComodato = (eqId: string) => {
    setComodatoEquipId(eqId);
    setComodatoForm({ destino_tipo: "tecnico", destino_nome: "", quantidade: 1, codigo_rastreio: "" });
    setComodatoModal(true);
  };

  const salvarComodato = async () => {
    if (!comodatoForm.destino_nome) { toast.error("Preencha o destino"); return; }
    try {
      await insertComodato.mutateAsync({
        equipamento_id: comodatoEquipId,
        ...comodatoForm,
        data_envio: new Date().toISOString().split("T")[0],
        status: "enviado",
      });
      await insertMovimentacao.mutateAsync({
        equipamento_id: comodatoEquipId,
        data: new Date().toISOString().split("T")[0],
        tipo: "saida_comodato",
        descricao: `Comodato: ${comodatoForm.quantidade}x para ${comodatoForm.destino_nome}`,
      });
      setComodatoModal(false);
      toast.success("Comodato registrado!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const baixarTemplate = () => {
    const csv = "imei_rastreador;modelo_rastreador;sim_card;iccid;numero_sim";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template-estoque.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.info("Template CSV baixado!");
  };

  const importarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/);
        if (cols.length < 2) continue;
        try {
          await insertEquipamento.mutateAsync({
            tipo: "rastreador", modelo: cols[1]?.trim() || "J16 4G", marca: "Trackit",
            serial: `IMP-${Date.now().toString().slice(-4)}-${i}`, imei: cols[0]?.trim() || "",
            sim_card: cols[2]?.trim() || "", iccid: cols[3]?.trim() || "",
            custo: 0, preco: 0, quantidade: 1, status: "disponivel", localizacao: "Estoque Central SP",
          });
          count++;
        } catch { /* skip */ }
      }
      toast.success(`${count} itens importados!`);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Estoque" subtitle="Rastreadores, sensores e equipamentos" />
      <TableSkeleton rows={6} cols={9} />
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Estoque" subtitle="Rastreadores, sensores e equipamentos">
        <Button variant="outline" onClick={baixarTemplate}><Download className="w-4 h-4 mr-2" /> Template CSV</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
        <Button onClick={() => { setForm(emptyForm); setEditMode(false); setEditId(null); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Adicionar Produto</Button>
      </PageHeader>
      <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={importarCSV} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Disponivel" value={disponivel} icon={Package} accent="success" />
        <StatCard label="Instalado" value={instalado} icon={CheckCircle} accent="primary" />
        <StatCard label="Manutencao" value={manutencao} icon={AlertTriangle} accent="warning" />
        <StatCard label="Defeito" value={defeito} icon={XCircle} accent="destructive" />
      </div>

      <Card className="p-4 card-shadow">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Busca rapida por IMEI, Serial ou ICCID..." value={buscaImei} onChange={e => setBuscaImei(e.target.value)} className="max-w-md" />
          {buscaImei && <Button variant="outline" size="sm" onClick={() => setBuscaImei("")}>Limpar</Button>}
        </div>
      </Card>

      <Card className="card-shadow overflow-hidden">
        {filtrado.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>SIM/ICCID</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.map(e => (
                <TableRow key={e.id}>
                  <TableCell><Badge variant="secondary">{tipoMap[e.tipo] || e.tipo}</Badge></TableCell>
                  <TableCell>{e.marca}</TableCell>
                  <TableCell className="font-medium">{e.modelo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{e.serial}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{e.imei || "--"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{e.iccid || e.sim_card || "--"}</TableCell>
                  <TableCell>{e.quantidade}</TableCell>
                  <TableCell><Badge variant={statusMap[e.status]?.variant}>{statusMap[e.status]?.label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1 row-actions">
                      <Button size="icon" variant="ghost" onClick={() => setDetalhe(e)}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => abrirComodato(e.id)}>Comodato</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add Product Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editMode ? "Editar Produto" : "Adicionar Produto ao Estoque"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as DbEquipamento["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tipoMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Marca</Label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
            <div><Label>Modelo</Label><Input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} /></div>
            <div><Label>Serial</Label><Input value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))} placeholder="Auto-gerado" /></div>
            <div><Label>IMEI Rastreador</Label><Input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>SIM Card</Label><Input value={form.sim_card} onChange={e => setForm(f => ({ ...f, sim_card: e.target.value }))} /></div>
            <div><Label>ICCID da Linha</Label><Input value={form.iccid} onChange={e => setForm(f => ({ ...f, iccid: e.target.value }))} /></div>
            <div><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: +e.target.value }))} /></div>
            <div><Label>Custo (R$)</Label><Input type="number" value={form.custo} onChange={e => setForm(f => ({ ...f, custo: +e.target.value }))} /></div>
            <div><Label>Preco (R$)</Label><Input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: +e.target.value }))} /></div>
            <div className="col-span-2"><Label>Localizacao</Label><Input value={form.localizacao} onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); setEditMode(false); setEditId(null); }}>Cancelar</Button>
            <Button onClick={salvar}>{editMode ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comodato Modal */}
      <Dialog open={comodatoModal} onOpenChange={setComodatoModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Comodato / Saida</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Destino</Label>
              <Select value={comodatoForm.destino_tipo} onValueChange={v => setComodatoForm(f => ({ ...f, destino_tipo: v as "tecnico" | "filial" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="tecnico">Tecnico</SelectItem><SelectItem value="filial">Filial</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Nome do Destino</Label>
              {comodatoForm.destino_tipo === "tecnico" ? (
                <Select value={comodatoForm.destino_nome} onValueChange={v => setComodatoForm(f => ({ ...f, destino_nome: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <FilialSelect value={comodatoForm.destino_nome} onValueChange={v => setComodatoForm(f => ({ ...f, destino_nome: v }))} placeholder="Selecione a filial" />
              )}
            </div>
            <div><Label>Quantidade</Label><Input type="number" value={comodatoForm.quantidade} onChange={e => setComodatoForm(f => ({ ...f, quantidade: +e.target.value }))} /></div>
            <div><Label>Codigo Rastreio (Correios)</Label><Input value={comodatoForm.codigo_rastreio} onChange={e => setComodatoForm(f => ({ ...f, codigo_rastreio: e.target.value }))} placeholder="BR000000000XX" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComodatoModal(false)}>Cancelar</Button>
            <Button onClick={salvarComodato}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>{detalhe.marca} {detalhe.modelo}</SheetTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => abrirEdicao(detalhe)}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => excluir(detalhe.id)}>Excluir</Button>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tipo</span><p className="font-medium">{tipoMap[detalhe.tipo]}</p></div>
                  <div><span className="text-muted-foreground">Serial</span><p className="font-mono">{detalhe.serial}</p></div>
                  <div><span className="text-muted-foreground">IMEI</span><p className="font-mono">{detalhe.imei || "--"}</p></div>
                  <div><span className="text-muted-foreground">SIM Card</span><p className="font-mono">{detalhe.sim_card || "--"}</p></div>
                  <div><span className="text-muted-foreground">ICCID</span><p className="font-mono">{detalhe.iccid || "--"}</p></div>
                  <div><span className="text-muted-foreground">Quantidade</span><p>{detalhe.quantidade}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusMap[detalhe.status]?.variant}>{statusMap[detalhe.status]?.label}</Badge></p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Localizacao</span><p>{detalhe.localizacao}</p></div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Comodatos</h4>
                  {detalhe.comodatos.length === 0 ? <p className="text-muted-foreground">Nenhum comodato registrado.</p> : (
                    <div className="space-y-2">
                      {detalhe.comodatos.map(c => (
                        <div key={c.id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{c.destino_nome}</span>
                            <Badge variant="outline">{c.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.quantidade}x - Envio: {c.data_envio} {c.codigo_rastreio && `- Rastreio: ${c.codigo_rastreio}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Historico de Movimentacoes</h4>
                  {detalhe.movimentacoes.length === 0 ? <p className="text-muted-foreground">Nenhuma movimentacao registrada.</p> : (
                    <div className="space-y-2">
                      {detalhe.movimentacoes.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <Badge variant="outline">{m.tipo}</Badge>
                          <div><p className="text-xs">{m.descricao}</p><p className="text-xs text-muted-foreground">{m.data}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Estoque;
