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
import { financeiroIniciais, tecnicosIniciais, Financeiro } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { DollarSign, CheckCircle, Clock, Plus, Upload, Eye } from "lucide-react";
import { toast } from "sonner";

const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  aberto: { label: "Aberto", variant: "secondary" },
  fechado: { label: "Fechado", variant: "outline" },
  pago: { label: "Pago", variant: "default" },
};

const FinanceiroPage = () => {
  const [registros, setRegistros] = useState(financeiroIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Financeiro | null>(null);

  const [form, setForm] = useState({ tecnicoId: "", periodo: "", valorTotal: 0, descontos: 0 });

  const totalAberto = registros.filter(f => f.status === "aberto").reduce((a, f) => a + f.valorFinal, 0);
  const totalPago = registros.filter(f => f.status === "pago").reduce((a, f) => a + f.valorFinal, 0);

  const salvar = () => {
    if (!form.tecnicoId || !form.periodo) { toast.error("Preencha técnico e período"); return; }
    const tec = tecnicosIniciais.find(t => t.id === form.tecnicoId);
    const novo: Financeiro = {
      id: `FIN-${String(registros.length + 1).padStart(3, "0")}`,
      tecnicoId: form.tecnicoId, tecnicoNome: tec?.nome || "",
      periodo: form.periodo, totalServicos: 0, servicos: [],
      valorTotal: form.valorTotal, descontos: form.descontos,
      valorFinal: form.valorTotal - form.descontos, status: "aberto",
    };
    setRegistros(prev => [...prev, novo]);
    setModalOpen(false);
    setForm({ tecnicoId: "", periodo: "", valorTotal: 0, descontos: 0 });
    toast.success("Fatura criada!");
  };

  const marcarPago = (id: string) => {
    setRegistros(prev => prev.map(f => f.id === id ? { ...f, status: "pago", dataPagamento: new Date().toISOString().split("T")[0] } : f));
    toast.success("Marcado como pago!");
  };

  const anexarNota = (id: string) => {
    setRegistros(prev => prev.map(f => f.id === id ? { ...f, notaFiscal: `NF-${Date.now().toString().slice(-6)}.pdf` } : f));
    toast.success("Nota fiscal anexada (simulação)!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Fechamento por técnico — quinzenal/mensal</p>
        </div>
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
              <TableHead>ID</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Serviços</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Descontos</TableHead>
              <TableHead>Valor Final</TableHead>
              <TableHead>NF</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-sm">{f.id}</TableCell>
                <TableCell className="font-medium">{f.tecnicoNome}</TableCell>
                <TableCell>{f.periodo}</TableCell>
                <TableCell>{f.totalServicos}</TableCell>
                <TableCell>R$ {f.valorTotal.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-destructive">{f.descontos > 0 ? `-R$ ${f.descontos}` : "—"}</TableCell>
                <TableCell className="font-semibold">R$ {f.valorFinal.toLocaleString("pt-BR")}</TableCell>
                <TableCell>{f.notaFiscal ? <Badge variant="outline" className="text-xs">{f.notaFiscal}</Badge> : "—"}</TableCell>
                <TableCell><Badge variant={statusStyles[f.status].variant}>{statusStyles[f.status].label}</Badge></TableCell>
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

      {/* Modal Nova Fatura */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Fatura / Fechamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Técnico / Prestador</Label>
              <Select value={form.tecnicoId} onValueChange={v => setForm(f => ({ ...f, tecnicoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Período</Label><Input value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} placeholder="01-15/03/2024" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Total (R$)</Label><Input type="number" value={form.valorTotal} onChange={e => setForm(f => ({ ...f, valorTotal: +e.target.value }))} /></div>
              <div><Label>Descontos (R$)</Label><Input type="number" value={form.descontos} onChange={e => setForm(f => ({ ...f, descontos: +e.target.value }))} /></div>
            </div>
            {form.valorTotal > 0 && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                Valor Final: <strong>R$ {(form.valorTotal - form.descontos).toLocaleString("pt-BR")}</strong>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Criar Fatura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhe */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>Fatura {detalhe.id}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Técnico</span><p className="font-medium">{detalhe.tecnicoNome}</p></div>
                  <div><span className="text-muted-foreground">Período</span><p>{detalhe.periodo}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusStyles[detalhe.status].variant}>{statusStyles[detalhe.status].label}</Badge></p></div>
                  <div><span className="text-muted-foreground">Valor Final</span><p className="font-semibold text-lg">R$ {detalhe.valorFinal.toLocaleString("pt-BR")}</p></div>
                  {detalhe.dataPagamento && <div><span className="text-muted-foreground">Data Pagamento</span><p>{detalhe.dataPagamento}</p></div>}
                  {detalhe.notaFiscal && <div><span className="text-muted-foreground">Nota Fiscal</span><p>{detalhe.notaFiscal}</p></div>}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Serviços Executados no Período</h4>
                  {detalhe.servicos.length === 0 ? <p className="text-muted-foreground">Nenhum serviço detalhado.</p> : (
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

export default FinanceiroPage;
