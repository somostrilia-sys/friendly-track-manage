import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { equipamentos } from "@/data/mock-data";
import { Plus } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Package, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const statusMap = {
  disponivel: { label: "Disponível", variant: "default" as const },
  instalado: { label: "Instalado", variant: "secondary" as const },
  manutencao: { label: "Manutenção", variant: "outline" as const },
  defeito: { label: "Defeito", variant: "destructive" as const },
};

const tipoMap = { rastreador: "Rastreador", sensor: "Sensor", camera: "Câmera", bloqueador: "Bloqueador" };

const Estoque = () => {
  const disponivel = equipamentos.filter(e => e.status === "disponivel").length;
  const instalado = equipamentos.filter(e => e.status === "instalado").length;
  const manutencao = equipamentos.filter(e => e.status === "manutencao").length;
  const defeito = equipamentos.filter(e => e.status === "defeito").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-muted-foreground text-sm">Rastreadores, sensores e equipamentos</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Disponível" value={disponivel} icon={Package} accent="success" />
        <StatCard label="Instalado" value={instalado} icon={CheckCircle} accent="primary" />
        <StatCard label="Manutenção" value={manutencao} icon={AlertTriangle} accent="warning" />
        <StatCard label="Defeito" value={defeito} icon={XCircle} accent="destructive" />
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipamentos.map(e => (
              <TableRow key={e.id}>
                <TableCell><Badge variant="secondary">{tipoMap[e.tipo]}</Badge></TableCell>
                <TableCell className="font-medium">{e.modelo}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{e.serial}</TableCell>
                <TableCell>{e.localizacao}</TableCell>
                <TableCell><Badge variant={statusMap[e.status].variant}>{statusMap[e.status].label}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Estoque;
