import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLinhasSIM, useInsertLinhaSIM, useClientes } from "@/hooks/useSupabaseData";
import type { DbLinhaSIM } from "@/types/database";
import { Plus, Settings, Wifi, WifiOff, Upload, Download } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";

const fornecedores = ["SmartSim", "Linkfield", "Arqia", "Alcon"];

const LinhasSIM = () => {
  const { data: linhas = [], isLoading } = useLinhasSIM();
  const { data: clientes = [] } = useClientes();
  const insertLinha = useInsertLinhaSIM();

  const [filtro, setFiltro] = useState<"all" | "online" | "offline">("all");
  const [filtroCliente, setFiltroCliente] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ iccid: "", operadora: "Vivo", numero: "", empresa_id: "", veiculo: "", fornecedor: "SmartSim" });

  const filtrado = linhas.filter(l => {
    if (filtro !== "all" && l.status !== filtro) return false;
    if (filtroCliente !== "all" && l.empresa_id !== filtroCliente) return false;
    return true;
  });
  const online = linhas.filter(l => l.status === "online").length;
  const offline = linhas.filter(l => l.status === "offline").length;

  const salvar = async () => {
    if (!form.iccid || !form.empresa_id) { toast.error("Preencha ICCID e empresa"); return; }
    const empresa = clientes.find(c => c.id === form.empresa_id);
    try {
      await insertLinha.mutateAsync({
        ...form,
        status: "offline",
        empresa_nome: empresa?.nome || "",
        ultima_conexao: "Nunca",
      });
      setModalOpen(false);
      setForm({ iccid: "", operadora: "Vivo", numero: "", empresa_id: "", veiculo: "", fornecedor: "SmartSim" });
      toast.success("Linha SIM adicionada!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const baixarTemplate = () => {
    const csv = "iccid;operadora;numero;fornecedor;empresa_id;veiculo";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template-linhas-sim.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.info("Template CSV baixado!");
  };

  const importarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/);
        if (cols.length < 3) continue;
        const empresa = clientes.find(c => c.id === cols[4]?.trim());
        try {
          await insertLinha.mutateAsync({
            iccid: cols[0]?.trim() || "",
            operadora: cols[1]?.trim() || "Vivo",
            numero: cols[2]?.trim() || "",
            fornecedor: cols[3]?.trim() || "SmartSim",
            empresa_id: cols[4]?.trim() || "",
            empresa_nome: empresa?.nome || "",
            veiculo: cols[5]?.trim() || "",
            status: "offline",
            ultima_conexao: "Nunca",
          });
          count++;
        } catch { /* skip */ }
      }
      toast.success(`${count} linhas importadas!`);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Linhas SIM" subtitle="Status das linhas por empresa, ICCID e fornecedor">
        <Button variant="outline" onClick={baixarTemplate}><Download className="w-4 h-4 mr-2" /> Template</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar</Button>
        <Button variant="outline" onClick={() => setApiOpen(true)}><Settings className="w-4 h-4 mr-2" /> API</Button>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Linha</Button>
      </PageHeader>
      <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={importarCSV} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Linhas" value={linhas.length} icon={Wifi} accent="primary" />
        <StatCard label="Online" value={online} icon={Wifi} accent="success" />
        <StatCard label="Offline" value={offline} icon={WifiOff} accent="destructive" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "online", "offline"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {f === "all" ? "Todas" : f === "online" ? "Online" : "Offline"}
          </button>
        ))}
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Filtrar cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Clientes</SelectItem>
            {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ICCID</TableHead>
              <TableHead>Operadora</TableHead>
              <TableHead>Numero</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Veiculo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ultima Conexao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-sm">{l.iccid}</TableCell>
                <TableCell>{l.operadora}</TableCell>
                <TableCell>{l.numero}</TableCell>
                <TableCell><Badge variant="outline">{l.fornecedor || "--"}</Badge></TableCell>
                <TableCell>{l.empresa_nome}</TableCell>
                <TableCell className="font-medium">{l.veiculo}</TableCell>
                <TableCell>
                  <Badge variant={l.status === "online" ? "default" : "secondary"}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 inline-block ${l.status === "online" ? "bg-success" : "bg-destructive"}`} />
                    {l.status === "online" ? "Online" : "Offline"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{l.ultima_conexao}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Nova Linha */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Linha SIM</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>ICCID</Label><Input value={form.iccid} onChange={e => setForm(f => ({ ...f, iccid: e.target.value }))} placeholder="89550312345678900XX" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Operadora</Label>
                <Select value={form.operadora} onValueChange={v => setForm(f => ({ ...f, operadora: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vivo">Vivo</SelectItem>
                    <SelectItem value="Claro">Claro</SelectItem>
                    <SelectItem value="Tim">Tim</SelectItem>
                    <SelectItem value="Oi">Oi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Empresa Fornecedora</Label>
                <Select value={form.fornecedor} onValueChange={v => setForm(f => ({ ...f, fornecedor: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{fornecedores.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Numero</Label><Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} /></div>
            <div><Label>Cliente B2B</Label>
              <Select value={form.empresa_id} onValueChange={v => setForm(f => ({ ...f, empresa_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Veiculo (Placa)</Label><Input value={form.veiculo} onChange={e => setForm(f => ({ ...f, veiculo: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal API */}
      <Dialog open={apiOpen} onOpenChange={setApiOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Painel de Integracao API</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Configure a conexao com o sistema externo de gerenciamento de linhas SIM.</p>
          <div className="space-y-4">
            <div><Label>URL da API</Label><Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.operadora.com.br/v1" /></div>
            <div><Label>Chave de API</Label><Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Configuracao salva!"); setApiOpen(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinhasSIM;
