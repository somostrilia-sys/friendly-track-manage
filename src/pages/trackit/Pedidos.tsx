import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePedidosCompletos, useInsertPedido, useInsertPedidoItem, useInsertParcela, useClientes } from "@/hooks/useSupabaseData";
import type { DbPedido, DbPedidoItem, DbParcela } from "@/types/database";
import { Plus, Eye, Package } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; class: string }> = {
  pendente: { label: "Pendente", class: "bg-warning text-warning-foreground" },
  configurando: { label: "Configurando", class: "bg-primary text-primary-foreground" },
  enviado: { label: "Enviado", class: "bg-success text-success-foreground" },
  entregue: { label: "Entregue", class: "bg-muted text-muted-foreground" },
};

const parcelaStyles: Record<string, string> = {
  pago: "bg-success/10 text-success border-success/30",
  pendente: "bg-warning/10 text-warning border-warning/30",
  atrasado: "bg-destructive/10 text-destructive border-destructive/30",
};

const produtosCatalogo = [
  { id: "plataforma", nome: "Plataforma de Rastreamento Trackit", preco: 29.90, tipo: "mensal" },
  { id: "linha", nome: "Linha/SIM Card", preco: 15, tipo: "mensal" },
  { id: "rastreador", nome: "Rastreador", preco: 350, tipo: "unico" },
];

type PedidoCompleto = DbPedido & { itens: DbPedidoItem[]; parcelas: DbParcela[] };

const Pedidos = () => {
  const { data: pedidos = [], isLoading } = usePedidosCompletos();
  const { data: clientes = [] } = useClientes();
  const insertPedido = useInsertPedido();
  const insertItem = useInsertPedidoItem();
  const insertParcela = useInsertParcela();

  const [modalOpen, setModalOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<PedidoCompleto | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [combo, setCombo] = useState(false);
  const [produtoManual, setProdutoManual] = useState("");
  const [valorManual, setValorManual] = useState(0);
  const [qtd, setQtd] = useState(1);
  const [numParcelas, setNumParcelas] = useState(1);
  const [taxaAdesao, setTaxaAdesao] = useState(0);
  const [observacao, setObservacao] = useState("");

  const clienteSel = clientes.find(c => c.id === clienteId);

  const calcValorTotal = () => {
    let total = 0;
    if (combo) {
      total = (350 + 15 + 29.90) * qtd;
    } else {
      produtosSelecionados.forEach(pid => {
        const p = produtosCatalogo.find(x => x.id === pid);
        if (p) total += p.preco * qtd;
      });
    }
    if (produtoManual && valorManual > 0) total += valorManual * qtd;
    total += taxaAdesao;
    return total;
  };

  const valorTotal = calcValorTotal();

  const salvar = async () => {
    if (!clienteId || (produtosSelecionados.length === 0 && !combo && !produtoManual)) {
      toast.error("Selecione cliente e pelo menos um produto"); return;
    }
    try {
      const codigo = `PED-${String((pedidos as PedidoCompleto[]).length + 1).padStart(3, "0")}`;
      const pedido = await insertPedido.mutateAsync({
        codigo,
        cliente_id: clienteId,
        cliente_nome: clienteSel?.nome || "",
        valor_total: valorTotal,
        status: "pendente",
        data_pedido: new Date().toISOString().split("T")[0],
        observacao: observacao || "",
        codigo_rastreio: "",
      });

      // Insert items
      const itens: { produto_id: string; nome: string; quantidade: number; valor_unitario: number }[] = [];
      if (combo) {
        itens.push({ produto_id: "combo", nome: "Combo Rastreador + Linha + Plataforma", quantidade: qtd, valor_unitario: 350 + 15 + 29.90 });
      } else {
        produtosSelecionados.forEach(pid => {
          const p = produtosCatalogo.find(x => x.id === pid);
          if (p) itens.push({ produto_id: pid, nome: p.nome, quantidade: qtd, valor_unitario: p.preco });
        });
      }
      if (produtoManual && valorManual > 0) {
        itens.push({ produto_id: "manual", nome: produtoManual, quantidade: qtd, valor_unitario: valorManual });
      }

      for (const item of itens) {
        await insertItem.mutateAsync({ pedido_id: pedido.id, ...item });
      }

      // Insert parcelas
      const valorParcela = Math.floor(valorTotal / numParcelas);
      for (let i = 0; i < numParcelas; i++) {
        await insertParcela.mutateAsync({
          pedido_id: pedido.id,
          numero: i + 1,
          valor: i === numParcelas - 1 ? valorTotal - valorParcela * (numParcelas - 1) : valorParcela,
          vencimento: new Date(Date.now() + (i + 1) * 30 * 86400000).toISOString().split("T")[0],
          status: "pendente",
        });
      }

      setModalOpen(false);
      setClienteId(""); setProdutosSelecionados([]); setCombo(false); setProdutoManual(""); setValorManual(0); setQtd(1); setNumParcelas(1); setTaxaAdesao(0); setObservacao("");
      toast.success("Pedido criado!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const peds = pedidos as PedidoCompleto[];

  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos" subtitle="Acompanhamento de pedidos e parcelas">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Pedido</Button>
      </PageHeader>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peds.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono font-medium">{p.codigo}</TableCell>
                <TableCell>{p.cliente_nome}</TableCell>
                <TableCell className="text-sm">{p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(", ")}</TableCell>
                <TableCell>R$ {p.valor_total.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-sm">{p.parcelas.length}x</TableCell>
                <TableCell>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[p.status]?.class}`}>{statusMap[p.status]?.label}</span>
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => setDetalhe(p)}><Eye className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Novo Pedido */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Pedido</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produtos Pre-cadastrados</Label>
              {produtosCatalogo.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={produtosSelecionados.includes(p.id)}
                    disabled={combo}
                    onCheckedChange={checked => {
                      if (checked) setProdutosSelecionados(prev => [...prev, p.id]);
                      else setProdutosSelecionados(prev => prev.filter(x => x !== p.id));
                    }}
                  />
                  <span className="text-sm">{p.nome} - R$ {p.preco} {p.tipo === "mensal" ? "(mensal)" : ""}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <Checkbox checked={combo} onCheckedChange={c => { setCombo(!!c); if (c) setProdutosSelecionados([]); }} />
                <span className="text-sm font-medium">Combo: Rastreador + Linha + Plataforma (R$ {(350 + 15 + 29.90).toFixed(2)}/un)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Produto Manual</Label><Input value={produtoManual} onChange={e => setProdutoManual(e.target.value)} placeholder="Nome do produto" /></div>
              <div><Label>Valor Manual (R$)</Label><Input type="number" value={valorManual} onChange={e => setValorManual(+e.target.value)} /></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div><Label>Quantidade</Label><Input type="number" min={1} value={qtd} onChange={e => setQtd(+e.target.value)} /></div>
              <div><Label>Parcelas</Label><Input type="number" min={1} max={12} value={numParcelas} onChange={e => setNumParcelas(+e.target.value)} /></div>
              <div><Label>Taxa Adesao (R$)</Label><Input type="number" value={taxaAdesao} onChange={e => setTaxaAdesao(+e.target.value)} /></div>
            </div>

            <div><Label>Observacao</Label><Textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2} placeholder="Notas sobre o pedido..." /></div>

            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="text-muted-foreground text-xs mb-1">Upload de contrato (PDF) sera disponibilizado apos integracao com storage.</p>
            </div>

            {valorTotal > 0 && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p>Valor Total: <strong>R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></p>
                {taxaAdesao > 0 && <p className="text-xs text-muted-foreground">Inclui taxa de adesao: R$ {taxaAdesao.toFixed(2)}</p>}
                <p>Parcela: <strong>{numParcelas}x de R$ {Math.floor(valorTotal / numParcelas).toLocaleString("pt-BR")}</strong></p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Criar Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhe Pedido */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>Pedido {detalhe.codigo}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Cliente</span><p className="font-medium">{detalhe.cliente_nome}</p></div>
                  <div><span className="text-muted-foreground">Data</span><p>{detalhe.data_pedido}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[detalhe.status]?.class}`}>{statusMap[detalhe.status]?.label}</span></p></div>
                  <div><span className="text-muted-foreground">Valor Total</span><p className="font-semibold text-lg">R$ {detalhe.valor_total.toLocaleString("pt-BR")}</p></div>
                </div>
                {detalhe.observacao && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground text-xs">Observacao:</span>
                    <p className="mt-1">{detalhe.observacao}</p>
                  </div>
                )}
                {detalhe.codigo_rastreio && (
                  <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Rastreio: <strong className="font-mono">{detalhe.codigo_rastreio}</strong></span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-2">Itens</h4>
                  {detalhe.itens.map((item, i) => (
                    <div key={i} className="flex justify-between p-2 rounded bg-muted/50 mb-1">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span>R$ {(item.quantidade * item.valor_unitario).toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Parcelas</h4>
                  <div className="space-y-2">
                    {detalhe.parcelas.map(p => (
                      <div key={p.numero} className={`flex justify-between items-center p-2.5 rounded-lg border ${parcelaStyles[p.status]}`}>
                        <span>Parcela {p.numero} - {p.vencimento}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">R$ {p.valor.toLocaleString("pt-BR")}</span>
                          <Badge variant="outline" className="text-xs">{p.status === "pago" ? "Pago" : p.status === "atrasado" ? "Atrasado" : "Pendente"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Pedidos;
