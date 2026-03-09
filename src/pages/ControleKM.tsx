import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { controleKMIniciais, ControleKM, tecnicosIniciais } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Plus, MapPin, Route } from "lucide-react";
import { toast } from "sonner";

const ControleKMPage = () => {
  const [registros, setRegistros] = useState(controleKMIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroTecnico, setFiltroTecnico] = useState("all");
  const [filtroData, setFiltroData] = useState("");
  const [form, setForm] = useState({ tecnicoId: "", enderecoInstalacao: "", horario: "", data: "", kmCalculado: 0 });

  const filtrado = registros.filter(r => {
    if (filtroTecnico !== "all" && r.tecnicoId !== filtroTecnico) return false;
    if (filtroData && r.data !== filtroData) return false;
    return true;
  });

  // Totalização por técnico/dia
  const totais = filtrado.reduce((acc, r) => {
    const key = `${r.tecnicoNome} - ${r.data}`;
    acc[key] = (acc[key] || 0) + r.kmCalculado;
    return acc;
  }, {} as Record<string, number>);

  const totalKm = filtrado.reduce((a, r) => a + r.kmCalculado, 0);
  const tecnicosUnicos = [...new Set(filtrado.map(r => r.tecnicoNome))].length;

  const salvar = () => {
    if (!form.tecnicoId || !form.enderecoInstalacao) { toast.error("Preencha técnico e endereço"); return; }
    const tec = tecnicosIniciais.find(t => t.id === form.tecnicoId);
    const novo: ControleKM = { id: `KM-${Date.now()}`, tecnicoNome: tec?.nome || "", ...form, data: form.data || new Date().toISOString().split("T")[0] };
    setRegistros(prev => [...prev, novo]);
    setModalOpen(false);
    setForm({ tecnicoId: "", enderecoInstalacao: "", horario: "", data: "", kmCalculado: 0 });
    toast.success("KM registrado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle de KM</h1>
          <p className="text-muted-foreground text-sm">Quilometragem por técnico e instalação</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Registro</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total KM" value={`${totalKm} km`} icon={Route} accent="primary" />
        <StatCard label="Registros" value={filtrado.length} icon={MapPin} />
        <StatCard label="Técnicos" value={tecnicosUnicos} icon={MapPin} accent="success" />
      </div>

      <Card className="card-shadow">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Técnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Técnicos</SelectItem>
              {tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-[160px]" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Técnico</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>KM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.tecnicoNome}</TableCell>
                <TableCell className="text-sm">{r.enderecoInstalacao}</TableCell>
                <TableCell>{r.horario}</TableCell>
                <TableCell>{r.data}</TableCell>
                <TableCell><Badge variant="secondary">{r.kmCalculado} km</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Totalização */}
      {Object.keys(totais).length > 0 && (
        <Card className="p-6 card-shadow">
          <h3 className="font-semibold mb-4">Totalização por Técnico / Dia</h3>
          <div className="space-y-2">
            {Object.entries(totais).map(([key, km]) => (
              <div key={key} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="font-medium text-sm">{key}</span>
                <Badge>{km} km</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar KM</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Técnico</Label>
              <Select value={form.tecnicoId} onValueChange={v => setForm(f => ({ ...f, tecnicoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Horário</Label><Input value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} placeholder="09:00" /></div>
            <div className="col-span-2"><Label>Endereço da Instalação</Label><Input value={form.enderecoInstalacao} onChange={e => setForm(f => ({ ...f, enderecoInstalacao: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div><Label>KM Calculado</Label><Input type="number" value={form.kmCalculado} onChange={e => setForm(f => ({ ...f, kmCalculado: +e.target.value }))} /></div>
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

export default ControleKMPage;
