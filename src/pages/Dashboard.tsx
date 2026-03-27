import { ShoppingCart, Wifi, WifiOff, DollarSign, Users, TrendingUp, AlertTriangle, Truck, CalendarDays, CheckCircle, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientes, useLinhasSIM, useManutencoes, useDespachos, useAgendamentos, useTecnicos, useFinanceiro } from "@/hooks/useSupabaseData";
import { usePedidosCompletos } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  const { data: clientes = [] } = useClientes();
  const { data: pedidos = [] } = usePedidosCompletos();
  const { data: linhas = [] } = useLinhasSIM();
  const { data: manutencoes = [] } = useManutencoes();
  const { data: despachos = [] } = useDespachos();
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: tecnicos = [] } = useTecnicos();
  const { data: financeiro = [] } = useFinanceiro();

  const pendentes = pedidos.filter(p => p.status === "pendente").length;
  const online = linhas.filter(l => l.status === "online").length;
  const offline = linhas.filter(l => l.status === "offline").length;
  const clientesAtivos = clientes.filter(c => c.status === "ativo").length;
  const faturamentoTotal = financeiro.reduce((sum: number, f: any) => sum + Number(f.valor_total || 0), 0);
  const faturamento = faturamentoTotal > 0 ? `R$ ${faturamentoTotal.toLocaleString("pt-BR")}` : "R$ 0";
  const manutencoesAbertas = manutencoes.filter(m => m.status === "aberto");
  const emTransito = despachos.filter(d => d.status_entrega === "em_transito" || d.status_entrega === "postado").length;
  const agendados = agendamentos.filter(a => a.status === "agendado").length;
  const realizados = agendamentos.filter(a => a.status === "realizado").length;
  const totalTecnicos = tecnicos.length;
  const tecnicosDisponiveis = tecnicos.filter(t => t.status === "disponivel").length;

  const faturamentoMensal = (() => {
    const meses: Record<string, number> = {};
    financeiro.forEach((f: any) => {
      const date = new Date(f.created_at || f.data_emissao);
      if (isNaN(date.getTime())) return;
      const key = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      meses[key] = (meses[key] || 0) + Number(f.valor_total || 0);
    });
    return Object.entries(meses).map(([mes, valor]) => ({ mes, valor }));
  })();

  const pieData = [
    { name: "Online", value: online, fill: "hsl(160, 55%, 38%)" },
    { name: "Offline", value: offline, fill: "hsl(220, 8%, 48%)" },
  ];

  const chartTooltipStyle = {
    background: "hsl(220, 18%, 10%)",
    border: "1px solid hsl(220, 14%, 16%)",
    borderRadius: "10px",
    fontSize: "12px",
    boxShadow: "0 8px 30px -8px rgba(0,0,0,0.5)",
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard Overview" subtitle="Visao consolidada do Trackit Hub">
        <Select defaultValue="30">
          <SelectTrigger className="w-[130px] h-9 text-xs bg-muted/40 border-border/30 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Hoje</SelectItem>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pedidos Pendentes" value={pendentes} icon={ShoppingCart} accent="warning" />
        <StatCard label="Linhas Online" value={online} icon={Wifi} accent="success" />
        <StatCard label="Linhas Offline" value={offline} icon={WifiOff} accent="muted" />
        <StatCard label="Faturamento Mes" value={faturamento} icon={DollarSign} accent="primary" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8 p-6 card-shadow card-hover">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold">Faturamento Mensal</h3>
              <p className="text-xs text-muted-foreground mt-1">Receita dos ultimos 6 meses</p>
            </div>
            <Badge variant="secondary" className="text-[10px] rounded-full">Mensal</Badge>
          </div>
          {faturamentoMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={faturamentoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(220, 8%, 48%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 8%, 48%)" }} tickFormatter={(v) => `${v/1000}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} contentStyle={chartTooltipStyle} />
                <Bar dataKey="valor" fill="hsl(174, 55%, 40%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
              Sem dados de faturamento ainda
            </div>
          )}
        </Card>

        <Card className="col-span-12 lg:col-span-4 p-6 card-shadow card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Linhas SIM</h3>
            <span className="text-2xl font-bold tracking-tight">{online + offline}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 text-xs mt-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" /> Online ({online})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> Offline ({offline})</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-4 p-6 card-shadow card-hover">
          <h3 className="text-sm font-semibold mb-5">Resumo Operacional</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div>
                <span className="text-sm">Clientes Ativos</span>
              </div>
              <span className="text-lg font-bold tracking-tight">{clientesAtivos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="w-4 h-4 text-destructive" /></div>
                <span className="text-sm">Manutencoes Abertas</span>
              </div>
              <span className="text-lg font-bold tracking-tight">{manutencoesAbertas.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10"><Truck className="w-4 h-4 text-warning" /></div>
                <span className="text-sm">Em Transito</span>
              </div>
              <span className="text-lg font-bold tracking-tight">{emTransito}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><CheckCircle className="w-4 h-4 text-success" /></div>
                <span className="text-sm">Instalacoes Realizadas</span>
              </div>
              <span className="text-lg font-bold tracking-tight">{realizados}</span>
            </div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4 p-6 card-shadow card-hover">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">Equipe Tecnica</h3>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-2xl font-bold tracking-tight">{totalTecnicos}</p>
              <p className="text-[11px] text-muted-foreground">Total</p>
            </div>
            <div className="p-3 rounded-xl bg-success/10 border border-success/10">
              <p className="text-2xl font-bold tracking-tight text-success">{tecnicosDisponiveis}</p>
              <p className="text-[11px] text-muted-foreground">Disponiveis</p>
            </div>
          </div>
          <div className="space-y-2">
            {tecnicos.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors duration-150">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                  {t.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{t.cidade}/{t.estado}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  t.status === "disponivel" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.status === "disponivel" ? "bg-success" : "bg-muted-foreground/50"}`} />
                  {t.status === "disponivel" ? "Online" : "Ocupado"}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="p-6 card-shadow card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10"><CalendarDays className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-3xl font-bold tracking-tight">{agendados}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Instalacoes Agendadas</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-shadow card-hover border-l-4 border-l-primary/60">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="w-4 h-4 text-primary" /></div>
              <h3 className="text-sm font-semibold">Resumo</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-medium text-xs text-primary">Clientes</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {clientes.length} cadastrados, {clientesAtivos} ativos
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                <p className="font-medium text-xs text-muted-foreground">Linhas SIM</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {linhas.length} total, {online} online, {offline} offline
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
