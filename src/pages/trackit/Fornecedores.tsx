import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFornecedores, useInsertFornecedor, useUpdateFornecedor, useDeleteFornecedor } from "@/hooks/useSupabaseData";
import { Plus, Search, Eye, Pencil, Trash2, Upload, Download, Inbox } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { DbFornecedor } from "@/types/database";
import * as XLSX from "xlsx";

const tiposFornecimento = [
  "Chip", "Rastreador", "Linha", "Rele", "Assessoria", "Contabilidade", "Logistica", "Outros",
];

const emptyForm: Record<string, any> = {
  nome: "", razao_social: "", cnpj_cpf: "", tipo_fornecimento: "", valor_chip: "",
  endereco: "", telefone: "", email: "", responsavel: "", status: "ativo",
};

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

const Fornecedores = () => {
  const { data: fornecedores = [], isLoading } = useFornecedores();
  const insertFornecedor = useInsertFornecedor();
  const updateFornecedor = useUpdateFornecedor();
  const deleteFornecedor = useDeleteFornecedor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"all" | "ativo" | "inativo">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<DbFornecedor | null>(null);
  const [detalhe, setDetalhe] = useState<DbFornecedor | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtrado = fornecedores.filter(f => {
    const matchBusca = f.nome.toLowerCase().includes(busca.toLowerCase()) || f.cnpj_cpf.includes(busca);
    const matchStatus = filtroStatus === "all" || f.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const abrirNovo = () => { setForm(emptyForm); setEditando(null); setModalOpen(true); };
  const abrirEditar = (f: DbFornecedor) => {
    setForm({
      nome: f.nome, razao_social: f.razao_social, cnpj_cpf: f.cnpj_cpf,
      tipo_fornecimento: f.tipo_fornecimento, valor_chip: f.valor_chip ?? "",
      endereco: f.endereco, telefone: f.telefone, email: f.email,
      responsavel: f.responsavel, status: f.status,
    });
    setEditando(f);
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.cnpj_cpf) { toast.error("Preencha nome e CNPJ/CPF"); return; }
    const payload = {
      ...form,
      valor_chip: form.valor_chip !== "" ? Number(form.valor_chip) : null,
    };
    try {
      if (editando) {
        await updateFornecedor.mutateAsync({ id: editando.id, ...payload });
        toast.success("Fornecedor atualizado!");
      } else {
        await insertFornecedor.mutateAsync(payload);
        toast.success("Fornecedor cadastrado!");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const excluir = async (id: string) => {
    try {
      await deleteFornecedor.mutateAsync(id);
      toast.success("Fornecedor removido!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const setField = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

  const downloadTemplate = () => {
    const headers = ["nome", "razao_social", "cnpj_cpf", "tipo_fornecimento", "valor_chip", "endereco", "telefone", "email", "responsavel", "status"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fornecedores");
    XLSX.writeFile(wb, "template_fornecedores.xlsx");
  };

  const importarCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        let count = 0;
        for (const row of rows) {
          if (!row.nome) continue;
          await insertFornecedor.mutateAsync({
            nome: row.nome || "",
            razao_social: row.razao_social || "",
            cnpj_cpf: row.cnpj_cpf || "",
            tipo_fornecimento: row.tipo_fornecimento || "",
            valor_chip: row.valor_chip ? Number(row.valor_chip) : null,
            endereco: row.endereco || "",
            telefone: row.telefone || "",
            email: row.email || "",
            responsavel: row.responsavel || "",
            status: row.status || "ativo",
          });
          count++;
        }
        toast.success(`${count} fornecedores importados!`);
      } catch (err: any) {
        toast.error("Erro na importacao: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Fornecedores" subtitle="Gerenciamento de fornecedores e parceiros" />
      <TableSkeleton rows={6} cols={7} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Fornecedores" subtitle="Gerenciamento de fornecedores e parceiros">
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" /> Template</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar</Button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={importarCSV} />
          <Button onClick={abrirNovo}><Plus className="w-4 h-4 mr-2" /> Novo Fornecedor</Button>
        </div>
      </PageHeader>

      <Card className="card-shadow">
        <div className="p-4 border-b border-border/30 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CNPJ/CPF..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "ativo", "inativo"] as const).map(f => (
              <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroStatus === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {f === "all" ? "Todos" : f === "ativo" ? "Ativos" : "Inativos"}
              </button>
            ))}
          </div>
        </div>

        {filtrado.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.map(f => (
                <TableRow key={f.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${getAvatarColor(f.nome)}`}>
                        {f.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{f.nome}</p>
                        {f.razao_social && <p className="text-xs text-muted-foreground">{f.razao_social}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{f.cnpj_cpf}</TableCell>
                  <TableCell>
                    {f.tipo_fornecimento ? (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground">{f.tipo_fornecimento}</span>
                    ) : "--"}
                  </TableCell>
                  <TableCell className="text-sm">{f.telefone || "--"}</TableCell>
                  <TableCell className="text-sm">{f.email || "--"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${f.status === "ativo" ? "bg-success" : "bg-muted-foreground"}`} />
                      <span className="text-sm">{f.status === "ativo" ? "Ativo" : "Inativo"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end row-actions opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => setDetalhe(f)}><Eye className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => abrirEditar(f)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => excluir(f.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="p-4 border-t border-border/30">
          <span className="text-sm text-muted-foreground">Total: {filtrado.length} fornecedores</span>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setField("nome", e.target.value)} /></div>
            <div className="col-span-2"><Label>Razao Social</Label><Input value={form.razao_social} onChange={e => setField("razao_social", e.target.value)} /></div>
            <div><Label>CNPJ/CPF</Label><Input value={form.cnpj_cpf} onChange={e => setField("cnpj_cpf", e.target.value)} placeholder="00.000.000/0001-00" /></div>
            <div><Label>Tipo de Fornecimento</Label>
              <Select value={form.tipo_fornecimento} onValueChange={v => setField("tipo_fornecimento", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tiposFornecimento.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor por Chip</Label><Input type="number" step="0.01" value={form.valor_chip} onChange={e => setField("valor_chip", e.target.value)} placeholder="0.00" /></div>
            <div><Label>Responsavel</Label><Input value={form.responsavel} onChange={e => setField("responsavel", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setField("telefone", e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setField("email", e.target.value)} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Endereco</Label><Input value={form.endereco} onChange={e => setField("endereco", e.target.value)} /></div>
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(detalhe.nome)}`}>
                    {detalhe.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <SheetTitle>{detalhe.nome}</SheetTitle>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">Razao Social</span><p className="font-medium">{detalhe.razao_social || "--"}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">CNPJ/CPF</span><p className="font-medium">{detalhe.cnpj_cpf}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">Tipo Fornecimento</span><p><span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground">{detalhe.tipo_fornecimento || "--"}</span></p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">Valor por Chip</span><p className="font-medium">{detalhe.valor_chip != null ? `R$ ${Number(detalhe.valor_chip).toFixed(2)}` : "--"}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">Status</span><p className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${detalhe.status === "ativo" ? "bg-success" : "bg-muted-foreground"}`} />{detalhe.status === "ativo" ? "Ativo" : "Inativo"}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">Responsavel</span><p className="font-medium">{detalhe.responsavel || "--"}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">Telefone</span><p className="font-medium">{detalhe.telefone || "--"}</p></div>
                  <div className="space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span><p className="font-medium">{detalhe.email || "--"}</p></div>
                  <div className="col-span-2 space-y-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">Endereco</span><p className="font-medium">{detalhe.endereco || "--"}</p></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Fornecedores;
