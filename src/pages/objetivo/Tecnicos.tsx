import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { tecnicos } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Users, Star, Package, DollarSign } from "lucide-react";
import { instalacoesPorMes } from "@/data/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statusMap = {
  disponivel: { label: "Disponível", variant: "default" as const },
  em_servico: { label: "Em Serviço", variant: "secondary" as const },
  indisponivel: { label: "Indisponível", variant: "outline" as const },
};

const Tecnicos = () => {
  const total = tecnicos.length;
  const disponiveis = tecnicos.filter(t => t.status === "disponivel").length;
  const mediaAvaliacao = (tecnicos.reduce((a, t) => a + t.avaliacao, 0) / total).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Técnicos</h1>
        <p className="text-muted-foreground text-sm">Rede de técnicos em todo o Brasil</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Técnicos" value={total} icon={Users} />
        <StatCard label="Disponíveis" value={disponiveis} icon={Users} accent="success" />
        <StatCard label="Avaliação Média" value={mediaAvaliacao} icon={Star} accent="warning" />
        <StatCard label="Instalações/Mês" value={tecnicos.reduce((a, t) => a + t.instalacoesMes, 0)} icon={Package} accent="primary" />
      </div>

      <Card className="p-6 card-shadow">
        <h3 className="font-semibold mb-4">Instalações por Mês</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={instalacoesPorMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 89%)" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="instalacoes" fill="hsl(204, 92%, 39%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Avaliação</TableHead>
              <TableHead>Instal./Mês</TableHead>
              <TableHead>Equip. Estoque</TableHead>
              <TableHead>Saldo Aberto</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tecnicos.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nome}</TableCell>
                <TableCell>{t.cidade}/{t.estado}</TableCell>
                <TableCell className="text-sm">{t.especialidade}</TableCell>
                <TableCell>⭐ {t.avaliacao}</TableCell>
                <TableCell>{t.instalacoesMes}</TableCell>
                <TableCell>{t.equipamentosEmEstoque}</TableCell>
                <TableCell>R$ {t.saldoAberto.toLocaleString("pt-BR")}</TableCell>
                <TableCell><Badge variant={statusMap[t.status].variant}>{statusMap[t.status].label}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Tecnicos;
