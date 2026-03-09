import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { despachosIniciais, DespachoRastreador } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Package, Truck, CheckCircle, Clock, Plus, Search, Upload, Download, FileSpreadsheet, History } from "lucide-react";
import { toast } from "sonner";

// ===== Types =====
interface RastreadorImport {
  id: string;
  imei: string;
  simNumber: string;
  modelo: string;
  usuarioDestino: string;
  dataCadastro: string;
}

interface HistoricoImport {
  id: string;
  data: string;
  quantidade: number;
  arquivo: string;
}

// ===== Despachos Tab (existing) =====
const statusLabels: Record<string, string> = { preparando: "Preparando", postado: "Postado", em_transito: "Em Transito", entregue: "Entregue", devolvido: "Devolvido" };
const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = { preparando: "outline", postado: "secondary", em_transito: "secondary", entregue: "default", devolvido: "destructive" };

const LogisticaRastreadores = () => {
  // === Despachos state ===
  const [despachos, setDespachos] = useState(despachosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [form, setForm] = useState({ rastreadorModelo: "J16 4G", serial: "", imei: "", destinatario: "", enderecoDestino: "", cidadeDestino: "", codigoRastreio: "", unidadeDestino: "", observacoes: "" });

  // === Import state ===
  const [rastreadores, setRastreadores] = useState<RastreadorImport[]>([]);
  const [importModal, setImportModal] = useState(false);
  const [importForm, setImportForm] = useState({ imei: "", simNumber: "", modelo: "J16 4G Arqia", usuarioDestino: "" });
  const [historico, setHistorico] = useState<HistoricoImport[]>([
    { id: "IMP-001", data: "2024-03-05", quantidade: 15, arquivo: "lote-sp-marco.csv" },
    { id: "IMP-002", data: "2024-03-07", quantidade: 8, arquivo: "lote-rj-marco.csv" },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  // === Despachos logic ===
  const filtrados = despachos.filter(d =>
    d.serial.toLowerCase().includes(filtro.toLowerCase()) ||
    d.destinatario.toLowerCase().includes(filtro.toLowerCase()) ||
    d.codigoRastreio.toLowerCase().includes(filtro.toLowerCase())
  );

  const salvar = () => {
    if (!form.serial || !form.destinatario) { toast.error("Preencha serial e destinatario"); return; }
    const novo: DespachoRastreador = { ...form, id: `DSP-${Date.now()}`, dataEnvio: new Date().toISOString().split("T")[0], statusEntrega: "preparando" };
    setDespachos(prev => [...prev, novo]);
    setModalOpen(false);
    setForm({ rastreadorModelo: "J16 4G", serial: "", imei: "", destinatario: "", enderecoDestino: "", cidadeDestino: "", codigoRastreio: "", unidadeDestino: "", observacoes: "" });
    toast.success("Despacho registrado!");
  };

  const atualizarStatus = (id: string, status: DespachoRastreador["statusEntrega"]) => {
    setDespachos(prev => prev.map(d => d.id === id ? { ...d, statusEntrega: status } : d));
    toast.success("Status atualizado!");
  };

  const entregues = despachos.filter(d => d.statusEntrega === "entregue").length;
  const emTransito = despachos.filter(d => d.statusEntrega === "em_transito" || d.statusEntrega === "postado").length;
  const preparando = despachos.filter(d => d.statusEntrega === "preparando").length;

  // === Import logic ===
  const salvarRastreador = () => {
    if (!importForm.imei || !importForm.usuarioDestino) { toast.error("Preencha IMEI e usuario destino"); return; }
    const novo: RastreadorImport = { ...importForm, id: `RAT-${Date.now()}`, dataCadastro: new Date().toISOString().split("T")[0] };
    setRastreadores(prev => [...prev, novo]);
    setImportModal(false);
    setImportForm({ imei: "", simNumber: "", modelo: "J16 4G Arqia", usuarioDestino: "" });
    toast.success("Rastreador cadastrado!");
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const novos: RastreadorImport[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/);
        if (cols.length < 4) continue;
        novos.push({
          id: `RAT-${Date.now()}-${i}`,
          imei: cols[0].trim(),
          simNumber: cols[1].trim(),
          modelo: cols[2].trim(),
          usuarioDestino: cols[3].trim(),
          dataCadastro: new Date().toISOString().split("T")[0],
        });
      }
      setRastreadores(prev => [...prev, ...novos]);
      setHistorico(prev => [...prev, { id: `IMP-${Date.now()}`, data: new Date().toISOString().split("T")[0], quantidade: novos.length, arquivo: file.name }]);
      toast.success(`${novos.length} rastreadores importados!`);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const gerarCSVPlataforma = () => {
    if (rastreadores.length === 0) { toast.error("Nenhum rastreador cadastrado"); return; }
    const headers = "name,imei,icon_id,users,timezone,sim_number,device_model,plate_number";
    const rows = rastreadores.map((r, i) => `Rastreador ${i + 1},${r.imei},1,${r.usuarioDestino},America/Sao_Paulo,${r.simNumber},${r.modelo},`);
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `importacao-plataforma-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV para plataforma gerado!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logistica de Rastreadores</h1>
        <p className="text-muted-foreground text-sm">Controle de despacho, entrega e importacao de dispositivos</p>
      </div>

      <Tabs defaultValue="despachos" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="despachos">Despachos</TabsTrigger>
          <TabsTrigger value="importacao">Importacao em Massa</TabsTrigger>
          <TabsTrigger value="historico">Historico Importacoes</TabsTrigger>
        </TabsList>

        {/* === DESPACHOS TAB === */}
        <TabsContent value="despachos">
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Despacho</Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Despachos" value={despachos.length} icon={Package} accent="primary" />
              <StatCard label="Em Transito" value={emTransito} icon={Truck} accent="warning" />
              <StatCard label="Entregues" value={entregues} icon={CheckCircle} accent="success" />
              <StatCard label="Preparando" value={preparando} icon={Clock} accent="muted" />
            </div>
            <Card className="p-4 card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por serial, destinatario ou rastreio..." value={filtro} onChange={e => setFiltro(e.target.value)} className="max-w-sm" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead><TableHead>Modelo</TableHead><TableHead>Destinatario</TableHead>
                    <TableHead>Unidade</TableHead><TableHead>Codigo Rastreio</TableHead><TableHead>Data Envio</TableHead>
                    <TableHead>Status</TableHead><TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.serial}</TableCell>
                      <TableCell>{d.rastreadorModelo}</TableCell>
                      <TableCell>{d.destinatario}</TableCell>
                      <TableCell className="text-sm">{d.unidadeDestino}</TableCell>
                      <TableCell className="font-mono text-sm">{d.codigoRastreio}</TableCell>
                      <TableCell>{d.dataEnvio}</TableCell>
                      <TableCell><Badge variant={statusVariants[d.statusEntrega]}>{statusLabels[d.statusEntrega]}</Badge></TableCell>
                      <TableCell>
                        {d.statusEntrega === "preparando" && <Button size="sm" variant="outline" onClick={() => atualizarStatus(d.id, "postado")}>Postar</Button>}
                        {d.statusEntrega === "postado" && <Button size="sm" variant="outline" onClick={() => atualizarStatus(d.id, "em_transito")}>Em Transito</Button>}
                        {d.statusEntrega === "em_transito" && <Button size="sm" onClick={() => atualizarStatus(d.id, "entregue")}>Entregue</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        {/* === IMPORTACAO EM MASSA TAB === */}
        <TabsContent value="importacao">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Importar CSV
                </Button>
                <Button variant="outline" onClick={gerarCSVPlataforma} disabled={rastreadores.length === 0}>
                  <Download className="w-4 h-4 mr-2" /> Gerar CSV Plataforma
                </Button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVUpload} />
              </div>
              <Button onClick={() => setImportModal(true)}><Plus className="w-4 h-4 mr-2" /> Cadastro Individual</Button>
            </div>

            <Card className="p-4 card-shadow">
              <p className="text-xs text-muted-foreground mb-3">
                CSV de entrada: IMEI;SIM;Modelo;UsuarioDestino (uma linha por dispositivo, com cabecalho)
              </p>
              {rastreadores.length === 0 ? (
                <div className="py-12 text-center">
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum rastreador cadastrado. Use o formulario ou importe um CSV.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead><TableHead>SIM</TableHead><TableHead>Modelo</TableHead>
                      <TableHead>Usuario Destino</TableHead><TableHead>Data Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rastreadores.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.imei}</TableCell>
                        <TableCell className="font-mono text-sm">{r.simNumber}</TableCell>
                        <TableCell>{r.modelo}</TableCell>
                        <TableCell>{r.usuarioDestino}</TableCell>
                        <TableCell>{r.dataCadastro}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* === HISTORICO TAB === */}
        <TabsContent value="historico">
          <Card className="card-shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead><TableHead>Data</TableHead><TableHead>Quantidade</TableHead><TableHead>Arquivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-sm">{h.id}</TableCell>
                    <TableCell>{h.data}</TableCell>
                    <TableCell><Badge variant="secondary">{h.quantidade} dispositivos</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{h.arquivo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Novo Despacho */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Despacho</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Modelo</Label>
              <Select value={form.rastreadorModelo} onValueChange={v => setForm(f => ({ ...f, rastreadorModelo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="J16 4G">J16 4G</SelectItem>
                  <SelectItem value="ST4955">ST4955</SelectItem>
                  <SelectItem value="GV300">GV300</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Serial</Label><Input value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))} /></div>
            <div><Label>IMEI</Label><Input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>Destinatario</Label><Input value={form.destinatario} onChange={e => setForm(f => ({ ...f, destinatario: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Endereco Destino</Label><Input value={form.enderecoDestino} onChange={e => setForm(f => ({ ...f, enderecoDestino: e.target.value }))} /></div>
            <div><Label>Cidade</Label><Input value={form.cidadeDestino} onChange={e => setForm(f => ({ ...f, cidadeDestino: e.target.value }))} /></div>
            <div><Label>Unidade Destino</Label><Input value={form.unidadeDestino} onChange={e => setForm(f => ({ ...f, unidadeDestino: e.target.value }))} /></div>
            <div><Label>Codigo Rastreio</Label><Input value={form.codigoRastreio} onChange={e => setForm(f => ({ ...f, codigoRastreio: e.target.value }))} /></div>
            <div><Label>Observacoes</Label><Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cadastro Individual */}
      <Dialog open={importModal} onOpenChange={setImportModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastro Individual de Rastreador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>IMEI</Label><Input value={importForm.imei} onChange={e => setImportForm(f => ({ ...f, imei: e.target.value }))} placeholder="351756051530001" /></div>
            <div><Label>Numero SIM</Label><Input value={importForm.simNumber} onChange={e => setImportForm(f => ({ ...f, simNumber: e.target.value }))} placeholder="8955031234567890001" /></div>
            <div><Label>Modelo Dispositivo</Label>
              <Select value={importForm.modelo} onValueChange={v => setImportForm(f => ({ ...f, modelo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="J16 4G Arqia">J16 4G Arqia</SelectItem>
                  <SelectItem value="ST4955 Suntech">ST4955 Suntech</SelectItem>
                  <SelectItem value="GV300 Queclink">GV300 Queclink</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Usuario Destino (email)</Label><Input value={importForm.usuarioDestino} onChange={e => setImportForm(f => ({ ...f, usuarioDestino: e.target.value }))} placeholder="usuario@empresa.com" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModal(false)}>Cancelar</Button>
            <Button onClick={salvarRastreador}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogisticaRastreadores;
