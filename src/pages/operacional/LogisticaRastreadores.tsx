import { useState } from "react";
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
import { Package, Truck, CheckCircle, Clock, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  preparando: "Preparando",
  postado: "Postado",
  em_transito: "Em Transito",
  entregue: "Entregue",
  devolvido: "Devolvido",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  preparando: "outline",
  postado: "secondary",
  em_transito: "secondary",
  entregue: "default",
  devolvido: "destructive",
};

const LogisticaRastreadores = () => {
  const [despachos, setDespachos] = useState(despachosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [form, setForm] = useState({ rastreadorModelo: "J16 4G", serial: "", imei: "", destinatario: "", enderecoDestino: "", cidadeDestino: "", codigoRastreio: "", unidadeDestino: "", observacoes: "" });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logistica de Rastreadores</h1>
          <p className="text-muted-foreground text-sm">Controle de despacho e entrega de dispositivos</p>
        </div>
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
              <TableHead>Serial</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Codigo Rastreio</TableHead>
              <TableHead>Data Envio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acoes</TableHead>
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
    </div>
  );
};

export default LogisticaRastreadores;
