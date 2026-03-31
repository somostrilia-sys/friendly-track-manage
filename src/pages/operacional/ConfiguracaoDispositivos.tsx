import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  useConfigDispositivosComChecklist, useUpdateConfiguracaoDispositivo, useUpdateConfigChecklist,
  useInsertConfiguracaoDispositivo, useDeleteConfiguracaoDispositivo, useInsertConfigChecklist,
  useRealtimeSubscription,
} from "@/hooks/useSupabaseData";
import type { DbConfiguracaoDispositivo, DbConfigChecklist } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { Settings, CheckCircle, AlertCircle, Clock, Plus, Trash2, Pencil, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const statusLabels: Record<string, string> = { pendente: "Pendente", configurado: "Configurado", testado: "Testado" };
const statusVariants: Record<string, "default" | "secondary" | "outline"> = { pendente: "outline", configurado: "secondary", testado: "default" };

type ConfigComChecklist = DbConfiguracaoDispositivo & { checklist: DbConfigChecklist[] };

const DEFAULT_CHECKLIST_ITEMS = [
  "Configurar APN",
  "Configurar IP/Porta",
  "Configurar intervalo de transmissao",
  "Atualizar firmware",
  "Testar comunicacao",
  "Validar posicionamento GPS",
];

const emptyForm = {
  serial: "",
  modelo: "",
  imei: "",
  firmware: "",
  apn: "",
  ip: "",
  porta: "",
  intervalo_transmissao: 60,
  responsavel_config: "",
  observacoes: "",
};

const ConfiguracaoDispositivos = () => {
  const { data: configs = [], isLoading } = useConfigDispositivosComChecklist();
  const updateConfig = useUpdateConfiguracaoDispositivo();
  const updateChecklist = useUpdateConfigChecklist();
  const insertConfig = useInsertConfiguracaoDispositivo();
  const deleteConfig = useDeleteConfiguracaoDispositivo();
  const insertChecklist = useInsertConfigChecklist();

  useRealtimeSubscription("configuracao_dispositivos", ["configuracao_dispositivos", "config_dispositivos_completo"]);

  const [detalhe, setDetalhe] = useState<ConfigComChecklist | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; serial: string }>({ open: false, id: "", serial: "" });

  const cfgs = configs as ConfigComChecklist[];
  const testados = cfgs.filter(c => c.status === "testado").length;
  const configurados = cfgs.filter(c => c.status === "configurado").length;
  const pendentes = cfgs.filter(c => c.status === "pendente").length;

  const toggleChecklist = async (configId: string, checklistItem: DbConfigChecklist) => {
    try {
      await updateChecklist.mutateAsync({ id: checklistItem.id, feito: !checklistItem.feito });
      const config = cfgs.find(c => c.id === configId);
      if (config) {
        const allDone = config.checklist.every(i => i.id === checklistItem.id ? !checklistItem.feito : i.feito);
        const currentStatus = config.status;
        if (currentStatus !== "testado") {
          await updateConfig.mutateAsync({ id: configId, status: allDone ? "configurado" : "pendente", checklist_concluido: allDone });
        }
      }
      // Update local detalhe state
      if (detalhe?.id === configId) {
        setDetalhe(prev => {
          if (!prev) return null;
          const updatedChecklist = prev.checklist.map(i => i.id === checklistItem.id ? { ...i, feito: !i.feito } : i);
          const allDone = updatedChecklist.every(i => i.feito);
          const newStatus = prev.status === "testado" ? "testado" : (allDone ? "configurado" : "pendente");
          return { ...prev, checklist: updatedChecklist, status: newStatus as DbConfiguracaoDispositivo["status"], checklist_concluido: allDone };
        });
      }
      toast.success("Checklist atualizado");
    } catch (e: any) { toast.error(e.message); }
  };

  const marcarTestado = async (id: string) => {
    try {
      await updateConfig.mutateAsync({ id, status: "testado" });
      if (detalhe?.id === id) setDetalhe(prev => prev ? { ...prev, status: "testado" } : null);
      toast.success("Dispositivo marcado como testado!");
    } catch (e: any) { toast.error(e.message); }
  };

  // Create
  const criarDispositivo = async () => {
    if (!createForm.imei || !createForm.modelo || !createForm.serial) {
      toast.error("Preencha serial, modelo e IMEI");
      return;
    }
    try {
      const result = await insertConfig.mutateAsync({
        ...createForm,
        intervalo_transmissao: Number(createForm.intervalo_transmissao) || 60,
        status: "pendente",
        checklist_concluido: false,
        data_config: new Date().toISOString().split("T")[0],
      });
      // Create default checklist items
      if (result?.id) {
        for (const item of DEFAULT_CHECKLIST_ITEMS) {
          await insertChecklist.mutateAsync({ config_id: result.id, item, feito: false });
        }
      }
      setCreateOpen(false);
      setCreateForm(emptyForm);
      toast.success("Dispositivo criado com checklist!");
    } catch (e: any) { toast.error(e.message); }
  };

  // Delete
  const confirmarDelete = async () => {
    try {
      await deleteConfig.mutateAsync(deleteDialog.id);
      if (detalhe?.id === deleteDialog.id) { setDetalhe(null); setEditMode(false); }
      toast.success("Dispositivo removido!");
    } catch (e: any) { toast.error(e.message); }
    setDeleteDialog({ open: false, id: "", serial: "" });
  };

  // Edit in sheet
  const startEdit = () => {
    if (!detalhe) return;
    setEditForm({
      serial: detalhe.serial,
      modelo: detalhe.modelo,
      imei: detalhe.imei,
      firmware: detalhe.firmware,
      apn: detalhe.apn,
      ip: detalhe.ip,
      porta: detalhe.porta,
      intervalo_transmissao: detalhe.intervalo_transmissao,
      responsavel_config: detalhe.responsavel_config,
      observacoes: detalhe.observacoes,
    });
    setEditMode(true);
  };

  const salvarEdicao = async () => {
    if (!detalhe) return;
    if (!editForm.imei || !editForm.modelo || !editForm.serial) {
      toast.error("Preencha serial, modelo e IMEI");
      return;
    }
    try {
      await updateConfig.mutateAsync({
        id: detalhe.id,
        serial: editForm.serial,
        modelo: editForm.modelo,
        imei: editForm.imei,
        firmware: editForm.firmware,
        apn: editForm.apn,
        ip: editForm.ip,
        porta: editForm.porta,
        intervalo_transmissao: Number(editForm.intervalo_transmissao) || 60,
        responsavel_config: editForm.responsavel_config,
        observacoes: editForm.observacoes,
      });
      setDetalhe(prev => prev ? {
        ...prev,
        serial: editForm.serial,
        modelo: editForm.modelo,
        imei: editForm.imei,
        firmware: editForm.firmware,
        apn: editForm.apn,
        ip: editForm.ip,
        porta: editForm.porta,
        intervalo_transmissao: Number(editForm.intervalo_transmissao) || 60,
        responsavel_config: editForm.responsavel_config,
        observacoes: editForm.observacoes,
      } : null);
      setEditMode(false);
      toast.success("Dispositivo atualizado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const closeSheet = () => {
    setDetalhe(null);
    setEditMode(false);
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Configuracao de Dispositivos" subtitle="Registro tecnico e checklist de rastreadores" />
      <TableSkeleton rows={5} cols={7} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Configuracao de Dispositivos" subtitle="Registro tecnico e checklist de rastreadores">
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Dispositivo</Button>
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={cfgs.length} icon={Settings} accent="primary" />
        <StatCard label="Testados" value={testados} icon={CheckCircle} accent="success" />
        <StatCard label="Configurados" value={configurados} icon={AlertCircle} accent="warning" />
        <StatCard label="Pendentes" value={pendentes} icon={Clock} accent="destructive" />
      </div>
      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial</TableHead><TableHead>Modelo</TableHead><TableHead>IMEI</TableHead>
              <TableHead>Firmware</TableHead><TableHead>Progresso</TableHead><TableHead>Status</TableHead>
              <TableHead>Responsavel</TableHead><TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cfgs.map(c => {
              const progresso = c.checklist.length > 0 ? Math.round((c.checklist.filter(i => i.feito).length / c.checklist.length) * 100) : 0;
              return (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm" onClick={() => setDetalhe(c)}>{c.serial}</TableCell>
                  <TableCell onClick={() => setDetalhe(c)}>{c.modelo}</TableCell>
                  <TableCell className="font-mono text-xs" onClick={() => setDetalhe(c)}>{c.imei}</TableCell>
                  <TableCell onClick={() => setDetalhe(c)}>{c.firmware}</TableCell>
                  <TableCell onClick={() => setDetalhe(c)}>
                    <div className="flex items-center gap-2">
                      <Progress value={progresso} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground">{progresso}%</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => setDetalhe(c)}><Badge variant={statusVariants[c.status]}>{statusLabels[c.status]}</Badge></TableCell>
                  <TableCell onClick={() => setDetalhe(c)}>{c.responsavel_config || "-"}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: c.id, serial: c.serial }); }}
                      title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Detail/Edit Sheet */}
      <Sheet open={!!detalhe} onOpenChange={closeSheet}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && !editMode && (
            <>
              <SheetHeader><SheetTitle>{detalhe.modelo} - {detalhe.serial}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">IMEI</span><p className="font-mono font-medium">{detalhe.imei}</p></div>
                  <div><span className="text-muted-foreground">Firmware</span><p className="font-medium">{detalhe.firmware}</p></div>
                  <div><span className="text-muted-foreground">APN</span><p className="font-medium">{detalhe.apn}</p></div>
                  <div><span className="text-muted-foreground">IP:Porta</span><p className="font-mono font-medium">{detalhe.ip}:{detalhe.porta}</p></div>
                  <div><span className="text-muted-foreground">Intervalo TX</span><p className="font-medium">{detalhe.intervalo_transmissao}s</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusVariants[detalhe.status]}>{statusLabels[detalhe.status]}</Badge></p></div>
                  <div><span className="text-muted-foreground">Responsavel</span><p className="font-medium">{detalhe.responsavel_config || "-"}</p></div>
                  <div><span className="text-muted-foreground">Data Config</span><p className="font-medium">{detalhe.data_config || "-"}</p></div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={startEdit}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { closeSheet(); setDeleteDialog({ open: true, id: detalhe.id, serial: detalhe.serial }); }}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                  </Button>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Checklist de Configuracao</h4>
                  <div className="space-y-2">
                    {detalhe.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                        <Checkbox checked={item.feito} onCheckedChange={() => toggleChecklist(detalhe.id, item)} />
                        <span className={item.feito ? "line-through text-muted-foreground" : ""}>{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {detalhe.status === "configurado" && (
                  <Button className="w-full" onClick={() => marcarTestado(detalhe.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Marcar como Testado
                  </Button>
                )}
                {detalhe.observacoes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground font-medium">Observacoes</p>
                    <p className="text-sm mt-1">{detalhe.observacoes}</p>
                  </div>
                )}
              </div>
            </>
          )}
          {detalhe && editMode && (
            <>
              <SheetHeader><SheetTitle>Editar Dispositivo</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Serial</Label><Input value={editForm.serial} onChange={e => setEditForm(f => ({ ...f, serial: e.target.value }))} /></div>
                  <div><Label>Modelo</Label><Input value={editForm.modelo} onChange={e => setEditForm(f => ({ ...f, modelo: e.target.value }))} /></div>
                  <div><Label>IMEI</Label><Input value={editForm.imei} onChange={e => setEditForm(f => ({ ...f, imei: e.target.value }))} /></div>
                  <div><Label>Firmware</Label><Input value={editForm.firmware} onChange={e => setEditForm(f => ({ ...f, firmware: e.target.value }))} /></div>
                  <div><Label>APN</Label><Input value={editForm.apn} onChange={e => setEditForm(f => ({ ...f, apn: e.target.value }))} /></div>
                  <div><Label>IP</Label><Input value={editForm.ip} onChange={e => setEditForm(f => ({ ...f, ip: e.target.value }))} /></div>
                  <div><Label>Porta</Label><Input value={editForm.porta} onChange={e => setEditForm(f => ({ ...f, porta: e.target.value }))} /></div>
                  <div><Label>Intervalo TX (s)</Label><Input type="number" value={editForm.intervalo_transmissao} onChange={e => setEditForm(f => ({ ...f, intervalo_transmissao: Number(e.target.value) }))} /></div>
                  <div className="col-span-2"><Label>Responsavel</Label><Input value={editForm.responsavel_config} onChange={e => setEditForm(f => ({ ...f, responsavel_config: e.target.value }))} /></div>
                  <div className="col-span-2"><Label>Observacoes</Label><Textarea value={editForm.observacoes} onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} /></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">Cancelar</Button>
                  <Button onClick={salvarEdicao} className="flex-1"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Dispositivo</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Serial</Label><Input value={createForm.serial} onChange={e => setCreateForm(f => ({ ...f, serial: e.target.value }))} placeholder="SN-00001" /></div>
            <div><Label>Modelo</Label><Input value={createForm.modelo} onChange={e => setCreateForm(f => ({ ...f, modelo: e.target.value }))} placeholder="GT06N" /></div>
            <div><Label>IMEI</Label><Input value={createForm.imei} onChange={e => setCreateForm(f => ({ ...f, imei: e.target.value }))} placeholder="123456789012345" /></div>
            <div><Label>Firmware</Label><Input value={createForm.firmware} onChange={e => setCreateForm(f => ({ ...f, firmware: e.target.value }))} placeholder="v1.0.0" /></div>
            <div><Label>APN</Label><Input value={createForm.apn} onChange={e => setCreateForm(f => ({ ...f, apn: e.target.value }))} placeholder="zap.vivo.com.br" /></div>
            <div><Label>IP</Label><Input value={createForm.ip} onChange={e => setCreateForm(f => ({ ...f, ip: e.target.value }))} placeholder="0.0.0.0" /></div>
            <div><Label>Porta</Label><Input value={createForm.porta} onChange={e => setCreateForm(f => ({ ...f, porta: e.target.value }))} placeholder="5023" /></div>
            <div><Label>Intervalo TX (s)</Label><Input type="number" value={createForm.intervalo_transmissao} onChange={e => setCreateForm(f => ({ ...f, intervalo_transmissao: Number(e.target.value) }))} /></div>
            <div className="col-span-2"><Label>Responsavel</Label><Input value={createForm.responsavel_config} onChange={e => setCreateForm(f => ({ ...f, responsavel_config: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Observacoes</Label><Textarea value={createForm.observacoes} onChange={e => setCreateForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Um checklist padrao sera criado automaticamente com {DEFAULT_CHECKLIST_ITEMS.length} itens.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={criarDispositivo}>Criar Dispositivo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, id: "", serial: "" }); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o dispositivo <span className="font-mono font-semibold">{deleteDialog.serial}</span>? O checklist associado tambem sera removido. Esta acao nao pode ser desfeita.
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

export default ConfiguracaoDispositivos;
