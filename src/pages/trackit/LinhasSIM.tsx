import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { linhasSIM } from "@/data/mock-data";
import { useState } from "react";

const LinhasSIM = () => {
  const [filtro, setFiltro] = useState<"all" | "online" | "offline">("all");
  const filtrado = filtro === "all" ? linhasSIM : linhasSIM.filter(l => l.status === filtro);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Linhas SIM</h1>
        <p className="text-muted-foreground text-sm">Status das linhas por empresa e ICCID</p>
      </div>

      <div className="flex gap-2">
        {(["all", "online", "offline"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {f === "all" ? "Todas" : f === "online" ? "Online" : "Offline"}
          </button>
        ))}
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ICCID</TableHead>
              <TableHead>Operadora</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Conexão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-sm">{l.iccid}</TableCell>
                <TableCell>{l.operadora}</TableCell>
                <TableCell>{l.numero}</TableCell>
                <TableCell>{l.empresaNome}</TableCell>
                <TableCell className="font-medium">{l.veiculo}</TableCell>
                <TableCell>
                  <Badge variant={l.status === "online" ? "default" : "secondary"}>
                    <span className={`status-dot mr-1.5 ${l.status === "online" ? "bg-success" : "bg-offline"}`} />
                    {l.status === "online" ? "Online" : "Offline"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{l.ultimaConexao}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default LinhasSIM;
