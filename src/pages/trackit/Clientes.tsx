import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientes } from "@/data/mock-data";
import { Plus, Search } from "lucide-react";

const Clientes = () => {
  const [busca, setBusca] = useState("");
  const filtrado = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cnpj.includes(busca)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerenciamento de clientes do sistema</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
      </div>

      <Card className="card-shadow">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CNPJ..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Veículos</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(c => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{c.tipo === "empresa" ? "Empresa" : "Associação"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.cnpj}</TableCell>
                <TableCell>{c.cidade}/{c.estado}</TableCell>
                <TableCell>{c.veiculosAtivos}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "ativo" ? "default" : "secondary"}>
                    {c.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Clientes;
