import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { instalacoesIniciais, Instalacao, tecnicosIniciais } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Plus, ClipboardCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  aguardando: { label: "Aguardando", variant: "outline" },
  em_andamento: { label: "Em Andamento", variant: "secondary" },
  concluida: { label: "Concluída", variant: "default" },
  problema: { label: "Problema", variant: "destructive" },
};

const AcompanhamentoInstalacoes = () => {
  const [instalacoes, setInstalacoes] = useState(instalacoesIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [filtroTecnico, setFiltroTecnico] = useState("all");
  const [filtroData, setFiltroData] = useState("");
  const [form, setForm] = useState({ placa: "", imei: "", chip: "", filial: "", tecnicoId: "", data: "" });

  const filtrado = instalacoes.filter(i => {
    if (filtroStatus !== "all" && i.status !== filtroStatus) return false;
    if (filtroTecnico !== "all" && i.tecnicoId !== filtroTecnico) return false;
    if (filtroData && i.data !== filtroData) return false;
    return true;
  });

  const concluir = (id: string) => {
    const loc = prompt("Localização de confirmação (lat, lng):");
    setInstalacoes(prev => prev.map(i => i.id === id ? { ...i, status: "concluida" as const, localizacaoConfirmacao: loc || undefined } : i));
    toast.success("Instalação concluída e registrada no relatório!");
  };

  const salvar = () => {
    if (!form.placa || !form.imei) { toast.error("Preencha placa e IMEI"); return; }
    const tec = tecnicosIniciais.find(t => t.id === form.tecnicoId);
    const novo: Instalacao = { id: `INST-${Date.now()}`, ...form, tecnicoNome: tec?.nome || "", status: "aguardando", data: form.data || new Date().toISOString().split("T")[0] };
    setInstalacoes(prev => [...prev, novo]);
    setModalOpen(false);
    setForm({ placa: "", imei: "", chip: "", filial: "", tecnicoId: "", data: "" });
    toast.success("Instalação registrada!");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Acompanhamento de Instalações" subtitle="Controle de instalações em campo">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Instalação</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aguardando" value={instalacoes.filter(i => i.status === "aguardando").length} icon={Clock} accent="warning" />
        <StatCard label="Em Andamento" value={instalacoes.filter(i => i.status === "em_andamento").length} icon={ClipboardCheck} accent="primary" />
        <StatCard label="Concluídas" value={instalacoes.filter(i => i.status === "concluida").length} icon={CheckCircle} accent="success" />
        <StatCard label="Problemas" value={instalacoes.filter(i => i.status === "problema").length} icon={AlertTriangle} accent="destructive" />
      </div>

      <Card className="card-shadow">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Técnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Técnicos</SelectItem>
              {tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-[160px]" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
          {(filtroStatus !== "all" || filtroTecnico !== "all" || filtroData) && (
            <Button variant="outline" size="sm" onClick={() => { setFiltroStatus("all"); setFiltroTecnico("all"); setFiltroData(""); }}>Limpar</Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>Chip</TableHead>
              <TableHead>Filial</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(i => (
              <TableRow key={i.id}>
                <TableCell className="font-medium font-mono">{i.placa}</TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">{i.imei}</TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">{i.chip}</TableCell>
                <TableCell>{i.filial}</TableCell>
                <TableCell>{i.tecnicoNome}</TableCell>
                <TableCell>{i.data}</TableCell>
                <TableCell><Badge variant={statusMap[i.status]?.variant}>{statusMap[i.status]?.label}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{i.localizacaoConfirmacao || "—"}</TableCell>
                <TableCell>
                  {i.status !== "concluida" && (
                    <Button size="sm" variant="outline" onClick={() => concluir(i.id)}>Concluir</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Instalação</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Placa</Label><Input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value }))} placeholder="ABC-1234" /></div>
            <div><Label>IMEI</Label><Input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>Chip (ICCID)</Label><Input value={form.chip} onChange={e => setForm(f => ({ ...f, chip: e.target.value }))} /></div>
            <div><Label>Filial</Label><Input value={form.filial} onChange={e => setForm(f => ({ ...f, filial: e.target.value }))} /></div>
            <div><Label>Técnico</Label>
              <Select value={form.tecnicoId} onValueChange={v => setForm(f => ({ ...f, tecnicoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
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

export default AcompanhamentoInstalacoes;
