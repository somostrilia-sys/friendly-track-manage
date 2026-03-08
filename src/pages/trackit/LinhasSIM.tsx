import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { linhasSIMIniciais, clientesIniciais, LinhaSIM } from "@/data/mock-data";
import { Plus, Settings, Wifi, WifiOff } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";

const LinhasSIM = () => {
  const [linhas, setLinhas] = useState(linhasSIMIniciais);
  const [filtro, setFiltro] = useState<"all" | "online" | "offline">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const [form, setForm] = useState({ iccid: "", operadora: "Vivo", numero: "", empresaId: "", veiculo: "" });

  const filtrado = filtro === "all" ? linhas : linhas.filter(l => l.status === filtro);
  const online = linhas.filter(l => l.status === "online").length;
  const offline = linhas.filter(l => l.status === "offline").length;

  const salvar = () => {
    if (!form.iccid || !form.empresaId) { toast.error("Preencha ICCID e empresa"); return; }
    const empresa = clientesIniciais.find(c => c.id === form.empresaId);
    const nova: LinhaSIM = {
      id: Date.now().toString(), ...form,
      status: "offline", empresaNome: empresa?.nome || "", ultimaConexao: "Nunca",
    };
    setLinhas(prev => [...prev, nova]);
    setModalOpen(false);
    setForm({ iccid: "", operadora: "Vivo", numero: "", empresaId: "", veiculo: "" });
    toast.success("Linha SIM adicionada!");
  };

  const salvarApi = () => {
    toast.success("Configuração de API salva com sucesso!");
    setApiOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Linhas SIM</h1>
          <p className="text-muted-foreground text-sm">Status das linhas por empresa e ICCID</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setApiOpen(true)}><Settings className="w-4 h-4 mr-2" /> Integração API</Button>
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Linha</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Linhas" value={linhas.length} icon={Wifi} accent="primary" />
        <StatCard label="Online" value={online} icon={Wifi} accent="success" />
        <StatCard label="Offline" value={offline} icon={WifiOff} accent="destructive" />
      </div>

      <div className="flex gap-2">
        {(["all", "online", "offline"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
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
                    <span className={`w-2 h-2 rounded-full mr-1.5 inline-block ${l.status === "online" ? "bg-success" : "bg-destructive"}`} />
                    {l.status === "online" ? "Online" : "Offline"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{l.ultimaConexao}</TableCell>
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
            <div><Label>Número</Label><Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} /></div>
            <div><Label>Empresa</Label>
              <Select value={form.empresaId} onValueChange={v => setForm(f => ({ ...f, empresaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientesIniciais.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Veículo (Placa)</Label><Input value={form.veiculo} onChange={e => setForm(f => ({ ...f, veiculo: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Integração API */}
      <Dialog open={apiOpen} onOpenChange={setApiOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Painel de Integração API</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Configure a conexão com o sistema externo de gerenciamento de linhas SIM.</p>
          <div className="space-y-4">
            <div><Label>URL da API</Label><Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.operadora.com.br/v1" /></div>
            <div><Label>Chave de API</Label><Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiOpen(false)}>Cancelar</Button>
            <Button onClick={salvarApi}>Salvar Configuração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinhasSIM;
