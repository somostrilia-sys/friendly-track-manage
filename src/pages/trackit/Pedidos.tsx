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
import { pedidosIniciais, clientesIniciais, equipamentosIniciais, Pedido, Parcela } from "@/data/mock-data";
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

const Pedidos = () => {
  const [pedidos, setPedidos] = useState(pedidosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Pedido | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState(1);
  const [numParcelas, setNumParcelas] = useState(1);

  const clienteSel = clientesIniciais.find(c => c.id === clienteId);
  const produtoSel = equipamentosIniciais.find(e => e.id === produtoId);
  const valorTotal = produtoSel ? produtoSel.preco * qtd : 0;

  const salvar = () => {
    if (!clienteId || !produtoId) { toast.error("Selecione cliente e produto"); return; }
    const valorParcela = Math.floor(valorTotal / numParcelas);
    const parcelas: Parcela[] = Array.from({ length: numParcelas }, (_, i) => ({
      numero: i + 1, valor: i === numParcelas - 1 ? valorTotal - valorParcela * (numParcelas - 1) : valorParcela,
      vencimento: new Date(Date.now() + (i + 1) * 30 * 86400000).toISOString().split("T")[0], status: "pendente",
    }));
    const novo: Pedido = {
      id: `PED-${String(pedidos.length + 1).padStart(3, "0")}`, clienteId, clienteNome: clienteSel?.nome || "",
      itens: [{ produtoId, nome: produtoSel?.modelo || "", quantidade: qtd, valorUnitario: produtoSel?.preco || 0 }],
      valorTotal, status: "pendente", dataPedido: new Date().toISOString().split("T")[0], parcelas,
    };
    setPedidos(prev => [...prev, novo]);
    setModalOpen(false);
    setClienteId(""); setProdutoId(""); setQtd(1); setNumParcelas(1);
    toast.success("Pedido criado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground text-sm">Acompanhamento de pedidos e parcelas</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Pedido</Button>
      </div>

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
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono font-medium">{p.id}</TableCell>
                <TableCell>{p.clienteNome}</TableCell>
                <TableCell className="text-sm">{p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(", ")}</TableCell>
                <TableCell>R$ {p.valorTotal.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-sm">{p.parcelas.length}x</TableCell>
                <TableCell>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[p.status].class}`}>{statusMap[p.status].label}</span>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Pedido</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clientesIniciais.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Produto</Label>
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>{equipamentosIniciais.filter(e => e.status === "disponivel").map(e => <SelectItem key={e.id} value={e.id}>{e.marca} {e.modelo} — R$ {e.preco}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantidade</Label><Input type="number" min={1} value={qtd} onChange={e => setQtd(+e.target.value)} /></div>
              <div><Label>Parcelas</Label><Input type="number" min={1} max={12} value={numParcelas} onChange={e => setNumParcelas(+e.target.value)} /></div>
            </div>
            {valorTotal > 0 && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p>Valor Total: <strong>R$ {valorTotal.toLocaleString("pt-BR")}</strong></p>
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
              <SheetHeader><SheetTitle>Pedido {detalhe.id}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Cliente</span><p className="font-medium">{detalhe.clienteNome}</p></div>
                  <div><span className="text-muted-foreground">Data</span><p>{detalhe.dataPedido}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[detalhe.status].class}`}>{statusMap[detalhe.status].label}</span></p></div>
                  <div><span className="text-muted-foreground">Valor Total</span><p className="font-semibold text-lg">R$ {detalhe.valorTotal.toLocaleString("pt-BR")}</p></div>
                </div>
                {detalhe.codigoRastreio && (
                  <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Rastreio: <strong className="font-mono">{detalhe.codigoRastreio}</strong></span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-2">Itens</h4>
                  {detalhe.itens.map((item, i) => (
                    <div key={i} className="flex justify-between p-2 rounded bg-muted/50 mb-1">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span>R$ {(item.quantidade * item.valorUnitario).toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Parcelas</h4>
                  <div className="space-y-2">
                    {detalhe.parcelas.map(p => (
                      <div key={p.numero} className={`flex justify-between items-center p-2.5 rounded-lg border ${parcelaStyles[p.status]}`}>
                        <span>Parcela {p.numero} — {p.vencimento}</span>
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
