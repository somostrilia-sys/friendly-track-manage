import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { escalonamentosIniciais, Escalonamento, tecnicosIniciais } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { ArrowUpCircle, Clock, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const statusLabels: Record<string, string> = { pendente: "Pendente", em_analise: "Em Analise", resolvido: "Resolvido" };
const statusVariants: Record<string, "outline" | "secondary" | "default"> = { pendente: "outline", em_analise: "secondary", resolvido: "default" };

const Escalonamentos = () => {
  const [escalonamentos, setEscalonamentos] = useState(escalonamentosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tecnicoId: "", demanda: "", clienteNome: "", motivo: "" });

  const pendentes = escalonamentos.filter(e => e.status === "pendente").length;
  const emAnalise = escalonamentos.filter(e => e.status === "em_analise").length;
  const resolvidos = escalonamentos.filter(e => e.status === "resolvido").length;

  const salvar = () => {
    if (!form.tecnicoId || !form.demanda) { toast.error("Preencha tecnico e demanda"); return; }
    const tec = tecnicosIniciais.find(t => t.id === form.tecnicoId);
    const novo: Escalonamento = {
      id: `ESC-${Date.now()}`, tecnicoId: form.tecnicoId, tecnicoNome: tec?.nome || "",
      demanda: form.demanda, clienteNome: form.clienteNome, motivo: form.motivo,
      dataAbertura: new Date().toISOString().split("T")[0], status: "pendente",
      responsavelGestor: "Matheus Souza", resolucao: "",
    };
    setEscalonamentos(prev => [...prev, novo]);
    setModalOpen(false);
    setForm({ tecnicoId: "", demanda: "", clienteNome: "", motivo: "" });
    toast.success("Escalonamento registrado!");
  };

  const atualizarStatus = (id: string, status: Escalonamento["status"]) => {
    setEscalonamentos(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    toast.success("Status atualizado!");
  };

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tecnico</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Demanda</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {escalonamentos.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-sm">{e.id}</TableCell>
                <TableCell className="font-medium">{e.tecnicoNome}</TableCell>
                <TableCell>{e.clienteNome}</TableCell>
                <TableCell className="max-w-[200px] truncate">{e.demanda}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{e.motivo}</TableCell>
                <TableCell>{e.dataAbertura}</TableCell>
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
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Escalonamento</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Tecnico</Label>
              <Select value={form.tecnicoId} onValueChange={v => setForm(f => ({ ...f, tecnicoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cliente</Label><Input value={form.clienteNome} onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))} /></div>
            <div><Label>Demanda</Label><Textarea value={form.demanda} onChange={e => setForm(f => ({ ...f, demanda: e.target.value }))} /></div>
            <div><Label>Motivo do Escalonamento</Label><Textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Escalonamentos;
