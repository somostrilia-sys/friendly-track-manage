import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEscalonamentos, useInsertEscalonamento, useUpdateEscalonamento, useTecnicos } from "@/hooks/useSupabaseData";
import type { DbEscalonamento } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { ArrowUpCircle, Clock, CheckCircle, AlertTriangle, Plus, Inbox } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const statusLabels: Record<string, string> = { pendente: "Pendente", em_analise: "Em Analise", resolvido: "Resolvido" };
const statusVariants: Record<string, "outline" | "secondary" | "default"> = { pendente: "outline", em_analise: "secondary", resolvido: "default" };

const Escalonamentos = () => {
  const { data: escalonamentos = [], isLoading } = useEscalonamentos();
  const { data: tecnicos = [] } = useTecnicos();
  const insertEscalonamento = useInsertEscalonamento();
  const updateEscalonamento = useUpdateEscalonamento();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tecnico_id: "" as string | null, demanda: "", cliente_nome: "", motivo: "" });

  const pendentes = escalonamentos.filter(e => e.status === "pendente").length;
  const emAnalise = escalonamentos.filter(e => e.status === "em_analise").length;
  const resolvidos = escalonamentos.filter(e => e.status === "resolvido").length;

  const salvar = async () => {
    if (!form.tecnico_id || !form.demanda) { toast.error("Preencha tecnico e demanda"); return; }
    const tec = tecnicos.find(t => t.id === form.tecnico_id);
    try {
      await insertEscalonamento.mutateAsync({
        codigo: `ESC-${Date.now()}`, tecnico_id: form.tecnico_id, tecnico_nome: tec?.nome || "",
        demanda: form.demanda, cliente_nome: form.cliente_nome, motivo: form.motivo,
        data_abertura: new Date().toISOString().split("T")[0], status: "pendente",
        responsavel_gestor: "Matheus Souza", resolucao: "",
      });
      setModalOpen(false);
      setForm({ tecnico_id: "", demanda: "", cliente_nome: "", motivo: "" });
      toast.success("Escalonamento registrado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const atualizarStatus = async (id: string, status: DbEscalonamento["status"]) => {
    try {
      await updateEscalonamento.mutateAsync({ id, status });
      toast.success("Status atualizado!");
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Escalonamentos" subtitle="Demandas escalonadas pelos tecnicos ao gestor" />
      <TableSkeleton rows={5} cols={8} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Escalonamentos" subtitle="Demandas escalonadas pelos tecnicos ao gestor">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Escalonamento</Button>
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={escalonamentos.length} icon={ArrowUpCircle} accent="primary" />
        <StatCard label="Pendentes" value={pendentes} icon={Clock} accent="destructive" />
        <StatCard label="Em Analise" value={emAnalise} icon={AlertTriangle} accent="warning" />
        <StatCard label="Resolvidos" value={resolvidos} icon={CheckCircle} accent="success" />
      </div>
      <Card className="card-shadow">
        {escalonamentos.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum escalonamento encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Tecnico</TableHead><TableHead>Cliente</TableHead>
                <TableHead>Demanda</TableHead><TableHead>Motivo</TableHead><TableHead>Data</TableHead>
                <TableHead>Status</TableHead><TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escalonamentos.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">{e.codigo}</TableCell>
                  <TableCell className="font-medium">{e.tecnico_nome}</TableCell>
                  <TableCell>{e.cliente_nome}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{e.demanda}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{e.motivo}</TableCell>
                  <TableCell>{e.data_abertura}</TableCell>
                  <TableCell><Badge variant={statusVariants[e.status]}>{statusLabels[e.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {e.status === "pendente" && <Button size="sm" variant="outline" onClick={() => atualizarStatus(e.id, "em_analise")}>Analisar</Button>}
                      {e.status === "em_analise" && <Button size="sm" onClick={() => atualizarStatus(e.id, "resolvido")}>Resolver</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Escalonamento</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Tecnico</Label>
              <Select value={form.tecnico_id || ""} onValueChange={v => setForm(f => ({ ...f, tecnico_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cliente</Label><Input value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} /></div>
            <div><Label>Demanda</Label><Textarea value={form.demanda} onChange={e => setForm(f => ({ ...f, demanda: e.target.value }))} /></div>
            <div><Label>Motivo do Escalonamento</Label><Textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={salvar}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Escalonamentos;
