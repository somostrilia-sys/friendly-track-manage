import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAgendamentos, useInsertAgendamento, useUpdateAgendamento, useTecnicos } from "@/hooks/useSupabaseData";
import type { DbAgendamento } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, CheckCircle, XCircle, Clock, Truck, Users, Inbox } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = { agendado: "bg-yellow-400", realizado: "bg-green-500", sem_retorno: "bg-red-500" };
const statusLabels: Record<string, string> = { agendado: "Agendado", realizado: "Realizado", sem_retorno: "Sem Retorno" };
const tipoLabels: Record<string, string> = { instalacao: "Instalacao", manutencao: "Manutencao", retirada: "Retirada" };
const envioLabels: Record<string, string> = { nao_enviado: "Nao Enviado", enviado: "Enviado", entregue: "Entregue" };
const envioVariants: Record<string, "outline" | "secondary" | "default"> = { nao_enviado: "outline", enviado: "secondary", entregue: "default" };

const erpAssociados: { id: string; numero: string; nome: string; modeloVeiculo: string; placa: string; produto: string }[] = [
  { id: "erp-1", numero: "45832", nome: "Transportes Bandeirantes Ltda", modeloVeiculo: "Volkswagen Delivery 9.170", placa: "ABC-1D34", produto: "Positron Duoblock" },
  { id: "erp-2", numero: "51290", nome: "Distribuidora Paulista de Alimentos", modeloVeiculo: "Fiat Ducato Cargo", placa: "DEF-2E78", produto: "Sascar ST300" },
  { id: "erp-3", numero: "38471", nome: "Logística Anhanguera S/A", modeloVeiculo: "Mercedes-Benz Accelo 815", placa: "GHI-3F12", produto: "Quant Q900" },
  { id: "erp-4", numero: "62105", nome: "Construtora ABC Engenharia", modeloVeiculo: "Ford Cargo 1723", placa: "JKL-4G56", produto: "Positron Duoblock" },
  { id: "erp-5", numero: "29867", nome: "Supermercados Paulistão Ltda", modeloVeiculo: "Iveco Daily 70C17", placa: "MNO-5H90", produto: "Sascar ST300" },
];

const Agendamentos = () => {
  const { data: agendamentos = [], isLoading } = useAgendamentos();
  const { data: tecnicos = [] } = useTecnicos();
  const insertAgendamento = useInsertAgendamento();
  const updateAgendamento = useUpdateAgendamento();

  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"dia" | "semana" | "mes">("semana");
  const [form, setForm] = useState({ tipo: "instalacao" as DbAgendamento["tipo"], placa: "", associado: "", endereco: "", endereco_instalacao: "", cidade: "", tecnico_id: "" as string | null, data: "", horario: "", rastreador_serial: "", status_envio_rastreador: "nao_enviado" as DbAgendamento["status_envio_rastreador"] });

  const [erpDataInicio, setErpDataInicio] = useState("");
  const [erpDataFim, setErpDataFim] = useState("");
  const [erpFiltrado, setErpFiltrado] = useState<typeof erpAssociados>([]);
  const [atribuicoes, setAtribuicoes] = useState<Record<string, string>>({});

  const salvar = async () => {
    if (!form.placa || !form.tecnico_id) { toast.error("Preencha placa e tecnico"); return; }
    const tec = tecnicos.find(t => t.id === form.tecnico_id);
    try {
      await insertAgendamento.mutateAsync({
        ...form, codigo: `AG-${Date.now()}`, tecnico_nome: tec?.nome || "", status: "agendado", tentativas: 0,
      });
      setModalOpen(false);
      toast.success("Agendamento criado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const registrarTentativa = async (ag: DbAgendamento) => {
    const tentativas = ag.tentativas + 1;
    try {
      await updateAgendamento.mutateAsync({ id: ag.id, tentativas, status: tentativas >= 3 ? "sem_retorno" : ag.status });
      toast.info("Tentativa registrada");
    } catch (e: any) { toast.error(e.message); }
  };

  const concluir = async (id: string) => {
    try {
      await updateAgendamento.mutateAsync({ id, status: "realizado" });
      toast.success("Agendamento concluido!");
    } catch (e: any) { toast.error(e.message); }
  };

  const porData = agendamentos.reduce((acc, a) => {
    (acc[a.data] = acc[a.data] || []).push(a);
    return acc;
  }, {} as Record<string, DbAgendamento[]>);
  const datasOrdenadas = Object.keys(porData).sort();

  const filtrarERP = () => { setErpFiltrado(erpAssociados); toast.success("Dados importados do Sistema ERP"); };
  const atribuirTecnico = (erpId: string, tecId: string) => {
    setAtribuicoes(prev => ({ ...prev, [erpId]: tecId }));
    const tec = tecnicos.find(t => t.id === tecId);
    toast.success(`Associado atribuido ao tecnico ${tec?.nome}`);
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Agendamentos" subtitle="Calendario de instalacoes, manutencoes e retiradas" />
      <TableSkeleton rows={5} cols={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Agendamentos" subtitle="Calendario de instalacoes, manutencoes e retiradas" />
      <Tabs defaultValue="agendamentos" className="w-full">
        <TabsList>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="erp">Sincronismo com Sistema ERP</TabsTrigger>
        </TabsList>
        <TabsContent value="agendamentos" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(["dia", "semana", "mes"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${view === v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>{v}</button>
              ))}
            </div>
            <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo</Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Agendados" value={agendamentos.filter(a => a.status === "agendado").length} icon={Clock} accent="warning" />
            <StatCard label="Realizados" value={agendamentos.filter(a => a.status === "realizado").length} icon={CheckCircle} accent="success" />
            <StatCard label="Sem Retorno" value={agendamentos.filter(a => a.status === "sem_retorno").length} icon={XCircle} accent="destructive" />
            <StatCard label="Total" value={agendamentos.length} icon={Calendar} accent="primary" />
          </div>
          <div className="space-y-4">
            {datasOrdenadas.length === 0 && (
              <Card className="p-0">
                <div className="flex flex-col items-center justify-center py-14 space-y-3 text-center">
                  <div className="rounded-full bg-muted/60 p-4">
                    <Inbox className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Nenhum agendamento encontrado</p>
                  <p className="text-xs text-muted-foreground/60">Crie um novo agendamento para começar</p>
                </div>
              </Card>
            )}
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
                          {a.rastreador_serial && (
                            <Badge variant={envioVariants[a.status_envio_rastreador]} className="text-xs">
                              <Truck className="w-3 h-3 mr-1" /> {a.rastreador_serial} - {envioLabels[a.status_envio_rastreador]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{a.associado} - {a.endereco}, {a.cidade}</p>
                        {a.endereco_instalacao && <p className="text-xs text-primary/70">Local: {a.endereco_instalacao}</p>}
                        <p className="text-xs text-muted-foreground">Tecnico: {a.tecnico_nome} {a.tentativas > 0 && `- ${a.tentativas} tentativa(s)`}</p>
                      </div>
                      <Badge variant={a.status === "realizado" ? "default" : a.status === "sem_retorno" ? "destructive" : "outline"}>{statusLabels[a.status]}</Badge>
                      {a.status === "agendado" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => registrarTentativa(a)}>Tentativa</Button>
                          <Button size="sm" onClick={() => concluir(a.id)}>Concluir</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="erp" className="space-y-6">
          <Card className="p-6 card-shadow">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Sincronismo com Sistema ERP</h3>
            <p className="text-sm text-muted-foreground mb-4">Importe veiculos e associados do ERP que possuem produto rastreador.</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div><Label className="text-xs">Data Inicio</Label><Input type="date" className="w-[160px]" value={erpDataInicio} onChange={e => setErpDataInicio(e.target.value)} /></div>
              <div><Label className="text-xs">Data Fim</Label><Input type="date" className="w-[160px]" value={erpDataFim} onChange={e => setErpDataFim(e.target.value)} /></div>
              <Button onClick={filtrarERP}>Importar do ERP</Button>
            </div>
          </Card>
          {erpFiltrado.length > 0 && (
            <Card className="card-shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N. Associado</TableHead><TableHead>Nome</TableHead><TableHead>Modelo Veiculo</TableHead>
                    <TableHead>Placa</TableHead><TableHead>Produto</TableHead><TableHead>Tecnico Atribuido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {erpFiltrado.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">{a.numero}</TableCell>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell>{a.modeloVeiculo}</TableCell>
                      <TableCell className="font-mono">{a.placa}</TableCell>
                      <TableCell><Badge variant="secondary">{a.produto}</Badge></TableCell>
                      <TableCell>
                        <Select value={atribuicoes[a.id] || ""} onValueChange={v => atribuirTecnico(a.id, v)}>
                          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Atribuir tecnico" /></SelectTrigger>
                          <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as DbAgendamento["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Placa</Label><Input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value }))} /></div>
            <div><Label>Associado</Label><Input value={form.associado} onChange={e => setForm(f => ({ ...f, associado: e.target.value }))} /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Endereco</Label><Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Endereco de Instalacao</Label><Input value={form.endereco_instalacao} onChange={e => setForm(f => ({ ...f, endereco_instalacao: e.target.value }))} placeholder="Local exato" /></div>
            <div><Label>Tecnico</Label>
              <Select value={form.tecnico_id || ""} onValueChange={v => setForm(f => ({ ...f, tecnico_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div><Label>Horario</Label><Input value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} placeholder="09:00" /></div>
            <div><Label>Serial Rastreador</Label><Input value={form.rastreador_serial} onChange={e => setForm(f => ({ ...f, rastreador_serial: e.target.value }))} /></div>
            <div><Label>Status Envio</Label>
              <Select value={form.status_envio_rastreador} onValueChange={v => setForm(f => ({ ...f, status_envio_rastreador: v as DbAgendamento["status_envio_rastreador"] }))}>
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
