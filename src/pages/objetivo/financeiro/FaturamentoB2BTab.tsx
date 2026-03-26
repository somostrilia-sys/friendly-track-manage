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
import { StatCard } from "@/components/StatCard";
import { useFaturamentoB2B, useInsertFaturamentoB2B, useUpdateFaturamentoB2B } from "@/hooks/useSupabaseData";
import { Plus, Download, BarChart3, Calendar, TrendingUp, TrendingDown, DollarSign, Building2, ArrowUpRight, ArrowDownRight, Search, Users } from "lucide-react";
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

const fmt = (v: number | null | undefined) => {
  if (v == null) return "R$ 0";
  const n = Number(v);
  if (n === 0) return "R$ 0";
  // Compact: omit decimals when cents are .00
  const hasCents = n % 1 !== 0;
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })}`;
};
const fmtNum = (v: number | null | undefined) => v != null ? Number(v) : 0;
const fmtCompact = (v: number) => {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`;
  return `R$ ${v.toFixed(0)}`;
};

const MONTH_MAP: Record<string, string> = {
  JANEIRO: "01", FEVEREIRO: "02", MARCO: "03", ABRIL: "04", MAIO: "05", JUNHO: "06",
  JULHO: "07", AGOSTO: "08", SETEMBRO: "09", OUTUBRO: "10", NOVEMBRO: "11", DEZEMBRO: "12",
};

/** Convert "MARCO 2026" → "2026-03" for correct lexicographic sorting */
function mesParaSortKey(mesRef: string): string {
  const parts = mesRef.trim().split(/\s+/);
  const mesNome = parts[0]?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
  const ano = parts[1] || "0000";
  return `${ano}-${MONTH_MAP[mesNome] || "00"}`;
}

function sortMesesAsc(a: string, b: string) {
  return mesParaSortKey(a).localeCompare(mesParaSortKey(b));
}

const emptyForm: Record<string, any> = {
  mes_referencia: "", data_fechamento: "", empresa: "", qtd_placas: 0, valor_por_placa: 0,
  total_plataforma: 0, qtd_linhas_smartsim: 0, valor_smartsim: 0, total_smartsim: 0,
  qtd_linhas_linkfield: 0, valor_linkfield: 0, total_linkfield: 0, qtd_linhas_arqia: 0,
  valor_arqia: 0, total_arqia: 0, total_linhas: 0, total_geral: 0, situacao: "aberto", observacao: "",
};

const FaturamentoB2BTab = () => {
  const { data: registros = [], isLoading } = useFaturamentoB2B();
  const insertMut = useInsertFaturamentoB2B();
  const updateMut = useUpdateFaturamentoB2B();

  const [mesSelecionado, setMesSelecionado] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<DbFaturamentoB2B | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [chartEmpresas, setChartEmpresas] = useState<string[]>([]);
  const [chartInitDone, setChartInitDone] = useState(false);

  // Sorted months ascending (chronological)
  const meses = useMemo(() => {
    const unique = [...new Set(registros.map(r => r.mes_referencia))];
    unique.sort(sortMesesAsc);
    return unique;
  }, [registros]);

  // Descending for dropdown (newest first)
  const mesesDesc = useMemo(() => [...meses].reverse(), [meses]);

  const mesAtual = mesSelecionado || mesesDesc[0] || "";

  // Records for selected month, sorted by data_fechamento ascending
  const registrosMes = useMemo(() => {
    const filtered = registros.filter(r => r.mes_referencia === mesAtual);
    filtered.sort((a, b) => {
      const dA = a.data_fechamento || "";
      const dB = b.data_fechamento || "";
      return dA.localeCompare(dB);
    });
    return filtered;
  }, [registros, mesAtual]);

  // Search filter
  const registrosMesFiltrados = useMemo(() => {
    if (!searchTerm) return registrosMes;
    const term = searchTerm.toLowerCase();
    return registrosMes.filter(r => r.empresa?.toLowerCase().includes(term));
  }, [registrosMes, searchTerm]);

  const empresas = useMemo(() => [...new Set(registros.map(r => r.empresa))].sort(), [registros]);

  // Initialize chart: top 10 by total_geral in current month
  useMemo(() => {
    if (!chartInitDone && mesesDesc.length > 0 && registros.length > 0) {
      const mesAtualData = registros.filter(r => r.mes_referencia === mesesDesc[0]);
      const top10 = mesAtualData.sort((a, b) => fmtNum(b.total_geral) - fmtNum(a.total_geral)).slice(0, 10).map(r => r.empresa);
      setChartEmpresas(top10);
      setChartInitDone(true);
    }
  }, [registros, mesesDesc, chartInitDone]);

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
  const mesAnteriorKey = useMemo(() => {
    const idx = meses.indexOf(mesesDesc[0]);
    return idx > 0 ? meses[idx - 1] : "";
  }, [meses, mesesDesc]);

  const totalMesAtual = useMemo(() => {
    return registros.filter(r => r.mes_referencia === mesesDesc[0]).reduce((s, r) => s + fmtNum(r.total_geral), 0);
  }, [registros, mesesDesc]);

  const totalMesAnterior = useMemo(() => {
    if (!mesAnteriorKey) return 0;
    return registros.filter(r => r.mes_referencia === mesAnteriorKey).reduce((s, r) => s + fmtNum(r.total_geral), 0);
  }, [registros, mesAnteriorKey]);

  const variacao = totalMesAnterior > 0 ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior * 100) : 0;

  const empresasAtivas = useMemo(() => {
    return new Set(registros.filter(r => r.mes_referencia === mesesDesc[0]).map(r => r.empresa)).size;
  }, [registros, mesesDesc]);

  // Resumo do Mes cards (for Fechamento tab)
  const mediaPorEmpresa = registrosMes.length > 0 ? totais.total_geral / registrosMes.length : 0;
  const mesAnteriorTotGeral = useMemo(() => {
    if (!mesAnteriorKey) return 0;
    return registros.filter(r => r.mes_referencia === mesAnteriorKey).reduce((s, r) => s + fmtNum(r.total_geral), 0);
  }, [registros, mesAnteriorKey]);
  const variacaoMes = mesAnteriorTotGeral > 0 ? ((totais.total_geral - mesAnteriorTotGeral) / mesAnteriorTotGeral * 100) : 0;

  // Growth ranking per company
  const growthData = useMemo(() => {
    if (!mesesDesc[0] || !mesAnteriorKey) return [];
    const atual = registros.filter(r => r.mes_referencia === mesesDesc[0]);
    const anterior = registros.filter(r => r.mes_referencia === mesAnteriorKey);
    const anteriorMap = new Map(anterior.map(r => [r.empresa, fmtNum(r.total_geral)]));

    return atual.map(r => {
      const prev = anteriorMap.get(r.empresa) || 0;
      const curr = fmtNum(r.total_geral);
      const growth = prev > 0 ? ((curr - prev) / prev * 100) : (curr > 0 ? 100 : 0);
      return { empresa: r.empresa, atual: curr, anterior: prev, growth };
    }).sort((a, b) => b.growth - a.growth);
  }, [registros, mesesDesc, mesAnteriorKey]);

  const topCrescimento = growthData.filter(d => d.growth > 0);
  const estagnadas = growthData.filter(d => d.growth <= 0);

  // Multi-line chart data (top 10 or selected companies)
  const lineChartData = useMemo(() => {
    return meses.map(mes => {
      const row: Record<string, any> = { mes: mes.substring(0, 3) + " " + mes.split(" ")[1]?.substring(2) };
      chartEmpresas.forEach(emp => {
        const rec = registros.find(r => r.mes_referencia === mes && r.empresa === emp);
        row[emp] = rec ? fmtNum(rec.total_geral) : 0;
      });
      return row;
    });
  }, [registros, meses, chartEmpresas]);

  // Bar chart: current vs previous month
  const barChartData = useMemo(() => {
    if (!mesesDesc[0] || !mesAnteriorKey) return [];
    return growthData.slice(0, 15).map(d => ({
      empresa: d.empresa.length > 12 ? d.empresa.substring(0, 12) + "..." : d.empresa,
      "Mes Atual": d.atual,
      "Mes Anterior": d.anterior,
    }));
  }, [growthData, mesesDesc, mesAnteriorKey]);

  // Area chart: total revenue evolution
  const areaChartData = useMemo(() => {
    return meses.map(mes => {
      const total = registros.filter(r => r.mes_referencia === mes).reduce((s, r) => s + fmtNum(r.total_geral), 0);
      return { mes: mes.substring(0, 3) + " " + mes.split(" ")[1]?.substring(2), total };
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
      mes_referencia: r.mes_referencia, data_fechamento: r.data_fechamento || "", empresa: r.empresa,
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
      "Mes Referencia": r.mes_referencia,
      "Data Fechamento": r.data_fechamento ? format(parseISO(r.data_fechamento), "dd/MM/yyyy") : "",
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

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "--";
    try { return format(parseISO(d), "dd/MM/yyyy"); } catch { return d; }
  };

  const getVencimento = (d: string | null | undefined) => {
    if (!d) return "--";
    try { return format(addDays(parseISO(d), 3), "dd/MM/yyyy"); } catch { return "--"; }
  };

  const getSituacaoBadge = (sit: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pago: "default", aberto: "secondary", atrasado: "destructive", faturado: "outline",
    };
    return <Badge variant={map[sit?.toLowerCase()] || "secondary"}>{sit || "--"}</Badge>;
  };

  const toggleChartEmpresa = (emp: string) => {
    setChartEmpresas(prev =>
      prev.includes(emp) ? prev.filter(e => e !== emp) : prev.length < 10 ? [...prev, emp] : prev
    );
  };

  const selectCompanyFilter = (emp: string) => {
    setEmpresaFiltro(emp);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="fechamento" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="fechamento"><Calendar className="w-4 h-4 mr-1" /> Fechamento Mensal</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Dashboard Crescimento</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: FECHAMENTO MENSAL ===== */}
        <TabsContent value="fechamento" className="space-y-4">
          {/* Resumo do Mes - 4 metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Faturamento do Mês"
              value={fmtCompact(totais.total_geral)}
              icon={DollarSign}
              accent="primary"
              subtitle={mesAtual}
            />
            <StatCard
              label="Quantidade de Empresas"
              value={registrosMes.length}
              icon={Building2}
              accent="success"
              subtitle="no mês selecionado"
            />
            <StatCard
              label="Média por Empresa"
              value={fmtCompact(mediaPorEmpresa)}
              icon={Users}
              accent="warning"
              subtitle="total ÷ empresas"
            />
            <StatCard
              label="Comparativo Mês Anterior"
              value={`${variacaoMes >= 0 ? "+" : ""}${variacaoMes.toFixed(1)}%`}
              icon={variacaoMes >= 0 ? TrendingUp : TrendingDown}
              accent={variacaoMes >= 0 ? "success" : "destructive"}
              trend={`${Math.abs(variacaoMes).toFixed(1)}%`}
              trendDirection={variacaoMes >= 0 ? "up" : "down"}
              subtitle={`vs ${mesAnteriorKey || "N/A"}`}
            />
          </div>

          <Card className="card-shadow">
            <div className="p-3 border-b flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <Label className="text-xs font-medium whitespace-nowrap">Mês:</Label>
                <Select value={mesAtual} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Selecione o mes" /></SelectTrigger>
                  <SelectContent>
                    {mesesDesc.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar empresa..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 w-[180px] text-xs"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{registrosMesFiltrados.length} empresas</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportar}><Download className="w-3.5 h-3.5 mr-1" /> Exportar</Button>
                <Button size="sm" onClick={abrirNovo}><Plus className="w-3.5 h-3.5 mr-1" /> Novo</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: "1700px" }}>
                <thead>
                  {/* Grouped column headers */}
                  <tr className="border-b bg-muted/20">
                    <th className="sticky left-0 z-20 bg-muted px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground" rowSpan={2} style={{ minWidth: 90 }}>Fechamento</th>
                    <th className="sticky left-[90px] z-20 bg-muted border-r border-border/50 px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground" rowSpan={2} style={{ minWidth: 160 }}>Empresa</th>
                    <th rowSpan={2} className="px-2 py-1 text-center text-[10px] font-semibold text-muted-foreground" style={{ minWidth: 80 }}>Vencim.</th>
                    <th colSpan={3} className="px-2 py-1 text-center text-[10px] font-bold border-b border-border/30">Plataforma</th>
                    <th colSpan={3} className="px-2 py-1 text-center text-[10px] font-bold bg-sky-500/10 border-b border-sky-500/20">SmartSim</th>
                    <th colSpan={3} className="px-2 py-1 text-center text-[10px] font-bold bg-emerald-500/10 border-b border-emerald-500/20">Linkfield</th>
                    <th colSpan={3} className="px-2 py-1 text-center text-[10px] font-bold bg-amber-500/10 border-b border-amber-500/20">Arqia</th>
                    <th colSpan={2} className="px-2 py-1 text-center text-[10px] font-bold border-b border-border/30">Totais</th>
                    <th rowSpan={2} className="px-2 py-1 text-center text-[10px] font-semibold">Situação</th>
                    <th rowSpan={2} className="px-2 py-1 text-center text-[10px] font-semibold">OBS</th>
                    <th rowSpan={2} className="px-2 py-1 text-center text-[10px] font-semibold">Ações</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    {/* Plataforma sub-headers */}
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap">Qtd</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap">Vlr/Placa</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap">Total</th>
                    {/* SmartSim */}
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-sky-500/10">Qtd</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-sky-500/10">Valor</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-sky-500/10">Total</th>
                    {/* Linkfield */}
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-emerald-500/10">Qtd</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-emerald-500/10">Valor</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-emerald-500/10">Total</th>
                    {/* Arqia */}
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-amber-500/10">Qtd</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-amber-500/10">Valor</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap bg-amber-500/10">Total</th>
                    {/* Totais */}
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap">Linhas</th>
                    <th className="px-2 py-1 text-right text-[10px] font-semibold whitespace-nowrap">Geral</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosMesFiltrados.map((r, idx) => (
                    <tr key={r.id} className={`border-b border-border/20 hover:bg-primary/5 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/15"}`}>
                      <td className={`sticky left-0 z-10 px-1.5 py-0.5 whitespace-nowrap text-xs ${idx % 2 === 0 ? "bg-background" : "bg-muted"}`}>{fmtDate(r.data_fechamento)}</td>
                      <td className={`sticky left-[90px] z-10 px-1.5 py-0.5 font-medium border-r border-border/30 text-xs max-w-[200px] truncate ${idx % 2 === 0 ? "bg-background" : "bg-muted"}`} title={r.empresa || ""}>{r.empresa || "--"}</td>
                      <td className="px-1.5 py-0.5 whitespace-nowrap text-xs text-muted-foreground">{getVencimento(r.data_fechamento)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs">{fmtNum(r.qtd_placas)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs">{fmt(r.valor_por_placa)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs font-medium">{fmt(r.total_plataforma)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs bg-sky-500/5">{fmtNum(r.qtd_linhas_smartsim)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs bg-sky-500/5">{fmt(r.valor_smartsim)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs font-medium bg-sky-500/5">{fmt(r.total_smartsim)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs bg-emerald-500/5">{fmtNum(r.qtd_linhas_linkfield)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs bg-emerald-500/5">{fmt(r.valor_linkfield)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs font-medium bg-emerald-500/5">{fmt(r.total_linkfield)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs bg-amber-500/5">{fmtNum(r.qtd_linhas_arqia)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs bg-amber-500/5">{fmt(r.valor_arqia)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs font-medium bg-amber-500/5">{fmt(r.total_arqia)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs font-medium">{fmtNum(r.total_linhas)}</td>
                      <td className="px-1.5 py-0.5 text-right text-xs font-bold text-primary">{fmt(r.total_geral)}</td>
                      <td className="px-1.5 py-0.5 text-center">{getSituacaoBadge(r.situacao)}</td>
                      <td className="px-1.5 py-0.5 max-w-[80px] truncate text-muted-foreground text-xs">{r.observacao || "--"}</td>
                      <td className="px-1.5 py-0.5 text-center">
                        <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1.5" onClick={() => abrirEditar(r)}>Editar</Button>
                      </td>
                    </tr>
                  ))}
                  {registrosMes.length > 0 && (
                    <tr className="bg-muted/60 font-bold border-t-2 border-primary/30">
                      <td className="sticky left-0 z-10 bg-muted px-2 py-1.5 text-[10px]" colSpan={1}></td>
                      <td className="sticky left-[90px] z-10 bg-muted px-2 py-1.5 border-r border-border/50 text-[10px]">TOTAIS</td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5 text-right text-[10px]">{totais.qtd_placas}</td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5 text-right text-[10px]">{fmt(totais.total_plataforma)}</td>
                      <td className="px-2 py-1.5 text-right bg-sky-500/10 text-[10px]">{totais.qtd_linhas_smartsim}</td>
                      <td className="px-2 py-1.5 bg-sky-500/10"></td>
                      <td className="px-2 py-1.5 text-right bg-sky-500/10 text-[10px]">{fmt(totais.total_smartsim)}</td>
                      <td className="px-2 py-1.5 text-right bg-emerald-500/10 text-[10px]">{totais.qtd_linhas_linkfield}</td>
                      <td className="px-2 py-1.5 bg-emerald-500/10"></td>
                      <td className="px-2 py-1.5 text-right bg-emerald-500/10 text-[10px]">{fmt(totais.total_linkfield)}</td>
                      <td className="px-2 py-1.5 text-right bg-amber-500/10 text-[10px]">{totais.qtd_linhas_arqia}</td>
                      <td className="px-2 py-1.5 bg-amber-500/10"></td>
                      <td className="px-2 py-1.5 text-right bg-amber-500/10 text-[10px]">{fmt(totais.total_arqia)}</td>
                      <td className="px-2 py-1.5 text-right text-[10px]">{totais.total_linhas}</td>
                      <td className="px-2 py-1.5 text-right text-primary text-[10px]">{fmt(totais.total_geral)}</td>
                      <td className="px-2 py-1.5" colSpan={3}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t">
              <span className="text-xs text-muted-foreground">Total: {registrosMes.length} empresas</span>
            </div>
          </Card>
        </TabsContent>

        {/* ===== TAB 2: DASHBOARD CRESCIMENTO ===== */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Faturamento Mês Atual"
              value={fmtCompact(totalMesAtual)}
              icon={DollarSign}
              accent="primary"
              subtitle={mesesDesc[0] || ""}
              trend={`${Math.abs(variacao).toFixed(1)}%`}
              trendDirection={variacao >= 0 ? "up" : "down"}
            />
            <StatCard
              label="Mês Anterior"
              value={fmtCompact(totalMesAnterior)}
              icon={DollarSign}
              accent="muted"
              subtitle={mesAnteriorKey || "N/A"}
            />
            <StatCard
              label="Variação"
              value={`${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}%`}
              icon={variacao >= 0 ? TrendingUp : TrendingDown}
              accent={variacao >= 0 ? "success" : "destructive"}
              trend={`${Math.abs(variacao).toFixed(1)}%`}
              trendDirection={variacao >= 0 ? "up" : "down"}
              subtitle="vs mês anterior"
            />
            <StatCard
              label="Empresas Ativas"
              value={empresasAtivas}
              icon={Building2}
              accent="primary"
              subtitle="no mês atual"
            />
          </div>

          {/* Area Chart: Overall revenue evolution */}
          <Card className="card-shadow p-6">
            <h3 className="text-base font-semibold mb-4">Evolução Receita Total ({meses.length} meses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="colorTotalB2B" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-45} textAnchor="end" height={50} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#colorTotalB2B)" strokeWidth={2} name="Total Geral" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Line Chart: Top 10 / selected companies */}
          <Card className="card-shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-base font-semibold">Evolução por Empresa (máx. 10)</h3>
              <Select value="__multi__" onValueChange={(v) => { if (v !== "__multi__") toggleChartEmpresa(v); }}>
                <SelectTrigger className="w-[280px] h-8 text-xs">
                  <SelectValue placeholder={`${chartEmpresas.length} empresas selecionadas`}>
                    {chartEmpresas.length} empresas selecionadas
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {empresas.map(emp => (
                    <SelectItem key={emp} value={emp}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${chartEmpresas.includes(emp) ? "bg-primary" : "bg-muted"}`} />
                        {emp}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {chartEmpresas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {chartEmpresas.map((emp, i) => (
                  <Badge
                    key={emp}
                    variant="outline"
                    className="text-[9px] cursor-pointer hover:bg-destructive/10"
                    style={{ borderColor: CHART_COLORS[empresas.indexOf(emp) % CHART_COLORS.length], color: CHART_COLORS[empresas.indexOf(emp) % CHART_COLORS.length] }}
                    onClick={() => toggleChartEmpresa(emp)}
                  >
                    {emp} ✕
                  </Badge>
                ))}
              </div>
            )}
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                {chartEmpresas.map((emp) => (
                  <Line key={emp} type="monotone" dataKey={emp} stroke={CHART_COLORS[empresas.indexOf(emp) % CHART_COLORS.length]} strokeWidth={2} dot={false} name={emp} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Bar Chart: Current vs Previous month */}
          <Card className="card-shadow p-6">
            <h3 className="text-base font-semibold mb-4">Comparativo: {mesesDesc[0]} vs {mesAnteriorKey}</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="empresa" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="Mes Anterior" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mes Atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Rankings side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-shadow">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Top Empresas em Crescimento
                </h3>
              </div>
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Empresa</TableHead>
                      <TableHead className="text-xs text-right">Anterior</TableHead>
                      <TableHead className="text-xs text-right">Atual</TableHead>
                      <TableHead className="text-xs text-right">Cresc.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCrescimento.map(d => (
                      <TableRow key={d.empresa} className="cursor-pointer hover:bg-muted/40" onClick={() => selectCompanyFilter(d.empresa)}>
                        <TableCell className="font-medium text-xs">{d.empresa}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{fmt(d.anterior)}</TableCell>
                        <TableCell className="text-right text-xs">{fmt(d.atual)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px]">+{d.growth.toFixed(1)}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {topCrescimento.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-xs">Sem dados</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="card-shadow">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-destructive" /> Empresas Estagnadas / Queda
                </h3>
              </div>
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Empresa</TableHead>
                      <TableHead className="text-xs text-right">Anterior</TableHead>
                      <TableHead className="text-xs text-right">Atual</TableHead>
                      <TableHead className="text-xs text-right">Var.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estagnadas.map(d => (
                      <TableRow key={d.empresa} className="cursor-pointer hover:bg-muted/40" onClick={() => selectCompanyFilter(d.empresa)}>
                        <TableCell className="font-medium text-xs">{d.empresa}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{fmt(d.anterior)}</TableCell>
                        <TableCell className="text-right text-xs">{fmt(d.atual)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive" className="text-[10px]">{d.growth.toFixed(1)}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {estagnadas.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-xs">Sem dados</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Individual company filter */}
          <Card className="card-shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h3 className="text-base font-semibold">Evolução Individual</h3>
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
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickFormatter={v => String(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
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
              <p className="text-sm text-muted-foreground text-center py-8">Selecione uma empresa acima ou clique em uma empresa nas tabelas de ranking</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Form */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando ? "Editar Registro" : "Novo Registro de Faturamento"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Mês Referência</Label><Input value={form.mes_referencia} onChange={e => setField("mes_referencia", e.target.value.toUpperCase())} placeholder="MARCO 2026" /></div>
            <div><Label>Data Fechamento</Label><Input type="date" value={form.data_fechamento} onChange={e => setField("data_fechamento", e.target.value)} /></div>
            <div><Label>Empresa</Label><Input value={form.empresa} onChange={e => setField("empresa", e.target.value)} /></div>

            <div><Label>Qtd Placas</Label><Input type="number" value={form.qtd_placas} onChange={e => setField("qtd_placas", Number(e.target.value))} /></div>
            <div><Label>Valor/Placa</Label><Input type="number" step="0.01" value={form.valor_por_placa} onChange={e => setField("valor_por_placa", Number(e.target.value))} /></div>
            <div><Label>Total Plataforma</Label><Input type="number" step="0.01" value={Number(form.qtd_placas) * Number(form.valor_por_placa)} disabled className="bg-muted" /></div>

            <div><Label>Qtd SmartSim</Label><Input type="number" value={form.qtd_linhas_smartsim} onChange={e => setField("qtd_linhas_smartsim", Number(e.target.value))} /></div>
            <div><Label>Valor SmartSim</Label><Input type="number" step="0.01" value={form.valor_smartsim} onChange={e => setField("valor_smartsim", Number(e.target.value))} /></div>
            <div><Label>Total SmartSim</Label><Input type="number" step="0.01" value={Number(form.qtd_linhas_smartsim) * Number(form.valor_smartsim)} disabled className="bg-muted" /></div>

            <div><Label>Qtd Linkfield</Label><Input type="number" value={form.qtd_linhas_linkfield} onChange={e => setField("qtd_linhas_linkfield", Number(e.target.value))} /></div>
            <div><Label>Valor Linkfield</Label><Input type="number" step="0.01" value={form.valor_linkfield} onChange={e => setField("valor_linkfield", Number(e.target.value))} /></div>
            <div><Label>Total Linkfield</Label><Input type="number" step="0.01" value={Number(form.qtd_linhas_linkfield) * Number(form.valor_linkfield)} disabled className="bg-muted" /></div>

            <div><Label>Qtd Arqia</Label><Input type="number" value={form.qtd_linhas_arqia} onChange={e => setField("qtd_linhas_arqia", Number(e.target.value))} /></div>
            <div><Label>Valor Arqia</Label><Input type="number" step="0.01" value={form.valor_arqia} onChange={e => setField("valor_arqia", Number(e.target.value))} /></div>
            <div><Label>Total Arqia</Label><Input type="number" step="0.01" value={Number(form.qtd_linhas_arqia) * Number(form.valor_arqia)} disabled className="bg-muted" /></div>

            <div><Label>Situação</Label>
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
            <div className="col-span-2"><Label>Observação</Label><Textarea value={form.observacao} onChange={e => setField("observacao", e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>{editando ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaturamentoB2BTab;
