import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface LinhaConferencia {
  empresa: string;
  valorFornecedor: number;
  valorInterno: number;
  diferenca: number;
  divergente: boolean;
}

const dadosInternosSimulados: Record<string, number> = {
  "Transportadora Rapida Ltda": 2845.50,
  "LogBrasil Transportes": 1588.80,
  "Assoc. Caminhoneiros do Sul": 5478.00,
  "Frota Segura ME": 890.00,
  "TransNorte Logistica": 1200.50,
};

const ConferenciaFornecedorTab = () => {
  const [resultado, setResultado] = useState<LinhaConferencia[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const processarCSV = (text: string) => {
    const lines = text.trim().split("\n");
    const data: LinhaConferencia[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[;,]/);
      if (cols.length < 2) continue;
      const empresa = cols[0].trim().replace(/"/g, "");
      const valorFornecedor = parseFloat(cols[1].trim().replace(",", ".")) || 0;
      const valorInterno = dadosInternosSimulados[empresa] || 0;
      const diferenca = valorFornecedor - valorInterno;
      data.push({
        empresa,
        valorFornecedor,
        valorInterno,
        diferenca,
        divergente: Math.abs(diferenca) > 0.01,
      });
    }
    return data;
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNomeArquivo(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const dados = processarCSV(text);
      setResultado(dados);
      toast.success(`Arquivo processado: ${dados.length} linhas`);
    };
    reader.readAsText(file);
  };

  const gerarCSVExemplo = () => {
    const csv = "Empresa;Valor\nTransportadora Rapida Ltda;2845.50\nLogBrasil Transportes;1600.00\nAssoc. Caminhoneiros do Sul;5478.00\nFrota Segura ME;920.00\nTransNorte Logistica;1200.50";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "exemplo-fornecedor.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.info("CSV de exemplo baixado!");
  };

  const totalFornecedor = resultado.reduce((a, r) => a + r.valorFornecedor, 0);
  const totalInterno = resultado.reduce((a, r) => a + r.valorInterno, 0);
  const divergencias = resultado.filter(r => r.divergente).length;

  return (
    <div className="space-y-6">
      <Card className="p-6 card-shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Upload de Planilha do Fornecedor</h3>
            <p className="text-sm text-muted-foreground">
              Envie um CSV com colunas: Empresa;Valor. O sistema cruza automaticamente com os dados internos do faturamento B2B.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={gerarCSVExemplo}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV Exemplo
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Importar CSV
            </Button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleUpload} />
        </div>
        {nomeArquivo && <p className="mt-3 text-sm text-muted-foreground">Arquivo: <span className="font-mono">{nomeArquivo}</span></p>}
      </Card>

      {resultado.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Fornecedor" value={`R$ ${totalFornecedor.toFixed(2)}`} icon={FileSpreadsheet} accent="primary" />
            <StatCard label="Total Interno" value={`R$ ${totalInterno.toFixed(2)}`} icon={CheckCircle} accent="success" />
            <StatCard label="Diferenca" value={`R$ ${(totalFornecedor - totalInterno).toFixed(2)}`} icon={AlertTriangle} accent={Math.abs(totalFornecedor - totalInterno) > 0.01 ? "warning" : "success"} />
            <StatCard label="Divergencias" value={divergencias} icon={AlertTriangle} accent={divergencias > 0 ? "warning" : "success"} />
          </div>

          <Card className="card-shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Valor Fornecedor</TableHead>
                  <TableHead className="text-right">Valor Interno</TableHead>
                  <TableHead className="text-right">Diferenca</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.map((r, i) => (
                  <TableRow key={i} className={r.divergente ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">{r.empresa}</TableCell>
                    <TableCell className="text-right font-mono">R$ {r.valorFornecedor.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{r.valorInterno > 0 ? `R$ ${r.valorInterno.toFixed(2)}` : <span className="text-muted-foreground">Nao encontrado</span>}</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${r.divergente ? "text-destructive" : "text-green-500"}`}>
                      {r.diferenca > 0 ? "+" : ""}{r.diferenca.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {r.divergente
                        ? <Badge variant="destructive">Divergente</Badge>
                        : <Badge variant="default">OK</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {resultado.length === 0 && (
        <Card className="p-12 card-shadow text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Importe um CSV do fornecedor para iniciar a conferencia</p>
        </Card>
      )}
    </div>
  );
};

export default ConferenciaFornecedorTab;
