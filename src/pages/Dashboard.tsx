import { ShoppingCart, Wifi, WifiOff, DollarSign, Users, Brain, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { clientes, pedidos, linhasSIM, faturamentoMensal, tarefas, manutencoes } from "@/data/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  const pendentes = pedidos.filter(p => p.status === "pendente").length;
  const online = linhasSIM.filter(l => l.status === "online").length;
  const offline = linhasSIM.filter(l => l.status === "offline").length;
  const clientesAtivos = clientes.filter(c => c.status === "ativo").length;
  const faturamento = "R$ 58.000";

  const urgentes = tarefas.filter(t => t.prioridade === "urgente" && t.status !== "concluida");
  const manutencoesAbertas = manutencoes.filter(m => m.status === "aberto");

  const pieData = [
    { name: "Online", value: online, fill: "hsl(152, 60%, 42%)" },
    { name: "Offline", value: offline, fill: "hsl(210, 10%, 55%)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Geral</h1>
        <p className="text-muted-foreground text-sm">Visão consolidada do Trackit Hub</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pedidos Pendentes" value={pendentes} icon={ShoppingCart} accent="warning" />
        <StatCard label="Linhas Online" value={online} icon={Wifi} accent="success" />
        <StatCard label="Linhas Offline" value={offline} icon={WifiOff} accent="muted" />
        <StatCard label="Faturamento Mês" value={faturamento} icon={DollarSign} accent="primary" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Clientes Ativos" value={clientesAtivos} icon={Users} accent="primary" />
        <StatCard label="Manutenções Abertas" value={manutencoesAbertas.length} icon={AlertTriangle} accent="destructive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Faturamento chart */}
        <Card className="lg:col-span-2 p-6 card-shadow">
          <h3 className="font-semibold mb-4">Faturamento Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 89%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
              <Bar dataKey="valor" fill="hsl(204, 92%, 39%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Linhas SIM pie */}
        <Card className="p-6 card-shadow">
          <h3 className="font-semibold mb-4">Linhas SIM</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs mt-2">
            <span className="flex items-center gap-1.5"><span className="status-dot bg-success" /> Online ({online})</span>
            <span className="flex items-center gap-1.5"><span className="status-dot bg-offline" /> Offline ({offline})</span>
          </div>
        </Card>
      </div>

      {/* IA Card */}
      <Card className="p-6 card-shadow border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2">
              IA Conselheira
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Beta</span>
            </h3>
            <div className="mt-3 space-y-3 text-sm">
              {urgentes.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="font-medium text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Atenção Urgente
                  </p>
                  {urgentes.map(t => (
                    <p key={t.id} className="text-muted-foreground mt-1">• {t.titulo} — prazo: {t.dataLimite}</p>
                  ))}
                </div>
              )}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium text-primary flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Análise de Viabilidade
                </p>
                <p className="text-muted-foreground mt-1">
                  Cidade de <strong>Manaus/AM</strong>: índice de furto elevado (32/1000 veículos), sem técnico local.
                  Custo de deslocamento estimado R$ 1.200. Para veículos acima de R$ 150k, recomenda-se a instalação mesmo com deslocamento.
                  <strong> Sugestão: cadastrar técnico parceiro na região.</strong>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <p className="font-medium text-warning">📊 Insight</p>
                <p className="text-muted-foreground mt-1">
                  Faturamento cresceu 9,4% em relação ao mês anterior. O módulo Objetivo registra
                  aumento de 8% em instalações. Técnico Ricardo Santos (PR) lidera com 28 instalações/mês.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
