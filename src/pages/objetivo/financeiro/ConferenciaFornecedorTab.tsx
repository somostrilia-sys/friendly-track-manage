import { useState, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Download, XCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useLinhasSIM } from "@/hooks/useSupabaseData";
import * as XLSX from "xlsx";

interface LinhaConferencia {
  iccid: string;
  valorCobrado: number;
  valorEsperado: number;
  diferenca: number;
  status: "ok" | "divergente" | "nao_cadastrada" | "faltando_cobranca";
}

const ConferenciaFornecedorTab = () => {
  const [resultado, setResultado] = useState<LinhaConferencia[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Dados internos: valor esperado por ICCID (simulado)
  const dadosInternos = useMemo(() => {
    const map: Record<string, number> = {};
    linhasSIMIniciais.forEach(l => {
      // Valor simulado por linha
      map[l.iccid] = 25.0 + Math.round(parseFloat(l.id) * 3.5 * 100) / 100;
    });
    return map;
  }, []);

  const processarDados = (rows: { iccid: string; valor: number }[]) => {
    // Agrupar por ICCID e somar valores duplicados
    const agrupado: Record<string, number> = {};
    rows.forEach(r => {
      const key = r.iccid.trim();
      if (!key) return;
      agrupado[key] = (agrupado[key] || 0) + r.valor;
    });

    const linhas: LinhaConferencia[] = [];

    // Linhas do fornecedor
    Object.entries(agrupado).forEach(([iccid, valorCobrado]) => {
      const valorEsperado = dadosInternos[iccid];
      if (valorEsperado === undefined) {
        linhas.push({ iccid, valorCobrado, valorEsperado: 0, diferenca: valorCobrado, status: "nao_cadastrada" });
      } else {
        const diferenca = valorCobrado - valorEsperado;
        linhas.push({
          iccid, valorCobrado, valorEsperado, diferenca,
          status: Math.abs(diferenca) > 0.01 ? "divergente" : "ok",
        });
      }
    });

    // Linhas internas faltando na cobranca
    Object.entries(dadosInternos).forEach(([iccid, valorEsperado]) => {
      if (!agrupado[iccid]) {
        linhas.push({ iccid, valorCobrado: 0, valorEsperado, diferenca: -valorEsperado, status: "faltando_cobranca" });
      }
    });

    return linhas;
  };

  const parseFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    setNomeArquivo(file.name);

    if (ext === "csv" || ext === "txt") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.trim().split("\n");
        const rows: { iccid: string; valor: number }[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/[;,]/);
          if (cols.length < 2) continue;
          rows.push({
            iccid: cols[0].trim().replace(/"/g, ""),
            valor: parseFloat(cols[1].trim().replace(",", ".")) || 0,
          });
        }
        const dados = processarDados(rows);
        setResultado(dados);
        toast.success(`Arquivo processado: ${rows.length} registros lidos`);
      };
      reader.readAsText(file);
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
        const rows: { iccid: string; valor: number }[] = [];
        json.forEach((row) => {
          const iccid = String(row["ICCID"] || row["iccid"] || row["Iccid"] || "");
          const valor = parseFloat(String(row["Valor"] || row["valor"] || row["VALOR"] || "0").replace(",", ".")) || 0;
          if (iccid) rows.push({ iccid, valor });
        });
        const dados = processarDados(rows);
        setResultado(dados);
        toast.success(`Arquivo processado: ${rows.length} registros lidos`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("Formato nao suportado. Use CSV, TXT ou XLSX.");
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const gerarTemplate = () => {
    const csv = "ICCID;Valor\n8955031234567890001;25.00\n8955031234567890002;30.00\n8955031234567890001;5.50\n8955031234567890099;28.00";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "template-conferencia-fornecedor.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.info("Template CSV baixado!");
  };

  // Export functions
  const exportarCSV = () => {
    const header = "ICCID;Valor Cobrado;Valor Esperado;Diferenca;Status";
    const lines = resultado.map(r =>
      `${r.iccid};${r.valorCobrado.toFixed(2)};${r.valorEsperado.toFixed(2)};${r.diferenca.toFixed(2)};${statusLabel(r.status)}`
    );
    const csv = [header, ...lines].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv" }), "conferencia-fornecedor.csv");
    toast.success("CSV exportado!");
  };

  const exportarExcel = () => {
    const data = resultado.map(r => ({
      ICCID: r.iccid,
      "Valor Cobrado": r.valorCobrado,
      "Valor Esperado": r.valorEsperado,
      Diferenca: r.diferenca,
      Status: statusLabel(r.status),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Conferencia");
    XLSX.writeFile(wb, "conferencia-fornecedor.xlsx");
    toast.success("Excel exportado!");
  };

  const exportarPDF = () => {
    // Simple printable HTML approach
    const rows = resultado.map(r =>
      `<tr style="background:${r.status === 'divergente' || r.status === 'nao_cadastrada' ? '#3a1111' : 'transparent'}">
        <td style="padding:6px;border:1px solid #333">${r.iccid}</td>
        <td style="padding:6px;border:1px solid #333;text-align:right">R$ ${r.valorCobrado.toFixed(2)}</td>
        <td style="padding:6px;border:1px solid #333;text-align:right">R$ ${r.valorEsperado.toFixed(2)}</td>
        <td style="padding:6px;border:1px solid #333;text-align:right">${r.diferenca > 0 ? "+" : ""}${r.diferenca.toFixed(2)}</td>
        <td style="padding:6px;border:1px solid #333">${statusLabel(r.status)}</td>
      </tr>`
    ).join("");
    const html = `<html><head><title>Conferencia Fornecedor</title><style>body{font-family:sans-serif;background:#111;color:#eee}table{border-collapse:collapse;width:100%}th{background:#1a3a3a;padding:8px;border:1px solid #333;text-align:left}</style></head><body>
      <h2>Relatorio Conferencia Fornecedor</h2>
      <p>Total Cobrado: R$ ${totalCobrado.toFixed(2)} | Total Esperado: R$ ${totalEsperado.toFixed(2)} | Diferenca: R$ ${(totalCobrado - totalEsperado).toFixed(2)}</p>
      <table><tr><th>ICCID</th><th>Valor Cobrado</th><th>Valor Esperado</th><th>Diferenca</th><th>Status</th></tr>${rows}</table></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const statusLabel = (s: LinhaConferencia["status"]) => {
    switch (s) {
      case "ok": return "OK";
      case "divergente": return "Divergente";
      case "nao_cadastrada": return "Nao Cadastrada";
      case "faltando_cobranca": return "Faltando na Cobranca";
    }
  };

  const statusBadge = (s: LinhaConferencia["status"]) => {
    switch (s) {
      case "ok": return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">OK</Badge>;
      case "divergente": return <Badge variant="destructive">Divergente</Badge>;
      case "nao_cadastrada": return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">Nao Cadastrada</Badge>;
      case "faltando_cobranca": return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">Faltando na Cobranca</Badge>;
    }
  };

  const totalCobrado = resultado.reduce((a, r) => a + r.valorCobrado, 0);
  const totalEsperado = resultado.reduce((a, r) => a + r.valorEsperado, 0);
  const qtdOk = resultado.filter(r => r.status === "ok").length;
  const qtdDivergente = resultado.filter(r => r.status === "divergente").length;
  const qtdNaoCadastrada = resultado.filter(r => r.status === "nao_cadastrada").length;
  const qtdFaltando = resultado.filter(r => r.status === "faltando_cobranca").length;

  return (
    <div className="space-y-6">
      <Card className="p-6 card-shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Upload de Planilha do Fornecedor</h3>
            <p className="text-sm text-muted-foreground">
              Envie um arquivo CSV ou XLSX com colunas: ICCID e Valor. Valores duplicados por ICCID serao somados automaticamente.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={gerarTemplate}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Template CSV
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Importar CSV/XLSX
            </Button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleUpload} />
        </div>
        {nomeArquivo && <p className="mt-3 text-sm text-muted-foreground">Arquivo: <span className="font-mono">{nomeArquivo}</span></p>}
      </Card>

      {resultado.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <StatCard label="Total Cobrado" value={`R$ ${totalCobrado.toFixed(2)}`} icon={FileSpreadsheet} accent="primary" />
            <StatCard label="Total Esperado" value={`R$ ${totalEsperado.toFixed(2)}`} icon={CheckCircle} accent="success" />
            <StatCard label="Diferenca" value={`R$ ${(totalCobrado - totalEsperado).toFixed(2)}`} icon={AlertTriangle} accent={Math.abs(totalCobrado - totalEsperado) > 0.01 ? "warning" : "success"} />
            <StatCard label="OK" value={qtdOk} icon={CheckCircle} accent="success" />
            <StatCard label="Divergentes" value={qtdDivergente} icon={XCircle} accent="destructive" />
            <StatCard label="Alertas" value={qtdNaoCadastrada + qtdFaltando} icon={HelpCircle} accent="warning" />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportarCSV}><Download className="w-4 h-4 mr-2" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={exportarExcel}><Download className="w-4 h-4 mr-2" /> Excel</Button>
            <Button variant="outline" size="sm" onClick={exportarPDF}><Download className="w-4 h-4 mr-2" /> PDF</Button>
          </div>

          <Card className="card-shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ICCID</TableHead>
                  <TableHead className="text-right">Valor Cobrado</TableHead>
                  <TableHead className="text-right">Valor Esperado</TableHead>
                  <TableHead className="text-right">Diferenca</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.map((r, i) => (
                  <TableRow
                    key={i}
                    className={
                      r.status === "divergente" || r.status === "nao_cadastrada"
                        ? "bg-destructive/10"
                        : r.status === "faltando_cobranca"
                        ? "bg-yellow-500/5"
                        : ""
                    }
                  >
                    <TableCell className="font-mono text-sm">{r.iccid}</TableCell>
                    <TableCell className="text-right font-mono">
                      {r.valorCobrado > 0 ? `R$ ${r.valorCobrado.toFixed(2)}` : <span className="text-muted-foreground">--</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.valorEsperado > 0 ? `R$ ${r.valorEsperado.toFixed(2)}` : <span className="text-muted-foreground">--</span>}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${
                      r.status === "ok" ? "text-emerald-400" : "text-destructive"
                    }`}>
                      {r.diferenca > 0 ? "+" : ""}{r.diferenca.toFixed(2)}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
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
          <p className="text-muted-foreground">Importe um CSV ou XLSX do fornecedor para iniciar a conferencia</p>
        </Card>
      )}
    </div>
  );
};

export default ConferenciaFornecedorTab;
