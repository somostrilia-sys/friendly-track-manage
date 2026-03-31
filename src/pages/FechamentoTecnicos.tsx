import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFechamentoCompleto, useUpdateFechamentoTecnico, useInsertFechamentoTecnico, useInsertFechamentoInstalacao, useTecnicos, useServicos, useControleKM, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbFechamentoTecnico, DbFechamentoInstalacao } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { DollarSign, FileText, Send, CheckCircle, Inbox, Plus, Calculator } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  enviado_financeiro: { label: "Enviado ao Financeiro", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
};

type FechamentoComInstalacoes = DbFechamentoTecnico & { instalacoes: DbFechamentoInstalacao[] };

const FechamentoTecnicosPage = () => {
  const { data: fechamentos = [], isLoading } = useFechamentoCompleto();
  const { data: tecnicos = [] } = useTecnicos();
  const { data: servicos = [] } = useServicos();
  const { data: controleKm = [] } = useControleKM();
  const updateFechamento = useUpdateFechamentoTecnico();
  const insertFechamento = useInsertFechamentoTecnico();
  const insertFechInstalacao = useInsertFechamentoInstalacao();

  useRealtimeSubscription("fechamento_tecnicos", ["fechamento_tecnicos", "fechamento_completo"]);

  const [detalhe, setDetalhe] = useState<FechamentoComInstalacoes | null>(null);
  const [gerarOpen, setGerarOpen] = useState(false);
  const [gerarTecnicoId, setGerarTecnicoId] = useState("");
  const [gerarPeriodoInicio, setGerarPeriodoInicio] = useState("");
  const [gerarPeriodoFim, setGerarPeriodoFim] = useState("");

  const fecs = fechamentos as FechamentoComInstalacoes[];
  const totalPendente = fecs.filter(f => f.status === "pendente").reduce((a, f) => a + f.valor_total, 0);
  const totalPago = fecs.filter(f => f.status === "pago").reduce((a, f) => a + f.valor_total, 0);

  // Auto-calculate for selected technician and period
  const calculo = useMemo(() => {
    if (!gerarTecnicoId || !gerarPeriodoInicio || !gerarPeriodoFim) return null;
    const tec = tecnicos.find(t => t.id === gerarTecnicoId);
    if (!tec) return null;

    const servicosPeriodo = servicos.filter(s =>
      s.tecnico_id === gerarTecnicoId &&
      s.status === "concluido" &&
      s.tipo === "instalacao" &&
      s.data >= gerarPeriodoInicio &&
      s.data <= gerarPeriodoFim
    );

    const kmPeriodo = controleKm.filter(k =>
      k.tecnico_id === gerarTecnicoId &&
      k.data >= gerarPeriodoInicio &&
      k.data <= gerarPeriodoFim
    );

    const totalInstalacoes = servicosPeriodo.length;
    const valorInstalacoes = totalInstalacoes * (tec.valor_instalacao || 0);
    const kmTotal = kmPeriodo.reduce((sum, k) => sum + (k.km_total || 0), 0);
    const valorKm = kmTotal * (tec.adicional_km || 0);
    const valorTotal = valorInstalacoes + valorKm;

    return {
      tec,
      servicosPeriodo,
      totalInstalacoes,
      valorInstalacoes,
      kmTotal,
      valorKm,
      valorTotal,
      regraFiscal: valorTotal > 1000 ? "nota_fiscal" : "recibo",
    };
  }, [gerarTecnicoId, gerarPeriodoInicio, gerarPeriodoFim, tecnicos, servicos, controleKm]);

  const gerarFechamento = async () => {
    if (!calculo) { toast.error("Selecione tecnico e periodo"); return; }
    try {
      const periodo = `${gerarPeriodoInicio} a ${gerarPeriodoFim}`;
      const fechamento = await insertFechamento.mutateAsync({
        tecnico_id: gerarTecnicoId,
        tecnico_nome: calculo.tec.nome,
        tipo_tecnico: calculo.tec.tipo_tecnico,
        periodo,
        total_instalacoes: calculo.totalInstalacoes,
        valor_instalacoes: calculo.valorInstalacoes,
        km_total: calculo.kmTotal,
        valor_km: calculo.valorKm,
        valor_total: calculo.valorTotal,
        status: "pendente",
        regra_fiscal: calculo.regraFiscal,
      });

      // Insert line items for each installation
      for (const s of calculo.servicosPeriodo) {
        await insertFechInstalacao.mutateAsync({
          fechamento_id: fechamento.id,
          servico_id: s.id,
          data: s.data,
          placa: s.veiculo || "",
          tipo: "instalacao",
          valor: calculo.tec.valor_instalacao || 0,
        });
      }

      setGerarOpen(false);
      setGerarTecnicoId("");
      setGerarPeriodoInicio("");
      setGerarPeriodoFim("");
      toast.success(`Fechamento gerado: R$ ${calculo.valorTotal.toFixed(2)}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const enviarFinanceiro = async (id: string) => {
    try {
      await updateFechamento.mutateAsync({ id, status: "enviado_financeiro" });
      toast.success("Enviado ao financeiro!");
    } catch (e: any) { toast.error(e.message); }
  };

  const marcarPago = async (id: string) => {
    try {
      await updateFechamento.mutateAsync({ id, status: "pago" });
      toast.success("Marcado como pago!");
    } catch (e: any) { toast.error(e.message); }
  };

  const gerarEtiqueta = (f: FechamentoComInstalacoes) => {
    const etiqueta = `ETIQUETA DE PAGAMENTO\n${f.tecnico_nome} (${f.tipo_tecnico})\nPeriodo: ${f.periodo}\nInstalacoes: ${f.total_instalacoes} x R$ ${(f.valor_instalacoes / (f.total_instalacoes || 1)).toFixed(2)}\nKM: ${f.km_total} km x R$ ${f.valor_km > 0 ? (f.valor_km / (f.km_total || 1)).toFixed(2) : "0.00"}/km\nTotal: R$ ${f.valor_total.toFixed(2)}\nDoc: ${f.regra_fiscal === "nota_fiscal" ? "Nota Fiscal Obrigatoria" : "Recibo"}`;
    navigator.clipboard.writeText(etiqueta);
    toast.success("Etiqueta copiada!");
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Fechamento Tecnicos" subtitle="Fechamento financeiro por prestador" />
      <TableSkeleton rows={5} cols={9} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Fechamento Tecnicos" subtitle="Fechamento financeiro por prestador">
        <Button onClick={() => setGerarOpen(true)}><Calculator className="w-4 h-4 mr-2" /> Gerar Fechamento</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pendente" value={`R$ ${totalPendente.toFixed(2)}`} icon={DollarSign} accent="warning" />
        <StatCard label="Total Pago" value={`R$ ${totalPago.toFixed(2)}`} icon={CheckCircle} accent="success" />
        <StatCard label="Fechamentos" value={fecs.length} icon={FileText} accent="primary" />
        <StatCard label="Pendentes" value={fecs.filter(f => f.status === "pendente").length} icon={Send} accent="destructive" />
      </div>

      <Card className="card-shadow">
        {fecs.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum fechamento encontrado</p>
            <p className="text-xs text-muted-foreground/60">Clique em "Gerar Fechamento" para calcular automaticamente</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tecnico</TableHead><TableHead>Tipo</TableHead><TableHead>Periodo</TableHead>
                <TableHead>Instalacoes</TableHead><TableHead>KM</TableHead><TableHead>Valor Total</TableHead>
                <TableHead>Doc. Fiscal</TableHead><TableHead>Status</TableHead><TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fecs.map(f => (
                <TableRow key={f.id} className="cursor-pointer" onClick={() => setDetalhe(f)}>
                  <TableCell className="font-medium">{f.tecnico_nome}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{f.tipo_tecnico}</Badge></TableCell>
                  <TableCell className="text-sm">{f.periodo}</TableCell>
                  <TableCell>{f.total_instalacoes}</TableCell>
                  <TableCell>{f.km_total} km</TableCell>
                  <TableCell className="font-semibold">R$ {f.valor_total.toFixed(2)}</TableCell>
                  <TableCell><Badge variant={f.regra_fiscal === "nota_fiscal" ? "destructive" : "outline"}>{f.regra_fiscal === "nota_fiscal" ? "NF" : "Recibo"}</Badge></TableCell>
                  <TableCell><Badge variant={statusMap[f.status]?.variant}>{statusMap[f.status]?.label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => gerarEtiqueta(f)}>Etiqueta</Button>
                      {f.status === "pendente" && <Button size="sm" onClick={() => enviarFinanceiro(f.id)}>Enviar</Button>}
                      {f.status === "enviado_financeiro" && <Button size="sm" onClick={() => marcarPago(f.id)}>Pagar</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Gerar Fechamento Automatico */}
      <Dialog open={gerarOpen} onOpenChange={setGerarOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Gerar Fechamento Automatico</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tecnico</Label>
              <Select value={gerarTecnicoId} onValueChange={setGerarTecnicoId}>
                <SelectTrigger><SelectValue placeholder="Selecione o tecnico" /></SelectTrigger>
                <SelectContent>
                  {tecnicos.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome} — R$ {t.valor_instalacao}/inst, R$ {t.adicional_km}/km
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Periodo Inicio</Label><Input type="date" value={gerarPeriodoInicio} onChange={e => setGerarPeriodoInicio(e.target.value)} /></div>
              <div><Label>Periodo Fim</Label><Input type="date" value={gerarPeriodoFim} onChange={e => setGerarPeriodoFim(e.target.value)} /></div>
            </div>

            {calculo && (
              <Card className="p-4 bg-muted/30 space-y-3">
                <h4 className="font-semibold text-sm">Calculo Automatico</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Instalacoes:</span>
                    <p className="font-medium">{calculo.totalInstalacoes} x R$ {calculo.tec.valor_instalacao} = <strong>R$ {calculo.valorInstalacoes.toFixed(2)}</strong></p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">KM Excedente:</span>
                    <p className="font-medium">{calculo.kmTotal} km x R$ {calculo.tec.adicional_km} = <strong>R$ {calculo.valorKm.toFixed(2)}</strong></p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Valor Total:</span>
                    <span className="text-xl font-bold text-primary">R$ {calculo.valorTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Doc. fiscal: {calculo.regraFiscal === "nota_fiscal" ? "Nota Fiscal obrigatoria (> R$ 1.000)" : "Recibo (ate R$ 1.000)"}
                  </p>
                </div>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGerarOpen(false)}>Cancelar</Button>
            <Button onClick={gerarFechamento} disabled={!calculo}>
              <Calculator className="w-4 h-4 mr-2" /> Gerar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhe */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>Fechamento - {detalhe.tecnico_nome}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tipo</span><p className="font-medium capitalize">{detalhe.tipo_tecnico}</p></div>
                  <div><span className="text-muted-foreground">Periodo</span><p className="font-medium">{detalhe.periodo}</p></div>
                  <div><span className="text-muted-foreground">Valor Instalacoes</span><p className="font-medium">R$ {detalhe.valor_instalacoes.toFixed(2)}</p></div>
                  <div><span className="text-muted-foreground">Valor KM</span><p className="font-medium">R$ {detalhe.valor_km.toFixed(2)}</p></div>
                  <div><span className="text-muted-foreground">KM Total</span><p className="font-medium">{detalhe.km_total} km</p></div>
                  <div><span className="text-muted-foreground">Valor Total</span><p className="font-semibold text-primary">R$ {detalhe.valor_total.toFixed(2)}</p></div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Instalacoes no Periodo</h4>
                  {detalhe.instalacoes.length === 0 ? (
                    <p className="text-muted-foreground">Nenhuma instalacao detalhada.</p>
                  ) : (
                    <div className="space-y-1">
                      {detalhe.instalacoes.map((inst, i) => (
                        <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                          <span>{inst.data} - {inst.placa}</span>
                          <span className="font-medium">R$ {inst.valor.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Regra fiscal: {detalhe.valor_total > 1000 ? "Acima de R$ 1.000 — NF obrigatoria" : "Ate R$ 1.000 — Recibo"}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FechamentoTecnicosPage;
