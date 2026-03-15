import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fechamentosTecnicosIniciais, FechamentoTecnico } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { DollarSign, FileText, Send, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  enviado_financeiro: { label: "Enviado ao Financeiro", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
};

const FechamentoTecnicosPage = () => {
  const [fechamentos, setFechamentos] = useState(fechamentosTecnicosIniciais);
  const [detalhe, setDetalhe] = useState<FechamentoTecnico | null>(null);

  const totalPendente = fechamentos.filter(f => f.status === "pendente").reduce((a, f) => a + f.valorTotal, 0);
  const totalPago = fechamentos.filter(f => f.status === "pago").reduce((a, f) => a + f.valorTotal, 0);

  const enviarFinanceiro = (id: string) => {
    setFechamentos(prev => prev.map(f => f.id === id ? { ...f, status: "enviado_financeiro" as const } : f));
    toast.success("Enviado ao financeiro!");
  };

  const marcarPago = (id: string) => {
    setFechamentos(prev => prev.map(f => f.id === id ? { ...f, status: "pago" as const } : f));
    toast.success("Marcado como pago!");
  };

  const gerarEtiqueta = (f: FechamentoTecnico) => {
    const etiqueta = `ETIQUETA DE PAGAMENTO\n${f.tecnicoNome} (${f.tipoTecnico})\nPeríodo: ${f.periodo}\nInstalações: ${f.totalInstalacoes} x R$ ${(f.valorInstalacoes / f.totalInstalacoes).toFixed(2)}\nKM: ${f.kmTotal} km x R$ ${f.valorKm > 0 ? (f.valorKm / f.kmTotal).toFixed(2) : "0.00"}/km\nTotal: R$ ${f.valorTotal.toFixed(2)}\nDoc: ${f.regraFiscal === "nota_fiscal" ? "Nota Fiscal Obrigatória" : "Recibo"}`;
    navigator.clipboard.writeText(etiqueta);
    toast.success("Etiqueta copiada para área de transferência!");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Fechamento Técnicos" subtitle="Fechamento financeiro por prestador" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pendente" value={`R$ ${totalPendente.toFixed(2)}`} icon={DollarSign} accent="warning" />
        <StatCard label="Total Pago" value={`R$ ${totalPago.toFixed(2)}`} icon={CheckCircle} accent="success" />
        <StatCard label="Fechamentos" value={fechamentos.length} icon={FileText} accent="primary" />
        <StatCard label="Pendentes" value={fechamentos.filter(f => f.status === "pendente").length} icon={Send} accent="destructive" />
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Técnico</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Instalações</TableHead>
              <TableHead>KM</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Doc. Fiscal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fechamentos.map(f => (
              <TableRow key={f.id} className="cursor-pointer" onClick={() => setDetalhe(f)}>
                <TableCell className="font-medium">{f.tecnicoNome}</TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{f.tipoTecnico}</Badge></TableCell>
                <TableCell className="text-sm">{f.periodo}</TableCell>
                <TableCell>{f.totalInstalacoes}</TableCell>
                <TableCell>{f.kmTotal} km</TableCell>
                <TableCell className="font-semibold">R$ {f.valorTotal.toFixed(2)}</TableCell>
                <TableCell><Badge variant={f.regraFiscal === "nota_fiscal" ? "destructive" : "outline"}>{f.regraFiscal === "nota_fiscal" ? "NF Obrigatória" : "Recibo"}</Badge></TableCell>
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
              <SheetHeader><SheetTitle>Fechamento - {detalhe.tecnicoNome}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tipo</span><p className="font-medium capitalize">{detalhe.tipoTecnico}</p></div>
                  <div><span className="text-muted-foreground">Período</span><p className="font-medium">{detalhe.periodo}</p></div>
                  <div><span className="text-muted-foreground">Valor Instalações</span><p className="font-medium">R$ {detalhe.valorInstalacoes.toFixed(2)}</p></div>
                  <div><span className="text-muted-foreground">Valor KM</span><p className="font-medium">R$ {detalhe.valorKm.toFixed(2)}</p></div>
                  <div><span className="text-muted-foreground">KM Total</span><p className="font-medium">{detalhe.kmTotal} km</p></div>
                  <div><span className="text-muted-foreground">Valor Total</span><p className="font-semibold text-primary">R$ {detalhe.valorTotal.toFixed(2)}</p></div>
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
                  <p className="text-xs text-muted-foreground">Regra fiscal: {detalhe.valorTotal > 1000 ? "Acima de R$ 1.000 — Nota Fiscal obrigatória" : "Até R$ 1.000 — Recibo"}</p>
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
