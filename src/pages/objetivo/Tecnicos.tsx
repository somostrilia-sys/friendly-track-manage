import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTecnicosCompletos, useInsertTecnico, useUpdateTecnico, useServicos, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import type { DbTecnico, DbTecnicoEstoque } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Users, Star, Package, Plus, Inbox, Copy, Pencil, Link } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  disponivel: { label: "Disponivel", variant: "default" },
  em_servico: { label: "Em Servico", variant: "secondary" },
  indisponivel: { label: "Indisponivel", variant: "outline" },
  inativo: { label: "Inativo", variant: "destructive" },
};

const tipoLabels: Record<string, string> = { avulso: "Avulso", parceiro: "Parceiro", proprio: "Proprio" };

const emptyForm = { nome: "", cpf: "", telefone: "", email: "", cidade: "", estado: "", especialidade: "", regiao_atuacao: "", status_ativo: "ativo" as "ativo" | "inativo", valor_servico: 200, periodo_pagamento: "quinzenal" as "quinzenal" | "mensal", chave_pix: "", banco: "", tipo_tecnico: "avulso" as "avulso" | "parceiro" | "proprio", valor_instalacao: 200, adicional_km: 1.2 };

const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type TecnicoComEstoque = DbTecnico & { estoque: DbTecnicoEstoque[] };

const Tecnicos = () => {
  const { data: tecnicos = [], isLoading } = useTecnicosCompletos();
  const { data: servicos = [] } = useServicos();
  const insertTecnico = useInsertTecnico();
  const updateTecnico = useUpdateTecnico();

  useRealtimeSubscription("tecnicos", ["tecnicos", "tecnicos_completos"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<TecnicoComEstoque | null>(null);
  const [form, setForm] = useState(emptyForm);

  const tecs = tecnicos as TecnicoComEstoque[];
  const total = tecs.length;
  const disponiveis = tecs.filter(t => t.status === "disponivel").length;
  const mediaAvaliacao = total > 0 ? (tecs.reduce((a, t) => a + t.avaliacao, 0) / total).toFixed(1) : "0";
  const totalInstalacoes = tecs.reduce((a, t) => a + t.instalacoes_mes, 0);

  // Build chart data from real services
  const instalacoesPorMes = useMemo(() => {
    const now = new Date();
    const months: { mes: string; instalacoes: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = servicos.filter(s => s.tipo === "instalacao" && s.status === "concluido" && s.data?.startsWith(key)).length;
      months.push({ mes: mesesNomes[d.getMonth()], instalacoes: count });
    }
    return months;
  }, [servicos]);

  const registroLink = `${window.location.origin}/registro-tecnico`;

  const abrirEdicao = (t: TecnicoComEstoque) => {
    setForm({
      nome: t.nome, cpf: t.cpf, telefone: t.telefone, email: t.email,
      cidade: t.cidade, estado: t.estado, especialidade: t.especialidade,
      regiao_atuacao: t.regiao_atuacao || "", status_ativo: t.status_ativo as "ativo" | "inativo",
      valor_servico: t.valor_servico || 200, periodo_pagamento: t.periodo_pagamento as "quinzenal" | "mensal",
      chave_pix: t.chave_pix || "", banco: t.banco || "",
      tipo_tecnico: t.tipo_tecnico as "avulso" | "parceiro" | "proprio",
      valor_instalacao: t.valor_instalacao, adicional_km: t.adicional_km,
    });
    setEditId(t.id);
    setEditMode(true);
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.cpf) { toast.error("Preencha nome e CPF"); return; }
    const prazoPadrao: Record<string, string> = { avulso: "2 dias uteis", parceiro: "5 dias uteis", proprio: "Conforme contrato" };
    try {
      if (editMode && editId) {
        await updateTecnico.mutateAsync({
          id: editId,
          ...form,
          status: form.status_ativo === "ativo" ? "disponivel" : "indisponivel",
          prazo_pagamento: prazoPadrao[form.tipo_tecnico],
        } as any);
        toast.success("Tecnico atualizado!");
      } else {
        await insertTecnico.mutateAsync({
          ...form,
          avaliacao: 0,
          instalacoes_mes: 0,
          equipamentos_em_estoque: 0,
          saldo_aberto: 0,
          status: form.status_ativo === "ativo" ? "disponivel" : "indisponivel",
          prazo_pagamento: prazoPadrao[form.tipo_tecnico],
        });
        toast.success("Tecnico cadastrado!");
      }
      setModalOpen(false);
      setEditMode(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Tecnicos" subtitle="Rede de tecnicos em todo o Brasil" />
      <TableSkeleton rows={6} cols={9} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Tecnicos" subtitle="Rede de tecnicos em todo o Brasil">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(registroLink); toast.success("Link copiado!"); }}>
            <Link className="w-4 h-4 mr-2" /> Link Cadastro
          </Button>
          <Button onClick={() => { setEditMode(false); setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Tecnico
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tecnicos" value={total} icon={Users} />
        <StatCard label="Disponiveis" value={disponiveis} icon={Users} accent="success" />
        <StatCard label="Avaliacao Media" value={mediaAvaliacao} icon={Star} accent="warning" />
        <StatCard label="Instalacoes/Mes" value={totalInstalacoes} icon={Package} accent="primary" />
      </div>

      <Card className="p-6 card-shadow">
        <h3 className="font-semibold mb-4">Instalacoes por Mes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={instalacoesPorMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 89%)" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="instalacoes" fill="hsl(204, 92%, 39%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="card-shadow">
        {tecs.length === 0 ? (
          <div className="empty-state empty-state-border m-4">
            <Inbox className="empty-state-icon" />
            <p className="text-sm text-muted-foreground">Nenhum técnico cadastrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Regiao</TableHead>
                <TableHead>Avaliacao</TableHead>
                <TableHead>Instal./Mes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tecs.map(t => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetalhe(t)}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell><Badge variant="secondary">{tipoLabels[t.tipo_tecnico]}</Badge></TableCell>
                  <TableCell className="text-sm">{t.telefone}</TableCell>
                  <TableCell>{t.cidade}/{t.estado}</TableCell>
                  <TableCell className="text-sm">{t.especialidade}</TableCell>
                  <TableCell className="text-sm">{t.regiao_atuacao || "--"}</TableCell>
                  <TableCell>{t.avaliacao}</TableCell>
                  <TableCell>{t.instalacoes_mes}</TableCell>
                  <TableCell><Badge variant={statusMap[t.status_ativo === "inativo" ? "inativo" : t.status]?.variant}>{statusMap[t.status_ativo === "inativo" ? "inativo" : t.status]?.label}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editMode ? "Editar Tecnico" : "Novo Tecnico"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome Completo</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label>CPF</Label><Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo_tecnico} onValueChange={v => setForm(f => ({ ...f, tipo_tecnico: v as "avulso" | "parceiro" | "proprio" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="avulso">Avulso</SelectItem>
                  <SelectItem value="parceiro">Parceiro</SelectItem>
                  <SelectItem value="proprio">Proprio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Especialidade</Label><Input value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} placeholder="Rastreadores, cameras..." /></div>
            <div><Label>Regiao de Atuacao</Label><Input value={form.regiao_atuacao} onChange={e => setForm(f => ({ ...f, regiao_atuacao: e.target.value }))} placeholder="Grande SP, Interior PR..." /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
            <div><Label>Estado</Label><Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="SP" /></div>
            <div><Label>Status</Label>
              <Select value={form.status_ativo} onValueChange={v => setForm(f => ({ ...f, status_ativo: v as "ativo" | "inativo" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Valor por Instalacao (R$)</Label><Input type="number" value={form.valor_instalacao} onChange={e => setForm(f => ({ ...f, valor_instalacao: +e.target.value }))} /></div>
            <div><Label>Adicional KM (R$/km)</Label><Input type="number" step="0.1" value={form.adicional_km} onChange={e => setForm(f => ({ ...f, adicional_km: +e.target.value }))} /></div>
            <div><Label>Periodo Pagamento</Label>
              <Select value={form.periodo_pagamento} onValueChange={v => setForm(f => ({ ...f, periodo_pagamento: v as "quinzenal" | "mensal" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="quinzenal">Quinzenal</SelectItem><SelectItem value="mensal">Mensal</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Chave PIX</Label><Input value={form.chave_pix} onChange={e => setForm(f => ({ ...f, chave_pix: e.target.value }))} /></div>
            <div><Label>Banco</Label><Input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); setEditMode(false); setEditId(null); setForm(emptyForm); }}>Cancelar</Button>
            <Button onClick={salvar}>{editMode ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>{detalhe.nome}</SheetTitle>
                  <Button size="sm" variant="outline" onClick={() => { abrirEdicao(detalhe); setDetalhe(null); }}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                  </Button>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tipo</span><p className="font-medium capitalize">{tipoLabels[detalhe.tipo_tecnico]}</p></div>
                  <div><span className="text-muted-foreground">CPF</span><p className="font-medium">{detalhe.cpf}</p></div>
                  <div><span className="text-muted-foreground">Telefone</span><p className="font-medium">{detalhe.telefone}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{detalhe.email}</p></div>
                  <div><span className="text-muted-foreground">Cidade/UF</span><p className="font-medium">{detalhe.cidade}/{detalhe.estado}</p></div>
                  <div><span className="text-muted-foreground">Especialidade</span><p className="font-medium">{detalhe.especialidade}</p></div>
                  <div><span className="text-muted-foreground">Regiao de Atuacao</span><p className="font-medium">{detalhe.regiao_atuacao || "--"}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusMap[detalhe.status_ativo === "inativo" ? "inativo" : detalhe.status]?.variant}>{detalhe.status_ativo === "inativo" ? "Inativo" : statusMap[detalhe.status]?.label}</Badge></p></div>
                  <div><span className="text-muted-foreground">Valor/Instalacao</span><p className="font-medium">R$ {detalhe.valor_instalacao}</p></div>
                  <div><span className="text-muted-foreground">Adicional KM</span><p className="font-medium">R$ {detalhe.adicional_km}/km</p></div>
                  <div><span className="text-muted-foreground">Prazo Pagamento</span><p className="font-medium">{detalhe.prazo_pagamento}</p></div>
                  <div><span className="text-muted-foreground">Avaliacao</span><p className="font-medium">{detalhe.avaliacao}</p></div>
                  <div><span className="text-muted-foreground">Pagamento</span><p className="font-medium capitalize">{detalhe.periodo_pagamento}</p></div>
                  <div><span className="text-muted-foreground">Chave PIX</span><p className="font-medium">{detalhe.chave_pix}</p></div>
                  <div><span className="text-muted-foreground">Banco</span><p className="font-medium">{detalhe.banco}</p></div>
                  <div><span className="text-muted-foreground">Saldo Aberto</span><p className="font-semibold text-primary">R$ {detalhe.saldo_aberto.toLocaleString("pt-BR")}</p></div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground font-medium">Regra Fiscal</p>
                  <p className="text-sm">{detalhe.saldo_aberto > 1000 ? "Acima de R$ 1.000 - Nota Fiscal obrigatoria" : "Ate R$ 1.000 - Recibo"}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Estoque na Mao do Tecnico</h4>
                  {detalhe.estoque.length === 0 ? <p className="text-muted-foreground">Nenhum equipamento.</p> : (
                    <div className="space-y-1">
                      {detalhe.estoque.map((e, i) => (
                        <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                          <span>{e.item}</span>
                          <Badge variant="outline">{e.quantidade} un.</Badge>
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

export default Tecnicos;
