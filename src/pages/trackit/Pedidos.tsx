import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { pedidos } from "@/data/mock-data";

const statusMap = {
  pendente: { label: "Pendente", class: "bg-warning text-warning-foreground" },
  configurando: { label: "Configurando", class: "bg-primary text-primary-foreground" },
  enviado: { label: "Enviado", class: "bg-success text-success-foreground" },
  entregue: { label: "Entregue", class: "bg-muted text-muted-foreground" },
};

const Pedidos = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <p className="text-muted-foreground text-sm">Acompanhamento de pedidos e parcelas</p>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-mono font-medium">{p.id}</TableCell>
              <TableCell>{p.clienteNome}</TableCell>
              <TableCell className="text-sm">{p.itens}</TableCell>
              <TableCell>R$ {p.valorTotal.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm">{p.parcelas}x R$ {p.valorParcela.toLocaleString("pt-BR")}</TableCell>
              <TableCell>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[p.status].class}`}>
                  {statusMap[p.status].label}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  </div>
);

export default Pedidos;
