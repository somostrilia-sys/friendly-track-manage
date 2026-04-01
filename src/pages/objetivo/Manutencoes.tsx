import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useManutencoes, useInsertManutencao, useUpdateManutencao, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbManutencao } from "@/types/database";
import { AlertTriangle, Send, WifiOff, Clock, Inbox, Plus, CheckCircle, Loader2, Bell, Truck, Car, Bike } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { enviarComandoSMS } from "@/lib/arqia";

// --- Helpers ---

function diasEntre(dataStr: string): number {
  const agora = new Date();
  const data = new Date(dataStr);
  return Math.max(0, Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatarData(dataStr?: string): string {
  if (!dataStr) return "--";
  return new Date(dataStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarDataHora(dataStr?: string): string {
  if (!dataStr) return "--";
  return new Date(dataStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const tipoVeiculoLabel: Record<string, string> = {
  carro: "Carro",
  moto: "Moto",
  caminhao: "Caminhao",
};

const tipoVeiculoIcon: Record<string, typeof Car> = {
  carro: Car,
  moto: Bike,
  caminhao: Truck,
};

// --- Component ---

const Manutencoes = () => {
  const { data: manutencoes = [], isLoading } = useManutencoes();
  const insertManutencao = useInsertManutencao();
  const updateManutencao = useUpdateManutencao();

  useRealtimeSubscription("manutencoes", ["manutencoes"]);

  const [activeTab, setActiveTab] = useState("espera");
  const [novaOpen, setNovaOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [enviandoComandos, setEnviandoComandos] = useState<string | null>(null);

  const [novaForm, setNovaForm] = useState({
    placa: "",
    veiculo: "",
    tipo_veiculo: "carro" as string,
    iccid: "",
    valor_fipe: "",
    descricao: "",
    cliente_nome: "",
  });

  // --- Data filtering ---

  const esperaList = useMemo(() => {
    return manutencoes
      .filter(m => m.status === "espera")
      .sort((a, b) => new Date(a.data_espera || a.data_abertura).getTime() - new Date(b.data_espera || b.data_abertura).getTime());
  }, [manutencoes]);

  const prioridadeList = useMemo(() => {
    let list = manutencoes.filter(m => m.status === "prioridade");
    if (filtroTipo !== "todos") {
      list = list.filter(m => m.tipo_veiculo === filtroTipo);
    }
    return list.sort((a, b) => new Date(a.data_prioridade || a.data_abertura).getTime() - new Date(b.data_prioridade || b.data_abertura).getTime());
  }, [manutencoes, filtroTipo]);

  const todasList = useMemo(() => {
    return [...manutencoes].sort((a, b) => new Date(b.data_abertura).getTime() - new Date(a.data_abertura).getTime());
  }, [manutencoes]);

  // --- Stats ---

  const totalEspera = esperaList.length;
  const totalPrioridade = prioridadeList.length;

  const resolvidosUltimos30 = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    return manutencoes.filter(m => m.status === "resolvido" && new Date(m.data_abertura) >= limite).length;
  }, [manutencoes]);

  const tempoMedioResolucao = useMemo(() => {
    const resolvidos = manutencoes.filter(m => m.status === "resolvido" && m.data_espera);
    if (resolvidos.length === 0) return "0 dias";
    const totalDias = resolvidos.reduce((sum, m) => {
      const inicio = new Date(m.data_espera || m.data_abertura);
      const fim = new Date(m.data_abertura); // approximate
      return sum + Math.max(1, diasEntre(inicio.toISOString()));
    }, 0);
    return `${Math.round(totalDias / resolvidos.length)} dias`;
  }, [manutencoes]);

  // --- Actions ---

  const enviarComandos = async (m: DbManutencao) => {
    if (!m.iccid) {
      toast.error("ICCID nao cadastrado para este veiculo");
      return;
    }

    setEnviandoComandos(m.id);

    try {
      // Send Reset command
      await enviarComandoSMS(m.iccid, "RESET");
      // Send RL command
      await enviarComandoSMS(m.iccid, "RL");

      const agora = new Date().toISOString();
      await updateManutencao.mutateAsync({
        id: m.id,
        comandos_enviados: {
          reset: true,
          rl: true,
          reset_em: agora,
          rl_em: agora,
        },
      } as any);

      toast.success("Comandos Reset e RL enviados com sucesso!");
    } catch (e: any) {
      toast.error(`Erro ao enviar comandos: ${e.message}`);
    } finally {
      setEnviandoComandos(null);
    }
  };

  const moverParaPrioridade = async (m: DbManutencao) => {
    try {
      await updateManutencao.mutateAsync({
        id: m.id,
        status: "prioridade",
        data_prioridade: new Date().toISOString(),
      } as any);
      toast.success("Movido para Prioridade");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const marcarResolvido = async (m: DbManutencao) => {
    try {
      await updateManutencao.mutateAsync({
        id: m.id,
        status: "resolvido",
      } as any);
      toast.success("Marcado como resolvido!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const atualizarFipe = async (m: DbManutencao, valor: string) => {
    try {
      await updateManutencao.mutateAsync({
        id: m.id,
        valor_fipe: valor,
      } as any);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const criarManutencao = async () => {
    if (!novaForm.placa || !novaForm.cliente_nome) {
      toast.error("Preencha placa e associado");
      return;
    }

    try {
      const codigo = `MAN-${String(manutencoes.length + 1).padStart(3, "0")}`;
      await insertManutencao.mutateAsync({
        codigo,
        veiculo: novaForm.veiculo,
        placa: novaForm.placa,
        cliente_nome: novaForm.cliente_nome,
        problema: "offline",
        descricao: novaForm.descricao,
        status: "espera",
        data_abertura: new Date().toISOString().split("T")[0],
        data_espera: new Date().toISOString(),
        tipo_veiculo: novaForm.tipo_veiculo,
        iccid: novaForm.iccid,
        valor_fipe: novaForm.valor_fipe,
        tecnico_designado: "",
        dias_offline: 0,
        comandos_enviados: { reset: false, rl: false },
      } as any);

      setNovaOpen(false);
      setNovaForm({ placa: "", veiculo: "", tipo_veiculo: "carro", iccid: "", valor_fipe: "", descricao: "", cliente_nome: "" });
      toast.success("Veiculo adicionado a fila de espera!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // --- Render ---

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Manutencoes" subtitle="Fluxo automatizado de manutencao de rastreadores" />
      <TableSkeleton rows={6} cols={7} />
    </div>
  );

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "destructive" | "secondary" | "default" | "outline" }> = {
      espera: { label: "Aguardando", variant: "secondary" },
      prioridade: { label: "Prioridade", variant: "destructive" },
      em_atendimento: { label: "Em Atendimento", variant: "default" },
      resolvido: { label: "Resolvido", variant: "outline" },
      aberto: { label: "Aberto", variant: "destructive" },
      designado: { label: "Designado", variant: "secondary" },
    };
    const s = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manutencoes" subtitle="Fluxo automatizado - veiculos sem comunicacao">
        <Button onClick={() => setNovaOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nova Manutencao
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Em Espera" value={totalEspera} icon={Clock} accent="warning" />
        <StatCard label="Em Prioridade" value={totalPrioridade} icon={AlertTriangle} accent="destructive" />
        <StatCard label="Resolvidos (30 dias)" value={resolvidosUltimos30} icon={CheckCircle} accent="success" />
        <StatCard label="Tempo Medio" value={tempoMedioResolucao} icon={WifiOff} accent="muted" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="espera">
            Espera {totalEspera > 0 && <Badge variant="secondary" className="ml-2 text-xs">{totalEspera}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="prioridade">
            Prioridade {totalPrioridade > 0 && <Badge variant="destructive" className="ml-2 text-xs">{totalPrioridade}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>

        {/* ====== TAB: ESPERA ====== */}
        <TabsContent value="espera">
          <Card className="card-shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veiculo / Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ultimo Sinal</TableHead>
                  <TableHead>Comandos Enviados</TableHead>
                  <TableHead>Tempo em Espera</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {esperaList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
                        <div className="rounded-full bg-muted/60 p-3">
                          <Inbox className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Nenhum veiculo em espera</p>
                        <p className="text-xs text-muted-foreground/60">Veiculos aguardando resposta dos comandos aparecerao aqui</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {esperaList.map(m => {
                  const cmds = m.comandos_enviados || { reset: false, rl: false };
                  const tempoEspera = m.data_espera ? diasEntre(m.data_espera) : diasEntre(m.data_abertura);

                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{m.veiculo || "--"}</span>
                          <span className="text-muted-foreground ml-2 font-mono text-sm">{m.placa}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{m.cliente_nome}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{tipoVeiculoLabel[m.tipo_veiculo || "carro"] || "--"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatarData(m.ultimo_sinal || m.data_abertura)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant={cmds.reset ? "default" : "secondary"} className="text-xs">
                            Reset {cmds.reset ? "✓" : "✗"}
                          </Badge>
                          <Badge variant={cmds.rl ? "default" : "secondary"} className="text-xs">
                            RL {cmds.rl ? "✓" : "✗"}
                          </Badge>
                        </div>
                        {cmds.reset_em && (
                          <p className="text-xs text-muted-foreground mt-1">Enviado em {formatarDataHora(cmds.reset_em)}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${tempoEspera > 1 ? "text-warning" : ""}`}>
                          {tempoEspera} {tempoEspera === 1 ? "dia" : "dias"}
                        </span>
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            disabled={enviandoComandos === m.id}
                            onClick={() => enviarComandos(m)}
                          >
                            {enviandoComandos === m.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3 mr-1" />
                            )}
                            Enviar Comandos
                          </Button>
                          {tempoEspera >= 1 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => moverParaPrioridade(m)}
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" /> Prioridade
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-green-600"
                            onClick={() => marcarResolvido(m)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Resolvido
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ====== TAB: PRIORIDADE ====== */}
        <TabsContent value="prioridade">
          <div className="flex items-center gap-3 mb-4">
            <Label className="text-sm font-medium">Filtrar por tipo:</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="carro">Carro</SelectItem>
                <SelectItem value="moto">Moto</SelectItem>
                <SelectItem value="caminhao">Caminhao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="card-shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veiculo / Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor FIPE</TableHead>
                  <TableHead>Dias sem Comunicacao</TableHead>
                  <TableHead>Em Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prioridadeList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
                        <div className="rounded-full bg-muted/60 p-3">
                          <Inbox className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Nenhum veiculo em prioridade</p>
                        <p className="text-xs text-muted-foreground/60">Veiculos que nao responderam aos comandos aparecerao aqui</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {prioridadeList.map(m => {
                  const diasSemSinal = m.ultimo_sinal ? diasEntre(m.ultimo_sinal) : diasEntre(m.data_abertura);
                  const diasEmPrioridade = m.data_prioridade ? diasEntre(m.data_prioridade) : 0;
                  const mostrarLembrete = diasEmPrioridade > 0 && diasEmPrioridade % 3 === 0;
                  const TipoIcon = tipoVeiculoIcon[m.tipo_veiculo || "carro"] || Car;

                  return (
                    <TableRow key={m.id} className={mostrarLembrete ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TipoIcon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{m.veiculo || "--"}</span>
                            <span className="text-muted-foreground ml-2 font-mono text-sm">{m.placa}</span>
                            <p className="text-xs text-muted-foreground">{m.cliente_nome}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{tipoVeiculoLabel[m.tipo_veiculo || "carro"] || "--"}</span>
                      </TableCell>
                      <TableCell>
                        <FipeInput
                          value={m.valor_fipe || ""}
                          onSave={(val) => atualizarFipe(m, val)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <WifiOff className="w-4 h-4 text-destructive" />
                          <span className="font-bold text-destructive">{diasSemSinal} dias</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-sm font-medium">{diasEmPrioridade} dias</span>
                          {mostrarLembrete && (
                            <div className="flex items-center gap-1">
                              <Bell className="w-3 h-3 text-destructive" />
                              <Badge variant="destructive" className="text-xs">
                                Lembrete: {diasEmPrioridade} dias em prioridade
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="text-xs"
                            onClick={() => {
                              updateManutencao.mutateAsync({ id: m.id, status: "em_atendimento" } as any);
                              toast.success("Manutencao agendada");
                            }}
                          >
                            <Clock className="w-3 h-3 mr-1" /> Agendar Manutencao
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              toast.info(`Contatar associado: ${m.cliente_nome}`);
                            }}
                          >
                            <Send className="w-3 h-3 mr-1" /> Contatar Associado
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-green-600"
                            onClick={() => marcarResolvido(m)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Resolvido
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ====== TAB: TODAS ====== */}
        <TabsContent value="todas">
          <Card className="card-shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Veiculo / Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Associado</TableHead>
                  <TableHead>Ultimo Sinal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todasList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
                        <div className="rounded-full bg-muted/60 p-3">
                          <Inbox className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Nenhuma manutencao registrada</p>
                        <p className="text-xs text-muted-foreground/60">Veiculos com problema aparecerao aqui</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {todasList.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">{m.codigo}</TableCell>
                    <TableCell>
                      <span className="font-medium">{m.veiculo || "--"}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-sm">{m.placa}</span>
                    </TableCell>
                    <TableCell>{tipoVeiculoLabel[m.tipo_veiculo || ""] || "--"}</TableCell>
                    <TableCell>{m.cliente_nome}</TableCell>
                    <TableCell>{formatarData(m.ultimo_sinal || m.data_abertura)}</TableCell>
                    <TableCell>{statusBadge(m.status)}</TableCell>
                    <TableCell className="text-sm">{formatarData(m.data_abertura)}</TableCell>
                    <TableCell>
                      {(m.status === "espera" || m.status === "prioridade" || m.status === "em_atendimento") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-green-600"
                          onClick={() => marcarResolvido(m)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Resolvido
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====== DIALOG: Nova Manutencao ====== */}
      <Dialog open={novaOpen} onOpenChange={setNovaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Manutencao</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Placa</Label>
              <Input
                value={novaForm.placa}
                onChange={e => setNovaForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
                placeholder="ABC-1D23"
              />
            </div>
            <div>
              <Label>Modelo do Veiculo</Label>
              <Input
                value={novaForm.veiculo}
                onChange={e => setNovaForm(f => ({ ...f, veiculo: e.target.value }))}
                placeholder="Ex: Fiat Uno, Honda CG 160"
              />
            </div>
            <div>
              <Label>Tipo de Veiculo</Label>
              <Select value={novaForm.tipo_veiculo} onValueChange={v => setNovaForm(f => ({ ...f, tipo_veiculo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="carro">Carro</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                  <SelectItem value="caminhao">Caminhao</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ICCID da Linha</Label>
              <Input
                value={novaForm.iccid}
                onChange={e => setNovaForm(f => ({ ...f, iccid: e.target.value }))}
                placeholder="Numero ICCID do chip"
              />
            </div>
            <div>
              <Label>Associado</Label>
              <Input
                value={novaForm.cliente_nome}
                onChange={e => setNovaForm(f => ({ ...f, cliente_nome: e.target.value }))}
                placeholder="Nome do associado"
              />
            </div>
            <div>
              <Label>Valor FIPE (opcional)</Label>
              <Input
                value={novaForm.valor_fipe}
                onChange={e => setNovaForm(f => ({ ...f, valor_fipe: e.target.value }))}
                placeholder="Ex: R$ 35.000"
              />
            </div>
            <div>
              <Label>Observacoes</Label>
              <Textarea
                value={novaForm.descricao}
                onChange={e => setNovaForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Detalhes adicionais sobre o veiculo ou problema"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaOpen(false)}>Cancelar</Button>
            <Button onClick={criarManutencao} disabled={insertManutencao.isPending}>
              {insertManutencao.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Inline editable FIPE input ---

function FipeInput({ value, onSave }: { value: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={val}
          onChange={e => setVal(e.target.value)}
          className="h-7 text-xs w-28"
          placeholder="R$ 0,00"
          onKeyDown={e => {
            if (e.key === "Enter") {
              onSave(val);
              setEditing(false);
            }
            if (e.key === "Escape") {
              setVal(value);
              setEditing(false);
            }
          }}
          autoFocus
        />
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { onSave(val); setEditing(false); }}>
          <CheckCircle className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setVal(value); setEditing(true); }}
      className="text-sm text-left hover:underline cursor-pointer min-w-[80px]"
    >
      {value || <span className="text-muted-foreground italic">Informar</span>}
    </button>
  );
}

export default Manutencoes;
