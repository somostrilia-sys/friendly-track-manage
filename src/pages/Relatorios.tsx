import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Filter, BarChart3, Users, Package, Truck, DollarSign, Wrench, MapPin, Calendar, Headphones } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";
import {
  useClientes, useEquipamentos, usePedidos, useLinhasSIM, useTecnicos,
  useServicos, useManutencoes, useAgendamentos, useDespachos,
  useFaturamentoB2B, useFechamentoCompleto, useChamadosSuporte,
  useControleKM, useControleUnidades,
} from "@/hooks/useSupabaseData";

const moduloConfig: Record<string, { label: string; icon: any; tabela: string }> = {
  clientes: { label: "Clientes", icon: Users, tabela: "clientes" },
  equipamentos: { label: "Estoque / Equipamentos", icon: Package, tabela: "equipamentos" },
  pedidos: { label: "Pedidos", icon: DollarSign, tabela: "pedidos" },
  linhas_sim: { label: "Linhas SIM", icon: BarChart3, tabela: "linhas_sim" },
  tecnicos: { label: "Tecnicos", icon: Users, tabela: "tecnicos" },
  servicos: { label: "Servicos / OS", icon: Wrench, tabela: "servicos_agendados" },
  manutencoes: { label: "Manutencoes", icon: Wrench, tabela: "manutencoes" },
  agendamentos: { label: "Agendamentos", icon: Calendar, tabela: "agendamentos" },
  despachos: { label: "Logistica / Despachos", icon: Truck, tabela: "despachos_rastreadores" },
  faturamento_b2b: { label: "Faturamento B2B", icon: DollarSign, tabela: "faturamento_b2b" },
  fechamento_tecnicos: { label: "Fechamento Tecnicos", icon: DollarSign, tabela: "fechamento_tecnicos" },
  chamados_suporte: { label: "Suporte / Chamados", icon: Headphones, tabela: "chamados_suporte" },
  controle_km: { label: "Controle de KM", icon: MapPin, tabela: "controle_km" },
  controle_unidades: { label: "Controle de Unidades", icon: Package, tabela: "controle_unidades" },
};

const Relatorios = () => {
  const [modulo, setModulo] = useState("clientes");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [gerado, setGerado] = useState(false);

  const { data: clientes = [] } = useClientes({ enabled: modulo === "clientes" });
  const { data: equipamentos = [] } = useEquipamentos({ enabled: modulo === "equipamentos" });
  const { data: pedidos = [] } = usePedidos({ enabled: modulo === "pedidos" });
  const { data: linhasSim = [] } = useLinhasSIM({ enabled: modulo === "linhas_sim" });
  const { data: tecnicos = [] } = useTecnicos({ enabled: modulo === "tecnicos" });
  const { data: servicos = [] } = useServicos({ enabled: modulo === "servicos" });
  const { data: manutencoes = [] } = useManutencoes({ enabled: modulo === "manutencoes" });
  const { data: agendamentos = [] } = useAgendamentos({ enabled: modulo === "agendamentos" });
  const { data: despachos = [] } = useDespachos({ enabled: modulo === "despachos" });
  const { data: faturamento = [] } = useFaturamentoB2B({ enabled: modulo === "faturamento_b2b" });
  const { data: fechamentos = [] } = useFechamentoCompleto({ enabled: modulo === "fechamento_tecnicos" });
  const { data: chamados = [] } = useChamadosSuporte({ enabled: modulo === "chamados_suporte" });
  const { data: controleKm = [] } = useControleKM({ enabled: modulo === "controle_km" });
  const { data: unidades = [] } = useControleUnidades({ enabled: modulo === "controle_unidades" });

  const dataMap: Record<string, any[]> = {
    clientes, equipamentos, pedidos, linhas_sim: linhasSim, tecnicos,
    servicos, manutencoes, agendamentos, despachos,
    faturamento_b2b: faturamento, fechamento_tecnicos: fechamentos,
    chamados_suporte: chamados, controle_km: controleKm, controle_unidades: unidades,
  };

  const dadosFiltrados = useMemo(() => {
    let dados = dataMap[modulo] || [];
    if (dataInicio) {
      dados = dados.filter((d: any) => {
        const dataField = d.data || d.data_pedido || d.data_abertura || d.data_fechamento || d.created_at || "";
        return dataField >= dataInicio;
      });
    }
    if (dataFim) {
      dados = dados.filter((d: any) => {
        const dataField = d.data || d.data_pedido || d.data_abertura || d.data_fechamento || d.created_at || "";
        return dataField <= dataFim + "T23:59:59";
      });
    }
    return dados;
  }, [modulo, dataInicio, dataFim, dataMap]);

  const colunas = useMemo(() => {
    if (dadosFiltrados.length === 0) return [];
    const first = dadosFiltrados[0];
    return Object.keys(first).filter(k => !["id", "user_id", "created_at", "updated_at"].includes(k) && typeof first[k] !== "object").slice(0, 8);
  }, [dadosFiltrados]);

  const exportarCSV = () => {
    if (dadosFiltrados.length === 0) { toast.error("Sem dados para exportar"); return; }
    const allCols = Object.keys(dadosFiltrados[0]).filter(k => typeof dadosFiltrados[0][k] !== "object");
    const header = allCols.join(";");
    const rows = dadosFiltrados.map((d: any) => allCols.map(c => String(d[c] ?? "").replace(/;/g, ",")).join(";"));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-${modulo}-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`CSV exportado com ${dadosFiltrados.length} registros!`);
  };

  const exportarPDF = () => {
    window.print();
    toast.success("PDF gerado via impressao!");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Relatorios" subtitle="Geracao e exportacao de relatorios do sistema" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Clientes" value={clientes.length} icon={Users} accent="primary" />
        <StatCard label="Equipamentos" value={equipamentos.length} icon={Package} accent="success" />
        <StatCard label="Servicos" value={servicos.length} icon={Wrench} accent="warning" />
        <StatCard label="Faturamento B2B" value={faturamento.length} icon={DollarSign} accent="muted" />
      </div>

      <Card className="p-6 card-shadow">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>Modulo</Label>
            <Select value={modulo} onValueChange={v => { setModulo(v); setGerado(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(moduloConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data Inicio</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
          <div><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
          <div className="flex items-end">
            <Button onClick={() => setGerado(true)} className="w-full"><FileText className="w-4 h-4 mr-2" /> Gerar Relatorio</Button>
          </div>
        </div>
      </Card>

      {gerado && (
        <Card className="card-shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{moduloConfig[modulo]?.label}</h3>
              <p className="text-xs text-muted-foreground">{dadosFiltrados.length} registros encontrados{dataInicio && ` — de ${dataInicio}`}{dataFim && ` ate ${dataFim}`}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportarCSV}><Download className="w-3 h-3 mr-1" /> CSV</Button>
              <Button size="sm" variant="outline" onClick={exportarPDF}><Download className="w-3 h-3 mr-1" /> PDF</Button>
            </div>
          </div>
          {dadosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado para os filtros selecionados</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {colunas.map(col => (
                      <TableHead key={col} className="text-xs whitespace-nowrap">{col.replace(/_/g, " ").toUpperCase()}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosFiltrados.slice(0, 100).map((row: any, i: number) => (
                    <TableRow key={i}>
                      {colunas.map(col => (
                        <TableCell key={col} className="text-xs max-w-[200px] truncate">
                          {typeof row[col] === "number"
                            ? row[col].toLocaleString("pt-BR")
                            : String(row[col] ?? "—")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {dadosFiltrados.length > 100 && (
                <div className="p-3 text-center text-xs text-muted-foreground border-t">
                  Mostrando 100 de {dadosFiltrados.length} registros. Exporte CSV para ver todos.
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Relatorios;
