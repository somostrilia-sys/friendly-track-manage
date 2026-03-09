import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { chamadosSuporteIniciais, ChamadoSuporte } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Plus, Headphones, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const origemMap: Record<string, string> = { cobranca: "Cobrança", comercial: "Comercial", tecnico: "Técnico", cliente: "Cliente" };
const tipoMap: Record<string, string> = { instalacao_urgente: "Instalação Urgente", retirada: "Retirada", manutencao: "Manutenção", atualizacao_equipamento: "Atualização Equip.", suporte_app: "Suporte App" };
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  aberto: { label: "Aberto", variant: "outline" },
  em_atendimento: { label: "Em Atendimento", variant: "secondary" },
  resolvido: { label: "Resolvido", variant: "default" },
};

const FilaSuporte = () => {
  const [chamados, setChamados] = useState(chamadosSuporteIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [form, setForm] = useState({ origem: "cliente" as ChamadoSuporte["origem"], tipo: "manutencao" as ChamadoSuporte["tipo"], descricao: "", clienteNome: "", prioridade: "normal" as ChamadoSuporte["prioridade"], responsavel: "" });

  const filtrado = chamados.filter(c => filtroStatus === "all" || c.status === filtroStatus);

  const salvar = () => {
    if (!form.descricao || !form.clienteNome) { toast.error("Preencha descrição e cliente"); return; }
    const novo: ChamadoSuporte = { id: `SUP-${Date.now()}`, ...form, status: "aberto", dataCriacao: new Date().toISOString().split("T")[0] };
    setChamados(prev => [...prev, novo]);
    setModalOpen(false);
    toast.success("Chamado criado!");
  };

  const atualizar = (id: string, status: ChamadoSuporte["status"]) => {
    setChamados(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    toast.success("Status atualizado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fila de Suporte</h1>
          <p className="text-muted-foreground text-sm">Chamados e atendimentos</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Chamado</Button>
      </div>

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
              <TableHead>ID</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.id}</TableCell>
                <TableCell><Badge variant="secondary">{origemMap[c.origem]}</Badge></TableCell>
                <TableCell className="text-sm">{tipoMap[c.tipo]}</TableCell>
                <TableCell className="font-medium">{c.clienteNome}</TableCell>
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
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Origem</Label>
              <Select value={form.origem} onValueChange={v => setForm(f => ({ ...f, origem: v as ChamadoSuporte["origem"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(origemMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as ChamadoSuporte["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tipoMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cliente</Label><Input value={form.clienteNome} onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))} /></div>
            <div><Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v as ChamadoSuporte["prioridade"] }))}>
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
