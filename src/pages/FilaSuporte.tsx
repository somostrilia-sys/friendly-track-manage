import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useChamadosSuporte, useInsertChamadoSuporte, useUpdateChamadoSuporte } from "@/hooks/useSupabaseData";
import type { DbChamadoSuporte } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { Plus, Headphones, AlertTriangle, CheckCircle, Clock, Inbox } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const origemMap: Record<string, string> = { cobranca: "Cobrança", comercial: "Comercial", tecnico: "Técnico", cliente: "Cliente" };
const tipoMap: Record<string, string> = { instalacao_urgente: "Instalação Urgente", retirada: "Retirada", manutencao: "Manutenção", atualizacao_equipamento: "Atualização Equip.", suporte_app: "Suporte App" };
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  aberto: { label: "Aberto", variant: "outline" },
  em_atendimento: { label: "Em Atendimento", variant: "secondary" },
  resolvido: { label: "Resolvido", variant: "default" },
};

const FilaSuporte = () => {
  const { data: chamados = [], isLoading } = useChamadosSuporte();
  const insertChamado = useInsertChamadoSuporte();
  const updateChamado = useUpdateChamadoSuporte();

  const [modalOpen, setModalOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [form, setForm] = useState({ origem: "cliente" as DbChamadoSuporte["origem"], tipo: "manutencao" as DbChamadoSuporte["tipo"], descricao: "", cliente_nome: "", prioridade: "normal" as DbChamadoSuporte["prioridade"], responsavel: "" });

  const filtrado = chamados.filter(c => filtroStatus === "all" || c.status === filtroStatus);

  const salvar = async () => {
    if (!form.descricao || !form.cliente_nome) { toast.error("Preencha descrição e cliente"); return; }
    try {
      await insertChamado.mutateAsync({ ...form, codigo: `SUP-${Date.now()}`, status: "aberto", data_criacao: new Date().toISOString().split("T")[0] });
      setModalOpen(false);
      toast.success("Chamado criado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const atualizar = async (id: string, status: DbChamadoSuporte["status"]) => {
    try {
      await updateChamado.mutateAsync({ id, status });
      toast.success("Status atualizado!");
    } catch (e: any) { toast.error(e.message); }
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
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Chamado</Button>
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
        {filtrado.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum chamado encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Origem</TableHead><TableHead>Tipo</TableHead><TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead><TableHead>Prioridade</TableHead><TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead><TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.codigo}</TableCell>
                  <TableCell><Badge variant="secondary">{origemMap[c.origem]}</Badge></TableCell>
                  <TableCell className="text-sm">{tipoMap[c.tipo]}</TableCell>
                  <TableCell className="font-medium">{c.cliente_nome}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{c.descricao}</TableCell>
                  <TableCell><Badge variant={c.prioridade === "urgente" ? "destructive" : "outline"}>{c.prioridade === "urgente" ? "Urgente" : "Normal"}</Badge></TableCell>
                  <TableCell>{c.responsavel}</TableCell>
                  <TableCell><Badge variant={statusMap[c.status]?.variant}>{statusMap[c.status]?.label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.status === "aberto" && <Button size="sm" variant="outline" onClick={() => atualizar(c.id, "em_atendimento")}>Atender</Button>}
                      {c.status === "em_atendimento" && <Button size="sm" onClick={() => atualizar(c.id, "resolvido")}>Resolver</Button>}
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
            <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Criar Chamado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilaSuporte;
