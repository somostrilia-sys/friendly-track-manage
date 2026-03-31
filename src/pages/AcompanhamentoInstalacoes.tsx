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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useInstalacoes, useInsertInstalacao, useUpdateInstalacao, useDeleteInstalacao, useTecnicos, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbInstalacao } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { Plus, ClipboardCheck, Clock, AlertTriangle, CheckCircle, Inbox, Eye, Pencil, Trash2, Play, XCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  aguardando: { label: "Aguardando", variant: "outline" },
  em_andamento: { label: "Em Andamento", variant: "secondary" },
  concluida: { label: "Concluida", variant: "default" },
  problema: { label: "Problema", variant: "destructive" },
};

const emptyForm = { placa: "", imei: "", chip: "", filial: "", tecnico_id: "" as string | null, data: "" };

const AcompanhamentoInstalacoes = () => {
  const { data: instalacoes = [], isLoading } = useInstalacoes();
  const { data: tecnicos = [] } = useTecnicos();
  const insertInstalacao = useInsertInstalacao();
  const updateInstalacao = useUpdateInstalacao();
  const deleteInstalacao = useDeleteInstalacao();

  useRealtimeSubscription("instalacoes", ["instalacoes"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [filtroTecnico, setFiltroTecnico] = useState("all");
  const [filtroData, setFiltroData] = useState("");
  const [form, setForm] = useState(emptyForm);

  // Status transition dialog
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; instalacao: DbInstalacao | null; targetStatus: string }>({ open: false, instalacao: null, targetStatus: "" });
  const [localizacao, setLocalizacao] = useState("");

  // Detail sheet
  const [detalhe, setDetalhe] = useState<DbInstalacao | null>(null);

  // Edit dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; placa: string }>({ open: false, id: "", placa: "" });

  const filtrado = instalacoes.filter(i => {
    if (filtroStatus !== "all" && i.status !== filtroStatus) return false;
    if (filtroTecnico !== "all" && i.tecnico_id !== filtroTecnico) return false;
    if (filtroData && i.data !== filtroData) return false;
    return true;
  });

  // Status transitions
  const openStatusTransition = (inst: DbInstalacao, target: string) => {
    setLocalizacao(inst.localizacao_confirmacao || "");
    setStatusDialog({ open: true, instalacao: inst, targetStatus: target });
  };

  const confirmarTransicao = async () => {
    if (!statusDialog.instalacao) return;
    const { id } = statusDialog.instalacao;
    const target = statusDialog.targetStatus;
    try {
      const updates: Partial<DbInstalacao> & { id: string } = { id, status: target as DbInstalacao["status"] };
      if (target === "concluida") {
        updates.localizacao_confirmacao = localizacao;
      }
      await updateInstalacao.mutateAsync(updates);
      toast.success(`Status atualizado para ${statusMap[target]?.label}`);
      // Update detail view if open
      if (detalhe?.id === id) {
        setDetalhe(prev => prev ? { ...prev, status: target as DbInstalacao["status"], ...(target === "concluida" ? { localizacao_confirmacao: localizacao } : {}) } : null);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setStatusDialog({ open: false, instalacao: null, targetStatus: "" });
    setLocalizacao("");
  };

  // Create
  const salvar = async () => {
    if (!form.placa || !form.imei) { toast.error("Preencha placa e IMEI"); return; }
    const tec = tecnicos.find(t => t.id === form.tecnico_id);
    try {
      await insertInstalacao.mutateAsync({
        ...form, codigo: `INST-${Date.now()}`, tecnico_nome: tec?.nome || "", status: "aguardando",
        data: form.data || new Date().toISOString().split("T")[0], localizacao_confirmacao: "",
      });
      setModalOpen(false);
      setForm(emptyForm);
      toast.success("Instalacao registrada!");
    } catch (e: any) { toast.error(e.message); }
  };

  // Edit
  const abrirEdicao = (inst: DbInstalacao) => {
    setEditId(inst.id);
    setEditForm({
      placa: inst.placa,
      imei: inst.imei,
      chip: inst.chip,
      filial: inst.filial,
      tecnico_id: inst.tecnico_id,
      data: inst.data,
    });
    setEditDialog(true);
  };

  const salvarEdicao = async () => {
    if (!editId) return;
    if (!editForm.placa || !editForm.imei) { toast.error("Preencha placa e IMEI"); return; }
    const tec = tecnicos.find(t => t.id === editForm.tecnico_id);
    try {
      await updateInstalacao.mutateAsync({
        id: editId,
        placa: editForm.placa,
        imei: editForm.imei,
        chip: editForm.chip,
        filial: editForm.filial,
        tecnico_id: editForm.tecnico_id,
        tecnico_nome: tec?.nome || "",
        data: editForm.data,
      });
      setEditDialog(false);
      setEditId(null);
      // Refresh detail view if same item
      if (detalhe?.id === editId) {
        setDetalhe(prev => prev ? {
          ...prev,
          placa: editForm.placa,
          imei: editForm.imei,
          chip: editForm.chip,
          filial: editForm.filial,
          tecnico_id: editForm.tecnico_id,
          tecnico_nome: tec?.nome || "",
          data: editForm.data,
        } : null);
      }
      toast.success("Instalacao atualizada!");
    } catch (e: any) { toast.error(e.message); }
  };

  // Delete
  const confirmarDelete = async () => {
    try {
      await deleteInstalacao.mutateAsync(deleteDialog.id);
      if (detalhe?.id === deleteDialog.id) setDetalhe(null);
      toast.success("Instalacao removida!");
    } catch (e: any) { toast.error(e.message); }
    setDeleteDialog({ open: false, id: "", placa: "" });
  };

  // Available transitions for a given status
  const getTransitions = (status: string) => {
    switch (status) {
      case "aguardando": return [
        { target: "em_andamento", label: "Iniciar", icon: Play, variant: "outline" as const },
      ];
      case "em_andamento": return [
        { target: "concluida", label: "Concluir", icon: CheckCircle, variant: "outline" as const },
        { target: "problema", label: "Problema", icon: XCircle, variant: "destructive" as const },
      ];
      case "problema": return [
        { target: "em_andamento", label: "Retomar", icon: Play, variant: "outline" as const },
      ];
      default: return [];
    }
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Acompanhamento de Instalacoes" subtitle="Controle de instalacoes em campo" />
      <TableSkeleton rows={6} cols={9} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Acompanhamento de Instalacoes" subtitle="Controle de instalacoes em campo">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Instalacao</Button>
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aguardando" value={instalacoes.filter(i => i.status === "aguardando").length} icon={Clock} accent="warning" />
        <StatCard label="Em Andamento" value={instalacoes.filter(i => i.status === "em_andamento").length} icon={ClipboardCheck} accent="primary" />
        <StatCard label="Concluidas" value={instalacoes.filter(i => i.status === "concluida").length} icon={CheckCircle} accent="success" />
        <StatCard label="Problemas" value={instalacoes.filter(i => i.status === "problema").length} icon={AlertTriangle} accent="destructive" />
      </div>
      <Card className="card-shadow">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tecnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tecnicos</SelectItem>
              {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-[160px]" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
          {(filtroStatus !== "all" || filtroTecnico !== "all" || filtroData) && (
            <Button variant="outline" size="sm" onClick={() => { setFiltroStatus("all"); setFiltroTecnico("all"); setFiltroData(""); }}>Limpar</Button>
          )}
        </div>
        {filtrado.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhuma instalacao encontrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead><TableHead>IMEI</TableHead><TableHead>Chip</TableHead><TableHead>Filial</TableHead>
                <TableHead>Tecnico</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium font-mono">{i.placa}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{i.imei}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{i.chip}</TableCell>
                  <TableCell>{i.filial}</TableCell>
                  <TableCell>{i.tecnico_nome}</TableCell>
                  <TableCell>{i.data}</TableCell>
                  <TableCell><Badge variant={statusMap[i.status]?.variant}>{statusMap[i.status]?.label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDetalhe(i)} title="Ver detalhes">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => abrirEdicao(i)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {getTransitions(i.status).map(t => (
                        <Button key={t.target} size="sm" variant={t.variant} className="h-8 text-xs" onClick={() => openStatusTransition(i, t.target)}>
                          <t.icon className="w-3.5 h-3.5 mr-1" />{t.label}
                        </Button>
                      ))}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, id: i.id, placa: i.placa })} title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[480px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader>
                <SheetTitle>Instalacao {detalhe.codigo}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-xs">Placa</span>
                    <p className="font-mono font-semibold">{detalhe.placa}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">IMEI</span>
                    <p className="font-mono font-medium">{detalhe.imei}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Chip (ICCID)</span>
                    <p className="font-mono font-medium">{detalhe.chip || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Filial</span>
                    <p className="font-medium">{detalhe.filial || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Tecnico</span>
                    <p className="font-medium">{detalhe.tecnico_nome || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Data</span>
                    <p className="font-medium">{detalhe.data}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Status</span>
                    <p><Badge variant={statusMap[detalhe.status]?.variant}>{statusMap[detalhe.status]?.label}</Badge></p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Localizacao</span>
                    <p className="font-mono text-xs">{detalhe.localizacao_confirmacao || "—"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => { abrirEdicao(detalhe); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  {getTransitions(detalhe.status).map(t => (
                    <Button key={t.target} size="sm" variant={t.variant} onClick={() => openStatusTransition(detalhe, t.target)}>
                      <t.icon className="w-3.5 h-3.5 mr-1" />{t.label}
                    </Button>
                  ))}
                  <Button size="sm" variant="destructive" onClick={() => { setDetalhe(null); setDeleteDialog({ open: true, id: detalhe.id, placa: detalhe.placa }); }}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Instalacao</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Placa</Label><Input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value }))} placeholder="ABC-1234" /></div>
            <div><Label>IMEI</Label><Input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>Chip (ICCID)</Label><Input value={form.chip} onChange={e => setForm(f => ({ ...f, chip: e.target.value }))} /></div>
            <div><Label>Filial</Label><Input value={form.filial} onChange={e => setForm(f => ({ ...f, filial: e.target.value }))} /></div>
            <div><Label>Tecnico</Label>
              <Select value={form.tecnico_id || ""} onValueChange={v => setForm(f => ({ ...f, tecnico_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Instalacao</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Placa</Label><Input value={editForm.placa} onChange={e => setEditForm(f => ({ ...f, placa: e.target.value }))} placeholder="ABC-1234" /></div>
            <div><Label>IMEI</Label><Input value={editForm.imei} onChange={e => setEditForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>Chip (ICCID)</Label><Input value={editForm.chip} onChange={e => setEditForm(f => ({ ...f, chip: e.target.value }))} /></div>
            <div><Label>Filial</Label><Input value={editForm.filial} onChange={e => setEditForm(f => ({ ...f, filial: e.target.value }))} /></div>
            <div><Label>Tecnico</Label>
              <Select value={editForm.tecnico_id || ""} onValueChange={v => setEditForm(f => ({ ...f, tecnico_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={editForm.data} onChange={e => setEditForm(f => ({ ...f, data: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button onClick={salvarEdicao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Transition Dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => { if (!open) setStatusDialog({ open: false, instalacao: null, targetStatus: "" }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialog.targetStatus === "concluida" && "Concluir Instalacao"}
              {statusDialog.targetStatus === "em_andamento" && "Iniciar Instalacao"}
              {statusDialog.targetStatus === "problema" && "Reportar Problema"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {statusDialog.instalacao && (
              <p className="text-sm text-muted-foreground">
                Placa: <span className="font-mono font-semibold text-foreground">{statusDialog.instalacao.placa}</span>
                {" | "}Status atual: <Badge variant={statusMap[statusDialog.instalacao.status]?.variant}>{statusMap[statusDialog.instalacao.status]?.label}</Badge>
                {" -> "}<Badge variant={statusMap[statusDialog.targetStatus]?.variant}>{statusMap[statusDialog.targetStatus]?.label}</Badge>
              </p>
            )}
            {statusDialog.targetStatus === "concluida" && (
              <div>
                <Label>Localizacao de confirmacao (lat, lng)</Label>
                <Input value={localizacao} onChange={e => setLocalizacao(e.target.value)} placeholder="-23.5505, -46.6333" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, instalacao: null, targetStatus: "" })}>Cancelar</Button>
            <Button onClick={confirmarTransicao} variant={statusDialog.targetStatus === "problema" ? "destructive" : "default"}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, id: "", placa: "" }); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a instalacao da placa <span className="font-mono font-semibold">{deleteDialog.placa}</span>? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AcompanhamentoInstalacoes;
