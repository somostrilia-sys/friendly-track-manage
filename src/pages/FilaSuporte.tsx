import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useChamadosSuporte, useInsertChamadoSuporte, useUpdateChamadoSuporte, useDeleteChamadoSuporte, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbChamadoSuporte } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { Plus, Headphones, AlertTriangle, CheckCircle, Clock, Inbox, Pencil, Trash2, Eye, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const origemMap: Record<string, string> = { cobranca: "Cobranca", comercial: "Comercial", tecnico: "Tecnico", cliente: "Cliente" };
const tipoMap: Record<string, string> = { instalacao_urgente: "Instalacao Urgente", retirada: "Retirada", manutencao: "Manutencao", atualizacao_equipamento: "Atualizacao Equip.", suporte_app: "Suporte App" };
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  aberto: { label: "Aberto", variant: "outline" },
  em_atendimento: { label: "Em Atendimento", variant: "secondary" },
  resolvido: { label: "Resolvido", variant: "default" },
};

const prioridadeMap: Record<string, string> = { normal: "Normal", urgente: "Urgente" };

const defaultForm = {
  origem: "cliente" as DbChamadoSuporte["origem"],
  tipo: "manutencao" as DbChamadoSuporte["tipo"],
  descricao: "",
  cliente_nome: "",
  prioridade: "normal" as DbChamadoSuporte["prioridade"],
  responsavel: "",
};

function calcularSLA(dataCriacao: string): { texto: string; cor: string } {
  const criacao = new Date(dataCriacao);
  const agora = new Date();
  const diffMs = agora.getTime() - criacao.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);
  const diffDias = Math.floor(diffHoras / 24);
  const horasRestantes = Math.floor(diffHoras % 24);

  let texto: string;
  if (diffDias > 0) {
    texto = `ha ${diffDias}d ${horasRestantes}h`;
  } else if (diffHoras >= 1) {
    texto = `ha ${Math.floor(diffHoras)}h`;
  } else {
    const diffMin = Math.floor(diffMs / (1000 * 60));
    texto = `ha ${diffMin}min`;
  }

  let cor: string;
  if (diffHoras < 24) {
    cor = "text-green-600 bg-green-50";
  } else if (diffHoras < 48) {
    cor = "text-yellow-600 bg-yellow-50";
  } else {
    cor = "text-red-600 bg-red-50";
  }

  return { texto, cor };
}

const FilaSuporte = () => {
  const { data: chamados = [], isLoading } = useChamadosSuporte();
  const insertChamado = useInsertChamadoSuporte();
  const updateChamado = useUpdateChamadoSuporte();
  const deleteChamado = useDeleteChamadoSuporte();

  useRealtimeSubscription("chamados_suporte", ["chamados_suporte"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState("all");
  const [form, setForm] = useState({ ...defaultForm });
  const [editForm, setEditForm] = useState({ id: "", descricao: "", prioridade: "normal" as DbChamadoSuporte["prioridade"], responsavel: "" });
  const [selectedChamado, setSelectedChamado] = useState<DbChamadoSuporte | null>(null);
  const [chamadoToDelete, setChamadoToDelete] = useState<DbChamadoSuporte | null>(null);
  const [chamadoToAssign, setChamadoToAssign] = useState<DbChamadoSuporte | null>(null);
  const [assignResponsavel, setAssignResponsavel] = useState("");

  const filtrado = chamados.filter(c => filtroStatus === "all" || c.status === filtroStatus);

  const resetForm = () => setForm({ ...defaultForm });

  const salvar = async () => {
    if (!form.descricao || !form.cliente_nome) { toast.error("Preencha descricao e cliente"); return; }
    try {
      await insertChamado.mutateAsync({ ...form, codigo: `SUP-${Date.now()}`, status: "aberto", data_criacao: new Date().toISOString().split("T")[0] });
      setModalOpen(false);
      resetForm();
      toast.success("Chamado criado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const atualizar = async (id: string, status: DbChamadoSuporte["status"], extra?: Partial<DbChamadoSuporte>) => {
    try {
      await updateChamado.mutateAsync({ id, status, ...extra });
      toast.success("Status atualizado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const salvarEdicao = async () => {
    if (!editForm.descricao) { toast.error("Descricao e obrigatoria"); return; }
    try {
      await updateChamado.mutateAsync({
        id: editForm.id,
        descricao: editForm.descricao,
        prioridade: editForm.prioridade,
        responsavel: editForm.responsavel,
      });
      setEditModalOpen(false);
      toast.success("Chamado atualizado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const confirmarDelete = async () => {
    if (!chamadoToDelete) return;
    try {
      await deleteChamado.mutateAsync(chamadoToDelete.id);
      setDeleteDialogOpen(false);
      setChamadoToDelete(null);
      toast.success("Chamado excluido!");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAtender = (c: DbChamadoSuporte) => {
    setChamadoToAssign(c);
    setAssignResponsavel(c.responsavel || "");
    setAssignDialogOpen(true);
  };

  const confirmarAtender = async () => {
    if (!chamadoToAssign) return;
    try {
      await updateChamado.mutateAsync({
        id: chamadoToAssign.id,
        status: "em_atendimento" as DbChamadoSuporte["status"],
        responsavel: assignResponsavel,
      });
      setAssignDialogOpen(false);
      setChamadoToAssign(null);
      setAssignResponsavel("");
      toast.success("Chamado em atendimento!");
    } catch (e: any) { toast.error(e.message); }
  };

  const openEdit = (c: DbChamadoSuporte) => {
    setEditForm({ id: c.id, descricao: c.descricao, prioridade: c.prioridade, responsavel: c.responsavel });
    setEditModalOpen(true);
  };

  const openDelete = (c: DbChamadoSuporte) => {
    setChamadoToDelete(c);
    setDeleteDialogOpen(true);
  };

  const openDetail = (c: DbChamadoSuporte) => {
    setSelectedChamado(c);
    setDetailSheetOpen(true);
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Fila de Suporte" subtitle="Chamados e atendimentos" />
      <TableSkeleton rows={5} cols={9} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Fila de Suporte" subtitle="Chamados e atendimentos">
        <Button onClick={() => { resetForm(); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Chamado</Button>
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Abertos" value={chamados.filter(c => c.status === "aberto").length} icon={Clock} accent="warning" />
        <StatCard label="Em Atendimento" value={chamados.filter(c => c.status === "em_atendimento").length} icon={Headphones} accent="primary" />
        <StatCard label="Resolvidos" value={chamados.filter(c => c.status === "resolvido").length} icon={CheckCircle} accent="success" />
        <StatCard label="Urgentes" value={chamados.filter(c => c.prioridade === "urgente" && c.status !== "resolvido").length} icon={AlertTriangle} accent="destructive" />
      </div>
      <Card className="card-shadow">
        <div className="p-4 border-b flex gap-3">
          {(["all", "aberto", "em_atendimento", "resolvido"] as const).map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroStatus === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {s === "all" ? "Todos" : statusMap[s]?.label}
            </button>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead><TableHead>Origem</TableHead><TableHead>Tipo</TableHead><TableHead>Cliente</TableHead>
              <TableHead>Descricao</TableHead><TableHead>Prioridade</TableHead><TableHead>Responsavel</TableHead>
              <TableHead>Status</TableHead><TableHead>SLA</TableHead><TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
                  <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
                    <div className="rounded-full bg-muted/60 p-3">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Nenhum chamado na fila</p>
                    <p className="text-xs text-muted-foreground/60">Abra um novo chamado para comecar</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtrado.map(c => {
              const sla = c.status !== "resolvido" ? calcularSLA(c.data_criacao) : null;
              return (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(c)}>
                  <TableCell className="font-mono text-sm">{c.codigo}</TableCell>
                  <TableCell><Badge variant="secondary">{origemMap[c.origem]}</Badge></TableCell>
                  <TableCell className="text-sm">{tipoMap[c.tipo]}</TableCell>
                  <TableCell className="font-medium">{c.cliente_nome}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{c.descricao}</TableCell>
                  <TableCell><Badge variant={c.prioridade === "urgente" ? "destructive" : "outline"}>{c.prioridade === "urgente" ? "Urgente" : "Normal"}</Badge></TableCell>
                  <TableCell>{c.responsavel || <span className="text-muted-foreground text-xs">-</span>}</TableCell>
                  <TableCell><Badge variant={statusMap[c.status]?.variant}>{statusMap[c.status]?.label}</Badge></TableCell>
                  <TableCell>
                    {sla ? (
                      <span className={`text-xs font-medium px-2 py-1 rounded ${sla.cor}`}>{sla.texto}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {c.status === "aberto" && (
                        <Button size="sm" variant="outline" onClick={() => handleAtender(c)} title="Atender">
                          <Headphones className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {c.status === "em_atendimento" && (
                        <Button size="sm" variant="outline" onClick={() => atualizar(c.id, "resolvido")} title="Resolver">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {c.status === "resolvido" && (
                        <Button size="sm" variant="outline" onClick={() => atualizar(c.id, "aberto")} title="Reabrir">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)} title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openDelete(c)} title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Criar Chamado */}
      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Origem</Label>
              <Select value={form.origem} onValueChange={v => setForm(f => ({ ...f, origem: v as DbChamadoSuporte["origem"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(origemMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as DbChamadoSuporte["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tipoMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cliente</Label><Input value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} /></div>
            <div><Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v as DbChamadoSuporte["prioridade"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgente">Urgente</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Responsavel</Label><Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Descricao</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={insertChamado.isPending}>{insertChamado.isPending ? "Criando..." : "Criar Chamado"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Chamado */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Chamado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descricao</Label><Textarea value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} rows={3} /></div>
            <div><Label>Prioridade</Label>
              <Select value={editForm.prioridade} onValueChange={v => setEditForm(f => ({ ...f, prioridade: v as DbChamadoSuporte["prioridade"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgente">Urgente</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Responsavel</Label><Input value={editForm.responsavel} onChange={e => setEditForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={updateChamado.isPending}>{updateChamado.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Atribuir Responsavel ao Atender */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Atender Chamado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Atribuir responsavel para o chamado <strong>{chamadoToAssign?.codigo}</strong>
            </p>
            <div><Label>Responsavel</Label><Input value={assignResponsavel} onChange={e => setAssignResponsavel(e.target.value)} placeholder="Nome do responsavel" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmarAtender} disabled={updateChamado.isPending}>{updateChamado.isPending ? "Salvando..." : "Iniciar Atendimento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Confirmar Exclusao */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir chamado?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o chamado <strong>{chamadoToDelete?.codigo}</strong>? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet Detalhes do Chamado */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Chamado</SheetTitle>
            <SheetDescription>{selectedChamado?.codigo}</SheetDescription>
          </SheetHeader>
          {selectedChamado && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-2">
                <Badge variant={statusMap[selectedChamado.status]?.variant}>{statusMap[selectedChamado.status]?.label}</Badge>
                <Badge variant={selectedChamado.prioridade === "urgente" ? "destructive" : "outline"}>
                  {prioridadeMap[selectedChamado.prioridade]}
                </Badge>
                {selectedChamado.status !== "resolvido" && (() => {
                  const sla = calcularSLA(selectedChamado.data_criacao);
                  return <span className={`text-xs font-medium px-2 py-1 rounded ${sla.cor}`}>{sla.texto}</span>;
                })()}
              </div>

              <Separator />

              <div className="space-y-3">
                <DetailRow label="Cliente" value={selectedChamado.cliente_nome} />
                <DetailRow label="Origem" value={origemMap[selectedChamado.origem]} />
                <DetailRow label="Tipo" value={tipoMap[selectedChamado.tipo]} />
                <DetailRow label="Responsavel" value={selectedChamado.responsavel || "-"} />
                <DetailRow label="Data de Criacao" value={formatDate(selectedChamado.data_criacao)} />
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Descricao</p>
                <p className="text-sm whitespace-pre-wrap">{selectedChamado.descricao}</p>
              </div>

              <Separator />

              <div className="flex gap-2 flex-wrap">
                {selectedChamado.status === "aberto" && (
                  <Button size="sm" onClick={() => { setDetailSheetOpen(false); handleAtender(selectedChamado); }}>
                    <Headphones className="w-3.5 h-3.5 mr-1" /> Atender
                  </Button>
                )}
                {selectedChamado.status === "em_atendimento" && (
                  <Button size="sm" onClick={() => { atualizar(selectedChamado.id, "resolvido"); setDetailSheetOpen(false); }}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolver
                  </Button>
                )}
                {selectedChamado.status === "resolvido" && (
                  <Button size="sm" variant="outline" onClick={() => { atualizar(selectedChamado.id, "aberto"); setDetailSheetOpen(false); }}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reabrir
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => { setDetailSheetOpen(false); openEdit(selectedChamado); }}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setDetailSheetOpen(false); openDelete(selectedChamado); }}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default FilaSuporte;
