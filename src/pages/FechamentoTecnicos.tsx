import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFechamentoCompleto, useUpdateFechamentoTecnico } from "@/hooks/useSupabaseData";
import type { DbFechamentoTecnico, DbFechamentoInstalacao } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { DollarSign, FileText, Send, CheckCircle } from "lucide-react";
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
  const updateFechamento = useUpdateFechamentoTecnico();
  const [detalhe, setDetalhe] = useState<FechamentoComInstalacoes | null>(null);

  const fecs = fechamentos as FechamentoComInstalacoes[];
  const totalPendente = fecs.filter(f => f.status === "pendente").reduce((a, f) => a + f.valor_total, 0);
  const totalPago = fecs.filter(f => f.status === "pago").reduce((a, f) => a + f.valor_total, 0);

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
    const etiqueta = `ETIQUETA DE PAGAMENTO\n${f.tecnico_nome} (${f.tipo_tecnico})\nPeríodo: ${f.periodo}\nInstalações: ${f.total_instalacoes} x R$ ${(f.valor_instalacoes / (f.total_instalacoes || 1)).toFixed(2)}\nKM: ${f.km_total} km x R$ ${f.valor_km > 0 ? (f.valor_km / (f.km_total || 1)).toFixed(2) : "0.00"}/km\nTotal: R$ ${f.valor_total.toFixed(2)}\nDoc: ${f.regra_fiscal === "nota_fiscal" ? "Nota Fiscal Obrigatória" : "Recibo"}`;
    navigator.clipboard.writeText(etiqueta);
    toast.success("Etiqueta copiada para área de transferência!");
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Fechamento Técnicos" subtitle="Fechamento financeiro por prestador" />
      <TableSkeleton rows={5} cols={9} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Fechamento Técnicos" subtitle="Fechamento financeiro por prestador" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pendente" value={`R$ ${totalPendente.toFixed(2)}`} icon={DollarSign} accent="warning" />
        <StatCard label="Total Pago" value={`R$ ${totalPago.toFixed(2)}`} icon={CheckCircle} accent="success" />
        <StatCard label="Fechamentos" value={fecs.length} icon={FileText} accent="primary" />
        <StatCard label="Pendentes" value={fecs.filter(f => f.status === "pendente").length} icon={Send} accent="destructive" />
      </div>
      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Técnico</TableHead><TableHead>Tipo</TableHead><TableHead>Período</TableHead>
              <TableHead>Instalações</TableHead><TableHead>KM</TableHead><TableHead>Valor Total</TableHead>
              <TableHead>Doc. Fiscal</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead>
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
                <TableCell><Badge variant={f.regra_fiscal === "nota_fiscal" ? "destructive" : "outline"}>{f.regra_fiscal === "nota_fiscal" ? "NF Obrigatória" : "Recibo"}</Badge></TableCell>
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
      </Card>
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>Fechamento - {detalhe.tecnico_nome}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tipo</span><p className="font-medium capitalize">{detalhe.tipo_tecnico}</p></div>
                  <div><span className="text-muted-foreground">Período</span><p className="font-medium">{detalhe.periodo}</p></div>
                  <div><span className="text-muted-foreground">Valor Instalações</span><p className="font-medium">R$ {detalhe.valor_instalacoes.toFixed(2)}</p></div>
                  <div><span className="text-muted-foreground">Valor KM</span><p className="font-medium">R$ {detalhe.valor_km.toFixed(2)}</p></div>
                  <div><span className="text-muted-foreground">KM Total</span><p className="font-medium">{detalhe.km_total} km</p></div>
                  <div><span className="text-muted-foreground">Valor Total</span><p className="font-semibold text-primary">R$ {detalhe.valor_total.toFixed(2)}</p></div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Instalações</h4>
                  <div className="space-y-1">
                    {detalhe.instalacoes.map((inst, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                        <span>{inst.data} - {inst.placa}</span>
                        <span className="font-medium">R$ {inst.valor.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Regra fiscal: {detalhe.valor_total > 1000 ? "Acima de R$ 1.000 — Nota Fiscal obrigatória" : "Até R$ 1.000 — Recibo"}</p>
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
