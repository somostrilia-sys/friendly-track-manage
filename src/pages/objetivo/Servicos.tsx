import { useState, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useServicos, useInsertServico, useUpdateServico, useTecnicos, useClientes, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import type { DbServico } from "@/types/database";
import { MapPin, Navigation, ExternalLink, Plus, Copy, Check, Inbox, Search, CalendarDays, Clock, PlayCircle, CheckCircle, Users, Camera, Upload, X, Image } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; class: string }> = {
  agendado: { label: "Agendado", class: "bg-secondary text-secondary-foreground" },
  aceito: { label: "Aceito", class: "bg-primary text-primary-foreground" },
  em_deslocamento: { label: "Em Deslocamento", class: "bg-warning text-warning-foreground" },
  em_execucao: { label: "Em Execucao", class: "bg-primary text-primary-foreground" },
  concluido: { label: "Concluido", class: "bg-success text-success-foreground" },
  cancelado: { label: "Cancelado", class: "bg-destructive text-destructive-foreground" },
};
const tipoMap: Record<string, string> = { instalacao: "Instalacao", manutencao: "Manutencao", remocao: "Remocao", troca: "Troca" };

const statusFlow: Record<string, string> = {
  agendado: "aceito",
  aceito: "em_deslocamento",
  em_deslocamento: "em_execucao",
  em_execucao: "concluido",
};

type FotoTipo = "imei" | "chip" | "instalacao";

const fotoLabels: Record<FotoTipo, string> = {
  imei: "Foto do IMEI",
  chip: "Foto do Chip",
  instalacao: "Foto da Instalacao",
};

const Servicos = () => {
  const { data: servicos = [], isLoading } = useServicos();
  const { data: tecnicos = [] } = useTecnicos();
  const { data: clientes = [] } = useClientes();
  const insertServico = useInsertServico();
  const updateServico = useUpdateServico();

  useRealtimeSubscription("servicos_agendados", ["servicos_agendados"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Photo upload dialog state
  const [fotoDialogOpen, setFotoDialogOpen] = useState(false);
  const [fotoServico, setFotoServico] = useState<DbServico | null>(null);
  const [fotos, setFotos] = useState<Record<FotoTipo, File | null>>({ imei: null, chip: null, instalacao: null });
  const [fotoPreviews, setFotoPreviews] = useState<Record<FotoTipo, string | null>>({ imei: null, chip: null, instalacao: null });
  const [fotoUploading, setFotoUploading] = useState(false);
  const [fotoErrors, setFotoErrors] = useState<Record<FotoTipo, string>>({ imei: "", chip: "", instalacao: "" });
  const fileInputRefs = {
    imei: useRef<HTMLInputElement>(null),
    chip: useRef<HTMLInputElement>(null),
    instalacao: useRef<HTMLInputElement>(null),
  };

  const emptyForm = { tecnico_id: "", cliente_nome: "", veiculo: "", tipo: "instalacao" as DbServico["tipo"], endereco: "", cidade: "", estado: "", data: "", horario: "", valor_servico: 0, imei: "", chip: "" };
  const [form, setForm] = useState(emptyForm);

  // Sort technicians by proximity to client city/state
  const tecnicosOrdenados = useMemo(() => {
    if (!form.cidade && !form.estado) return tecnicos.filter(t => t.status === "disponivel");
    const cidadeLower = form.cidade.toLowerCase().trim();
    const estadoUpper = form.estado.toUpperCase().trim();
    return [...tecnicos]
      .filter(t => t.status === "disponivel")
      .sort((a, b) => {
        const aMesmaCidade = a.cidade?.toLowerCase().trim() === cidadeLower;
        const bMesmaCidade = b.cidade?.toLowerCase().trim() === cidadeLower;
        const aMesmoEstado = a.estado?.toUpperCase().trim() === estadoUpper;
        const bMesmoEstado = b.estado?.toUpperCase().trim() === estadoUpper;
        if (aMesmaCidade && !bMesmaCidade) return -1;
        if (!aMesmaCidade && bMesmaCidade) return 1;
        if (aMesmoEstado && !bMesmoEstado) return -1;
        if (!aMesmoEstado && bMesmoEstado) return 1;
        return 0;
      });
  }, [tecnicos, form.cidade, form.estado]);

  // Auto-pull technician value
  const onTecnicoChange = (tecnicoId: string) => {
    const tec = tecnicos.find(t => t.id === tecnicoId);
    setForm(f => ({
      ...f,
      tecnico_id: tecnicoId,
      valor_servico: tec?.valor_instalacao || tec?.valor_servico || f.valor_servico,
    }));
  };

  const salvar = async () => {
    if (!form.tecnico_id || !form.cliente_nome) { toast.error("Preencha tecnico e cliente"); return; }
    const tec = tecnicos.find(t => t.id === form.tecnico_id);
    const codigo = `OS-${String(servicos.length + 1).padStart(3, "0")}`;
    try {
      const { chip: _chip, imei: _imei, ...formData } = form;
      await insertServico.mutateAsync({
        ...formData,
        tecnico_nome: tec?.nome || "",
        status: "agendado",
      });
      setModalOpen(false);
      setForm(emptyForm);
      toast.success("Ordem de servico criada!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleFotoSelect = (tipo: FotoTipo, file: File | null) => {
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setFotoErrors(prev => ({ ...prev, [tipo]: "Selecione um arquivo de imagem" }));
      return;
    }
    setFotoErrors(prev => ({ ...prev, [tipo]: "" }));
    setFotos(prev => ({ ...prev, [tipo]: file }));
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFotoPreviews(prev => ({ ...prev, [tipo]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeFoto = (tipo: FotoTipo) => {
    setFotos(prev => ({ ...prev, [tipo]: null }));
    setFotoPreviews(prev => ({ ...prev, [tipo]: null }));
    setFotoErrors(prev => ({ ...prev, [tipo]: "" }));
    if (fileInputRefs[tipo].current) {
      fileInputRefs[tipo].current!.value = "";
    }
  };

  const uploadFotosAndConcluir = async () => {
    if (!fotoServico) return;

    // Validar fotos obrigatórias
    const missing: string[] = [];
    (["imei", "chip", "instalacao"] as FotoTipo[]).forEach(tipo => {
      if (!fotos[tipo]) missing.push(fotoLabels[tipo]);
    });
    if (missing.length > 0) {
      const newErrors = { imei: "", chip: "", instalacao: "" };
      if (!fotos.imei) newErrors.imei = "Obrigatorio";
      if (!fotos.chip) newErrors.chip = "Obrigatorio";
      if (!fotos.instalacao) newErrors.instalacao = "Obrigatorio";
      setFotoErrors(newErrors);
      toast.error(`Fotos obrigatorias: ${missing.join(", ")}`);
      return;
    }

    setFotoUploading(true);
    try {
      const urls: Record<string, string> = {};
      for (const tipo of ["imei", "chip", "instalacao"] as FotoTipo[]) {
        const file = fotos[tipo]!;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${fotoServico.codigo}/${tipo}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("instalacao-fotos")
          .upload(path, file, { upsert: true });

        if (uploadError) throw new Error(`Erro ao enviar ${fotoLabels[tipo]}: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("instalacao-fotos")
          .getPublicUrl(path);

        urls[`foto_${tipo}`] = urlData.publicUrl;
      }

      // Update service order with photo URLs and mark as concluido
      await updateServico.mutateAsync({
        id: fotoServico.id,
        status: "concluido",
        foto_imei: urls.foto_imei,
        foto_chip: urls.foto_chip,
        foto_instalacao: urls.foto_instalacao,
      } as any);

      toast.success("Fotos enviadas e OS marcada como concluida!");
      closeFotoDialog();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setFotoUploading(false);
    }
  };

  const closeFotoDialog = () => {
    setFotoDialogOpen(false);
    setFotoServico(null);
    setFotos({ imei: null, chip: null, instalacao: null });
    setFotoPreviews({ imei: null, chip: null, instalacao: null });
    setFotoErrors({ imei: "", chip: "", instalacao: "" });
  };

  const avancarStatus = async (id: string, statusAtual: string) => {
    const proximo = statusFlow[statusAtual];
    if (!proximo) return;

    // If advancing to concluido, show photo upload dialog instead
    if (proximo === "concluido") {
      const servico = servicos.find(s => s.id === id);
      if (servico) {
        setFotoServico(servico);
        setFotoDialogOpen(true);
      }
      return;
    }

    try {
      await updateServico.mutateAsync({ id, status: proximo } as any);
      toast.success(`Status alterado para ${statusMap[proximo]?.label}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const baseUrl = window.location.origin;
  const copyLink = (type: string, id: string) => {
    const link = `${baseUrl}/servico/${type}/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(`${type}-${id}`);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Servicos Agendados" subtitle="Ordens de servico e acompanhamento" />
      <TableSkeleton rows={5} cols={6} />
    </div>
  );

  const agendados = servicos.filter(s => s.status === "agendado").length;
  const emAndamento = servicos.filter(s => ["aceito", "em_deslocamento", "em_execucao"].includes(s.status)).length;
  const concluidos = servicos.filter(s => s.status === "concluido").length;
  const total = servicos.length;

  const filtered = servicos.filter(s => {
    const matchBusca = !busca || s.codigo.toLowerCase().includes(busca.toLowerCase()) || s.tecnico_nome?.toLowerCase().includes(busca.toLowerCase()) || s.cliente_nome?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || s.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Servicos Agendados" subtitle="Ordens de servico e acompanhamento">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova OS</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Agendadas" value={agendados} icon={CalendarDays} accent="muted" />
        <StatCard label="Em Andamento" value={emAndamento} icon={PlayCircle} accent="warning" />
        <StatCard label="Concluidas" value={concluidos} icon={CheckCircle} accent="success" />
        <StatCard label="Total" value={total} icon={Clock} accent="primary" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar OS, tecnico ou cliente..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 && (
          <Card className="p-0">
            <div className="flex flex-col items-center justify-center py-14 space-y-3 text-center">
              <div className="rounded-full bg-muted/60 p-4"><Inbox className="h-7 w-7 text-muted-foreground" /></div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma ordem de servico encontrada</p>
              <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}><Plus className="w-3 h-3 mr-1" /> Nova OS</Button>
            </div>
          </Card>
        )}
        {filtered.map(s => (
          <Card key={s.id} className="p-5 card-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-sm">{s.codigo}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[s.status]?.class}`}>{statusMap[s.status]?.label}</span>
                  <Badge variant="secondary">{tipoMap[s.tipo]}</Badge>
                </div>
                <div className="text-sm">
                  <p><strong>Tecnico:</strong> {s.tecnico_nome}</p>
                  <p><strong>Cliente:</strong> {s.cliente_nome}</p>
                  <p><strong>Veiculo:</strong> {s.veiculo}</p>
                  <p className="text-muted-foreground">{s.endereco} — {s.cidade}/{s.estado}</p>
                  <p className="text-muted-foreground">{s.data} as {s.horario}</p>
                </div>
                {s.status === "concluido" && (s.foto_imei || s.foto_chip || s.foto_instalacao) && (
                  <div className="flex items-center gap-2 pt-1">
                    <Camera className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Fotos anexadas</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className="font-semibold">R$ {s.valor_servico}</span>
                {statusFlow[s.status] && (
                  <Button size="sm" onClick={() => avancarStatus(s.id, s.status)}>
                    {statusMap[statusFlow[s.status]]?.label} →
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => copyLink("tecnico", s.codigo)}>
                    {copiedId === `tecnico-${s.codigo}` ? <Check className="w-3 h-3 mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
                    Tecnico
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => copyLink("cliente", s.codigo)}>
                    {copiedId === `cliente-${s.codigo}` ? <Check className="w-3 h-3 mr-1" /> : <ExternalLink className="w-3 h-3 mr-1" />}
                    Cliente
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Nova OS Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Ordem de Servico</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Cliente</Label>
              <Select value={form.cliente_nome} onValueChange={v => setForm(f => ({ ...f, cliente_nome: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Veiculo</Label><Input value={form.veiculo} onChange={e => setForm(f => ({ ...f, veiculo: e.target.value }))} placeholder="Modelo - Placa" /></div>
            <div className="col-span-2"><Label>Endereco do Cliente</Label><Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, numero, bairro" /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Preencha para ver tecnicos proximos" /></div>
            <div><Label>Estado</Label><Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="SP" maxLength={2} /></div>

            {/* Technician selection with proximity indicators */}
            <div className="col-span-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Tecnico {form.cidade && <span className="text-xs text-muted-foreground font-normal">— ordenado por proximidade de {form.cidade}</span>}
              </Label>
              <Select value={form.tecnico_id} onValueChange={onTecnicoChange}>
                <SelectTrigger><SelectValue placeholder="Selecione o tecnico" /></SelectTrigger>
                <SelectContent>
                  {tecnicosOrdenados.map(t => {
                    const mesmaCidade = form.cidade && t.cidade?.toLowerCase().trim() === form.cidade.toLowerCase().trim();
                    const mesmoEstado = form.estado && t.estado?.toUpperCase().trim() === form.estado.toUpperCase().trim();
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        {mesmaCidade ? "● " : mesmoEstado ? "○ " : ""}{t.nome} — {t.cidade}/{t.estado} — R$ {t.valor_instalacao || 0}/inst.
                        {mesmaCidade ? " (mesma cidade)" : mesmoEstado ? " (mesmo estado)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {form.cidade && tecnicosOrdenados.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">● mesma cidade &nbsp; ○ mesmo estado</p>
              )}
              {form.cidade && tecnicosOrdenados.filter(t => t.cidade?.toLowerCase().trim() === form.cidade.toLowerCase().trim()).length === 0 && (
                <p className="text-xs text-orange-400 mt-1">Nenhum tecnico cadastrado em {form.cidade}. Use "Buscar Tecnicos" para encontrar prestadores na regiao.</p>
              )}
            </div>

            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as DbServico["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tipoMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor do Servico (R$)</Label><Input type="number" value={form.valor_servico || ""} onChange={e => setForm(f => ({ ...f, valor_servico: +e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div><Label>Horario</Label><Input type="time" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} /></div>
            <div><Label>IMEI do Rastreador</Label><Input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} placeholder="IMEI do rastreador" /></div>
            <div><Label>Numero do Chip</Label><Input value={form.chip} onChange={e => setForm(f => ({ ...f, chip: e.target.value }))} placeholder="Numero do SIM" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Criar OS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog for Concluir OS */}
      <Dialog open={fotoDialogOpen} onOpenChange={(open) => { if (!open) closeFotoDialog(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Fotos Obrigatorias — Concluir OS
            </DialogTitle>
          </DialogHeader>
          {fotoServico && (
            <p className="text-sm text-muted-foreground">
              OS: <span className="font-mono font-semibold text-foreground">{fotoServico.codigo}</span>
              {" | "}{fotoServico.cliente_nome} — {fotoServico.veiculo}
            </p>
          )}
          <div className="space-y-5">
            {(["imei", "chip", "instalacao"] as FotoTipo[]).map(tipo => (
              <div key={tipo} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  {fotoLabels[tipo]}
                  <span className="text-destructive">*</span>
                </Label>
                {fotoPreviews[tipo] ? (
                  <div className="relative inline-block">
                    <img
                      src={fotoPreviews[tipo]!}
                      alt={fotoLabels[tipo]}
                      className="w-40 h-28 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeFoto(tipo)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors ${fotoErrors[tipo] ? "border-destructive" : "border-muted-foreground/30"}`}
                    onClick={() => fileInputRefs[tipo].current?.click()}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                  </div>
                )}
                <input
                  ref={fileInputRefs[tipo]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFotoSelect(tipo, e.target.files?.[0] || null)}
                />
                {fotoErrors[tipo] && (
                  <p className="text-xs text-destructive">{fotoErrors[tipo]}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeFotoDialog} disabled={fotoUploading}>
              Cancelar
            </Button>
            <Button onClick={uploadFotosAndConcluir} disabled={fotoUploading}>
              {fotoUploading ? "Enviando..." : "Enviar Fotos e Concluir OS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Servicos;
