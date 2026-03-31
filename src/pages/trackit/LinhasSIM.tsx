import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLinhasSIM, useInsertLinhaSIM, useUpdateLinhaSIM, useDeleteLinhaSIM, useClientes, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbLinhaSIM } from "@/types/database";
import { consultarLinha, enviarComandoSMS, ativarLinha, desativarLinha } from "@/lib/arqia";
import { Plus, Wifi, WifiOff, Upload, Download, Inbox, Pencil, Trash2, Radio, Send, Power, PowerOff, Search, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const LinhasSIM = () => {
  const { data: linhas = [], isLoading } = useLinhasSIM();
  const { data: clientes = [] } = useClientes();
  const insertLinha = useInsertLinhaSIM();
  const updateLinha = useUpdateLinhaSIM();
  const deleteLinha = useDeleteLinhaSIM();

  useRealtimeSubscription("linhas_sim", ["linhas_sim"]);

  const [filtro, setFiltro] = useState<"all" | "online" | "offline">("all");
  const [filtroCliente, setFiltroCliente] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbLinhaSIM | null>(null);
  const [gerenciamentoOpen, setGerenciamentoOpen] = useState(false);
  const [gerenciamentoLinha, setGerenciamentoLinha] = useState<DbLinhaSIM | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyForm = { iccid: "", operadora: "Vivo", numero: "", empresa_id: "", veiculo: "", fornecedor: "", status: "offline" as "online" | "offline" };
  const [form, setForm] = useState(emptyForm);

  // Gerenciamento de Linha state
  const [consultaResult, setConsultaResult] = useState<Record<string, unknown> | null>(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [smsComando, setSmsComando] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);
  const [ativarLoading, setAtivarLoading] = useState(false);
  const [desativarLoading, setDesativarLoading] = useState(false);

  const filtrado = linhas.filter(l => {
    if (filtro !== "all" && l.status !== filtro) return false;
    if (filtroCliente !== "all" && l.empresa_id !== filtroCliente) return false;
    return true;
  });
  const online = linhas.filter(l => l.status === "online").length;
  const offline = linhas.filter(l => l.status === "offline").length;

  const openCreate = () => {
    setEditMode(false);
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (linha: DbLinhaSIM) => {
    setEditMode(true);
    setEditId(linha.id);
    setForm({
      iccid: linha.iccid,
      operadora: linha.operadora,
      numero: linha.numero,
      empresa_id: linha.empresa_id || "",
      veiculo: linha.veiculo,
      fornecedor: linha.fornecedor || "",
      status: linha.status,
    });
    setModalOpen(true);
  };

  const openGerenciamento = (linha: DbLinhaSIM) => {
    setGerenciamentoLinha(linha);
    setConsultaResult(null);
    setSmsComando("");
    setGerenciamentoOpen(true);
  };

  const salvar = async () => {
    if (!form.iccid || !form.empresa_id) { toast.error("Preencha ICCID e empresa"); return; }
    const empresa = clientes.find(c => c.id === form.empresa_id);

    try {
      if (editMode && editId) {
        await updateLinha.mutateAsync({
          id: editId,
          iccid: form.iccid,
          operadora: form.operadora,
          numero: form.numero,
          fornecedor: form.fornecedor,
          empresa_id: form.empresa_id,
          empresa_nome: empresa?.nome || "",
          veiculo: form.veiculo,
          status: form.status,
        });
        toast.success("Linha atualizada!");
      } else {
        await insertLinha.mutateAsync({
          ...form,
          status: form.status,
          empresa_nome: empresa?.nome || "",
          ultima_conexao: "Nunca",
        });
        toast.success("Linha SIM adicionada!");
      }
      setModalOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const confirmarDelete = (linha: DbLinhaSIM) => {
    setDeleteTarget(linha);
    setDeleteConfirmOpen(true);
  };

  const executarDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLinha.mutateAsync(deleteTarget.id);
      toast.success("Linha removida!");
    } catch (e: any) {
      toast.error(e.message);
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  // Gerenciamento actions
  const handleConsultar = async () => {
    if (!gerenciamentoLinha) return;
    setConsultaLoading(true);
    try {
      const result = await consultarLinha(gerenciamentoLinha.iccid);
      setConsultaResult(result);
      toast.success("Consulta realizada!");
    } catch (e: any) {
      toast.error(`Erro ao consultar: ${e.message}`);
    } finally {
      setConsultaLoading(false);
    }
  };

  const handleEnviarSMS = async () => {
    if (!gerenciamentoLinha || !smsComando.trim()) {
      toast.error("Digite o comando para enviar");
      return;
    }
    setSmsLoading(true);
    try {
      await enviarComandoSMS(gerenciamentoLinha.iccid, smsComando.trim());
      toast.success("Comando SMS enviado!");
      setSmsComando("");
    } catch (e: any) {
      toast.error(`Erro ao enviar SMS: ${e.message}`);
    } finally {
      setSmsLoading(false);
    }
  };

  const handleAtivar = async () => {
    if (!gerenciamentoLinha) return;
    setAtivarLoading(true);
    try {
      await ativarLinha(gerenciamentoLinha.iccid);
      await updateLinha.mutateAsync({ id: gerenciamentoLinha.id, status: "online" });
      toast.success("Linha ativada!");
    } catch (e: any) {
      toast.error(`Erro ao ativar: ${e.message}`);
    } finally {
      setAtivarLoading(false);
    }
  };

  const handleDesativar = async () => {
    if (!gerenciamentoLinha) return;
    setDesativarLoading(true);
    try {
      await desativarLinha(gerenciamentoLinha.iccid);
      await updateLinha.mutateAsync({ id: gerenciamentoLinha.id, status: "offline" });
      toast.success("Linha desativada!");
    } catch (e: any) {
      toast.error(`Erro ao desativar: ${e.message}`);
    } finally {
      setDesativarLoading(false);
    }
  };

  const baixarTemplate = () => {
    const csv = "iccid;operadora;numero;fornecedor;empresa_id;veiculo";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template-linhas-sim.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.info("Template CSV baixado!");
  };

  const importarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/);
        if (cols.length < 3) continue;
        const empresa = clientes.find(c => c.id === cols[4]?.trim());
        try {
          await insertLinha.mutateAsync({
            iccid: cols[0]?.trim() || "",
            operadora: cols[1]?.trim() || "Vivo",
            numero: cols[2]?.trim() || "",
            fornecedor: cols[3]?.trim() || "",
            empresa_id: cols[4]?.trim() || "",
            empresa_nome: empresa?.nome || "",
            veiculo: cols[5]?.trim() || "",
            status: "offline",
            ultima_conexao: "Nunca",
          });
          count++;
        } catch { /* skip */ }
      }
      toast.success(`${count} linhas importadas!`);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Linhas SIM" subtitle="Status das linhas por empresa, ICCID e fornecedor" />
      <TableSkeleton rows={6} cols={8} />
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Linhas SIM" subtitle="Status das linhas por empresa, ICCID e fornecedor">
        <Button variant="outline" onClick={baixarTemplate}><Download className="w-4 h-4 mr-2" /> Template</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar</Button>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Nova Linha</Button>
      </PageHeader>
      <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={importarCSV} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Linhas" value={linhas.length} icon={Wifi} accent="primary" />
        <StatCard label="Online" value={online} icon={Wifi} accent="success" />
        <StatCard label="Offline" value={offline} icon={WifiOff} accent="destructive" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "online", "offline"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {f === "all" ? "Todas" : f === "online" ? "Online" : "Offline"}
          </button>
        ))}
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Filtrar cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Clientes</SelectItem>
            {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="card-shadow overflow-hidden">
        {filtrado.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ICCID</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Numero</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Veiculo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultima Conexao</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-sm">{l.iccid}</TableCell>
                  <TableCell>{l.operadora}</TableCell>
                  <TableCell>{l.numero}</TableCell>
                  <TableCell><Badge variant="outline">{l.fornecedor || "--"}</Badge></TableCell>
                  <TableCell>{l.empresa_nome}</TableCell>
                  <TableCell className="font-medium">{l.veiculo}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === "online" ? "default" : "secondary"}>
                      <span className={`w-2 h-2 rounded-full mr-1.5 inline-block ${l.status === "online" ? "bg-success" : "bg-destructive"}`} />
                      {l.status === "online" ? "Online" : "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{l.ultima_conexao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openGerenciamento(l)} title="Gerenciamento de Linha">
                        <Radio className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => confirmarDelete(l)} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Dialog: Nova / Editar Linha */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMode ? "Editar Linha SIM" : "Nova Linha SIM"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>ICCID</Label><Input value={form.iccid} onChange={e => setForm(f => ({ ...f, iccid: e.target.value }))} placeholder="89550312345678900XX" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Operadora</Label>
                <Select value={form.operadora} onValueChange={v => setForm(f => ({ ...f, operadora: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vivo">Vivo</SelectItem>
                    <SelectItem value="Claro">Claro</SelectItem>
                    <SelectItem value="Tim">Tim</SelectItem>
                    <SelectItem value="Oi">Oi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input
                  value={form.fornecedor}
                  onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))}
                  placeholder="Ex: Arqia, SmartSim, Linkfield..."
                />
              </div>
            </div>
            <div><Label>Numero</Label><Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} /></div>
            <div><Label>Cliente B2B</Label>
              <Select value={form.empresa_id} onValueChange={v => setForm(f => ({ ...f, empresa_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Veiculo (Placa)</Label><Input value={form.veiculo} onChange={e => setForm(f => ({ ...f, veiculo: e.target.value }))} /></div>
            {editMode && (
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as "online" | "offline" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>{editMode ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar exclusao */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir a linha <strong className="font-mono">{deleteTarget?.iccid}</strong>? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executarDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Gerenciamento de Linha (Arqia) */}
      <Dialog open={gerenciamentoOpen} onOpenChange={setGerenciamentoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciamento de Linha</DialogTitle>
            {gerenciamentoLinha && (
              <p className="text-sm text-muted-foreground mt-1">
                ICCID: <span className="font-mono">{gerenciamentoLinha.iccid}</span>
                {gerenciamentoLinha.numero && <> &middot; {gerenciamentoLinha.numero}</>}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-5">
            {/* Consultar Status */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4" /> Consultar Status
              </Label>
              <p className="text-xs text-muted-foreground">Busca informacoes da linha na operadora Arqia.</p>
              <Button variant="outline" size="sm" onClick={handleConsultar} disabled={consultaLoading}>
                {consultaLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Consultar
              </Button>
              {consultaResult && (
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40 mt-2">
                  {JSON.stringify(consultaResult, null, 2)}
                </pre>
              )}
            </div>

            <hr />

            {/* Enviar Comando SMS */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Send className="w-4 h-4" /> Enviar Comando SMS
              </Label>
              <p className="text-xs text-muted-foreground">Envia um comando via SMS para o dispositivo vinculado a esta linha.</p>
              <Textarea
                value={smsComando}
                onChange={e => setSmsComando(e.target.value)}
                placeholder="Digite o comando..."
                rows={2}
              />
              <Button variant="outline" size="sm" onClick={handleEnviarSMS} disabled={smsLoading || !smsComando.trim()}>
                {smsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar SMS
              </Button>
            </div>

            <hr />

            {/* Ativar / Desativar */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Power className="w-4 h-4" /> Ativar / Desativar Linha
              </Label>
              <p className="text-xs text-muted-foreground">Ativa ou desativa esta linha na operadora. O status local sera atualizado automaticamente.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleAtivar} disabled={ativarLoading} className="text-green-600 border-green-300 hover:bg-green-50">
                  {ativarLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Power className="w-4 h-4 mr-2" />}
                  Ativar
                </Button>
                <Button variant="outline" size="sm" onClick={handleDesativar} disabled={desativarLoading} className="text-red-600 border-red-300 hover:bg-red-50">
                  {desativarLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PowerOff className="w-4 h-4 mr-2" />}
                  Desativar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinhasSIM;
