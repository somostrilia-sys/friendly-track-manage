import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { agendamentosIniciais, Agendamento, tecnicosIniciais } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Plus, Calendar, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  agendado: "bg-yellow-400",
  realizado: "bg-green-500",
  sem_retorno: "bg-red-500",
};
const statusLabels: Record<string, string> = { agendado: "Agendado", realizado: "Realizado", sem_retorno: "Sem Retorno" };
const tipoLabels: Record<string, string> = { instalacao: "Instalacao", manutencao: "Manutencao", retirada: "Retirada" };
const envioLabels: Record<string, string> = { nao_enviado: "Nao Enviado", enviado: "Enviado", entregue: "Entregue" };
const envioVariants: Record<string, "outline" | "secondary" | "default"> = { nao_enviado: "outline", enviado: "secondary", entregue: "default" };

const Agendamentos = () => {
  const [agendamentos, setAgendamentos] = useState(agendamentosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"dia" | "semana" | "mes">("semana");
  const [form, setForm] = useState({ tipo: "instalacao" as Agendamento["tipo"], placa: "", associado: "", endereco: "", enderecoInstalacao: "", cidade: "", tecnicoId: "", data: "", horario: "", rastreadorSerial: "", statusEnvioRastreador: "nao_enviado" as Agendamento["statusEnvioRastreador"] });

  const salvar = () => {
    if (!form.placa || !form.tecnicoId) { toast.error("Preencha placa e tecnico"); return; }
    const tec = tecnicosIniciais.find(t => t.id === form.tecnicoId);
    const novo: Agendamento = { id: `AG-${Date.now()}`, ...form, tecnicoNome: tec?.nome || "", status: "agendado", tentativas: 0 };
    setAgendamentos(prev => [...prev, novo]);
    setModalOpen(false);
    setForm({ tipo: "instalacao", placa: "", associado: "", endereco: "", enderecoInstalacao: "", cidade: "", tecnicoId: "", data: "", horario: "", rastreadorSerial: "", statusEnvioRastreador: "nao_enviado" });
    toast.success("Agendamento criado!");
  };

  const registrarTentativa = (id: string) => {
    setAgendamentos(prev => prev.map(a => {
      if (a.id !== id) return a;
      const tentativas = a.tentativas + 1;
      return { ...a, tentativas, status: tentativas >= 3 ? "sem_retorno" as const : a.status };
    }));
    toast.info("Tentativa registrada");
  };

  const concluir = (id: string) => {
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: "realizado" as const } : a));
    toast.success("Agendamento concluido!");
  };

  const porData = agendamentos.reduce((acc, a) => {
    (acc[a.data] = acc[a.data] || []).push(a);
    return acc;
  }, {} as Record<string, Agendamento[]>);

  const datasOrdenadas = Object.keys(porData).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground text-sm">Calendario de instalacoes, manutencoes e retiradas</p>
        </div>
        <div className="flex gap-2">
          {(["dia", "semana", "mes"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${view === v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>{v}</button>
          ))}
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Agendados" value={agendamentos.filter(a => a.status === "agendado").length} icon={Clock} accent="warning" />
        <StatCard label="Realizados" value={agendamentos.filter(a => a.status === "realizado").length} icon={CheckCircle} accent="success" />
        <StatCard label="Sem Retorno" value={agendamentos.filter(a => a.status === "sem_retorno").length} icon={XCircle} accent="destructive" />
        <StatCard label="Total" value={agendamentos.length} icon={Calendar} accent="primary" />
      </div>

      <div className="space-y-4">
        {datasOrdenadas.map(data => (
          <Card key={data} className="p-4 card-shadow">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">{data}</h3>
            <div className="space-y-2">
              {porData[data].map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className={`w-3 h-3 rounded-full ${statusColors[a.status]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-medium text-sm">{a.placa}</span>
                      <Badge variant="secondary" className="text-xs">{tipoLabels[a.tipo]}</Badge>
                      <span className="text-xs text-muted-foreground">{a.horario}</span>
                      {a.rastreadorSerial && (
                        <Badge variant={envioVariants[a.statusEnvioRastreador]} className="text-xs">
                          <Truck className="w-3 h-3 mr-1" /> {a.rastreadorSerial} - {envioLabels[a.statusEnvioRastreador]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{a.associado} - {a.endereco}, {a.cidade}</p>
                    {a.enderecoInstalacao && <p className="text-xs text-primary/70">Local: {a.enderecoInstalacao}</p>}
                    <p className="text-xs text-muted-foreground">Tecnico: {a.tecnicoNome} {a.tentativas > 0 && `- ${a.tentativas} tentativa(s)`}</p>
                  </div>
                  <Badge variant={a.status === "realizado" ? "default" : a.status === "sem_retorno" ? "destructive" : "outline"}>{statusLabels[a.status]}</Badge>
                  {a.status === "agendado" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => registrarTentativa(a.id)}>Tentativa</Button>
                      <Button size="sm" onClick={() => concluir(a.id)}>Concluir</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as Agendamento["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Placa</Label><Input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value }))} /></div>
            <div><Label>Associado</Label><Input value={form.associado} onChange={e => setForm(f => ({ ...f, associado: e.target.value }))} /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Endereco</Label><Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Endereco de Instalacao</Label><Input value={form.enderecoInstalacao} onChange={e => setForm(f => ({ ...f, enderecoInstalacao: e.target.value }))} placeholder="Local exato da instalacao" /></div>
            <div><Label>Tecnico</Label>
              <Select value={form.tecnicoId} onValueChange={v => setForm(f => ({ ...f, tecnicoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div><Label>Horario</Label><Input value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} placeholder="09:00" /></div>
            <div><Label>Serial Rastreador</Label><Input value={form.rastreadorSerial} onChange={e => setForm(f => ({ ...f, rastreadorSerial: e.target.value }))} placeholder="J16-2024-001" /></div>
            <div><Label>Status Envio</Label>
              <Select value={form.statusEnvioRastreador} onValueChange={v => setForm(f => ({ ...f, statusEnvioRastreador: v as Agendamento["statusEnvioRastreador"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_enviado">Nao Enviado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agendamentos;
