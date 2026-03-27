import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFinanceiroCompleto, useInsertFinanceiro, useUpdateFinanceiro, useTecnicos } from "@/hooks/useSupabaseData";
import type { DbFinanceiro, DbFinanceiroServico } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { DollarSign, CheckCircle, Clock, Plus, Upload, Eye } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  aberto: { label: "Aberto", variant: "secondary" },
  fechado: { label: "Fechado", variant: "outline" },
  pago: { label: "Pago", variant: "default" },
};

type FinanceiroComServicos = DbFinanceiro & { servicos: DbFinanceiroServico[] };

const FechamentoTecnicosTab = () => {
  const { data: registros = [], isLoading } = useFinanceiroCompleto();
  const { data: tecnicos = [] } = useTecnicos();
  const insertFinanceiro = useInsertFinanceiro();
  const updateFinanceiro = useUpdateFinanceiro();

  const [modalOpen, setModalOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<FinanceiroComServicos | null>(null);
  const [form, setForm] = useState({ tecnico_id: "" as string | null, periodo: "", valor_total: 0, descontos: 0 });

  const regs = registros as FinanceiroComServicos[];
  const totalAberto = regs.filter(f => f.status === "aberto").reduce((a, f) => a + f.valor_final, 0);
  const totalPago = regs.filter(f => f.status === "pago").reduce((a, f) => a + f.valor_final, 0);

  const salvar = async () => {
    if (!form.tecnico_id || !form.periodo) { toast.error("Preencha tecnico e periodo"); return; }
    const tec = tecnicos.find(t => t.id === form.tecnico_id);
    try {
      await insertFinanceiro.mutateAsync({
        codigo: `FIN-${String(regs.length + 1).padStart(3, "0")}`,
        tecnico_id: form.tecnico_id, tecnico_nome: tec?.nome || "",
        periodo: form.periodo, total_servicos: 0,
        valor_total: form.valor_total, descontos: form.descontos,
        valor_final: form.valor_total - form.descontos, status: "aberto",
        nota_fiscal: "", data_pagamento: "",
      });
      setModalOpen(false);
      setForm({ tecnico_id: "", periodo: "", valor_total: 0, descontos: 0 });
      toast.success("Fatura criada!");
    } catch (e: any) { toast.error(e.message); }
  };

  const marcarPago = async (id: string) => {
    try {
      await updateFinanceiro.mutateAsync({ id, status: "pago", data_pagamento: new Date().toISOString().split("T")[0] });
      toast.success("Marcado como pago!");
    } catch (e: any) { toast.error(e.message); }
  };

  const anexarNota = async (id: string) => {
    try {
      await updateFinanceiro.mutateAsync({ id, nota_fiscal: `NF-${Date.now().toString().slice(-6)}.pdf` });
      toast.success("Nota fiscal anexada (simulacao)!");
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return <TableSkeleton rows={5} cols={10} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Fatura</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Aberto" value={`R$ ${totalAberto.toLocaleString("pt-BR")}`} icon={Clock} accent="warning" />
        <StatCard label="Total Pago" value={`R$ ${totalPago.toLocaleString("pt-BR")}`} icon={CheckCircle} accent="success" />
        <StatCard label="Total Geral" value={`R$ ${(totalAberto + totalPago).toLocaleString("pt-BR")}`} icon={DollarSign} accent="primary" />
      </div>
      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead><TableHead>Tecnico</TableHead><TableHead>Periodo</TableHead><TableHead>Servicos</TableHead>
              <TableHead>Valor Bruto</TableHead><TableHead>Descontos</TableHead><TableHead>Valor Final</TableHead>
              <TableHead>NF</TableHead><TableHead>Status</TableHead><TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regs.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-sm">{f.codigo}</TableCell>
                <TableCell className="font-medium">{f.tecnico_nome}</TableCell>
                <TableCell>{f.periodo}</TableCell>
                <TableCell>{f.total_servicos}</TableCell>
                <TableCell>R$ {f.valor_total.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-destructive">{f.descontos > 0 ? `-R$ ${f.descontos}` : "--"}</TableCell>
                <TableCell className="font-semibold">R$ {f.valor_final.toLocaleString("pt-BR")}</TableCell>
                <TableCell>{f.nota_fiscal ? <Badge variant="outline" className="text-xs">{f.nota_fiscal}</Badge> : "--"}</TableCell>
                <TableCell><Badge variant={statusStyles[f.status]?.variant}>{statusStyles[f.status]?.label}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetalhe(f)}><Eye className="w-4 h-4" /></Button>
                    {f.status === "aberto" && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => anexarNota(f.id)} title="Anexar NF"><Upload className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => marcarPago(f.id)}>Pagar</Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Fatura / Fechamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tecnico / Prestador</Label>
              <Select value={form.tecnico_id || ""} onValueChange={v => setForm(f => ({ ...f, tecnico_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Periodo</Label><Input value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} placeholder="01-15/03/2024" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Total (R$)</Label><Input type="number" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: +e.target.value }))} /></div>
              <div><Label>Descontos (R$)</Label><Input type="number" value={form.descontos} onChange={e => setForm(f => ({ ...f, descontos: +e.target.value }))} /></div>
            </div>
            {form.valor_total > 0 && (
              <div className="p-3 rounded-lg bg-muted text-sm">Valor Final: <strong>R$ {(form.valor_total - form.descontos).toLocaleString("pt-BR")}</strong></div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={salvar}>Criar Fatura</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>Fatura {detalhe.codigo}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tecnico</span><p className="font-medium">{detalhe.tecnico_nome}</p></div>
                  <div><span className="text-muted-foreground">Periodo</span><p>{detalhe.periodo}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusStyles[detalhe.status]?.variant}>{statusStyles[detalhe.status]?.label}</Badge></p></div>
                  <div><span className="text-muted-foreground">Valor Final</span><p className="font-semibold text-lg">R$ {detalhe.valor_final.toLocaleString("pt-BR")}</p></div>
                  {detalhe.data_pagamento && <div><span className="text-muted-foreground">Data Pagamento</span><p>{detalhe.data_pagamento}</p></div>}
                  {detalhe.nota_fiscal && <div><span className="text-muted-foreground">Nota Fiscal</span><p>{detalhe.nota_fiscal}</p></div>}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Servicos Executados no Periodo</h4>
                  {detalhe.servicos.length === 0 ? <p className="text-muted-foreground">Nenhum servico detalhado.</p> : (
                    <div className="space-y-1">
                      {detalhe.servicos.map((s, i) => (
                        <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                          <div><p>{s.descricao}</p><p className="text-xs text-muted-foreground">{s.data}</p></div>
                          <span className="font-medium">R$ {s.valor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FechamentoTecnicosTab;
