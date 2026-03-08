import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { manutencoes } from "@/data/mock-data";
import { AlertTriangle, Send } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { WifiOff, Zap, Shield } from "lucide-react";

const problemaMap = {
  offline: "Offline",
  falha_gps: "Falha GPS",
  sem_sinal: "Sem Sinal",
  bateria_baixa: "Bateria Baixa",
  violacao: "Violação",
};

const prioridadeStyles = {
  critica: "bg-destructive text-destructive-foreground",
  alta: "bg-warning text-warning-foreground",
  media: "bg-primary text-primary-foreground",
};

const statusMap = {
  aberto: { label: "Aberto", variant: "destructive" as const },
  designado: { label: "Designado", variant: "secondary" as const },
  em_atendimento: { label: "Em Atendimento", variant: "default" as const },
  resolvido: { label: "Resolvido", variant: "outline" as const },
};

const Manutencoes = () => {
  const abertos = manutencoes.filter(m => m.status === "aberto").length;
  const criticos = manutencoes.filter(m => m.prioridade === "critica").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manutenções</h1>
        <p className="text-muted-foreground text-sm">Veículos offline ou com falha</p>
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
                    <Button size="sm" variant="outline" className="text-xs">
                      <Send className="w-3 h-3 mr-1" /> Despachar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Manutencoes;
