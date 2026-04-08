import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useClientesCompletos, useInsertCliente, useUpdateCliente, useDeleteCliente, useInsertHistoricoContato, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import { Plus, Search, Eye, Pencil, Trash2, Inbox } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { DbCliente } from "@/types/database";

const statusAcessoMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  credenciais_enviadas: { label: "Credenciais Enviadas", variant: "secondary" },
  ativo: { label: "Ativo", variant: "default" },
};

const tiposServico = [
  "Plataforma de Rastreamento", "Rastreador + Instalacao", "Linha/SIM Card",
  "Combo Completo (Rastreador + Linha + Plataforma)", "Manutencao de Equipamento", "Monitoramento 24h", "Outro",
];

type ClienteComHistorico = DbCliente & { historicoContatos: { data: string; tipo: string; descricao: string }[] };

const emptyForm: Record<string, any> = {
  nome: "", razao_social: "", tipo: "empresa", cnpj: "", email: "", telefone: "",
  responsavel: "", endereco: "", cidade: "", estado: "", cep: "", veiculos_ativos: 0, status: "ativo",
  status_acesso: "pendente", cpf_associado: "", email_associado: "", filial: "", tipo_servico: "",
};

// Generate consistent pastel color from string
function getAvatarColor(name: string): string {
  const colors = [
    "bg-primary/15 text-primary",
    "bg-success/15 text-success",
    "bg-warning/15 text-warning",
    "bg-destructive/15 text-destructive",
    "bg-accent/15 text-accent",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const Clientes = () => {
  const { data: clientes = [], isLoading } = useClientesCompletos();
  const insertCliente = useInsertCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();
  const insertContato = useInsertHistoricoContato();

  useRealtimeSubscription("clientes", ["clientes", "clientes_completos"]);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"all" | "ativo" | "inativo">("all");
  const [filtroTipo, setFiltroTipo] = useState<"all" | "empresa" | "associacao">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<ClienteComHistorico | null>(null);
  const [detalhe, setDetalhe] = useState<ClienteComHistorico | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [novoContato, setNovoContato] = useState({ tipo: "", descricao: "" });
  const filtrado = (clientes as ClienteComHistorico[]).filter(c => {
    const matchBusca = (c.nome || "").toLowerCase().includes(busca.toLowerCase()) || (c.cnpj || "").includes(busca);
    const matchStatus = filtroStatus === "all" || c.status === filtroStatus;
    const matchTipo = filtroTipo === "all" || c.tipo === filtroTipo;
    return matchBusca && matchStatus && matchTipo;
  });

  const abrirNovo = () => { setForm(emptyForm); setEditando(null); setModalOpen(true); };
  const abrirEditar = (c: ClienteComHistorico) => {
    setForm({
      nome: c.nome, razao_social: c.razao_social, tipo: c.tipo as "empresa" | "associacao", cnpj: c.cnpj, email: c.email,
      telefone: c.telefone, responsavel: c.responsavel, endereco: c.endereco, cidade: c.cidade,
      estado: c.estado, cep: c.cep, veiculos_ativos: c.veiculos_ativos, status: c.status as "ativo" | "inativo",
      status_acesso: c.status_acesso as "pendente" | "credenciais_enviadas" | "ativo", cpf_associado: c.cpf_associado, email_associado: c.email_associado,
      filial: c.filial, tipo_servico: c.tipo_servico,
    });
    setEditando(c);
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.cnpj) { toast.error("Preencha nome e CNPJ"); return; }
    try {
      if (editando) {
        await updateCliente.mutateAsync({ id: editando.id, ...form });
        toast.success("Cliente atualizado!");
      } else {
        await insertCliente.mutateAsync(form);
        toast.success("Cliente cadastrado!");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const excluir = async (id: string) => {
    try {
      await deleteCliente.mutateAsync(id);
      toast.success("Cliente removido!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const adicionarContato = async () => {
    if (!detalhe || !novoContato.descricao) return;
    try {
      await insertContato.mutateAsync({
        cliente_id: detalhe.id,
        data: new Date().toISOString().split("T")[0],
        tipo: novoContato.tipo,
        descricao: novoContato.descricao,
      });
      setNovoContato({ tipo: "", descricao: "" });
      toast.success("Contato registrado!");
      setDetalhe(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const setField = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Clientes" subtitle="Gerenciamento de clientes do sistema" />
      <TableSkeleton rows={6} cols={7} />
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Clientes" subtitle="Gerenciamento de clientes do sistema">
        <Button onClick={abrirNovo} className="gap-2"><Plus className="w-4 h-4" /> Novo Cliente</Button>
      </PageHeader>

      <Card className="card-shadow overflow-hidden">
        <div className="p-4 border-b border-border/30 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input placeholder="Buscar por nome ou CNPJ..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "ativo", "inativo"] as const).map(f => (
              <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filtroStatus === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {f === "all" ? "Todos" : f === "ativo" ? "Ativos" : "Inativos"}
              </button>
            ))}
            {(["all", "empresa", "associacao"] as const).map(f => (
              <button key={f} onClick={() => setFiltroTipo(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filtroTipo === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {f === "all" ? "Tipo: Todos" : f === "empresa" ? "Empresa" : "Associacao"}
              </button>
            ))}
          </div>
        </div>

        {filtrado.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Tipo Servico</TableHead><TableHead>Filial</TableHead><TableHead>Acesso</TableHead>
                <TableHead>Veiculos</TableHead><TableHead>Status</TableHead><TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getAvatarColor(c.nome)}`}>
                        {c.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">{c.cnpj}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                      {c.tipo === "empresa" ? "Empresa" : "Associacao"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.tipo_servico || "--"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.filial || "--"}</TableCell>
                  <TableCell>
                    {(() => {
                      const acesso = (!c.status_acesso || c.status_acesso === "pendente") ? (c.status === "ativo" ? "ativo" : "pendente") : c.status_acesso;
                      return (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          acesso === "ativo" ? "bg-success/10 text-success" :
                          acesso === "credenciais_enviadas" ? "bg-primary/10 text-primary" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {statusAcessoMap[acesso]?.label || acesso}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-sm">{c.veiculos_ativos}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${c.status === "ativo" ? "bg-success" : "bg-muted-foreground/40"}`} />
                      <span className="text-sm">{c.status === "ativo" ? "Ativo" : "Inativo"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 row-actions">
                      <Button size="icon" variant="ghost" onClick={() => setDetalhe(c)}><Eye className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => abrirEditar(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => excluir(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="p-4 border-t border-border/30">
          <span className="text-xs text-muted-foreground">Total: {filtrado.length} clientes</span>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Nome Fantasia</Label><Input value={form.nome} onChange={e => setField("nome", e.target.value)} /></div>
            <div className="col-span-2"><Label>Razao Social</Label><Input value={form.razao_social} onChange={e => setField("razao_social", e.target.value)} /></div>
            <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setField("cnpj", e.target.value)} placeholder="00.000.000/0001-00" /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setField("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="empresa">Empresa</SelectItem><SelectItem value="associacao">Associacao</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Tipo de Servico</Label>
              <Select value={form.tipo_servico} onValueChange={v => setField("tipo_servico", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o servico contratado" /></SelectTrigger>
                <SelectContent>{tiposServico.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Responsavel</Label><Input value={form.responsavel} onChange={e => setField("responsavel", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setField("telefone", e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setField("email", e.target.value)} /></div>
            <div><Label>CPF Associado</Label><Input value={form.cpf_associado} onChange={e => setField("cpf_associado", e.target.value)} /></div>
            <div><Label>Email Associado</Label><Input value={form.email_associado} onChange={e => setField("email_associado", e.target.value)} /></div>
            <div><Label>Filial</Label><Input value={form.filial} onChange={e => setField("filial", e.target.value)} /></div>
            <div><Label>Status Acesso</Label>
              <Select value={form.status_acesso} onValueChange={v => setField("status_acesso", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="credenciais_enviadas">Credenciais Enviadas</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Endereco</Label><Input value={form.endereco} onChange={e => setField("endereco", e.target.value)} /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setField("cidade", e.target.value)} /></div>
            <div><Label>Estado</Label><Input value={form.estado} onChange={e => setField("estado", e.target.value)} placeholder="SP" /></div>
            <div><Label>CEP</Label><Input value={form.cep} onChange={e => setField("cep", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>{editando ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold ${getAvatarColor(detalhe.nome)}`}>
                    {detalhe.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle>{detalhe.nome}</SheetTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{detalhe.cnpj}</p>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Razao Social</span><p className="font-medium">{detalhe.razao_social}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Tipo</span><p><span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">{detalhe.tipo === "empresa" ? "Empresa" : "Associacao"}</span></p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Tipo Servico</span><p className="font-medium">{detalhe.tipo_servico || "--"}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</span><p><span className={`inline-flex items-center gap-1.5 text-sm`}><span className={`w-2 h-2 rounded-full ${detalhe.status === "ativo" ? "bg-success" : "bg-muted-foreground/40"}`} />{detalhe.status}</span></p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Status Acesso</span><p><Badge variant={statusAcessoMap[detalhe.status_acesso]?.variant}>{statusAcessoMap[detalhe.status_acesso]?.label}</Badge></p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Filial</span><p className="font-medium">{detalhe.filial || "--"}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">CPF Associado</span><p className="font-medium">{detalhe.cpf_associado || "--"}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email Associado</span><p className="font-medium">{detalhe.email_associado || "--"}</p></div>
                </div>

                <div className="border-t border-border/30 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Responsavel</span><p className="font-medium">{detalhe.responsavel}</p></div>
                    <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Telefone</span><p className="font-medium">{detalhe.telefone}</p></div>
                    <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</span><p className="font-medium">{detalhe.email}</p></div>
                    <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Veiculos Ativos</span><p className="font-medium">{detalhe.veiculos_ativos}</p></div>
                    <div className="col-span-2 space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Endereco</span><p className="font-medium">{detalhe.endereco}</p></div>
                    <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Cidade/UF</span><p className="font-medium">{detalhe.cidade}/{detalhe.estado}</p></div>
                    <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">CEP</span><p className="font-medium">{detalhe.cep}</p></div>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4">
                  <h4 className="text-sm font-semibold mb-3">Historico de Contatos</h4>
                  <div className="flex gap-2 mb-3">
                    <Input placeholder="Tipo (Telefone, Email...)" value={novoContato.tipo} onChange={e => setNovoContato(p => ({ ...p, tipo: e.target.value }))} className="w-32" />
                    <Input placeholder="Descricao do contato" value={novoContato.descricao} onChange={e => setNovoContato(p => ({ ...p, descricao: e.target.value }))} className="flex-1" />
                    <Button size="sm" onClick={adicionarContato}>Adicionar</Button>
                  </div>
                  {detalhe.historicoContatos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum contato registrado.</p> : (
                    <div className="space-y-2">
                      {detalhe.historicoContatos.map((h, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/20 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">{h.tipo}</Badge>
                            <span className="text-xs text-muted-foreground">{h.data}</span>
                          </div>
                          <p>{h.descricao}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Clientes;
