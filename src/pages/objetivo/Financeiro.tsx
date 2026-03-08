import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { financeiro } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { DollarSign, CheckCircle, Clock } from "lucide-react";

const FinanceiroPage = () => {
  const totalAberto = financeiro.filter(f => f.status === "aberto").reduce((a, f) => a + f.valorFinal, 0);
  const totalPago = financeiro.filter(f => f.status === "pago").reduce((a, f) => a + f.valorFinal, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground text-sm">Fechamento por técnico — quinzenal/mensal</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Aberto" value={`R$ ${totalAberto.toLocaleString("pt-BR")}`} icon={Clock} accent="warning" />
        <StatCard label="Total Pago" value={`R$ ${totalPago.toLocaleString("pt-BR")}`} icon={CheckCircle} accent="success" />
        <StatCard label="Total Geral" value={`R$ ${(totalAberto + totalPago).toLocaleString("pt-BR")}`} icon={DollarSign} accent="primary" />
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Serviços</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Descontos</TableHead>
              <TableHead>Valor Final</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financeiro.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-sm">{f.id}</TableCell>
                <TableCell className="font-medium">{f.tecnicoNome}</TableCell>
                <TableCell>{f.periodo}</TableCell>
                <TableCell>{f.totalServicos}</TableCell>
                <TableCell>R$ {f.valorTotal.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-destructive">{f.descontos > 0 ? `-R$ ${f.descontos}` : "—"}</TableCell>
                <TableCell className="font-semibold">R$ {f.valorFinal.toLocaleString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge variant={f.status === "pago" ? "default" : "secondary"}>
                    {f.status === "pago" ? "Pago" : "Aberto"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default FinanceiroPage;
