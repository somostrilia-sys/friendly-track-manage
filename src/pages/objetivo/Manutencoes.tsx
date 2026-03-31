import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useManutencoes, useInsertManutencao, useUpdateManutencao, useTecnicos, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbManutencao } from "@/types/database";
import { AlertTriangle, Send, WifiOff, Shield, Clock, Inbox, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const problemaMap: Record<string, string> = { offline: "Offline", falha_gps: "Falha GPS", sem_sinal: "Sem Sinal", bateria_baixa: "Bateria Baixa", violacao: "Violacao" };

const classificarPrioridade = (dataAbertura: string): { label: string; class: string; ordem: number } => {
  const hoje = new Date();
  const abertura = new Date(dataAbertura);
  const dias = Math.floor((hoje.getTime() - abertura.getTime()) / (1000 * 60 * 60 * 24));
  if (dias > 30) return { label: "Critica (>" + dias + " dias)", class: "bg-destructive text-destructive-foreground", ordem: 0 };
  if (dias > 15) return { label: "Alta (" + dias + " dias)", class: "bg-warning text-warning-foreground", ordem: 1 };
  if (dias > 7) return { label: "Media (" + dias + " dias)", class: "bg-primary text-primary-foreground", ordem: 2 };
  return { label: "Baixa (" + dias + " dias)", class: "bg-secondary text-secondary-foreground", ordem: 3 };
};

const statusMap: Record<string, { label: string; variant: "destructive" | "secondary" | "default" | "outline" }> = {
  aberto: { label: "Aberto", variant: "destructive" },
  designado: { label: "Designado", variant: "secondary" },
  em_atendimento: { label: "Em Atendimento", variant: "default" },
  resolvido: { label: "Resolvido", variant: "outline" },
};

const Manutencoes = () => {
  const { data: manutencoes = [], isLoading } = useManutencoes();
  const { data: tecnicos = [] } = useTecnicos();
  const insertManutencao = useInsertManutencao();
  const updateManutencao = useUpdateManutencao();

  useRealtimeSubscription("manutencoes", ["manutencoes"]);

  const [despacharId, setDespacharId] = useState<string | null>(null);
  const [tecnicoId, setTecnicoId] = useState("");
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaForm, setNovaForm] = useState({ veiculo: "", placa: "", cliente_nome: "", problema: "offline" as string });

  const ordenadas = useMemo(() => {
    return [...manutencoes].sort((a, b) => {
      const prioA = classificarPrioridade(a.data_abertura).ordem;
      const prioB = classificarPrioridade(b.data_abertura).ordem;
      return prioA - prioB;
    });
  }, [manutencoes]);

  const abertos = manutencoes.filter(m => m.status === "aberto").length;
  const criticos = manutencoes.filter(m => {
    const dias = Math.floor((new Date().getTime() - new Date(m.data_abertura).getTime()) / (1000 * 60 * 60 * 24));
    return dias > 30;
  }).length;

  const tempoMedio = useMemo(() => {
    const abertosComTempo = manutencoes.filter(m => m.status !== "resolvido");
    if (abertosComTempo.length === 0) return "0 dias";
    const totalDias = abertosComTempo.reduce((sum, m) => {
      return sum + Math.floor((new Date().getTime() - new Date(m.data_abertura).getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    return `${Math.round(totalDias / abertosComTempo.length)} dias`;
  }, [manutencoes]);

  const criarManutencao = async () => {
    if (!novaForm.placa || !novaForm.cliente_nome) { toast.error("Preencha placa e cliente"); return; }
    try {
      await insertManutencao.mutateAsync({
        codigo: `MAN-${String(manutencoes.length + 1).padStart(3, "0")}`,
        veiculo: novaForm.veiculo,
        placa: novaForm.placa,
        cliente_nome: novaForm.cliente_nome,
        problema: novaForm.problema,
        status: "aberto",
        data_abertura: new Date().toISOString().split("T")[0],
        tecnico_designado: "",
        dias_offline: 0,
      });
      setNovaOpen(false);
      setNovaForm({ veiculo: "", placa: "", cliente_nome: "", problema: "offline" });
      toast.success("Manutencao criada!");
    } catch (e: any) { toast.error(e.message); }
  };

  const despachar = async () => {
    if (!tecnicoId) { toast.error("Selecione um tecnico"); return; }
    const tec = tecnicos.find(t => t.id === tecnicoId);
    try {
      await updateManutencao.mutateAsync({ id: despacharId!, tecnico_designado: tec?.nome || "", status: "designado" });
      setDespacharId(null);
      setTecnicoId("");
      toast.success("Tecnico despachado!");
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Manutencoes" subtitle="Rastreadores offline e com falha" />
      <TableSkeleton rows={6} cols={8} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Manutencoes" subtitle="Rastreadores offline e com falha - ordenados por tempo offline">
        <Button onClick={() => setNovaOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Manutencao</Button>
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Chamados Abertos" value={abertos} icon={WifiOff} accent="destructive" />
        <StatCard label="Criticos (>30 dias)" value={criticos} icon={AlertTriangle} accent="warning" />
        <StatCard label="Total" value={manutencoes.length} icon={Shield} accent="primary" />
        <StatCard label="Tempo Medio" value={tempoMedio} icon={Clock} accent="muted" />
      </div>
      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead><TableHead>Veiculo/Placa</TableHead><TableHead>Cliente</TableHead>
              <TableHead>Problema</TableHead><TableHead>Classificacao</TableHead><TableHead>Tecnico</TableHead>
              <TableHead>Status</TableHead><TableHead>Acao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
                    <div className="rounded-full bg-muted/60 p-3">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Nenhuma manutenção registrada</p>
                    <p className="text-xs text-muted-foreground/60">Rastreadores com problema aparecerão aqui</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {ordenadas.map(m => {
              const prio = classificarPrioridade(m.data_abertura);
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.codigo}</TableCell>
                  <TableCell className="font-medium">{m.veiculo} - {m.placa}</TableCell>
                  <TableCell>{m.cliente_nome}</TableCell>
                  <TableCell>{problemaMap[m.problema]}</TableCell>
                  <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prio.class}`}>{prio.label}</span></TableCell>
                  <TableCell>{m.tecnico_designado || "--"}</TableCell>
                  <TableCell><Badge variant={statusMap[m.status]?.variant}>{statusMap[m.status]?.label}</Badge></TableCell>
                  <TableCell>
                    {m.status === "aberto" && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setDespacharId(m.id)}>
                        <Send className="w-3 h-3 mr-1" /> Despachar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      {/* Nova Manutencao */}
      <Dialog open={novaOpen} onOpenChange={setNovaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Manutencao</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Veiculo</Label><Input value={novaForm.veiculo} onChange={e => setNovaForm(f => ({ ...f, veiculo: e.target.value }))} placeholder="Modelo do veiculo" /></div>
            <div><Label>Placa</Label><Input value={novaForm.placa} onChange={e => setNovaForm(f => ({ ...f, placa: e.target.value }))} placeholder="ABC-1234" /></div>
            <div><Label>Cliente</Label><Input value={novaForm.cliente_nome} onChange={e => setNovaForm(f => ({ ...f, cliente_nome: e.target.value }))} placeholder="Nome do cliente" /></div>
            <div><Label>Problema</Label>
              <Select value={novaForm.problema} onValueChange={v => setNovaForm(f => ({ ...f, problema: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(problemaMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaOpen(false)}>Cancelar</Button>
            <Button onClick={criarManutencao}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Despachar */}
      <Dialog open={!!despacharId} onOpenChange={() => setDespacharId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Despachar Tecnico</DialogTitle></DialogHeader>
          <div><Label>Tecnico</Label>
            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger><SelectValue placeholder="Selecione o tecnico" /></SelectTrigger>
              <SelectContent>
                {tecnicos.filter(t => t.status === "disponivel").map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nome} - {t.cidade}/{t.estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDespacharId(null)}>Cancelar</Button>
            <Button onClick={despachar}>Confirmar Despacho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Manutencoes;
