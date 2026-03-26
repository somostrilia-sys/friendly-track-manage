import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useFaturamentoB2B, useInsertFaturamentoB2B, useUpdateFaturamentoB2B } from "@/hooks/useSupabaseData";
import { Plus, Download, BarChart3, Calendar, TrendingUp, TrendingDown, DollarSign, Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";
import type { DbFaturamentoB2B } from "@/types/database";
import * as XLSX from "xlsx";
import { addDays, format, parseISO } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))", "#22d3ee", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316",
  "#6366f1", "#14b8a6", "#e11d48", "#a855f7", "#0ea5e9",
];

const fmt = (v: number | null | undefined) => v != null ? `R$ ${Number(v).toFixed(2)}` : "R$ 0,00";
const fmtNum = (v: number | null | undefined) => v != null ? Number(v) : 0;
const fmtCompact = (v: number) => {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`;
  return `R$ ${v.toFixed(2)}`;
};

const MONTH_ORDER: Record<string, number> = {
  JANEIRO: 1, FEVEREIRO: 2, MARCO: 3, ABRIL: 4, MAIO: 5, JUNHO: 6,
  JULHO: 7, AGOSTO: 8, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12,
};

function sortMeses(a: string, b: string) {
  const [mA, yA] = a.split(" ");
  const [mB, yB] = b.split(" ");
  return ((parseInt(yA) || 0) * 100 + (MONTH_ORDER[mA] || 0)) - ((parseInt(yB) || 0) * 100 + (MONTH_ORDER[mB] || 0));
}

const emptyForm: Record<string, any> = {
  mes_referencia: "", data_fechamento: "", empresa: "", qtd_placas: 0, valor_por_placa: 0,
  total_plataforma: 0, qtd_linhas_smartsim: 0, valor_smartsim: 0, total_smartsim: 0,
  qtd_linhas_linkfield: 0, valor_linkfield: 0, total_linkfield: 0, qtd_linhas_arqia: 0,
  valor_arqia: 0, total_arqia: 0, total_linhas: 0, total_geral: 0, situacao: "aberto", observacao: "",
};

const FaturamentoB2BPage = () => {
  const { data: registros = [], isLoading } = useFaturamentoB2B();
  const insertMut = useInsertFaturamentoB2B();
  const updateMut = useUpdateFaturamentoB2B();

  const [mesSelecionado, setMesSelecionado] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<DbFaturamentoB2B | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>("all");
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState<string[]>([]);

  // Sorted months (chronological)
  const meses = useMemo(() => {
    const unique = [...new Set(registros.map(r => r.mes_referencia))];
    unique.sort(sortMeses);
    return unique;
  }, [registros]);

  // Descending for dropdown
  const mesesDesc = useMemo(() => [...meses].reverse(), [meses]);

  const mesAtual = mesSelecionado || mesesDesc[0] || "";

  const registrosMes = useMemo(
    () => registros.filter(r => r.mes_referencia === mesAtual),
    [registros, mesAtual]
  );

  const empresas = useMemo(() => [...new Set(registros.map(r => r.empresa))].sort(), [registros]);

  // Initialize selected companies (top 5 by latest total)
  useMemo(() => {
    if (empresasSelecionadas.length === 0 && empresas.length > 0 && mesesDesc[0]) {
      const latest = registros.filter(r => r.mes_referencia === mesesDesc[0]);
      const top5 = latest.sort((a, b) => fmtNum(b.total_geral) - fmtNum(a.total_geral)).slice(0, 5).map(r => r.empresa);
      setEmpresasSelecionadas(top5);
    }
  }, [empresas, mesesDesc, registros]);

  const totais = useMemo(() => {
    return registrosMes.reduce(
      (acc, r) => ({
        qtd_placas: acc.qtd_placas + fmtNum(r.qtd_placas),
        total_plataforma: acc.total_plataforma + fmtNum(r.total_plataforma),
        qtd_linhas_smartsim: acc.qtd_linhas_smartsim + fmtNum(r.qtd_linhas_smartsim),
        total_smartsim: acc.total_smartsim + fmtNum(r.total_smartsim),
        qtd_linhas_linkfield: acc.qtd_linhas_linkfield + fmtNum(r.qtd_linhas_linkfield),
        total_linkfield: acc.total_linkfield + fmtNum(r.total_linkfield),
        qtd_linhas_arqia: acc.qtd_linhas_arqia + fmtNum(r.qtd_linhas_arqia),
        total_arqia: acc.total_arqia + fmtNum(r.total_arqia),
        total_linhas: acc.total_linhas + fmtNum(r.total_linhas),
        total_geral: acc.total_geral + fmtNum(r.total_geral),
      }),
      { qtd_placas: 0, total_plataforma: 0, qtd_linhas_smartsim: 0, total_smartsim: 0, qtd_linhas_linkfield: 0, total_linkfield: 0, qtd_linhas_arqia: 0, total_arqia: 0, total_linhas: 0, total_geral: 0 }
    );
  }, [registrosMes]);

  // ===== Dashboard data =====
  const mesAtualIdx = meses.indexOf(mesesDesc[0]);
  const mesAnterior = mesAtualIdx > 0 ? meses[mesAtualIdx - 1] : "";

  const totalMesAtual = useMemo(() => {
    return registros.filter(r => r.mes_referencia === mesesDesc[0]).reduce((s, r) => s + fmtNum(r.total_geral), 0);
  }, [registros, mesesDesc]);

  const totalMesAnterior = useMemo(() => {
    if (!mesAnterior) return 0;
    return registros.filter(r => r.mes_referencia === mesAnterior).reduce((s, r) => s + fmtNum(r.total_geral), 0);
  }, [registros, mesAnterior]);

  const variacao = totalMesAnterior > 0 ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior * 100) : 0;

  const empresasAtivas = useMemo(() => {
    return new Set(registros.filter(r => r.mes_referencia === mesesDesc[0]).map(r => r.empresa)).size;
  }, [registros, mesesDesc]);

  // Growth ranking per company
  const growthData = useMemo(() => {
    if (!mesesDesc[0] || !mesAnterior) return [];
    const atual = registros.filter(r => r.mes_referencia === mesesDesc[0]);
    const anterior = registros.filter(r => r.mes_referencia === mesAnterior);
    const anteriorMap = new Map(anterior.map(r => [r.empresa, fmtNum(r.total_geral)]));

    return atual.map(r => {
      const prev = anteriorMap.get(r.empresa) || 0;
      const curr = fmtNum(r.total_geral);
      const growth = prev > 0 ? ((curr - prev) / prev * 100) : (curr > 0 ? 100 : 0);
      return { empresa: r.empresa, atual: curr, anterior: prev, growth };
    }).sort((a, b) => b.growth - a.growth);
  }, [registros, mesesDesc, mesAnterior]);

  const topCrescimento = growthData.filter(d => d.growth > 0);
  const estagnadas = growthData.filter(d => d.growth <= 0);

  // Multi-line chart data (evolution per company)
  const lineChartData = useMemo(() => {
    const filtered = empresasSelecionadas.length > 0
      ? registros.filter(r => empresasSelecionadas.includes(r.empresa))
      : registros;

    return meses.map(mes => {
      const row: Record<string, any> = { mes: mes.substring(0, 3) + " " + mes.split(" ")[1]?.substring(2) };
      empresasSelecionadas.forEach(emp => {
        const rec = filtered.find(r => r.mes_referencia === mes && r.empresa === emp);
        row[emp] = rec ? fmtNum(rec.total_geral) : 0;
      });
      return row;
    });
  }, [registros, meses, empresasSelecionadas]);

  // Bar chart: current vs previous month
  const barChartData = useMemo(() => {
    if (!mesesDesc[0] || !mesAnterior) return [];
    return growthData.slice(0, 15).map(d => ({
      empresa: d.empresa.length > 12 ? d.empresa.substring(0, 12) + "..." : d.empresa,
      "Mes Atual": d.atual,
      "Mes Anterior": d.anterior,
    }));
  }, [growthData, mesesDesc, mesAnterior]);

  // Area chart: total revenue evolution
  const areaChartData = useMemo(() => {
    return meses.map(mes => {
      const total = registros.filter(r => r.mes_referencia === mes).reduce((s, r) => s + fmtNum(r.total_geral), 0);
      return {
        mes: mes.substring(0, 3) + " " + mes.split(" ")[1]?.substring(2),
        total,
      };
    });
  }, [registros, meses]);

  // Individual company evolution
  const empresaEvolucao = useMemo(() => {
    if (empresaFiltro === "all") return [];
    return meses.map(mes => {
      const rec = registros.find(r => r.mes_referencia === mes && r.empresa === empresaFiltro);
      return {
        mes: mes.substring(0, 3) + " " + mes.split(" ")[1]?.substring(2),
        placas: rec ? fmtNum(rec.qtd_placas) : 0,
        smartsim: rec ? fmtNum(rec.qtd_linhas_smartsim) : 0,
        linkfield: rec ? fmtNum(rec.qtd_linhas_linkfield) : 0,
        arqia: rec ? fmtNum(rec.qtd_linhas_arqia) : 0,
        total: rec ? fmtNum(rec.total_geral) : 0,
      };
    });
  }, [registros, meses, empresaFiltro]);

  const setField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const abrirNovo = () => { setForm({ ...emptyForm, mes_referencia: mesAtual }); setEditando(null); setModalOpen(true); };
  const abrirEditar = (r: DbFaturamentoB2B) => {
    setForm({
      mes_referencia: r.mes_referencia, data_fechamento: r.data_fechamento, empresa: r.empresa,
      qtd_placas: r.qtd_placas, valor_por_placa: r.valor_por_placa, total_plataforma: r.total_plataforma,
      qtd_linhas_smartsim: r.qtd_linhas_smartsim, valor_smartsim: r.valor_smartsim, total_smartsim: r.total_smartsim,
      qtd_linhas_linkfield: r.qtd_linhas_linkfield, valor_linkfield: r.valor_linkfield, total_linkfield: r.total_linkfield,
      qtd_linhas_arqia: r.qtd_linhas_arqia, valor_arqia: r.valor_arqia, total_arqia: r.total_arqia,
      total_linhas: r.total_linhas, total_geral: r.total_geral, situacao: r.situacao, observacao: r.observacao || "",
    });
    setEditando(r);
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.empresa || !form.mes_referencia) { toast.error("Preencha empresa e mes de referencia"); return; }
    const payload = { ...form };
    payload.total_plataforma = Number(payload.qtd_placas) * Number(payload.valor_por_placa);
    payload.total_smartsim = Number(payload.qtd_linhas_smartsim) * Number(payload.valor_smartsim);
    payload.total_linkfield = Number(payload.qtd_linhas_linkfield) * Number(payload.valor_linkfield);
    payload.total_arqia = Number(payload.qtd_linhas_arqia) * Number(payload.valor_arqia);
    payload.total_linhas = Number(payload.qtd_linhas_smartsim) + Number(payload.qtd_linhas_linkfield) + Number(payload.qtd_linhas_arqia);
    payload.total_geral = payload.total_plataforma + payload.total_smartsim + payload.total_linkfield + payload.total_arqia;
    try {
      if (editando) {
        await updateMut.mutateAsync({ id: editando.id, ...payload });
        toast.success("Registro atualizado!");
      } else {
        await insertMut.mutateAsync(payload);
        toast.success("Registro criado!");
      }
      setModalOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const exportar = () => {
    const rows = registrosMes.map(r => ({
      "Mes Referencia": r.mes_referencia, "Data Fechamento": r.data_fechamento,
      "Vencimento": r.data_fechamento ? format(addDays(parseISO(r.data_fechamento), 3), "dd/MM/yyyy") : "",
      "Empresa": r.empresa, "Qtd Placas": r.qtd_placas, "Valor/Placa": r.valor_por_placa,
      "Total Plataforma": r.total_plataforma, "Qtd SmartSim": r.qtd_linhas_smartsim,
      "Valor SmartSim": r.valor_smartsim, "Total SmartSim": r.total_smartsim,
      "Qtd Linkfield": r.qtd_linhas_linkfield, "Valor Linkfield": r.valor_linkfield,
      "Total Linkfield": r.total_linkfield, "Qtd Arqia": r.qtd_linhas_arqia,
      "Valor Arqia": r.valor_arqia, "Total Arqia": r.total_arqia,
      "Total Linhas": r.total_linhas, "Total Geral": r.total_geral,
      "Situacao": r.situacao, "OBS": r.observacao,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faturamento B2B");
    XLSX.writeFile(wb, `faturamento_b2b_${mesAtual.replace(/\s+/g, "_")}.xlsx`);
    toast.success("Exportado com sucesso!");
  };

  const getVencimento = (dataFechamento: string) => {
    if (!dataFechamento) return "--";
    try { return format(addDays(parseISO(dataFechamento), 3), "dd/MM/yyyy"); } catch { return "--"; }
  };

  const getSituacaoBadge = (sit: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pago: "default", aberto: "secondary", atrasado: "destructive", faturado: "outline",
    };
    return <Badge variant={map[sit?.toLowerCase()] || "secondary"}>{sit || "--"}</Badge>;
  };

  const toggleEmpresa = (emp: string) => {
    setEmpresasSelecionadas(prev =>
      prev.includes(emp) ? prev.filter(e => e !== emp) : [...prev, emp]
    );
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Faturamento B2B" subtitle="Gestao de faturamento mensal por empresa">
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportar}><Download className="w-4 h-4 mr-2" /> Exportar</Button>
          <Button onClick={abrirNovo}><Plus className="w-4 h-4 mr-2" /> Novo Registro</Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="fechamento" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="fechamento"><Calendar className="w-4 h-4 mr-1" /> Fechamento Mensal</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Dashboard Crescimento</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: FECHAMENTO MENSAL ===== */}
        <TabsContent value="fechamento">
          <Card className="card-shadow">
            <div className="p-4 border-b flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">Mes de Referencia:</Label>
                <Select value={mesAtual} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione o mes" /></SelectTrigger>
                  <SelectContent>
                    {mesesDesc.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-muted-foreground">{registrosMes.length} empresas neste mes</span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Data Fechamento</TableHead>
                    <TableHead className="whitespace-nowrap">Vencimento</TableHead>
                    <TableHead className="whitespace-nowrap">Empresa</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Qtd Placas</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Valor/Placa</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Plataforma</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Qtd SmartSim</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Valor SmartSim</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total SmartSim</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Qtd Linkfield</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Valor Linkfield</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Linkfield</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Qtd Arqia</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Valor Arqia</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Arqia</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Linhas</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Geral</TableHead>
                    <TableHead className="whitespace-nowrap">Situacao</TableHead>
                    <TableHead className="whitespace-nowrap">OBS</TableHead>
                    <TableHead className="whitespace-nowrap">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrosMes.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm">{r.data_fechamento ? format(parseISO(r.data_fechamento), "dd/MM/yyyy") : "--"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{getVencimento(r.data_fechamento)}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{r.empresa}</TableCell>
                      <TableCell className="text-right">{fmtNum(r.qtd_placas)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(r.valor_por_placa)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.total_plataforma)}</TableCell>
                      <TableCell className="text-right">{fmtNum(r.qtd_linhas_smartsim)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(r.valor_smartsim)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.total_smartsim)}</TableCell>
                      <TableCell className="text-right">{fmtNum(r.qtd_linhas_linkfield)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(r.valor_linkfield)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.total_linkfield)}</TableCell>
                      <TableCell className="text-right">{fmtNum(r.qtd_linhas_arqia)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(r.valor_arqia)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.total_arqia)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtNum(r.total_linhas)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{fmt(r.total_geral)}</TableCell>
                      <TableCell>{getSituacaoBadge(r.situacao)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{r.observacao || "--"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => abrirEditar(r)}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {registrosMes.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold border-t-2">
                      <TableCell colSpan={3} className="text-right">TOTAIS</TableCell>
                      <TableCell className="text-right">{totais.qtd_placas}</TableCell>
                      <TableCell />
                      <TableCell className="text-right">{fmt(totais.total_plataforma)}</TableCell>
                      <TableCell className="text-right">{totais.qtd_linhas_smartsim}</TableCell>
                      <TableCell />
                      <TableCell className="text-right">{fmt(totais.total_smartsim)}</TableCell>
                      <TableCell className="text-right">{totais.qtd_linhas_linkfield}</TableCell>
                      <TableCell />
                      <TableCell className="text-right">{fmt(totais.total_linkfield)}</TableCell>
                      <TableCell className="text-right">{totais.qtd_linhas_arqia}</TableCell>
                      <TableCell />
                      <TableCell className="text-right">{fmt(totais.total_arqia)}</TableCell>
                      <TableCell className="text-right">{totais.total_linhas}</TableCell>
                      <TableCell className="text-right text-primary">{fmt(totais.total_geral)}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t">
              <span className="text-sm text-muted-foreground">Total: {registrosMes.length} empresas</span>
            </div>
          </Card>
        </TabsContent>

        {/* ===== TAB 2: DASHBOARD CRESCIMENTO ===== */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Faturamento Mes Atual"
              value={fmtCompact(totalMesAtual)}
              icon={DollarSign}
              accent="primary"
              subtitle={mesesDesc[0] || ""}
            />
            <StatCard
              label="Faturamento Mes Anterior"
              value={fmtCompact(totalMesAnterior)}
              icon={DollarSign}
              accent="muted"
              subtitle={mesAnterior || "N/A"}
            />
            <StatCard
              label="Variacao"
              value={`${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}%`}
              icon={variacao >= 0 ? TrendingUp : TrendingDown}
              accent={variacao >= 0 ? "success" : "destructive"}
              trend={`${Math.abs(variacao).toFixed(1)}%`}
              trendDirection={variacao >= 0 ? "up" : "down"}
            />
            <StatCard
              label="Empresas Ativas"
              value={empresasAtivas}
              icon={Building2}
              accent="primary"
              subtitle="no mes atual"
            />
          </div>

          {/* Area Chart: Overall revenue evolution */}
          <Card className="card-shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Evolucao Receita Total (23 meses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#colorTotal)" strokeWidth={2} name="Total Geral" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Line Chart: per-company evolution */}
          <Card className="card-shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold">Evolucao por Empresa</h3>
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                {empresas.map((emp, i) => (
                  <label key={emp} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox
                      checked={empresasSelecionadas.includes(emp)}
                      onCheckedChange={() => toggleEmpresa(emp)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="truncate max-w-[100px]" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{emp}</span>
                  </label>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                {empresasSelecionadas.map((emp, i) => (
                  <Line key={emp} type="monotone" dataKey={emp} stroke={CHART_COLORS[empresas.indexOf(emp) % CHART_COLORS.length]} strokeWidth={2} dot={false} name={emp} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Bar Chart: Current vs Previous month */}
          <Card className="card-shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Comparativo: {mesesDesc[0]} vs {mesAnterior}</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="empresa" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="Mes Anterior" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mes Atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Rankings side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Crescimento */}
            <Card className="card-shadow">
              <div className="p-4 border-b">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Top Empresas em Crescimento
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-right">Mes Anterior</TableHead>
                    <TableHead className="text-right">Mes Atual</TableHead>
                    <TableHead className="text-right">Crescimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCrescimento.slice(0, 10).map(d => (
                    <TableRow key={d.empresa}>
                      <TableCell className="font-medium">{d.empresa}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{fmt(d.anterior)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(d.atual)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">+{d.growth.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {topCrescimento.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Estagnadas */}
            <Card className="card-shadow">
              <div className="p-4 border-b">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-destructive" /> Empresas Estagnadas / Queda
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-right">Mes Anterior</TableHead>
                    <TableHead className="text-right">Mes Atual</TableHead>
                    <TableHead className="text-right">Variacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estagnadas.slice(0, 10).map(d => (
                    <TableRow key={d.empresa}>
                      <TableCell className="font-medium">{d.empresa}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{fmt(d.anterior)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(d.atual)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{d.growth.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {estagnadas.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Individual company filter */}
          <Card className="card-shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold">Evolucao Individual</h3>
              <Select value={empresaFiltro} onValueChange={setEmpresaFiltro}>
                <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Selecione uma empresa</SelectItem>
                  {empresas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {empresaFiltro !== "all" && empresaEvolucao.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={empresaEvolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickFormatter={v => String(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="placas" stroke="hsl(var(--primary))" strokeWidth={2} name="Placas" />
                  <Line type="monotone" dataKey="smartsim" stroke="#22d3ee" strokeWidth={2} name="SmartSim" />
                  <Line type="monotone" dataKey="linkfield" stroke="#f59e0b" strokeWidth={2} name="Linkfield" />
                  <Line type="monotone" dataKey="arqia" stroke="#10b981" strokeWidth={2} name="Arqia" />
                  <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} name="Total (R$)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Selecione uma empresa para ver a evolucao detalhada</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Form */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando ? "Editar Registro" : "Novo Registro de Faturamento"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Mes Referencia</Label><Input value={form.mes_referencia} onChange={e => setField("mes_referencia", e.target.value.toUpperCase())} placeholder="MARCO 2026" /></div>
            <div><Label>Data Fechamento</Label><Input type="date" value={form.data_fechamento} onChange={e => setField("data_fechamento", e.target.value)} /></div>
            <div><Label>Empresa</Label><Input value={form.empresa} onChange={e => setField("empresa", e.target.value)} /></div>

            <div><Label>Qtd Placas</Label><Input type="number" value={form.qtd_placas} onChange={e => setField("qtd_placas", Number(e.target.value))} /></div>
            <div><Label>Valor/Placa</Label><Input type="number" step="0.01" value={form.valor_por_placa} onChange={e => setField("valor_por_placa", Number(e.target.value))} /></div>
            <div><Label>Total Plataforma</Label><Input type="number" step="0.01" value={Number(form.qtd_placas) * Number(form.valor_por_placa)} disabled className="bg-muted" /></div>

            <div><Label>Qtd Linhas SmartSim</Label><Input type="number" value={form.qtd_linhas_smartsim} onChange={e => setField("qtd_linhas_smartsim", Number(e.target.value))} /></div>
            <div><Label>Valor SmartSim</Label><Input type="number" step="0.01" value={form.valor_smartsim} onChange={e => setField("valor_smartsim", Number(e.target.value))} /></div>
            <div><Label>Total SmartSim</Label><Input type="number" step="0.01" value={Number(form.qtd_linhas_smartsim) * Number(form.valor_smartsim)} disabled className="bg-muted" /></div>

            <div><Label>Qtd Linhas Linkfield</Label><Input type="number" value={form.qtd_linhas_linkfield} onChange={e => setField("qtd_linhas_linkfield", Number(e.target.value))} /></div>
            <div><Label>Valor Linkfield</Label><Input type="number" step="0.01" value={form.valor_linkfield} onChange={e => setField("valor_linkfield", Number(e.target.value))} /></div>
            <div><Label>Total Linkfield</Label><Input type="number" step="0.01" value={Number(form.qtd_linhas_linkfield) * Number(form.valor_linkfield)} disabled className="bg-muted" /></div>

            <div><Label>Qtd Linhas Arqia</Label><Input type="number" value={form.qtd_linhas_arqia} onChange={e => setField("qtd_linhas_arqia", Number(e.target.value))} /></div>
            <div><Label>Valor Arqia</Label><Input type="number" step="0.01" value={form.valor_arqia} onChange={e => setField("valor_arqia", Number(e.target.value))} /></div>
            <div><Label>Total Arqia</Label><Input type="number" step="0.01" value={Number(form.qtd_linhas_arqia) * Number(form.valor_arqia)} disabled className="bg-muted" /></div>

            <div><Label>Situacao</Label>
              <Select value={form.situacao} onValueChange={v => setField("situacao", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="faturado">Faturado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Observacao</Label><Textarea value={form.observacao} onChange={e => setField("observacao", e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>{editando ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaturamentoB2BPage;
