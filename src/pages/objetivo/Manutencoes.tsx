import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { manutencoesIniciais, tecnicosIniciais, Manutencao } from "@/data/mock-data";
import { AlertTriangle, Send, WifiOff, Shield, Settings } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";

const problemaMap: Record<string, string> = { offline: "Offline", falha_gps: "Falha GPS", sem_sinal: "Sem Sinal", bateria_baixa: "Bateria Baixa", violacao: "Violação" };
const prioridadeStyles: Record<string, string> = { critica: "bg-destructive text-destructive-foreground", alta: "bg-warning text-warning-foreground", media: "bg-primary text-primary-foreground" };
const statusMap: Record<string, { label: string; variant: "destructive" | "secondary" | "default" | "outline" }> = {
  aberto: { label: "Aberto", variant: "destructive" },
  designado: { label: "Designado", variant: "secondary" },
  em_atendimento: { label: "Em Atendimento", variant: "default" },
  resolvido: { label: "Resolvido", variant: "outline" },
};

const Manutencoes = () => {
  const [manutencoes, setManutencoes] = useState(manutencoesIniciais);
  const [despacharId, setDespacharId] = useState<string | null>(null);
  const [tecnicoId, setTecnicoId] = useState("");
  const [integracaoOpen, setIntegracaoOpen] = useState(false);
  const [plataformaUrl, setPlataformaUrl] = useState("");

  const abertos = manutencoes.filter(m => m.status === "aberto").length;
  const criticos = manutencoes.filter(m => m.prioridade === "critica").length;

  const despachar = () => {
    if (!tecnicoId) { toast.error("Selecione um técnico"); return; }
    const tec = tecnicosIniciais.find(t => t.id === tecnicoId);
    setManutencoes(prev => prev.map(m => m.id === despacharId ? { ...m, tecnicoDesignado: tec?.nome, status: "designado" } : m));
    setDespacharId(null);
    setTecnicoId("");
    toast.success("Técnico despachado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manutenções</h1>
          <p className="text-muted-foreground text-sm">Veículos offline ou com falha</p>
        </div>
        <Button variant="outline" onClick={() => setIntegracaoOpen(true)}><Settings className="w-4 h-4 mr-2" /> Integração Plataforma</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Chamados Abertos" value={abertos} icon={WifiOff} accent="destructive" />
        <StatCard label="Críticos" value={criticos} icon={AlertTriangle} accent="warning" />
        <StatCard label="Total" value={manutencoes.length} icon={Shield} accent="primary" />
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Veículo/Placa</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Problema</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manutencoes.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-sm">{m.id}</TableCell>
                <TableCell className="font-medium">{m.veiculo} — {m.placa}</TableCell>
                <TableCell>{m.clienteNome}</TableCell>
                <TableCell>{problemaMap[m.problema]}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadeStyles[m.prioridade]}`}>
                    {m.prioridade.charAt(0).toUpperCase() + m.prioridade.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{m.tecnicoDesignado || "—"}</TableCell>
                <TableCell><Badge variant={statusMap[m.status].variant}>{statusMap[m.status].label}</Badge></TableCell>
                <TableCell>
                  {m.status === "aberto" && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setDespacharId(m.id)}>
                      <Send className="w-3 h-3 mr-1" /> Despachar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Despachar */}
      <Dialog open={!!despacharId} onOpenChange={() => setDespacharId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Despachar Técnico</DialogTitle></DialogHeader>
          <div><Label>Técnico</Label>
            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger><SelectValue placeholder="Selecione o técnico" /></SelectTrigger>
              <SelectContent>
                {tecnicosIniciais.filter(t => t.status === "disponivel").map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nome} — {t.cidade}/{t.estado}</SelectItem>
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

      {/* Integração */}
      <Dialog open={integracaoOpen} onOpenChange={setIntegracaoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Integração com Plataforma de Rastreamento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Configure a conexão com a plataforma para receber alertas de veículos automaticamente.</p>
          <div className="space-y-4">
            <div><Label>URL da Plataforma</Label><Input value={plataformaUrl} onChange={e => setPlataformaUrl(e.target.value)} placeholder="https://plataforma.rastreamento.com.br" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntegracaoOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Integração configurada!"); setIntegracaoOpen(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Manutencoes;
