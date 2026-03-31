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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePedidosCompletos, useInsertPedido, useInsertPedidoItem, useInsertParcela, useUpdatePedido, useUpdateParcela, useClientes, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbPedido, DbPedidoItem, DbParcela } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { Plus, Eye, Package, Inbox, Search, Clock, Settings, Truck, CheckCircle, Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
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

type PedidoCompleto = DbPedido & { itens: DbPedidoItem[]; parcelas: DbParcela[] };

interface ItemForm {
  nome: string;
  valor_unitario: number;
  quantidade: number;
}

const Pedidos = () => {
  const { data: pedidos = [], isLoading } = usePedidosCompletos();
  const { data: clientes = [] } = useClientes();
  const insertPedido = useInsertPedido();
  const insertItem = useInsertPedidoItem();
  const insertParcela = useInsertParcela();
  const updatePedido = useUpdatePedido();
  const updateParcela = useUpdateParcela();

  useRealtimeSubscription("pedidos", ["pedidos", "pedidos_completos"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<PedidoCompleto | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Form state
  const [clienteId, setClienteId] = useState("");
  const [itensForm, setItensForm] = useState<ItemForm[]>([{ nome: "", valor_unitario: 0, quantidade: 1 }]);
  const [numParcelas, setNumParcelas] = useState(1);
  const [taxaAdesao, setTaxaAdesao] = useState(0);
  const [observacao, setObservacao] = useState("");

  const clienteSel = clientes.find(c => c.id === clienteId);

  const addItem = () => setItensForm(prev => [...prev, { nome: "", valor_unitario: 0, quantidade: 1 }]);
  const removeItem = (idx: number) => setItensForm(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof ItemForm, value: string | number) => {
    setItensForm(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const valorTotal = itensForm.reduce((acc, item) => acc + item.valor_unitario * item.quantidade, 0) + taxaAdesao;

  const resetForm = () => {
    setClienteId("");
    setItensForm([{ nome: "", valor_unitario: 0, quantidade: 1 }]);
    setNumParcelas(1);
    setTaxaAdesao(0);
    setObservacao("");
  };

  const salvar = async () => {
    const itensValidos = itensForm.filter(i => i.nome.trim() && i.valor_unitario > 0);
    if (!clienteId || itensValidos.length === 0) {
      toast.error("Selecione um cliente e adicione pelo menos um produto");
      return;
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

      for (const item of itensValidos) {
        await insertItem.mutateAsync({
          pedido_id: pedido.id,
          produto_id: "manual",
          nome: item.nome,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        });
      }

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
      resetForm();
      toast.success("Pedido criado!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const alterarStatus = async (pedidoId: string, novoStatus: string) => {
    try {
      await updatePedido.mutateAsync({ id: pedidoId, status: novoStatus } as any);
      toast.success(`Status alterado para ${statusMap[novoStatus]?.label}`);
      setDetalhe(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const marcarParcelaPaga = async (parcelaId: string) => {
    try {
      await updateParcela.mutateAsync({ id: parcelaId, status: "pago" } as any);
      toast.success("Parcela marcada como paga!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Pedidos" subtitle="Acompanhamento de pedidos e parcelas" />
      <TableSkeleton rows={5} cols={7} />
    </div>
  );

  const peds = pedidos as PedidoCompleto[];
  const pendentes = peds.filter(p => p.status === "pendente").length;
  const configurando = peds.filter(p => p.status === "configurando").length;
  const enviados = peds.filter(p => p.status === "enviado").length;
  const entregues = peds.filter(p => p.status === "entregue").length;

  const filtered = peds.filter(p => {
    const matchBusca = !busca || p.codigo.toLowerCase().includes(busca.toLowerCase()) || p.cliente_nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || p.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Pedidos" subtitle="Acompanhamento de pedidos e parcelas">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Pedido</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pendentes" value={pendentes} icon={Clock} accent="warning" />
        <StatCard label="Configurando" value={configurando} icon={Settings} accent="primary" />
        <StatCard label="Enviados" value={enviados} icon={Truck} accent="success" />
        <StatCard label="Entregues" value={entregues} icon={CheckCircle} accent="muted" />
      </div>

      <Card className="card-shadow overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar pedido ou cliente..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="configurando">Configurando</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="entregue">Entregue</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="ml-auto">{filtered.length} pedido{filtered.length !== 1 ? "s" : ""}</Badge>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum pedido encontrado</p>
          </div>
        ) : (
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
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono font-medium">{p.codigo}</TableCell>
                  <TableCell>{p.cliente_nome}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(", ")}</TableCell>
                  <TableCell>R$ {p.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
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
        )}
      </Card>

      {/* Modal Novo Pedido — 100% Manual */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Pedido</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Produtos / Servicos</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Adicionar Item</Button>
              </div>
              {itensForm.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_100px_80px_32px] gap-2 items-end">
                  <div>
                    {idx === 0 && <Label className="text-xs">Produto</Label>}
                    <Input value={item.nome} onChange={e => updateItem(idx, "nome", e.target.value)} placeholder="Nome do produto/servico" />
                  </div>
                  <div>
                    {idx === 0 && <Label className="text-xs">Valor (R$)</Label>}
                    <Input type="number" min={0} step="0.01" value={item.valor_unitario || ""} onChange={e => updateItem(idx, "valor_unitario", +e.target.value)} placeholder="0,00" />
                  </div>
                  <div>
                    {idx === 0 && <Label className="text-xs">Qtd</Label>}
                    <Input type="number" min={1} value={item.quantidade} onChange={e => updateItem(idx, "quantidade", +e.target.value)} />
                  </div>
                  <div>
                    {itensForm.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Parcelas</Label><Input type="number" min={1} max={24} value={numParcelas} onChange={e => setNumParcelas(+e.target.value)} /></div>
              <div><Label>Taxa Adesao (R$)</Label><Input type="number" min={0} step="0.01" value={taxaAdesao || ""} onChange={e => setTaxaAdesao(+e.target.value)} /></div>
            </div>

            <div><Label>Observacao</Label><Textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2} placeholder="Notas sobre o pedido..." /></div>

            {valorTotal > 0 && (
              <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                <p>Valor Total: <strong>R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></p>
                {taxaAdesao > 0 && <p className="text-xs text-muted-foreground">Inclui taxa de adesao: R$ {taxaAdesao.toFixed(2)}</p>}
                <p>Parcela: <strong>{numParcelas}x de R$ {(valorTotal / numParcelas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={salvar}>Criar Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhe Pedido com acoes */}
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
                  <div><span className="text-muted-foreground">Valor Total</span><p className="font-semibold text-lg">R$ {detalhe.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                </div>

                {/* Alterar Status */}
                <div className="flex gap-2 flex-wrap">
                  {detalhe.status === "pendente" && <Button size="sm" variant="outline" onClick={() => alterarStatus(detalhe.id, "configurando")}>Marcar Configurando</Button>}
                  {detalhe.status === "configurando" && <Button size="sm" variant="outline" onClick={() => alterarStatus(detalhe.id, "enviado")}>Marcar Enviado</Button>}
                  {detalhe.status === "enviado" && <Button size="sm" variant="outline" onClick={() => alterarStatus(detalhe.id, "entregue")}>Marcar Entregue</Button>}
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
                      <span>R$ {(item.quantidade * item.valor_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
                          <span className="font-medium">R$ {p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          {p.status !== "pago" ? (
                            <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => marcarParcelaPaga(p.id)}>Pagar</Button>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pago</Badge>
                          )}
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
