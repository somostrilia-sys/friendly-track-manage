import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { servicosIniciais, tecnicosIniciais, clientesIniciais, ServicoAgendado } from "@/data/mock-data";
import { MapPin, Navigation, ExternalLink, Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; class: string }> = {
  agendado: { label: "Agendado", class: "bg-secondary text-secondary-foreground" },
  aceito: { label: "Aceito", class: "bg-primary text-primary-foreground" },
  em_deslocamento: { label: "Em Deslocamento", class: "bg-warning text-warning-foreground" },
  em_execucao: { label: "Em Execução", class: "bg-primary text-primary-foreground" },
  concluido: { label: "Concluído", class: "bg-success text-success-foreground" },
  cancelado: { label: "Cancelado", class: "bg-destructive text-destructive-foreground" },
};
const tipoMap: Record<string, string> = { instalacao: "Instalação", manutencao: "Manutenção", remocao: "Remoção", troca: "Troca" };

const Servicos = () => {
  const [servicos, setServicos] = useState(servicosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({ tecnicoId: "", clienteNome: "", veiculo: "", tipo: "instalacao" as ServicoAgendado["tipo"], endereco: "", cidade: "", estado: "", data: "", horario: "", valorServico: 200 });

  const salvar = () => {
    if (!form.tecnicoId || !form.clienteNome) { toast.error("Preencha técnico e cliente"); return; }
    const tec = tecnicosIniciais.find(t => t.id === form.tecnicoId);
    const novo: ServicoAgendado = {
      ...form, id: `OS-${String(servicos.length + 1).padStart(3, "0")}`,
      tecnicoNome: tec?.nome || "", status: "agendado",
    };
    setServicos(prev => [...prev, novo]);
    setModalOpen(false);
    toast.success("Ordem de serviço criada!");
  };

  const baseUrl = window.location.origin;

  const copyLink = (type: string, id: string) => {
    const link = `${baseUrl}/servico/${type}/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(`${type}-${id}`);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços Agendados</h1>
          <p className="text-muted-foreground text-sm">Ordens de serviço e acompanhamento</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova OS</Button>
      </div>

      <div className="grid gap-4">
        {servicos.map(s => (
          <Card key={s.id} className="p-5 card-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-sm">{s.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[s.status].class}`}>{statusMap[s.status].label}</span>
                  <Badge variant="secondary">{tipoMap[s.tipo]}</Badge>
                </div>
                <div className="text-sm">
                  <p><strong>Técnico:</strong> {s.tecnicoNome}</p>
                  <p><strong>Cliente:</strong> {s.clienteNome}</p>
                  <p><strong>Veículo:</strong> {s.veiculo}</p>
                  <p className="text-muted-foreground">{s.endereco} — {s.cidade}/{s.estado}</p>
                  <p className="text-muted-foreground">{s.data} às {s.horario}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className="font-semibold">R$ {s.valorServico}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => copyLink("tecnico", s.id)}>
                    {copiedId === `tecnico-${s.id}` ? <Check className="w-3 h-3 mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
                    Link Técnico
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => copyLink("cliente", s.id)}>
                    {copiedId === `cliente-${s.id}` ? <Check className="w-3 h-3 mr-1" /> : <ExternalLink className="w-3 h-3 mr-1" />}
                    Link Cliente
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Ordem de Serviço</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Técnico</Label>
              <Select value={form.tecnicoId} onValueChange={v => setForm(f => ({ ...f, tecnicoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.id}>{t.nome} ({t.cidade}/{t.estado})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cliente</Label>
              <Select value={form.clienteNome} onValueChange={v => setForm(f => ({ ...f, clienteNome: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientesIniciais.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Veículo</Label><Input value={form.veiculo} onChange={e => setForm(f => ({ ...f, veiculo: e.target.value }))} placeholder="Modelo - Placa" /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as ServicoAgendado["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
            <div><Label>Estado</Label><Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="SP" /></div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div><Label>Horário</Label><Input type="time" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} /></div>
            <div><Label>Valor do Serviço (R$)</Label><Input type="number" value={form.valorServico} onChange={e => setForm(f => ({ ...f, valorServico: +e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Criar OS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Servicos;
