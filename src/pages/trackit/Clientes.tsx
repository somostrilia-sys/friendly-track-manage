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
import { useClientesCompletos, useInsertCliente, useUpdateCliente, useDeleteCliente, useInsertHistoricoContato } from "@/hooks/useSupabaseData";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
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

const Clientes = () => {
  const { data: clientes = [], isLoading } = useClientesCompletos();
  const insertCliente = useInsertCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();
  const insertContato = useInsertHistoricoContato();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"all" | "ativo" | "inativo">("all");
  const [filtroTipo, setFiltroTipo] = useState<"all" | "empresa" | "associacao">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<ClienteComHistorico | null>(null);
  const [detalhe, setDetalhe] = useState<ClienteComHistorico | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [novoContato, setNovoContato] = useState({ tipo: "", descricao: "" });
  const filtrado = (clientes as ClienteComHistorico[]).filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cnpj.includes(busca);
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
      // Refresh detalhe
      setDetalhe(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const setField = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle="Gerenciamento de clientes do sistema">
        <Button onClick={abrirNovo}><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
      </PageHeader>

      <Card className="card-shadow">
        <div className="p-4 border-b flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CNPJ..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "ativo", "inativo"] as const).map(f => (
              <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroStatus === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {f === "all" ? "Todos" : f === "ativo" ? "Ativos" : "Inativos"}
              </button>
            ))}
            {(["all", "empresa", "associacao"] as const).map(f => (
              <button key={f} onClick={() => setFiltroTipo(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroTipo === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {f === "all" ? "Tipo: Todos" : f === "empresa" ? "Empresa" : "Associacao"}
              </button>
            ))}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>CNPJ</TableHead>
              <TableHead>Tipo Servico</TableHead><TableHead>Filial</TableHead><TableHead>Acesso</TableHead>
              <TableHead>Veiculos</TableHead><TableHead>Status</TableHead><TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell><Badge variant="secondary">{c.tipo === "empresa" ? "Empresa" : "Associacao"}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.cnpj}</TableCell>
                <TableCell className="text-sm">{c.tipo_servico || "--"}</TableCell>
                <TableCell className="text-sm">{c.filial || "--"}</TableCell>
                <TableCell><Badge variant={statusAcessoMap[c.status_acesso]?.variant}>{statusAcessoMap[c.status_acesso]?.label}</Badge></TableCell>
                <TableCell>{c.veiculos_ativos}</TableCell>
                <TableCell><Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status === "ativo" ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetalhe(c)}><Eye className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => abrirEditar(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => excluir(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 border-t">
          <span className="text-sm text-muted-foreground">Total: {filtrado.length} clientes</span>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
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
              <SheetHeader><SheetTitle>{detalhe.nome}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Razao Social</span><p className="font-medium">{detalhe.razao_social}</p></div>
                  <div><span className="text-muted-foreground">CNPJ</span><p className="font-medium">{detalhe.cnpj}</p></div>
                  <div><span className="text-muted-foreground">Tipo</span><p><Badge variant="secondary">{detalhe.tipo === "empresa" ? "Empresa" : "Associacao"}</Badge></p></div>
                  <div><span className="text-muted-foreground">Tipo Servico</span><p className="font-medium">{detalhe.tipo_servico || "--"}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={detalhe.status === "ativo" ? "default" : "secondary"}>{detalhe.status}</Badge></p></div>
                  <div><span className="text-muted-foreground">Status Acesso</span><p><Badge variant={statusAcessoMap[detalhe.status_acesso]?.variant}>{statusAcessoMap[detalhe.status_acesso]?.label}</Badge></p></div>
                  <div><span className="text-muted-foreground">Filial</span><p className="font-medium">{detalhe.filial || "--"}</p></div>
                  <div><span className="text-muted-foreground">CPF Associado</span><p className="font-medium">{detalhe.cpf_associado || "--"}</p></div>
                  <div><span className="text-muted-foreground">Email Associado</span><p className="font-medium">{detalhe.email_associado || "--"}</p></div>
                  <div><span className="text-muted-foreground">Responsavel</span><p className="font-medium">{detalhe.responsavel}</p></div>
                  <div><span className="text-muted-foreground">Telefone</span><p className="font-medium">{detalhe.telefone}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{detalhe.email}</p></div>
                  <div><span className="text-muted-foreground">Veiculos Ativos</span><p className="font-medium">{detalhe.veiculos_ativos}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Endereco</span><p className="font-medium">{detalhe.endereco}</p></div>
                  <div><span className="text-muted-foreground">Cidade/UF</span><p className="font-medium">{detalhe.cidade}/{detalhe.estado}</p></div>
                  <div><span className="text-muted-foreground">CEP</span><p className="font-medium">{detalhe.cep}</p></div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Historico de Contatos</h4>
                  <div className="flex gap-2 mb-3">
                    <Input placeholder="Tipo (Telefone, Email...)" value={novoContato.tipo} onChange={e => setNovoContato(p => ({ ...p, tipo: e.target.value }))} className="w-32" />
                    <Input placeholder="Descricao do contato" value={novoContato.descricao} onChange={e => setNovoContato(p => ({ ...p, descricao: e.target.value }))} className="flex-1" />
                    <Button size="sm" onClick={adicionarContato}>Adicionar</Button>
                  </div>
                  {detalhe.historicoContatos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum contato registrado.</p> : (
                    <div className="space-y-2">
                      {detalhe.historicoContatos.map((h, i) => (
                        <div key={i} className="p-2 rounded-lg bg-muted/50 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{h.tipo}</Badge>
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
