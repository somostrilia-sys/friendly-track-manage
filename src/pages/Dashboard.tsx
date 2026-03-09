import { ShoppingCart, Wifi, WifiOff, DollarSign, Users, Brain, TrendingUp, AlertTriangle, Truck, ArrowUpCircle, CalendarDays, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientesIniciais, pedidosIniciais, linhasSIMIniciais, faturamentoMensal, tarefasIniciais, manutencoesIniciais, despachosIniciais, escalonamentosIniciais, agendamentosIniciais } from "@/data/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  const pendentes = pedidosIniciais.filter(p => p.status === "pendente").length;
  const online = linhasSIMIniciais.filter(l => l.status === "online").length;
  const offline = linhasSIMIniciais.filter(l => l.status === "offline").length;
  const clientesAtivos = clientesIniciais.filter(c => c.status === "ativo").length;
  const faturamento = "R$ 58.000";

  const urgentes = tarefasIniciais.filter(t => t.prioridade === "urgente" && t.status !== "concluida");
  const manutencoesAbertas = manutencoesIniciais.filter(m => m.status === "aberto");

  // Gestor data
  const emTransito = despachosIniciais.filter(d => d.statusEntrega === "em_transito" || d.statusEntrega === "postado").length;
  const escPendentes = escalonamentosIniciais.filter(e => e.status === "pendente").length;
  const agendados = agendamentosIniciais.filter(a => a.status === "agendado").length;
  const realizados = agendamentosIniciais.filter(a => a.status === "realizado").length;

  const pieData = [
    { name: "Online", value: online, fill: "hsl(152, 60%, 42%)" },
    { name: "Offline", value: offline, fill: "hsl(210, 10%, 55%)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Geral</h1>
        <p className="text-muted-foreground text-sm">Visao consolidada do Trackit Hub</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pedidos Pendentes" value={pendentes} icon={ShoppingCart} accent="warning" />
        <StatCard label="Linhas Online" value={online} icon={Wifi} accent="success" />
        <StatCard label="Linhas Offline" value={offline} icon={WifiOff} accent="muted" />
        <StatCard label="Faturamento Mes" value={faturamento} icon={DollarSign} accent="primary" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Clientes Ativos" value={clientesAtivos} icon={Users} accent="primary" />
        <StatCard label="Manutencoes Abertas" value={manutencoesAbertas.length} icon={AlertTriangle} accent="destructive" />
      </div>

      {/* Gestor Section */}
      <Card className="p-6 card-shadow border-l-4 border-l-accent">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Painel do Gestor
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Truck className="w-5 h-5 mx-auto text-warning mb-1" />
            <p className="text-2xl font-bold">{emTransito}</p>
            <p className="text-xs text-muted-foreground">Rastreadores em Transito</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <ArrowUpCircle className="w-5 h-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold">{escPendentes}</p>
            <p className="text-xs text-muted-foreground">Escalonamentos Pendentes</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <CalendarDays className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{agendados}</p>
            <p className="text-xs text-muted-foreground">Instalacoes Agendadas</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <CheckCircle className="w-5 h-5 mx-auto text-success mb-1" />
            <p className="text-2xl font-bold">{realizados}</p>
            <p className="text-xs text-muted-foreground">Instalacoes Realizadas</p>
          </div>
        </div>
        {escPendentes > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-sm font-medium text-destructive flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> {escPendentes} escalonamento(s) pendente(s) aguardando analise
            </p>
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
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

        <Card className="p-6 card-shadow">
          <h3 className="font-semibold mb-4">Linhas SIM</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs mt-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Online ({online})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /> Offline ({offline})</span>
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
                    <AlertTriangle className="w-4 h-4" /> Atencao Urgente
                  </p>
                  {urgentes.map(t => (
                    <p key={t.id} className="text-muted-foreground mt-1">- {t.titulo} - prazo: {t.dataLimite}</p>
                  ))}
                </div>
              )}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium text-primary flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Analise de Viabilidade
                </p>
                <p className="text-muted-foreground mt-1">
                  Cidade de <strong>Manaus/AM</strong>: indice de furto elevado (32/1000 veiculos), sem tecnico local.
                  Custo de deslocamento estimado R$ 1.200. Para veiculos acima de R$ 150k, recomenda-se a instalacao mesmo com deslocamento.
                  <strong> Sugestao: cadastrar tecnico parceiro na regiao.</strong>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <p className="font-medium text-warning">Insight</p>
                <p className="text-muted-foreground mt-1">
                  Faturamento cresceu 9,4% em relacao ao mes anterior. O modulo Objetivo registra
                  aumento de 8% em instalacoes. Tecnico Ricardo Santos (PR) lidera com 28 instalacoes/mes.
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
