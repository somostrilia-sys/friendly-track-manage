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
import { useFaturamentoB2B, useInsertFaturamentoB2B, useUpdateFaturamentoB2B } from "@/hooks/useSupabaseData";
import { Plus, Download, BarChart3, Calendar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import type { DbFaturamentoB2B } from "@/types/database";
import * as XLSX from "xlsx";
import { addDays, format, parseISO } from "date-fns";

const fmt = (v: number | null | undefined) => v != null ? `R$ ${Number(v).toFixed(2)}` : "R$ 0,00";
const fmtNum = (v: number | null | undefined) => v != null ? Number(v) : 0;

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

  const meses = useMemo(() => {
    const unique = [...new Set(registros.map(r => r.mes_referencia))];
    // Sort chronologically - parse month names
    const monthOrder: Record<string, number> = {
      JANEIRO: 1, FEVEREIRO: 2, MARCO: 3, ABRIL: 4, MAIO: 5, JUNHO: 6,
      JULHO: 7, AGOSTO: 8, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12,
    };
    unique.sort((a, b) => {
      const [mA, yA] = a.split(" ");
      const [mB, yB] = b.split(" ");
      const dateA = (parseInt(yA) || 0) * 100 + (monthOrder[mA] || 0);
      const dateB = (parseInt(yB) || 0) * 100 + (monthOrder[mB] || 0);
      return dateB - dateA;
    });
    return unique;
  }, [registros]);

  // Auto-select latest month
  const mesAtual = mesSelecionado || meses[0] || "";

  const registrosMes = useMemo(
    () => registros.filter(r => r.mes_referencia === mesAtual),
    [registros, mesAtual]
  );

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
    // Auto-calculate totals
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
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const exportar = () => {
    const rows = registrosMes.map(r => ({
      "Mes Referencia": r.mes_referencia,
      "Data Fechamento": r.data_fechamento,
      "Vencimento": r.data_fechamento ? format(addDays(parseISO(r.data_fechamento), 3), "dd/MM/yyyy") : "",
      "Empresa": r.empresa,
      "Qtd Placas": r.qtd_placas,
      "Valor/Placa": r.valor_por_placa,
      "Total Plataforma": r.total_plataforma,
      "Qtd SmartSim": r.qtd_linhas_smartsim,
      "Valor SmartSim": r.valor_smartsim,
      "Total SmartSim": r.total_smartsim,
      "Qtd Linkfield": r.qtd_linhas_linkfield,
      "Valor Linkfield": r.valor_linkfield,
      "Total Linkfield": r.total_linkfield,
      "Qtd Arqia": r.qtd_linhas_arqia,
      "Valor Arqia": r.valor_arqia,
      "Total Arqia": r.total_arqia,
      "Total Linhas": r.total_linhas,
      "Total Geral": r.total_geral,
      "Situacao": r.situacao,
      "OBS": r.observacao,
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
          <TabsTrigger value="resumo"><BarChart3 className="w-4 h-4 mr-1" /> Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="fechamento">
          <Card className="card-shadow">
            <div className="p-4 border-b flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">Mes de Referencia:</Label>
                <Select value={mesAtual} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione o mes" /></SelectTrigger>
                  <SelectContent>
                    {meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
                  {/* Summary row */}
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

        <TabsContent value="resumo">
          <Card className="card-shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Resumo por Mes</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Empresas</TableHead>
                    <TableHead className="text-right">Total Plataforma</TableHead>
                    <TableHead className="text-right">Total SmartSim</TableHead>
                    <TableHead className="text-right">Total Linkfield</TableHead>
                    <TableHead className="text-right">Total Arqia</TableHead>
                    <TableHead className="text-right">Total Geral</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meses.map(mes => {
                    const regs = registros.filter(r => r.mes_referencia === mes);
                    const t = regs.reduce((a, r) => ({
                      plat: a.plat + fmtNum(r.total_plataforma),
                      ss: a.ss + fmtNum(r.total_smartsim),
                      lf: a.lf + fmtNum(r.total_linkfield),
                      aq: a.aq + fmtNum(r.total_arqia),
                      total: a.total + fmtNum(r.total_geral),
                    }), { plat: 0, ss: 0, lf: 0, aq: 0, total: 0 });
                    return (
                      <TableRow key={mes} className="cursor-pointer hover:bg-muted/50" onClick={() => { setMesSelecionado(mes); }}>
                        <TableCell className="font-medium">{mes}</TableCell>
                        <TableCell className="text-right">{regs.length}</TableCell>
                        <TableCell className="text-right">{fmt(t.plat)}</TableCell>
                        <TableCell className="text-right">{fmt(t.ss)}</TableCell>
                        <TableCell className="text-right">{fmt(t.lf)}</TableCell>
                        <TableCell className="text-right">{fmt(t.aq)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{fmt(t.total)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
