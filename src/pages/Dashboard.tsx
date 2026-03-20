import { ShoppingCart, Wifi, WifiOff, DollarSign, Users, Brain, TrendingUp, AlertTriangle, Truck, CalendarDays, CheckCircle, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientes, useLinhasSIM, useManutencoes, useDespachos, useAgendamentos, useTecnicos } from "@/hooks/useSupabaseData";
import { usePedidosCompletos } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const faturamentoMensal = [
  { mes: "Out", valor: 42000 },
  { mes: "Nov", valor: 48000 },
  { mes: "Dez", valor: 51000 },
  { mes: "Jan", valor: 45000 },
  { mes: "Fev", valor: 53000 },
  { mes: "Mar", valor: 58000 },
];

const Dashboard = () => {
  const { data: clientes = [] } = useClientes();
  const { data: pedidos = [] } = usePedidosCompletos();
  const { data: linhas = [] } = useLinhasSIM();
  const { data: manutencoes = [] } = useManutencoes();
  const { data: despachos = [] } = useDespachos();
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: tecnicos = [] } = useTecnicos();

  const pendentes = pedidos.filter(p => p.status === "pendente").length;
  const online = linhas.filter(l => l.status === "online").length;
  const offline = linhas.filter(l => l.status === "offline").length;
  const clientesAtivos = clientes.filter(c => c.status === "ativo").length;
  const faturamento = "R$ 58.000";
  const manutencoesAbertas = manutencoes.filter(m => m.status === "aberto");
  const emTransito = despachos.filter(d => d.status_entrega === "em_transito" || d.status_entrega === "postado").length;
  const agendados = agendamentos.filter(a => a.status === "agendado").length;
  const realizados = agendamentos.filter(a => a.status === "realizado").length;
  const totalTecnicos = tecnicos.length;
  const tecnicosDisponiveis = tecnicos.filter(t => t.status === "disponivel").length;

  const pieData = [
    { name: "Online", value: online, fill: "hsl(160, 55%, 38%)" },
    { name: "Offline", value: offline, fill: "hsl(210, 8%, 50%)" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Overview" subtitle="Visao consolidada do Trackit Hub">
        <Select defaultValue="30">
          <SelectTrigger className="w-[130px] h-9 text-xs bg-secondary/60 border-border/50 rounded-xl">
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
        <StatCard label="Pedidos Pendentes" value={pendentes} icon={ShoppingCart} accent="warning" trend="+12%" trendDirection="up" />
        <StatCard label="Linhas Online" value={online} icon={Wifi} accent="success" trend="+3.1%" trendDirection="up" />
        <StatCard label="Linhas Offline" value={offline} icon={WifiOff} accent="muted" trend="-2.4%" trendDirection="down" />
        <StatCard label="Faturamento Mes" value={faturamento} icon={DollarSign} accent="primary" trend="+9.4%" trendDirection="up" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8 p-6 card-shadow card-hover">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-base">Faturamento Mensal</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Receita dos ultimos 6 meses</p>
            </div>
            <Badge variant="secondary" className="text-xs">Mensal</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 18%)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(210, 8%, 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(210, 8%, 50%)" }} tickFormatter={(v) => `${v/1000}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} contentStyle={{ background: "hsl(210, 20%, 10%)", border: "1px solid hsl(210, 15%, 18%)", borderRadius: "12px", fontSize: "12px" }} />
              <Bar dataKey="valor" fill="hsl(174, 55%, 40%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-12 lg:col-span-4 p-6 card-shadow card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base">Linhas SIM</h3>
            <span className="text-2xl font-bold">{online + offline}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(210, 20%, 10%)", border: "1px solid hsl(210, 15%, 18%)", borderRadius: "12px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 text-xs mt-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Online ({online})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /> Offline ({offline})</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-4 p-6 card-shadow card-hover">
          <h3 className="font-semibold text-base mb-4">Resumo Operacional</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div>
                <span className="text-sm">Clientes Ativos</span>
              </div>
              <span className="text-lg font-bold">{clientesAtivos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="w-4 h-4 text-destructive" /></div>
                <span className="text-sm">Manutencoes Abertas</span>
              </div>
              <span className="text-lg font-bold">{manutencoesAbertas.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10"><Truck className="w-4 h-4 text-warning" /></div>
                <span className="text-sm">Em Transito</span>
              </div>
              <span className="text-lg font-bold">{emTransito}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><CheckCircle className="w-4 h-4 text-success" /></div>
                <span className="text-sm">Instalacoes Realizadas</span>
              </div>
              <span className="text-lg font-bold">{realizados}</span>
            </div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4 p-6 card-shadow card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base">Equipe Tecnica</h3>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold">{totalTecnicos}</p>
              <p className="text-[11px] text-muted-foreground">Total</p>
            </div>
            <div className="p-3 rounded-xl bg-success/10">
              <p className="text-2xl font-bold text-success">{tecnicosDisponiveis}</p>
              <p className="text-[11px] text-muted-foreground">Disponiveis</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {tecnicos.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                  {t.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{t.cidade}/{t.estado}</p>
                </div>
                <Badge variant={t.status === "disponivel" ? "default" : "secondary"} className="text-[10px]">
                  {t.status === "disponivel" ? "Online" : "Ocupado"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="p-5 card-shadow card-hover">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10"><CalendarDays className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{agendados}</p>
                <p className="text-xs text-muted-foreground">Instalacoes Agendadas</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 card-shadow card-hover border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-primary/10"><Brain className="w-4 h-4 text-primary" /></div>
              <h3 className="font-semibold text-sm">IA Conselheira</h3>
              <Badge variant="secondary" className="text-[10px]">Beta</Badge>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
                <p className="font-medium text-xs text-primary flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Viabilidade</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  <strong>Manaus/AM</strong>: indice de furto elevado, sem tecnico local. Sugestao: cadastrar tecnico parceiro.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/15">
                <p className="font-medium text-xs text-warning">Insight</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Faturamento cresceu 9,4%. Ricardo Santos (PR) lidera com 28 instalacoes/mes.
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
