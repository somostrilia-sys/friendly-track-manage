import { Users, DollarSign, Clock, AlertTriangle, Truck, CalendarDays, CheckCircle, ArrowRight, ShoppingCart, TrendingUp, TrendingDown, Wrench, PhoneOff, PackageMinus, Wifi, Box } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientes, useManutencoes, useDespachos, useAgendamentos, useTecnicos, useFaturamentoB2B, usePedidosCompletos, useRealtimeSubscription, useServicos, useEquipamentos, useLinhasSIM, useInstalacoes, useChamadosSuporte, useRetiradas } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const MONTH_MAP: Record<string, number> = {
  JANEIRO: 1, FEVEREIRO: 2, MARCO: 3, ABRIL: 4, MAIO: 5, JUNHO: 6,
  JULHO: 7, AGOSTO: 8, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12,
};

const MONTH_SHORT: Record<number, string> = {
  1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
  7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
};

function parseMesReferencia(mes: string): { month: number; year: number } | null {
  if (!mes) return null;
  const parts = mes.toUpperCase().trim().split(/[\s\/]+/);
  if (parts.length < 2) return null;
  const monthName = parts[0];
  const year = parseInt(parts[parts.length - 1]);
  const month = MONTH_MAP[monthName];
  if (!month || isNaN(year)) return null;
  return { month, year };
}

const SITUACAO_COLORS: Record<string, string> = {
  pago: "bg-success/15 text-success",
  faturado: "bg-primary/15 text-primary",
  aberto: "bg-warning/15 text-warning",
  atrasado: "bg-destructive/15 text-destructive",
  parcial: "bg-accent/15 text-accent",
};

const PIE_COLORS = [
  "hsl(174, 55%, 40%)", "hsl(160, 55%, 38%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(220, 60%, 50%)", "hsl(280, 55%, 50%)",
  "hsl(30, 80%, 50%)", "hsl(140, 50%, 45%)", "hsl(200, 60%, 45%)", "hsl(320, 50%, 50%)",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: clientes = [] } = useClientes();
  const { data: pedidos = [] } = usePedidosCompletos();
  const { data: manutencoes = [] } = useManutencoes();
  const { data: despachos = [] } = useDespachos();
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: tecnicos = [] } = useTecnicos();
  const { data: faturamentoB2B = [] } = useFaturamentoB2B();
  const { data: servicos = [] } = useServicos();
  const { data: equipamentos = [] } = useEquipamentos();
  const { data: linhasSIM = [] } = useLinhasSIM();
  const { data: instalacoes = [] } = useInstalacoes();
  const { data: chamados = [] } = useChamadosSuporte();
  const { data: retiradas = [] } = useRetiradas();

  // Realtime subscriptions for dashboard
  useRealtimeSubscription("clientes", ["clientes"]);
  useRealtimeSubscription("faturamento_b2b", ["faturamento_b2b"]);
  useRealtimeSubscription("agendamentos", ["agendamentos"]);
  useRealtimeSubscription("tecnicos", ["tecnicos"]);
  useRealtimeSubscription("manutencoes", ["manutencoes"]);
  useRealtimeSubscription("servicos_agendados", ["servicos_agendados"]);
  useRealtimeSubscription("equipamentos", ["equipamentos"]);
  useRealtimeSubscription("instalacoes", ["instalacoes"]);
  useRealtimeSubscription("chamados_suporte", ["chamados_suporte"]);
  useRealtimeSubscription("retiradas", ["retiradas"]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentMonthRecords = useMemo(() => {
    return faturamentoB2B.filter((f: any) => {
      const parsed = parseMesReferencia(f.mes_referencia);
      return parsed && parsed.month === currentMonth && parsed.year === currentYear;
    });
  }, [faturamentoB2B, currentMonth, currentYear]);

  const prevMonthRecords = useMemo(() => {
    let pm = currentMonth - 1, py = currentYear;
    if (pm === 0) { pm = 12; py--; }
    return faturamentoB2B.filter((f: any) => {
      const parsed = parseMesReferencia(f.mes_referencia);
      return parsed && parsed.month === pm && parsed.year === py;
    });
  }, [faturamentoB2B, currentMonth, currentYear]);

  // Metric 1: Clientes Ativos
  const clientesAtivos = clientes.filter((c: any) => c.status === "ativo").length;

  // Metric 2: Faturamento do Mes
  const faturamentoMesAtual = currentMonthRecords.reduce((sum: number, f: any) => sum + Number(f.total_geral || 0), 0);
  const faturamentoMesAnterior = prevMonthRecords.reduce((sum: number, f: any) => sum + Number(f.total_geral || 0), 0);
  const faturamentoVariacao = faturamentoMesAnterior > 0
    ? ((faturamentoMesAtual - faturamentoMesAnterior) / faturamentoMesAnterior * 100)
    : 0;

  // Metric 3: A Receber
  const aReceber = currentMonthRecords
    .filter((f: any) => f.situacao !== "pago")
    .reduce((sum: number, f: any) => sum + (Number(f.total_geral || 0) - Number(f.valor_pago || 0)), 0);

  // Metric 4: Inadimplentes
  const inadimplentes = currentMonthRecords.filter((f: any) => {
    if (f.situacao === "atrasado") return true;
    if (f.situacao === "pago") return false;
    if (f.data_fechamento) {
      const fechamento = new Date(f.data_fechamento);
      const vencimento = new Date(fechamento);
      vencimento.setDate(vencimento.getDate() + 3);
      return vencimento < now;
    }
    return false;
  }).length;

  // Faturamento Mensal Chart (last 12 months)
  const faturamentoMensal = useMemo(() => {
    const meses: Record<string, number> = {};
    faturamentoB2B.forEach((f: any) => {
      const parsed = parseMesReferencia(f.mes_referencia);
      if (!parsed) return;
      const key = `${parsed.year}-${String(parsed.month).padStart(2, "0")}`;
      meses[key] = (meses[key] || 0) + Number(f.total_geral || 0);
    });
    return Object.entries(meses)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, valor]) => {
        const [, m] = key.split("-");
        return { mes: MONTH_SHORT[parseInt(m)], valor };
      });
  }, [faturamentoB2B]);

  // Pie chart: Top 10 clients by total_geral current month
  const faturamentoPorCliente = useMemo(() => {
    const byClient: Record<string, number> = {};
    currentMonthRecords.forEach((f: any) => {
      byClient[f.empresa] = (byClient[f.empresa] || 0) + Number(f.total_geral || 0);
    });
    return Object.entries(byClient)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value], i) => ({ name, value, fill: PIE_COLORS[i % PIE_COLORS.length] }));
  }, [currentMonthRecords]);

  // Operational
  const manutencoesEspera = manutencoes.filter((m: any) => m.status === "espera").length;
  const manutencoesPrioridade = manutencoes.filter((m: any) => m.status === "prioridade").length;
  const manutencoesAbertas = manutencoes.filter((m: any) => !["resolvido", "concluido"].includes(m.status)).length;
  const emTransito = despachos.filter((d: any) => d.status_entrega === "em_transito" || d.status_entrega === "postado").length;
  const pedidosPendentes = pedidos.filter((p: any) => p.status === "pendente").length;
  const agendados = agendamentos.filter((a: any) => a.status === "agendado").length;
  const realizados = agendamentos.filter((a: any) => a.status === "realizado").length;
  const semRetorno = agendamentos.filter((a: any) => a.status === "sem_retorno").length;
  const totalTecnicos = tecnicos.length;
  const tecnicosDisponiveis = tecnicos.filter((t: any) => t.status === "disponivel").length;

  // Equipment & SIM
  const equipamentosEstoque = equipamentos.filter((e: any) => e.status === "disponivel" || e.status === "em_estoque").length;
  const totalEquipamentos = equipamentos.length;
  const linhasAtivas = linhasSIM.filter((l: any) => l.status === "online" || l.status === "ativa").length;
  const totalLinhas = linhasSIM.length;

  // Suporte
  const chamadosAbertos = chamados.filter((c: any) => c.status === "aberto").length;
  const chamadosEmAtendimento = chamados.filter((c: any) => c.status === "em_atendimento").length;

  // Retiradas
  const retiradasPendentes = retiradas.filter((r: any) => r.status === "pendente" || r.status === "retirado").length;

  // Instalações
  const instalacoesConcluidas = instalacoes.filter((i: any) => i.status === "concluida").length;
  const instalacoesAndamento = instalacoes.filter((i: any) => i.status === "em_andamento" || i.status === "aguardando").length;

  // Trackit Operational KPIs (real data from Supabase)
  const instalacoesSemana = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const fromAgendamentos = agendamentos.filter((a: any) => a.status === "realizado" && new Date(a.data) >= weekAgo).length;
    const fromServicos = servicos.filter((s: any) => s.tipo === "instalacao" && s.status === "concluido" && new Date(s.data) >= weekAgo).length;
    return Math.max(fromAgendamentos, fromServicos);
  }, [agendamentos, servicos]);
  const rastreadoresAtivos = clientes.reduce((sum: number, c: any) => sum + (Number(c.veiculos_ativos) || 0), 0) || totalEquipamentos - equipamentosEstoque;
  const tecnicosOnline = tecnicosDisponiveis;

  // Recent faturamentos
  const ultimosFaturamentos = useMemo(() => {
    return [...faturamentoB2B]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [faturamentoB2B]);

  const chartTooltipStyle = {
    background: "hsl(220, 18%, 10%)",
    border: "1px solid hsl(220, 14%, 16%)",
    borderRadius: "10px",
    fontSize: "12px",
    boxShadow: "0 8px 30px -8px rgba(0,0,0,0.5)",
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard Overview" subtitle="Visao consolidada do Trackit Hub" />

      {/* Financeiro KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Clientes Ativos" value={clientesAtivos} icon={Users} accent="primary" />
        <StatCard
          label="Faturamento do Mes"
          value={`R$ ${faturamentoMesAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          accent="success"
          trend={faturamentoMesAnterior > 0 ? `${Math.abs(Math.round(faturamentoVariacao))}%` : undefined}
          trendDirection={faturamentoVariacao >= 0 ? "up" : "down"}
        />
        <StatCard
          label="A Receber"
          value={`R$ ${aReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={Clock}
          accent="warning"
        />
        <StatCard label="Inadimplentes" value={inadimplentes} icon={AlertTriangle} accent="destructive" />
      </div>

      {/* Operacional KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Instalacoes esta Semana" value={instalacoesSemana} icon={CalendarDays} accent="success" />
        <StatCard label="Rastreadores Ativos" value={rastreadoresAtivos.toLocaleString("pt-BR")} icon={Truck} accent="primary" />
        <StatCard label="Equipamentos em Estoque" value={equipamentosEstoque} icon={Box} accent="muted" />
        <StatCard label="Linhas SIM Ativas" value={`${linhasAtivas}/${totalLinhas}`} icon={Wifi} accent="success" />
      </div>

      {/* Atencao KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Manutencoes (Espera)" value={manutencoesEspera} icon={Wrench} accent="warning" />
        <StatCard label="Manutencoes (Prioridade)" value={manutencoesPrioridade} icon={AlertTriangle} accent="destructive" />
        <StatCard label="Sem Retorno" value={semRetorno} icon={PhoneOff} accent="warning" />
        <StatCard label="Retiradas Pendentes" value={retiradasPendentes} icon={PackageMinus} accent="muted" />
        <StatCard label="Chamados Abertos" value={chamadosAbertos + chamadosEmAtendimento} icon={AlertTriangle} accent="warning" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8 p-6 card-shadow card-hover">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold">Faturamento Mensal</h3>
              <p className="text-xs text-muted-foreground mt-1">Receita dos ultimos 12 meses (faturamento_b2b)</p>
            </div>
            <Badge variant="secondary" className="text-[10px] rounded-full">Mensal</Badge>
          </div>
          {faturamentoMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={faturamentoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(220, 8%, 48%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 8%, 48%)" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={chartTooltipStyle} />
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
            <h3 className="text-sm font-semibold">Faturamento por Cliente</h3>
            <span className="text-[10px] text-muted-foreground">Mes atual - Top 10</span>
          </div>
          {faturamentoPorCliente.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={faturamentoPorCliente} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={68} strokeWidth={0}>
                    {faturamentoPorCliente.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] mt-2 max-h-[60px] overflow-y-auto">
                {faturamentoPorCliente.slice(0, 5).map((e, i) => (
                  <span key={i} className="flex items-center gap-1 truncate max-w-[140px]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.fill }} />
                    <span className="truncate">{e.name}</span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
              Sem dados no mes atual
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-4 p-6 card-shadow card-hover">
          <h3 className="text-sm font-semibold mb-5">Resumo Operacional</h3>
          <div className="space-y-3">
            {[
              { icon: Users, label: "Clientes Ativos", value: clientesAtivos, color: "primary" },
              { icon: Wrench, label: "Manutencoes Abertas", value: manutencoesAbertas, color: "destructive" },
              { icon: Truck, label: "Despachos em Transito", value: emTransito, color: "warning" },
              { icon: ShoppingCart, label: "Pedidos Pendentes", value: pedidosPendentes, color: "warning" },
              { icon: CalendarDays, label: "Agendamentos Pendentes", value: agendados, color: "primary" },
              { icon: PhoneOff, label: "Associados Sem Retorno", value: semRetorno, color: "destructive" },
              { icon: PackageMinus, label: "Retiradas Pendentes", value: retiradasPendentes, color: "warning" },
              { icon: CheckCircle, label: "Instalacoes Concluidas", value: instalacoesConcluidas, color: "success" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${color}/10`}><Icon className={`w-4 h-4 text-${color}`} /></div>
                  <span className="text-sm">{label}</span>
                </div>
                <span className={`text-lg font-bold tracking-tight ${value > 0 && color === "destructive" ? "text-destructive" : ""}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4 p-6 card-shadow card-hover">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">Equipe Tecnica</h3>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1" onClick={() => navigate("/objetivo/tecnicos")}>
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
            {tecnicos.slice(0, 4).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors duration-150">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                  {t.nome.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{t.regiao_atuacao || "—"}</p>
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
          <Card className="p-6 card-shadow card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10"><CheckCircle className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-3xl font-bold tracking-tight">{realizados}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Instalacoes Realizadas</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 card-shadow card-hover border-l-4 border-l-primary/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="w-4 h-4 text-primary" /></div>
              <h3 className="text-sm font-semibold">Resumo</h3>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-medium text-xs text-primary">Clientes</p>
                <p className="text-xs text-muted-foreground mt-1">{clientes.length} cadastrados, {clientesAtivos} ativos</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                <p className="font-medium text-xs text-muted-foreground">Faturamento B2B</p>
                <p className="text-xs text-muted-foreground mt-1">{faturamentoB2B.length} registros totais</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Ultimos Faturamentos */}
      <Card className="card-shadow">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Ultimos Faturamentos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">10 registros mais recentes do faturamento B2B</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1" onClick={() => navigate("/objetivo/financeiro")}>
            Ver todos <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        {ultimosFaturamentos.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Mes Referencia</TableHead>
                <TableHead>Data Fechamento</TableHead>
                <TableHead className="text-right">Total Geral</TableHead>
                <TableHead>Situacao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ultimosFaturamentos.map((f: any) => (
                <TableRow key={f.id} className="group">
                  <TableCell className="font-medium text-sm">{f.empresa}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.mes_referencia}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.data_fechamento ? new Date(f.data_fechamento).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    R$ {Number(f.total_geral || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${SITUACAO_COLORS[f.situacao] || "bg-muted text-muted-foreground"}`}>
                      {f.situacao ? f.situacao.charAt(0).toUpperCase() + f.situacao.slice(1) : "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum registro de faturamento encontrado</div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
