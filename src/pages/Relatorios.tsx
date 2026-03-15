import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

interface RelatorioGerado {
  id: string; titulo: string; modulo: string; tipo: string; periodo: string; registros: number; geradoEm: string;
}

const Relatorios = () => {
  const [modulo, setModulo] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [relatorios, setRelatorios] = useState<RelatorioGerado[]>([]);

  const gerarRelatorio = () => {
    const novo: RelatorioGerado = {
      id: `REL-${String(relatorios.length + 1).padStart(3, "0")}`,
      titulo: `Relatório ${tipo !== "todos" ? tipo : "Geral"} - ${modulo !== "todos" ? modulo : "Todos os Módulos"}`,
      modulo: modulo !== "todos" ? modulo : "Todos",
      tipo: tipo !== "todos" ? tipo : "Consolidado",
      periodo: dataInicio && dataFim ? `${dataInicio} a ${dataFim}` : "Último mês",
      registros: Math.floor(Math.random() * 200) + 10,
      geradoEm: new Date().toLocaleString("pt-BR"),
    };
    setRelatorios(prev => [novo, ...prev]);
    toast.success("Relatório gerado com sucesso!");
  };

  const exportarCSV = (rel: RelatorioGerado) => {
    const csv = `ID,Titulo,Modulo,Tipo,Periodo,Registros\n${rel.id},${rel.titulo},${rel.modulo},${rel.tipo},${rel.periodo},${rel.registros}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${rel.id}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const exportarPDF = (rel: RelatorioGerado) => {
    // Simulação
    toast.success(`PDF do ${rel.id} gerado (simulação)!`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" subtitle="Geração e exportação de relatórios do sistema" />

      <Card className="p-6 card-shadow">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><Label>Módulo</Label>
            <Select value={modulo} onValueChange={setModulo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Trackit">Trackit</SelectItem>
                <SelectItem value="Objetivo">Objetivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Técnico">Técnico</SelectItem>
                <SelectItem value="Logístico">Logístico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data Início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
          <div><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
        </div>
        <div className="mt-4">
          <Button onClick={gerarRelatorio}><FileText className="w-4 h-4 mr-2" /> Gerar Relatório</Button>
        </div>
      </Card>

      {relatorios.length > 0 && (
        <Card className="card-shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Relatórios Gerados ({relatorios.length})</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Gerado Em</TableHead>
                <TableHead>Exportar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatorios.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.titulo}</TableCell>
                  <TableCell><Badge variant="secondary">{r.modulo}</Badge></TableCell>
                  <TableCell>{r.tipo}</TableCell>
                  <TableCell className="text-sm">{r.periodo}</TableCell>
                  <TableCell>{r.registros}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.geradoEm}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => exportarCSV(r)}>
                        <Download className="w-3 h-3 mr-1" /> CSV
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => exportarPDF(r)}>
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default Relatorios;
