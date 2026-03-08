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
import { clientesIniciais, Cliente } from "@/data/mock-data";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyCliente: Omit<Cliente, "id"> = {
  nome: "", razaoSocial: "", tipo: "empresa", cnpj: "", email: "", telefone: "",
  responsavel: "", endereco: "", cidade: "", estado: "", cep: "", veiculosAtivos: 0, status: "ativo",
};

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"all" | "ativo" | "inativo">("all");
  const [filtroTipo, setFiltroTipo] = useState<"all" | "empresa" | "associacao">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [detalhe, setDetalhe] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyCliente);

  const filtrado = clientes.filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cnpj.includes(busca);
    const matchStatus = filtroStatus === "all" || c.status === filtroStatus;
    const matchTipo = filtroTipo === "all" || c.tipo === filtroTipo;
    return matchBusca && matchStatus && matchTipo;
  });

  const abrirNovo = () => { setForm(emptyCliente); setEditando(null); setModalOpen(true); };
  const abrirEditar = (c: Cliente) => { setForm(c); setEditando(c); setModalOpen(true); };

  const salvar = () => {
    if (!form.nome || !form.cnpj) { toast.error("Preencha nome e CNPJ"); return; }
    if (editando) {
      setClientes(prev => prev.map(c => c.id === editando.id ? { ...editando, ...form } : c));
      toast.success("Cliente atualizado!");
    } else {
      setClientes(prev => [...prev, { ...form, id: Date.now().toString() } as Cliente]);
      toast.success("Cliente cadastrado!");
    }
    setModalOpen(false);
  };

  const excluir = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    toast.success("Cliente removido!");
  };

  const setField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerenciamento de clientes do sistema</p>
        </div>
        <Button onClick={abrirNovo}><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
      </div>

      <Card className="card-shadow">
        <div className="p-4 border-b flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CNPJ..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(["all", "ativo", "inativo"] as const).map(f => (
              <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroStatus === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {f === "all" ? "Todos" : f === "ativo" ? "Ativos" : "Inativos"}
              </button>
            ))}
            {(["all", "empresa", "associacao"] as const).map(f => (
              <button key={f} onClick={() => setFiltroTipo(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroTipo === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {f === "all" ? "Tipo: Todos" : f === "empresa" ? "Empresa" : "Associação"}
              </button>
            ))}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Veículos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell><Badge variant="secondary">{c.tipo === "empresa" ? "Empresa" : "Associação"}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.cnpj}</TableCell>
                <TableCell>{c.cidade}/{c.estado}</TableCell>
                <TableCell>{c.veiculosAtivos}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status === "ativo" ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
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
      </Card>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome Fantasia</Label><Input value={form.nome} onChange={e => setField("nome", e.target.value)} /></div>
            <div className="col-span-2"><Label>Razão Social</Label><Input value={form.razaoSocial} onChange={e => setField("razaoSocial", e.target.value)} /></div>
            <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setField("cnpj", e.target.value)} placeholder="00.000.000/0001-00" /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setField("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="associacao">Associação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setField("responsavel", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setField("telefone", e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setField("email", e.target.value)} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setField("endereco", e.target.value)} /></div>
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

      {/* Detalhe Sheet */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[480px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>{detalhe.nome}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Razão Social</span><p className="font-medium">{detalhe.razaoSocial}</p></div>
                  <div><span className="text-muted-foreground">CNPJ</span><p className="font-medium">{detalhe.cnpj}</p></div>
                  <div><span className="text-muted-foreground">Tipo</span><p><Badge variant="secondary">{detalhe.tipo === "empresa" ? "Empresa" : "Associação"}</Badge></p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={detalhe.status === "ativo" ? "default" : "secondary"}>{detalhe.status}</Badge></p></div>
                  <div><span className="text-muted-foreground">Responsável</span><p className="font-medium">{detalhe.responsavel}</p></div>
                  <div><span className="text-muted-foreground">Telefone</span><p className="font-medium">{detalhe.telefone}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{detalhe.email}</p></div>
                  <div><span className="text-muted-foreground">Veículos Ativos</span><p className="font-medium">{detalhe.veiculosAtivos}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Endereço</span><p className="font-medium">{detalhe.endereco}</p></div>
                  <div><span className="text-muted-foreground">Cidade/UF</span><p className="font-medium">{detalhe.cidade}/{detalhe.estado}</p></div>
                  <div><span className="text-muted-foreground">CEP</span><p className="font-medium">{detalhe.cep}</p></div>
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
