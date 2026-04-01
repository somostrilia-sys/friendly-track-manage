import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRetiradas, useInsertRetirada, useUpdateRetirada, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import { PackageMinus, Plus, Inbox, Package, Clock, ArrowRightLeft, Archive, Search, CalendarDays } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Retirada = {
  id: string;
  created_at: string;
  unidade_origem: string;
  associado: string;
  placa: string;
  imei: string;
  iccid: string;
  motivo: string;
  observacoes: string;
  status: string;
  unidade_destino: string | null;
};

const motivoMap: Record<string, string> = {
  cancelamento: "Cancelamento",
  inadimplencia: "Inadimplencia",
  troca: "Troca",
  outro: "Outro",
};

const statusMap: Record<string, { label: string; variant: "destructive" | "secondary" | "default" | "outline" }> = {
  pendente: { label: "Pendente", variant: "destructive" },
  retirado: { label: "Retirado", variant: "secondary" },
  em_estoque: { label: "Em Estoque", variant: "default" },
  remanejado: { label: "Remanejado", variant: "outline" },
};

const emptyForm = {
  unidade_origem: "",
  associado: "",
  placa: "",
  imei: "",
  iccid: "",
  motivo: "cancelamento",
  observacoes: "",
};

const Retiradas = () => {
  const { data: retiradas = [], isLoading } = useRetiradas();
  const insertRetirada = useInsertRetirada();
  const updateRetirada = useUpdateRetirada();

  useRealtimeSubscription("retiradas", ["retiradas"]);

  const [novaOpen, setNovaOpen] = useState(false);
  const [novaForm, setNovaForm] = useState({ ...emptyForm });
  const [detailItem, setDetailItem] = useState<Retirada | null>(null);
  const [remanejarId, setRemanejarId] = useState<string | null>(null);
  const [unidadeDestino, setUnidadeDestino] = useState("");

  // Filters
  const [filtroUnidade, setFiltroUnidade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const typed = retiradas as Retirada[];

  const filtradas = useMemo(() => {
    return typed.filter((r) => {
      if (filtroUnidade && !r.unidade_origem?.toLowerCase().includes(filtroUnidade.toLowerCase())) return false;
      if (filtroStatus !== "todos" && r.status !== filtroStatus) return false;
      if (filtroDataInicio) {
        const dataItem = new Date(r.created_at).toISOString().split("T")[0];
        if (dataItem < filtroDataInicio) return false;
      }
      if (filtroDataFim) {
        const dataItem = new Date(r.created_at).toISOString().split("T")[0];
        if (dataItem > filtroDataFim) return false;
      }
      return true;
    });
  }, [typed, filtroUnidade, filtroStatus, filtroDataInicio, filtroDataFim]);

  // Stats (mes atual)
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const retiradasMes = typed.filter((r) => r.created_at?.startsWith(mesAtual)).length;
  const aguardandoDestino = typed.filter((r) => r.status === "retirado").length;
  const remanejados = typed.filter((r) => r.status === "remanejado").length;
  const emEstoque = typed.filter((r) => r.status === "em_estoque").length;

  const criarRetirada = async () => {
    if (!novaForm.placa || !novaForm.unidade_origem || !novaForm.imei) {
      toast.error("Preencha unidade de origem, placa e IMEI");
      return;
    }
    try {
      await insertRetirada.mutateAsync({
        unidade_origem: novaForm.unidade_origem,
        associado: novaForm.associado,
        placa: novaForm.placa,
        imei: novaForm.imei,
        iccid: novaForm.iccid,
        motivo: novaForm.motivo,
        observacoes: novaForm.observacoes,
        status: "pendente",
        unidade_destino: null,
      });
      setNovaOpen(false);
      setNovaForm({ ...emptyForm });
      toast.success("Retirada registrada!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const marcarRetirado = async (id: string) => {
    try {
      await updateRetirada.mutateAsync({ id, status: "retirado" });
      toast.success("Marcado como retirado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const devolverEstoque = async (id: string) => {
    try {
      await updateRetirada.mutateAsync({ id, status: "em_estoque", unidade_destino: "Estoque" });
      toast.success("Devolvido ao estoque");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const confirmarRemanejamento = async () => {
    if (!unidadeDestino) {
      toast.error("Informe a unidade de destino");
      return;
    }
    try {
      await updateRetirada.mutateAsync({ id: remanejarId!, status: "remanejado", unidade_destino: unidadeDestino });
      setRemanejarId(null);
      setUnidadeDestino("");
      toast.success("Remanejamento registrado!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Retiradas" subtitle="Controle de retiradas e remanejamento de rastreadores" />
        <TableSkeleton rows={6} cols={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Retiradas" subtitle="Controle de retiradas e remanejamento de rastreadores">
        <Button onClick={() => setNovaOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nova Retirada
        </Button>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Retiradas (mes)" value={retiradasMes} icon={PackageMinus} accent="primary" />
        <StatCard label="Aguardando Destino" value={aguardandoDestino} icon={Clock} accent="warning" />
        <StatCard label="Remanejados" value={remanejados} icon={ArrowRightLeft} accent="success" />
        <StatCard label="Em Estoque" value={emEstoque} icon={Archive} accent="muted" />
      </div>

      {/* Filters */}
      <Card className="p-4 card-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Unidade</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por unidade..."
                value={filtroUnidade}
                onChange={(e) => setFiltroUnidade(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="retirado">Retirado</SelectItem>
                <SelectItem value="em_estoque">Em Estoque</SelectItem>
                <SelectItem value="remanejado">Remanejado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Data Inicio</Label>
            <Input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Data Fim</Label>
            <Input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} className="mt-1" />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Unidade Origem</TableHead>
              <TableHead>Associado</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
                    <div className="rounded-full bg-muted/60 p-3">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Nenhuma retirada registrada</p>
                    <p className="text-xs text-muted-foreground/60">Retiradas de rastreadores aparecerao aqui</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtradas.map((r) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailItem(r)}>
                <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="font-medium">{r.unidade_origem}</TableCell>
                <TableCell>{r.associado || "--"}</TableCell>
                <TableCell className="font-mono text-sm">{r.placa}</TableCell>
                <TableCell className="font-mono text-sm">{r.imei}</TableCell>
                <TableCell>{motivoMap[r.motivo] || r.motivo}</TableCell>
                <TableCell>{r.unidade_destino || "--"}</TableCell>
                <TableCell>
                  <Badge variant={statusMap[r.status]?.variant || "secondary"}>
                    {statusMap[r.status]?.label || r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {r.status === "pendente" && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => marcarRetirado(r.id)}>
                        Retirar
                      </Button>
                    )}
                    {r.status === "retirado" && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => devolverEstoque(r.id)}>
                          Estoque
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setRemanejarId(r.id)}>
                          Remanejar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Retirada</SheetTitle>
          </SheetHeader>
          {detailItem && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{new Date(detailItem.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusMap[detailItem.status]?.variant || "secondary"}>
                    {statusMap[detailItem.status]?.label || detailItem.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unidade de Origem</p>
                  <p className="font-medium">{detailItem.unidade_origem}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Associado/Cliente</p>
                  <p className="font-medium">{detailItem.associado || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Placa do Veiculo</p>
                  <p className="font-mono font-medium">{detailItem.placa}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IMEI do Rastreador</p>
                  <p className="font-mono font-medium">{detailItem.imei}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ICCID do Chip</p>
                  <p className="font-mono font-medium">{detailItem.iccid || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Motivo</p>
                  <p className="font-medium">{motivoMap[detailItem.motivo] || detailItem.motivo}</p>
                </div>
                {detailItem.unidade_destino && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Unidade de Destino</p>
                    <p className="font-medium">{detailItem.unidade_destino}</p>
                  </div>
                )}
              </div>
              {detailItem.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground">Observacoes</p>
                  <p className="text-sm mt-1 bg-muted/50 p-3 rounded-md">{detailItem.observacoes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t">
                {detailItem.status === "pendente" && (
                  <Button size="sm" onClick={() => { marcarRetirado(detailItem.id); setDetailItem(null); }}>
                    Marcar como Retirado
                  </Button>
                )}
                {detailItem.status === "retirado" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { devolverEstoque(detailItem.id); setDetailItem(null); }}>
                      Devolver ao Estoque
                    </Button>
                    <Button size="sm" onClick={() => { setRemanejarId(detailItem.id); setDetailItem(null); }}>
                      Remanejar para Unidade
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Nova Retirada Dialog */}
      <Dialog open={novaOpen} onOpenChange={setNovaOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Retirada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Unidade de Origem</Label>
              <Input
                value={novaForm.unidade_origem}
                onChange={(e) => setNovaForm((f) => ({ ...f, unidade_origem: e.target.value }))}
                placeholder="Nome da unidade/filial"
              />
            </div>
            <div>
              <Label>Associado/Cliente</Label>
              <Input
                value={novaForm.associado}
                onChange={(e) => setNovaForm((f) => ({ ...f, associado: e.target.value }))}
                placeholder="Nome do associado ou cliente"
              />
            </div>
            <div>
              <Label>Placa do Veiculo</Label>
              <Input
                value={novaForm.placa}
                onChange={(e) => setNovaForm((f) => ({ ...f, placa: e.target.value }))}
                placeholder="ABC-1234"
              />
            </div>
            <div>
              <Label>IMEI do Rastreador</Label>
              <Input
                value={novaForm.imei}
                onChange={(e) => setNovaForm((f) => ({ ...f, imei: e.target.value }))}
                placeholder="IMEI do equipamento"
              />
            </div>
            <div>
              <Label>ICCID do Chip</Label>
              <Input
                value={novaForm.iccid}
                onChange={(e) => setNovaForm((f) => ({ ...f, iccid: e.target.value }))}
                placeholder="ICCID do chip SIM"
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Select value={novaForm.motivo} onValueChange={(v) => setNovaForm((f) => ({ ...f, motivo: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(motivoMap).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observacoes</Label>
              <Textarea
                value={novaForm.observacoes}
                onChange={(e) => setNovaForm((f) => ({ ...f, observacoes: e.target.value }))}
                placeholder="Informacoes adicionais sobre a retirada..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={criarRetirada}>Registrar Retirada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remanejar Dialog */}
      <Dialog open={!!remanejarId} onOpenChange={() => setRemanejarId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remanejar para Unidade</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Unidade de Destino</Label>
            <Input
              value={unidadeDestino}
              onChange={(e) => setUnidadeDestino(e.target.value)}
              placeholder="Nome da unidade de destino"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemanejarId(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarRemanejamento}>Confirmar Remanejamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Retiradas;
