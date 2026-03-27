import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useTarefas, useInsertTarefa, useUpdateTarefa } from "@/hooks/useSupabaseData";
import type { DbTarefa } from "@/types/database";
import { Plus, CheckCircle, Clock, Loader2, Inbox } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const prioridadeStyles: Record<string, string> = {
  urgente: "bg-destructive text-destructive-foreground",
  alta: "bg-warning text-warning-foreground",
  media: "bg-primary text-primary-foreground",
  baixa: "bg-secondary text-secondary-foreground",
};

const statusIcons: Record<string, typeof Clock> = { pendente: Clock, em_andamento: Loader2, concluida: CheckCircle };

const Tarefas = () => {
  const { data: tarefas = [], isLoading } = useTarefas();
  const insertTarefa = useInsertTarefa();
  const updateTarefa = useUpdateTarefa();

  const [filtro, setFiltro] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", prioridade: "media" as DbTarefa["prioridade"], responsavel: "", data_limite: "" });

  const filtrado = tarefas.filter(t => {
    const mp = filtro === "all" || t.prioridade === filtro;
    const ms = filtroStatus === "all" || t.status === filtroStatus;
    return mp && ms;
  });

  const toggleConcluida = async (t: DbTarefa) => {
    try {
      await updateTarefa.mutateAsync({ id: t.id, status: t.status === "concluida" ? "pendente" : "concluida" });
    } catch (e: any) { toast.error(e.message); }
  };

  const salvar = async () => {
    if (!form.titulo) { toast.error("Título é obrigatório"); return; }
    try {
      await insertTarefa.mutateAsync({
        ...form, status: "pendente", data_criacao: new Date().toISOString().split("T")[0],
      });
      setModalOpen(false);
      setForm({ titulo: "", descricao: "", prioridade: "media", responsavel: "", data_limite: "" });
      toast.success("Tarefa criada!");
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Tarefas" subtitle="Gestão de tarefas por prioridade" />
      <TableSkeleton rows={4} cols={4} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Tarefas" subtitle="Gestão de tarefas por prioridade">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>
      </PageHeader>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-1">Prioridade:</span>
        {["all", "urgente", "alta", "media", "baixa"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {f === "all" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-3 mr-1">Status:</span>
        {["all", "pendente", "em_andamento", "concluida"].map(f => (
          <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroStatus === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {f === "all" ? "Todos" : f === "pendente" ? "Pendente" : f === "em_andamento" ? "Em Andamento" : "Concluída"}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtrado.map(t => {
          const StatusIcon = statusIcons[t.status];
          return (
            <Card key={t.id} className={`p-4 card-shadow transition-shadow ${t.status === "concluida" ? "opacity-60" : "hover:shadow-md"}`}>
              <div className="flex items-start gap-3">
                <Checkbox checked={t.status === "concluida"} onCheckedChange={() => toggleConcluida(t)} className="mt-1" />
                <StatusIcon className={`w-5 h-5 mt-0.5 shrink-0 ${t.status === "concluida" ? "text-success" : t.status === "em_andamento" ? "text-primary" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <h3 className={`font-medium ${t.status === "concluida" ? "line-through" : ""}`}>{t.titulo}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t.descricao}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Responsável: {t.responsavel}</span>
                    <span>Prazo: {t.data_limite}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${prioridadeStyles[t.prioridade]}`}>
                  {t.prioridade.charAt(0).toUpperCase() + t.prioridade.slice(1)}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v as DbTarefa["prioridade"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgente">Urgente</SelectItem><SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem><SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
            </div>
            <div><Label>Data Limite</Label><Input type="date" value={form.data_limite} onChange={e => setForm(f => ({ ...f, data_limite: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={salvar}>Criar Tarefa</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tarefas;
