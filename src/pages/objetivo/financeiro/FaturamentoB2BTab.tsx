import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/StatCard";
import { DollarSign, TrendingUp, TrendingDown, Plus, Download, Building2 } from "lucide-react";
import { toast } from "sonner";

export interface ClienteB2B {
  id: string;
  empresa: string;
  diaFechamento: number;
  mesAno: string;
  qtdPlacas: number;
  valorPlaca: number;
  totalPlataforma: number;
  qtdSmartSim: number;
  valorSmartSim: number;
  totalSmartSim: number;
  qtdLinkfield: number;
  valorLinkfield: number;
  totalLinkfield: number;
  qtdArqia: number;
  valorArqia: number;
  totalArqia: number;
  totalLinhas: number;
  totalGeral: number;
  status: "pendente" | "pago" | "atrasado";
  obs: string;
}

const calcTotais = (c: Omit<ClienteB2B, "totalPlataforma" | "totalSmartSim" | "totalLinkfield" | "totalArqia" | "totalLinhas" | "totalGeral">) => {
  const totalPlataforma = c.qtdPlacas * c.valorPlaca;
  const totalSmartSim = c.qtdSmartSim * c.valorSmartSim;
  const totalLinkfield = c.qtdLinkfield * c.valorLinkfield;
  const totalArqia = c.qtdArqia * c.valorArqia;
  const totalLinhas = totalSmartSim + totalLinkfield + totalArqia;
  const totalGeral = totalPlataforma + totalLinhas;
  return { totalPlataforma, totalSmartSim, totalLinkfield, totalArqia, totalLinhas, totalGeral };
};

const clientesB2BIniciais: ClienteB2B[] = [
  { id: "B2B-001", empresa: "Transportadora Rapida Ltda", diaFechamento: 10, mesAno: "03/2024", qtdPlacas: 45, valorPlaca: 29.90, ...(() => { const t = calcTotais({ id: "", empresa: "", diaFechamento: 0, mesAno: "", qtdPlacas: 45, valorPlaca: 29.90, qtdSmartSim: 20, valorSmartSim: 15, qtdLinkfield: 15, valorLinkfield: 18, qtdArqia: 10, valorArqia: 22, status: "pendente", obs: "" }); return t; })(), qtdSmartSim: 20, valorSmartSim: 15, qtdLinkfield: 15, valorLinkfield: 18, qtdArqia: 10, valorArqia: 22, status: "pendente", obs: "" },
  { id: "B2B-002", empresa: "LogBrasil Transportes", diaFechamento: 15, mesAno: "03/2024", qtdPlacas: 32, valorPlaca: 29.90, ...(() => { const t = calcTotais({ id: "", empresa: "", diaFechamento: 0, mesAno: "", qtdPlacas: 32, valorPlaca: 29.90, qtdSmartSim: 10, valorSmartSim: 15, qtdLinkfield: 12, valorLinkfield: 18, qtdArqia: 10, valorArqia: 22, status: "pago", obs: "" }); return t; })(), qtdSmartSim: 10, valorSmartSim: 15, qtdLinkfield: 12, valorLinkfield: 18, qtdArqia: 10, valorArqia: 22, status: "pago", obs: "Pago via boleto" },
  { id: "B2B-003", empresa: "Assoc. Caminhoneiros do Sul", diaFechamento: 5, mesAno: "03/2024", qtdPlacas: 120, valorPlaca: 24.90, ...(() => { const t = calcTotais({ id: "", empresa: "", diaFechamento: 0, mesAno: "", qtdPlacas: 120, valorPlaca: 24.90, qtdSmartSim: 50, valorSmartSim: 15, qtdLinkfield: 40, valorLinkfield: 18, qtdArqia: 30, valorArqia: 22, status: "atrasado", obs: "" }); return t; })(), qtdSmartSim: 50, valorSmartSim: 15, qtdLinkfield: 40, valorLinkfield: 18, qtdArqia: 30, valorArqia: 22, status: "atrasado", obs: "Cobranca enviada 2x" },
];

const mesAnterior: Record<string, number> = {
  "B2B-001": 2580,
  "B2B-002": 1550,
  "B2B-003": 5200,
};

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  atrasado: { label: "Atrasado", variant: "destructive" },
};

const meses = ["01/2024", "02/2024", "03/2024", "04/2024", "05/2024", "06/2024", "07/2024", "08/2024", "09/2024", "10/2024", "11/2024", "12/2024"];

const FaturamentoB2BTab = () => {
  const [clientes, setClientes] = useState(clientesB2BIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroMes, setFiltroMes] = useState("03/2024");
  const [form, setForm] = useState({
    empresa: "", diaFechamento: 10, qtdPlacas: 0, valorPlaca: 29.90,
    qtdSmartSim: 0, valorSmartSim: 15, qtdLinkfield: 0, valorLinkfield: 18,
    qtdArqia: 0, valorArqia: 22, obs: "",
  });

  const filtrados = clientes.filter(c => c.mesAno === filtroMes);

  const totais = useMemo(() => ({
    plataforma: filtrados.reduce((a, c) => a + c.totalPlataforma, 0),
    linhas: filtrados.reduce((a, c) => a + c.totalLinhas, 0),
    geral: filtrados.reduce((a, c) => a + c.totalGeral, 0),
  }), [filtrados]);

  const salvar = () => {
    if (!form.empresa) { toast.error("Preencha o nome da empresa"); return; }
    const totaisCalc = calcTotais({ ...form, id: "", mesAno: "", status: "pendente" });
    const novo: ClienteB2B = {
      ...form, ...totaisCalc,
      id: `B2B-${String(clientes.length + 1).padStart(3, "0")}`,
      mesAno: filtroMes, status: "pendente",
    };
    setClientes(prev => [...prev, novo]);
    setModalOpen(false);
    setForm({ empresa: "", diaFechamento: 10, qtdPlacas: 0, valorPlaca: 29.90, qtdSmartSim: 0, valorSmartSim: 15, qtdLinkfield: 0, valorLinkfield: 18, qtdArqia: 0, valorArqia: 22, obs: "" });
    toast.success("Cliente B2B adicionado!");
  };

  const exportarCSV = () => {
    const headers = ["Empresa", "Dia Fech.", "Placas", "Vlr Placa", "Total Plataforma", "SmartSim", "Linkfield", "Arqia", "Total Linhas", "Total Geral", "Status", "OBS"];
    const rows = filtrados.map(c => [c.empresa, c.diaFechamento, c.qtdPlacas, c.valorPlaca, c.totalPlataforma.toFixed(2), c.qtdSmartSim, c.qtdLinkfield, c.qtdArqia, c.totalLinhas.toFixed(2), c.totalGeral.toFixed(2), c.status, c.obs]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `faturamento-b2b-${filtroMes.replace("/", "-")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const atualizarStatus = (id: string, status: ClienteB2B["status"]) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    toast.success("Status atualizado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Label className="text-sm">Periodo:</Label>
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarCSV}><Download className="w-4 h-4 mr-2" /> Exportar CSV</Button>
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Plataforma" value={`R$ ${totais.plataforma.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={Building2} accent="primary" />
        <StatCard label="Total Linhas" value={`R$ ${totais.linhas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} accent="warning" />
        <StatCard label="Total Geral" value={`R$ ${totais.geral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} accent="success" />
      </div>

      <Card className="card-shadow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-center">Fech.</TableHead>
              <TableHead className="text-center">Placas</TableHead>
              <TableHead className="text-right">Tot. Plataforma</TableHead>
              <TableHead className="text-center">SmartSim</TableHead>
              <TableHead className="text-center">Linkfield</TableHead>
              <TableHead className="text-center">Arqia</TableHead>
              <TableHead className="text-right">Tot. Linhas</TableHead>
              <TableHead className="text-right">Total Geral</TableHead>
              <TableHead className="text-center">Var.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map(c => {
              const anterior = mesAnterior[c.id] || 0;
              const diff = anterior > 0 ? c.totalGeral - anterior : 0;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.empresa}</TableCell>
                  <TableCell className="text-center">Dia {c.diaFechamento}</TableCell>
                  <TableCell className="text-center">{c.qtdPlacas}</TableCell>
                  <TableCell className="text-right">R$ {c.totalPlataforma.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{c.qtdSmartSim}</TableCell>
                  <TableCell className="text-center">{c.qtdLinkfield}</TableCell>
                  <TableCell className="text-center">{c.qtdArqia}</TableCell>
                  <TableCell className="text-right">R$ {c.totalLinhas.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">R$ {c.totalGeral.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    {diff > 0 ? <span className="text-green-500 flex items-center justify-center gap-0.5"><TrendingUp className="w-3 h-3" />+{diff.toFixed(0)}</span> :
                     diff < 0 ? <span className="text-red-500 flex items-center justify-center gap-0.5"><TrendingDown className="w-3 h-3" />{diff.toFixed(0)}</span> :
                     <span className="text-muted-foreground">--</span>}
                  </TableCell>
                  <TableCell><Badge variant={statusBadge[c.status].variant}>{statusBadge[c.status].label}</Badge></TableCell>
                  <TableCell>
                    <Select onValueChange={v => atualizarStatus(c.id, v as ClienteB2B["status"])}>
                      <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue placeholder="Alterar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-semibold">TOTAIS</TableCell>
              <TableCell className="text-right font-semibold">R$ {totais.plataforma.toFixed(2)}</TableCell>
              <TableCell colSpan={3} />
              <TableCell className="text-right font-semibold">R$ {totais.linhas.toFixed(2)}</TableCell>
              <TableCell className="text-right font-bold">R$ {totais.geral.toFixed(2)}</TableCell>
              <TableCell colSpan={3} />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo Cliente B2B</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Empresa</Label><Input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} /></div>
            <div><Label>Dia Fechamento</Label><Input type="number" min={1} max={31} value={form.diaFechamento} onChange={e => setForm(f => ({ ...f, diaFechamento: +e.target.value }))} /></div>
            <div />
            <div><Label>Qtd Placas</Label><Input type="number" value={form.qtdPlacas} onChange={e => setForm(f => ({ ...f, qtdPlacas: +e.target.value }))} /></div>
            <div><Label>Valor/Placa (R$)</Label><Input type="number" step="0.01" value={form.valorPlaca} onChange={e => setForm(f => ({ ...f, valorPlaca: +e.target.value }))} /></div>
            <div><Label>Qtd SmartSim</Label><Input type="number" value={form.qtdSmartSim} onChange={e => setForm(f => ({ ...f, qtdSmartSim: +e.target.value }))} /></div>
            <div><Label>Valor SmartSim (R$)</Label><Input type="number" step="0.01" value={form.valorSmartSim} onChange={e => setForm(f => ({ ...f, valorSmartSim: +e.target.value }))} /></div>
            <div><Label>Qtd Linkfield</Label><Input type="number" value={form.qtdLinkfield} onChange={e => setForm(f => ({ ...f, qtdLinkfield: +e.target.value }))} /></div>
            <div><Label>Valor Linkfield (R$)</Label><Input type="number" step="0.01" value={form.valorLinkfield} onChange={e => setForm(f => ({ ...f, valorLinkfield: +e.target.value }))} /></div>
            <div><Label>Qtd Arqia</Label><Input type="number" value={form.qtdArqia} onChange={e => setForm(f => ({ ...f, qtdArqia: +e.target.value }))} /></div>
            <div><Label>Valor Arqia (R$)</Label><Input type="number" step="0.01" value={form.valorArqia} onChange={e => setForm(f => ({ ...f, valorArqia: +e.target.value }))} /></div>
            <div className="col-span-2"><Label>Observacoes</Label><Textarea value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))} rows={2} /></div>
            {(form.qtdPlacas > 0 || form.qtdSmartSim > 0) && (
              <div className="col-span-2 p-3 rounded-lg bg-muted text-sm">
                <div className="flex justify-between"><span>Plataforma:</span><strong>R$ {(form.qtdPlacas * form.valorPlaca).toFixed(2)}</strong></div>
                <div className="flex justify-between"><span>Linhas:</span><strong>R$ {(form.qtdSmartSim * form.valorSmartSim + form.qtdLinkfield * form.valorLinkfield + form.qtdArqia * form.valorArqia).toFixed(2)}</strong></div>
                <div className="flex justify-between border-t border-border mt-2 pt-2"><span className="font-semibold">Total Geral:</span><strong>R$ {(form.qtdPlacas * form.valorPlaca + form.qtdSmartSim * form.valorSmartSim + form.qtdLinkfield * form.valorLinkfield + form.qtdArqia * form.valorArqia).toFixed(2)}</strong></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaturamentoB2BTab;
