import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAgendamentos, useInsertAgendamento, useUpdateAgendamento, useTecnicos, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbAgendamento } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, CheckCircle, XCircle, Clock, Truck, Users, Inbox, RefreshCw, Loader2, AlertTriangle, Phone, Bell, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { buscarAssociadosComRastreador, sincronizarAssociados, type AssociadoERP } from "@/lib/hinova-erp";

const statusColors: Record<string, string> = {
  agendado: "bg-yellow-400",
  realizado: "bg-green-500",
  sem_retorno: "bg-red-500",
  tentativa_1: "bg-yellow-400",
  tentativa_2: "bg-orange-400",
  tentativa_3: "bg-red-500",
};
const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  realizado: "Realizado",
  sem_retorno: "Sem Retorno",
  tentativa_1: "Tentativa 1/3",
  tentativa_2: "Tentativa 2/3",
  tentativa_3: "Tentativa 3/3",
};
const tipoLabels: Record<string, string> = { instalacao: "Instalacao", manutencao: "Manutencao", retirada: "Retirada" };
const envioLabels: Record<string, string> = { nao_enviado: "Nao Enviado", enviado: "Enviado", entregue: "Entregue" };
const envioVariants: Record<string, "outline" | "secondary" | "default"> = { nao_enviado: "outline", enviado: "secondary", entregue: "default" };

const statusInstalacaoColors: Record<string, string> = {
  instalado: "bg-green-500",
  pendente: "bg-yellow-400",
  agendado: "bg-blue-500",
};
const statusInstalacaoLabels: Record<string, string> = {
  instalado: "Instalado",
  pendente: "Pendente",
  agendado: "Agendado",
};

function diasDesde(dataStr: string | null): number {
  if (!dataStr) return 0;
  const diff = Date.now() - new Date(dataStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatarDiasSemRetorno(dataStr: string | null): string {
  const dias = diasDesde(dataStr);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "ha 1 dia";
  return `ha ${dias} dias`;
}

function tentativaBadge(tentativas: number) {
  if (tentativas === 0) return null;
  const isMax = tentativas >= 3;
  return (
    <Badge variant={isMax ? "destructive" : "outline"} className={isMax ? "" : "border-yellow-500 text-yellow-700 bg-yellow-50"}>
      {tentativas}/3
    </Badge>
  );
}

const Agendamentos = () => {
  const { data: agendamentos = [], isLoading } = useAgendamentos();
  const { data: tecnicos = [] } = useTecnicos();
  const insertAgendamento = useInsertAgendamento();
  const updateAgendamento = useUpdateAgendamento();

  useRealtimeSubscription("agendamentos", ["agendamentos"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"dia" | "semana" | "mes">("semana");
  const [form, setForm] = useState({
    tipo: "instalacao" as DbAgendamento["tipo"],
    placa: "",
    associado: "",
    endereco: "",
    endereco_instalacao: "",
    cidade: "",
    tecnico_id: "" as string | null,
    data: "",
    horario: "",
    rastreador_serial: "",
    status_envio_rastreador: "nao_enviado" as DbAgendamento["status_envio_rastreador"],
    telefone: "",
    unidade: "",
  });

  const [erpDataInicio, setErpDataInicio] = useState("");
  const [erpDataFim, setErpDataFim] = useState("");
  const [erpAssociados, setErpAssociados] = useState<AssociadoERP[]>([]);
  const [erpLoading, setErpLoading] = useState(false);
  const [erpLoaded, setErpLoaded] = useState(false);
  const [atribuicoes, setAtribuicoes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("agendamentos");

  // Derived data
  const semRetornoList = useMemo(
    () => agendamentos.filter(a => a.status === "sem_retorno"),
    [agendamentos]
  );
  const agendadosList = useMemo(
    () => agendamentos.filter(a => a.status !== "sem_retorno" && a.status !== "realizado"),
    [agendamentos]
  );

  const fetchErpData = useCallback(async () => {
    setErpLoading(true);
    try {
      const data = await buscarAssociadosComRastreador(
        erpDataInicio || undefined,
        erpDataFim || undefined
      );

      const enriched = data.map((assoc) => {
        const agendamento = agendamentos.find(
          (a) => a.placa === assoc.placa || a.associado === assoc.nome
        );
        if (agendamento) {
          return {
            ...assoc,
            status_instalacao:
              agendamento.status === "realizado"
                ? ("instalado" as const)
                : ("agendado" as const),
          };
        }
        return assoc;
      });

      setErpAssociados(enriched);
      setErpLoaded(true);
      toast.success(`${enriched.length} associados importados do ERP`);
    } catch (err: any) {
      console.error("Erro ao buscar associados ERP:", err);
      toast.error(err.message || "Erro ao buscar dados do ERP");
      setErpAssociados([]);
    } finally {
      setErpLoading(false);
    }
  }, [erpDataInicio, erpDataFim, agendamentos]);

  const handleSincronizar = async () => {
    setErpLoading(true);
    try {
      const data = await sincronizarAssociados();

      const enriched = data.map((assoc) => {
        const agendamento = agendamentos.find(
          (a) => a.placa === assoc.placa || a.associado === assoc.nome
        );
        if (agendamento) {
          return {
            ...assoc,
            status_instalacao:
              agendamento.status === "realizado"
                ? ("instalado" as const)
                : ("agendado" as const),
          };
        }
        return assoc;
      });

      setErpAssociados(enriched);
      toast.success(`Sincronizacao completa: ${enriched.length} associados`);
    } catch (err: any) {
      console.error("Erro ao sincronizar:", err);
      toast.error(err.message || "Erro ao sincronizar com o ERP");
    } finally {
      setErpLoading(false);
    }
  };

  // Auto-fetch when switching to the ERP tab
  useEffect(() => {
    if (activeTab === "erp" && !erpLoaded && !erpLoading) {
      fetchErpData();
    }
  }, [activeTab, erpLoaded, erpLoading, fetchErpData]);

  const salvar = async () => {
    if (!form.placa || !form.tecnico_id) { toast.error("Preencha placa e tecnico"); return; }
    const tec = tecnicos.find(t => t.id === form.tecnico_id);
    try {
      await insertAgendamento.mutateAsync({
        ...form,
        codigo: `AG-${Date.now()}`,
        tecnico_nome: tec?.nome || "",
        status: "agendado",
        tentativas: 0,
        data_ultima_tentativa: null,
        gestor_notificado: false,
      });
      setModalOpen(false);
      toast.success("Agendamento criado!");
    } catch (e: any) { toast.error(e.message); }
  };

  const registrarTentativa = async (ag: DbAgendamento) => {
    const tentativas = (ag.tentativas || 0) + 1;
    const hoje = new Date().toISOString().split("T")[0];
    const novoStatus: DbAgendamento["status"] = tentativas >= 3
      ? "sem_retorno"
      : (`tentativa_${tentativas}` as DbAgendamento["status"]);

    try {
      await updateAgendamento.mutateAsync({
        id: ag.id,
        tentativas,
        status: novoStatus,
        data_ultima_tentativa: hoje,
      });
      if (tentativas >= 3) {
        toast.warning(`${ag.associado} movido para "Sem Retorno" apos 3 tentativas`);
      } else {
        toast.info(`Tentativa ${tentativas}/3 registrada para ${ag.associado}`);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const tentarNovamente = async (ag: DbAgendamento) => {
    const hoje = new Date().toISOString().split("T")[0];
    try {
      await updateAgendamento.mutateAsync({
        id: ag.id,
        status: "agendado",
        tentativas: 0,
        data_ultima_tentativa: hoje,
        gestor_notificado: false,
      });
      toast.success(`${ag.associado} retornou para agendamentos`);
    } catch (e: any) { toast.error(e.message); }
  };

  const notificarGestor = async (ag: DbAgendamento) => {
    try {
      await updateAgendamento.mutateAsync({
        id: ag.id,
        gestor_notificado: true,
      });
      toast.success(
        `Notificacao enviada ao gestor da unidade "${ag.unidade || "N/A"}": Associado ${ag.associado} sem retorno apos ${ag.tentativas} tentativas de contato.`,
        { duration: 6000 }
      );
    } catch (e: any) { toast.error(e.message); }
  };

  const marcarComoAgendado = async (ag: DbAgendamento) => {
    try {
      await updateAgendamento.mutateAsync({
        id: ag.id,
        status: "agendado",
        gestor_notificado: false,
      });
      toast.success(`${ag.associado} marcado como agendado`);
    } catch (e: any) { toast.error(e.message); }
  };

  const concluir = async (id: string) => {
    try {
      await updateAgendamento.mutateAsync({ id, status: "realizado" });
      toast.success("Agendamento concluido!");
    } catch (e: any) { toast.error(e.message); }
  };

  const atribuirTecnico = (erpId: string, tecId: string) => {
    setAtribuicoes(prev => ({ ...prev, [erpId]: tecId }));
    const tec = tecnicos.find(t => t.id === tecId);
    toast.success(`Associado atribuido ao tecnico ${tec?.nome}`);
  };

  const porData = agendadosList.reduce((acc, a) => {
    (acc[a.data] = acc[a.data] || []).push(a);
    return acc;
  }, {} as Record<string, DbAgendamento[]>);
  const datasOrdenadas = Object.keys(porData).sort();

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Agendamentos" subtitle="Calendario de instalacoes, manutencoes e retiradas" />
      <TableSkeleton rows={5} cols={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Agendamentos" subtitle="Calendario de instalacoes, manutencoes e retiradas" />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="sem_retorno" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Sem Retorno
            {semRetornoList.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
                {semRetornoList.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="erp">Sincronismo com Sistema ERP</TabsTrigger>
        </TabsList>

        {/* ===================== ABA AGENDAMENTOS ===================== */}
        <TabsContent value="agendamentos" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(["dia", "semana", "mes"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${view === v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>{v}</button>
              ))}
            </div>
            <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo</Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Agendados" value={agendamentos.filter(a => a.status === "agendado").length} icon={Clock} accent="warning" />
            <StatCard label="Em Tentativa" value={agendamentos.filter(a => ["tentativa_1", "tentativa_2", "tentativa_3"].includes(a.status)).length} icon={Phone} accent="warning" />
            <StatCard label="Realizados" value={agendamentos.filter(a => a.status === "realizado").length} icon={CheckCircle} accent="success" />
            <StatCard label="Sem Retorno" value={semRetornoList.length} icon={XCircle} accent="destructive" />
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
                  <p className="text-xs text-muted-foreground/60">Crie um novo agendamento para comecar</p>
                </div>
              </Card>
            )}
            {datasOrdenadas.map(data => (
              <Card key={data} className="p-4 card-shadow">
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">{data}</h3>
                <div className="space-y-2">
                  {porData[data].map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <div className={`w-3 h-3 rounded-full ${statusColors[a.status] || "bg-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-sm">{a.placa}</span>
                          <Badge variant="secondary" className="text-xs">{tipoLabels[a.tipo]}</Badge>
                          <span className="text-xs text-muted-foreground">{a.horario}</span>
                          {tentativaBadge(a.tentativas || 0)}
                          {a.rastreador_serial && (
                            <Badge variant={envioVariants[a.status_envio_rastreador]} className="text-xs">
                              <Truck className="w-3 h-3 mr-1" /> {a.rastreador_serial} - {envioLabels[a.status_envio_rastreador]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{a.associado} - {a.endereco}, {a.cidade}</p>
                        {a.endereco_instalacao && <p className="text-xs text-primary/70">Local: {a.endereco_instalacao}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Tecnico: {a.tecnico_nome}</span>
                          {a.telefone && <span>Tel: {a.telefone}</span>}
                          {a.unidade && <span>Unidade: {a.unidade}</span>}
                          {a.data_ultima_tentativa && (
                            <span className="text-orange-600">Ultima tentativa: {formatarDiasSemRetorno(a.data_ultima_tentativa)}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant={a.status === "realizado" ? "default" : a.status === "sem_retorno" ? "destructive" : "outline"}>
                        {statusLabels[a.status] || a.status}
                      </Badge>
                      {a.status !== "realizado" && a.status !== "sem_retorno" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => registrarTentativa(a)} title="Registrar tentativa de contato">
                            <Phone className="w-3.5 h-3.5 mr-1" /> Tentativa
                          </Button>
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

        {/* ===================== ABA SEM RETORNO ===================== */}
        <TabsContent value="sem_retorno" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Sem Retorno" value={semRetornoList.length} icon={XCircle} accent="destructive" />
            <StatCard label="Gestor Notificado" value={semRetornoList.filter(a => a.gestor_notificado).length} icon={Bell} accent="success" />
            <StatCard label="Aguardando Notificacao" value={semRetornoList.filter(a => !a.gestor_notificado).length} icon={AlertTriangle} accent="warning" />
          </div>

          {semRetornoList.length === 0 ? (
            <Card className="p-0">
              <div className="flex flex-col items-center justify-center py-14 space-y-3 text-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum associado sem retorno</p>
                <p className="text-xs text-muted-foreground/60">Todos os associados responderam as tentativas de contato</p>
              </div>
            </Card>
          ) : (
            <Card className="card-shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Associado</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Ultima Tentativa</TableHead>
                    <TableHead>Dias sem Retorno</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semRetornoList.map(a => {
                    const dias = diasDesde(a.data_ultima_tentativa);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.associado}</TableCell>
                        <TableCell>{a.unidade || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{a.telefone || "-"}</TableCell>
                        <TableCell className="font-mono">{a.placa}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{a.tentativas || 0}/3</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.data_ultima_tentativa || "-"}
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${dias >= 7 ? "text-red-600" : dias >= 3 ? "text-orange-600" : "text-muted-foreground"}`}>
                            {a.data_ultima_tentativa ? formatarDiasSemRetorno(a.data_ultima_tentativa) : "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {a.gestor_notificado ? (
                            <Badge variant="default" className="bg-green-600 gap-1">
                              <CheckCircle className="w-3 h-3" /> Notificado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => tentarNovamente(a)}
                              title="Reiniciar tentativas e voltar para agendamentos"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Tentar Novamente
                            </Button>
                            {!a.gestor_notificado && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() => notificarGestor(a)}
                                title="Notificar gestor da unidade"
                              >
                                <Bell className="w-3.5 h-3.5 mr-1" /> Notificar Gestor
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => marcarComoAgendado(a)}
                              title="Marcar como agendado"
                            >
                              <Calendar className="w-3.5 h-3.5 mr-1" /> Agendar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ===================== ABA ERP ===================== */}
        <TabsContent value="erp" className="space-y-6">
          <Card className="p-6 card-shadow">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Sincronismo com Sistema ERP</h3>
            <p className="text-sm text-muted-foreground mb-4">Importe veiculos e associados do ERP que possuem produto rastreador.</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div><Label className="text-xs">Data Inicio</Label><Input type="date" className="w-[160px]" value={erpDataInicio} onChange={e => setErpDataInicio(e.target.value)} /></div>
              <div><Label className="text-xs">Data Fim</Label><Input type="date" className="w-[160px]" value={erpDataFim} onChange={e => setErpDataFim(e.target.value)} /></div>
              <Button onClick={fetchErpData} disabled={erpLoading}>
                {erpLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Importar do ERP
              </Button>
              <Button variant="outline" onClick={handleSincronizar} disabled={erpLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${erpLoading ? "animate-spin" : ""}`} />
                Sincronizar
              </Button>
            </div>
          </Card>

          {erpLoading && !erpLoaded && (
            <TableSkeleton rows={5} cols={7} />
          )}

          {!erpLoading && erpLoaded && erpAssociados.length === 0 && (
            <Card className="p-0">
              <div className="flex flex-col items-center justify-center py-14 space-y-3 text-center">
                <div className="rounded-full bg-muted/60 p-4">
                  <Inbox className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum associado encontrado no ERP</p>
                <p className="text-xs text-muted-foreground/60">Tente ajustar os filtros de data ou sincronizar novamente</p>
              </div>
            </Card>
          )}

          {erpAssociados.length > 0 && (
            <Card className="card-shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N. Associado</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tecnico Atribuido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {erpAssociados.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">{a.numero}</TableCell>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{a.cpf_cnpj || "-"}</TableCell>
                      <TableCell className="font-mono">{a.placa || "-"}</TableCell>
                      <TableCell><Badge variant="secondary">{a.produto || "-"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${statusInstalacaoColors[a.status_instalacao]}`} />
                          <span className="text-xs">{statusInstalacaoLabels[a.status_instalacao]}</span>
                        </div>
                      </TableCell>
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

      {/* ===================== MODAL NOVO AGENDAMENTO ===================== */}
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
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
            <div><Label>Unidade</Label><Input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} placeholder="Filial / unidade" /></div>
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
