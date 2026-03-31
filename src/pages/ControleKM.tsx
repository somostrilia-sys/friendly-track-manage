import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useControleKM, useInsertControleKM, useUpdateControleKM, useDeleteControleKM, useTecnicos, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import { calcularDistancia } from "@/lib/geocoding";
import type { DbControleKM } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { Plus, MapPin, Route, Trash2, Inbox, Pencil, Calculator, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface InstalacaoDia {
  endereco: string;
  enderecoOrigem: string;
  horario: string;
  kmTrecho: number;
  calculando: boolean;
}

const criarInstalacaoVazia = (): InstalacaoDia => ({
  endereco: "",
  enderecoOrigem: "",
  horario: "",
  kmTrecho: 0,
  calculando: false,
});

const ControleKMPage = () => {
  const { data: registros = [], isLoading } = useControleKM();
  const { data: tecnicos = [] } = useTecnicos();
  const insertKM = useInsertControleKM();
  const updateKM = useUpdateControleKM();
  const deleteKM = useDeleteControleKM();

  useRealtimeSubscription("controle_km", ["controle_km"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<DbControleKM | null>(null);
  const [filtroTecnico, setFiltroTecnico] = useState("all");
  const [filtroData, setFiltroData] = useState("");
  const [formTecnicoId, setFormTecnicoId] = useState("");
  const [formData, setFormData] = useState("");
  const [instalacoes, setInstalacoes] = useState<InstalacaoDia[]>([criarInstalacaoVazia()]);

  // Edit single record state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEndereco, setEditEndereco] = useState("");
  const [editEnderecoOrigem, setEditEnderecoOrigem] = useState("");
  const [editHorario, setEditHorario] = useState("");
  const [editKm, setEditKm] = useState(0);
  const [editCalculando, setEditCalculando] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbControleKM | null>(null);

  const addInstalacao = () => setInstalacoes(prev => [...prev, criarInstalacaoVazia()]);
  const removeInstalacao = (i: number) => setInstalacoes(prev => prev.filter((_, idx) => idx !== i));
  const updateInstalacao = (i: number, field: keyof InstalacaoDia, value: string | number | boolean) => {
    setInstalacoes(prev => prev.map((inst, idx) => idx === i ? { ...inst, [field]: value } : inst));
  };
  const kmTotalForm = instalacoes.reduce((a, inst) => a + inst.kmTrecho, 0);

  const calcularDistanciaTrecho = async (index: number) => {
    const inst = instalacoes[index];
    if (!inst.enderecoOrigem || !inst.endereco) {
      toast.error("Preencha o endereco de origem e destino para calcular");
      return;
    }
    updateInstalacao(index, "calculando", true);
    try {
      const resultado = await calcularDistancia(inst.enderecoOrigem, inst.endereco);
      if (resultado) {
        updateInstalacao(index, "kmTrecho", Math.round(resultado.distance_km * 10) / 10);
        toast.success(`Distancia calculada: ${resultado.distance_km.toFixed(1)} km (~${Math.round(resultado.duration_minutes)} min)`);
      } else {
        toast.error("Nao foi possivel calcular a distancia. Verifique os enderecos.");
      }
    } catch {
      toast.error("Erro ao calcular distancia");
    } finally {
      updateInstalacao(index, "calculando", false);
    }
  };

  const calcularDistanciaEdit = async () => {
    if (!editEnderecoOrigem || !editEndereco) {
      toast.error("Preencha o endereco de origem e destino para calcular");
      return;
    }
    setEditCalculando(true);
    try {
      const resultado = await calcularDistancia(editEnderecoOrigem, editEndereco);
      if (resultado) {
        setEditKm(Math.round(resultado.distance_km * 10) / 10);
        toast.success(`Distancia calculada: ${resultado.distance_km.toFixed(1)} km (~${Math.round(resultado.duration_minutes)} min)`);
      } else {
        toast.error("Nao foi possivel calcular a distancia. Verifique os enderecos.");
      }
    } catch {
      toast.error("Erro ao calcular distancia");
    } finally {
      setEditCalculando(false);
    }
  };

  const filtrado = registros.filter(r => {
    if (filtroTecnico !== "all" && r.tecnico_id !== filtroTecnico) return false;
    if (filtroData && r.data !== filtroData) return false;
    return true;
  });

  // Summary: total KM per technician
  const totaisPorTecnico = filtrado.reduce((acc, r) => {
    const nome = r.tecnico_nome;
    acc[nome] = (acc[nome] || 0) + r.km_calculado;
    return acc;
  }, {} as Record<string, number>);

  const totalKm = filtrado.reduce((a, r) => a + r.km_calculado, 0);
  const tecnicosUnicos = [...new Set(filtrado.map(r => r.tecnico_nome))].length;

  const resetForm = () => {
    setFormTecnicoId("");
    setFormData("");
    setInstalacoes([criarInstalacaoVazia()]);
  };

  const salvar = async () => {
    if (!formTecnicoId || instalacoes.length === 0) {
      toast.error("Preencha o tecnico e pelo menos uma instalacao");
      return;
    }
    const tec = tecnicos.find(t => t.id === formTecnicoId);
    const data = formData || new Date().toISOString().split("T")[0];
    let count = 0;
    for (const inst of instalacoes.filter(i => i.endereco)) {
      try {
        await insertKM.mutateAsync({
          tecnico_id: formTecnicoId,
          tecnico_nome: tec?.nome || "",
          endereco_instalacao: inst.endereco,
          horario: inst.horario,
          data,
          km_calculado: inst.kmTrecho,
        });
        count++;
      } catch { /* skip */ }
    }
    setModalOpen(false);
    resetForm();
    toast.success(`${count} registro(s) salvo(s) - Total: ${kmTotalForm} km`);
  };

  const abrirEdicao = (registro: DbControleKM) => {
    setEditando(registro);
    setEditEndereco(registro.endereco_instalacao);
    setEditEnderecoOrigem("");
    setEditHorario(registro.horario);
    setEditKm(registro.km_calculado);
    setEditCalculando(false);
    setEditModalOpen(true);
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    try {
      await updateKM.mutateAsync({
        id: editando.id,
        endereco_instalacao: editEndereco,
        horario: editHorario,
        km_calculado: editKm,
      } as any);
      setEditModalOpen(false);
      setEditando(null);
      toast.success("Registro atualizado");
    } catch {
      toast.error("Erro ao atualizar registro");
    }
  };

  const confirmarExclusao = (registro: DbControleKM) => {
    setDeleteTarget(registro);
    setDeleteConfirmOpen(true);
  };

  const executarExclusao = async () => {
    if (!deleteTarget) return;
    try {
      await deleteKM.mutateAsync(deleteTarget.id);
      toast.success("Registro excluido");
    } catch {
      toast.error("Erro ao excluir registro");
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Controle de KM" subtitle="Registre e gerencie a quilometragem dos tecnicos" />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Controle de KM" subtitle="Registre e gerencie a quilometragem dos tecnicos">
        <Button onClick={() => { resetForm(); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Registrar Dia</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total KM" value={`${totalKm.toFixed(1)} km`} icon={Route} accent="primary" />
        <StatCard label="Registros" value={filtrado.length} icon={MapPin} />
        <StatCard label="Tecnicos" value={tecnicosUnicos} icon={MapPin} accent="success" />
      </div>

      {/* Filters */}
      <Card className="card-shadow">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tecnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tecnicos</SelectItem>
              {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-[160px]" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
          {(filtroTecnico !== "all" || filtroData) && (
            <Button variant="ghost" size="sm" onClick={() => { setFiltroTecnico("all"); setFiltroData(""); }}>Limpar filtros</Button>
          )}
        </div>

        {filtrado.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum registro de KM encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tecnico</TableHead>
                <TableHead>Endereco</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>KM Trecho</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.tecnico_nome}</TableCell>
                  <TableCell className="text-sm">{r.endereco_instalacao}</TableCell>
                  <TableCell>{r.horario}</TableCell>
                  <TableCell>{r.data}</TableCell>
                  <TableCell><Badge variant="secondary">{r.km_calculado} km</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => abrirEdicao(r)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => confirmarExclusao(r)} title="Excluir">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Summary by technician */}
      {Object.keys(totaisPorTecnico).length > 0 && (
        <Card className="p-6 card-shadow">
          <h3 className="font-semibold mb-4">Total de KM por Tecnico</h3>
          <div className="space-y-2">
            {Object.entries(totaisPorTecnico)
              .sort(([, a], [, b]) => b - a)
              .map(([nome, km]) => (
                <div key={nome} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">{nome}</span>
                  <Badge>{km.toFixed(1)} km</Badge>
                </div>
              ))}
            {Object.keys(totaisPorTecnico).length > 1 && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20 mt-2">
                <span className="font-semibold text-sm">Total Geral</span>
                <Badge variant="default">{totalKm.toFixed(1)} km</Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modal: New records */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Instalacoes do Dia</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tecnico</Label>
                <Select value={formTecnicoId} onValueChange={setFormTecnicoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data</Label><Input type="date" value={formData} onChange={e => setFormData(e.target.value)} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Instalacoes do Dia</Label>
                <Button size="sm" variant="outline" onClick={addInstalacao}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
              </div>
              <div className="space-y-3">
                {instalacoes.map((inst, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 border space-y-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Endereco Origem #{i + 1}</Label>
                        <Input
                          value={inst.enderecoOrigem}
                          onChange={e => updateInstalacao(i, "enderecoOrigem", e.target.value)}
                          placeholder="De onde sai... (ex: Rua X, Cidade)"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Endereco Destino #{i + 1}</Label>
                        <Input
                          value={inst.endereco}
                          onChange={e => updateInstalacao(i, "endereco", e.target.value)}
                          placeholder="Para onde vai... (ex: Rua Y, Cidade)"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="w-24">
                        <Label className="text-xs">Horario</Label>
                        <Input value={inst.horario} onChange={e => updateInstalacao(i, "horario", e.target.value)} placeholder="09:00" />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">KM Trecho</Label>
                        <Input type="number" value={inst.kmTrecho} onChange={e => updateInstalacao(i, "kmTrecho", +e.target.value)} />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => calcularDistanciaTrecho(i)}
                        disabled={inst.calculando || !inst.enderecoOrigem || !inst.endereco}
                        title="Calcular distancia automaticamente"
                      >
                        {inst.calculando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Calculator className="w-4 h-4 mr-1" />}
                        Calcular KM
                      </Button>
                      {instalacoes.length > 1 && (
                        <Button size="icon" variant="ghost" onClick={() => removeInstalacao(i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium">KM Total do Dia: <strong>{kmTotalForm.toFixed(1)} km</strong></p>
              <p className="text-xs text-muted-foreground mt-1">
                Rota: {instalacoes.filter(i => i.endereco).map(i => i.endereco.split(",")[0]).join(" -> ")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={insertKM.isPending}>
              {insertKM.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Registrar Dia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit single record */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Registro de KM</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tecnico</Label>
              <Input value={editando?.tecnico_nome || ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Data</Label>
              <Input value={editando?.data || ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Endereco de Origem (para calculo)</Label>
              <Input
                value={editEnderecoOrigem}
                onChange={e => setEditEnderecoOrigem(e.target.value)}
                placeholder="De onde saiu... (opcional, para calcular KM)"
              />
            </div>
            <div>
              <Label>Endereco Destino</Label>
              <Input
                value={editEndereco}
                onChange={e => setEditEndereco(e.target.value)}
                placeholder="Endereco da instalacao"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horario</Label>
                <Input value={editHorario} onChange={e => setEditHorario(e.target.value)} placeholder="09:00" />
              </div>
              <div>
                <Label>KM do Trecho</Label>
                <Input type="number" value={editKm} onChange={e => setEditKm(+e.target.value)} />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={calcularDistanciaEdit}
              disabled={editCalculando || !editEnderecoOrigem || !editEndereco}
            >
              {editCalculando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
              Calcular Distancia
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={updateKM.isPending}>
              {updateKM.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirm delete */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir o registro de <strong>{deleteTarget?.tecnico_nome}</strong> em <strong>{deleteTarget?.endereco_instalacao}</strong>?
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executarExclusao} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ControleKMPage;
