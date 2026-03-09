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
import { tecnicosIniciais, Tecnico, instalacoesPorMes } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Users, Star, Package, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  disponivel: { label: "Disponivel", variant: "default" },
  em_servico: { label: "Em Servico", variant: "secondary" },
  indisponivel: { label: "Indisponivel", variant: "outline" },
  inativo: { label: "Inativo", variant: "destructive" },
};

const tipoLabels: Record<string, string> = { avulso: "Avulso", parceiro: "Parceiro", proprio: "Proprio" };

const emptyForm = { nome: "", cpf: "", telefone: "", email: "", cidade: "", estado: "", especialidade: "", regiaoAtuacao: "", statusAtivo: "ativo" as "ativo" | "inativo", valorServico: 200, periodoPagamento: "quinzenal" as "quinzenal" | "mensal", chavePix: "", banco: "", tipoTecnico: "avulso" as "avulso" | "parceiro" | "proprio", valorInstalacao: 200, adicionalKm: 1.2 };

const Tecnicos = () => {
  const [tecnicos, setTecnicos] = useState(tecnicosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Tecnico | null>(null);
  const [form, setForm] = useState(emptyForm);

  const total = tecnicos.length;
  const disponiveis = tecnicos.filter(t => t.status === "disponivel").length;
  const mediaAvaliacao = (tecnicos.reduce((a, t) => a + t.avaliacao, 0) / total).toFixed(1);
  const totalInstalacoes = tecnicos.reduce((a, t) => a + t.instalacoesMes, 0);

  const salvar = () => {
    if (!form.nome || !form.cpf) { toast.error("Preencha nome e CPF"); return; }
    const prazoPadrao: Record<string, string> = { avulso: "2 dias uteis", parceiro: "5 dias uteis", proprio: "Conforme contrato" };
    const novo: Tecnico = {
      ...form, id: Date.now().toString(), avaliacao: 0, instalacoesMes: 0,
      equipamentosEmEstoque: 0, saldoAberto: 0, status: form.statusAtivo === "ativo" ? "disponivel" : "indisponivel",
      estoque: [], prazoPagamento: prazoPadrao[form.tipoTecnico],
      regiaoAtuacao: form.regiaoAtuacao, statusAtivo: form.statusAtivo,
    };
    setTecnicos(prev => [...prev, novo]);
    setModalOpen(false);
    setForm(emptyForm);
    toast.success("Tecnico cadastrado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tecnicos</h1>
          <p className="text-muted-foreground text-sm">Rede de tecnicos em todo o Brasil</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Tecnico</Button>
      </div>

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
            {tecnicos.map(t => (
              <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetalhe(t)}>
                <TableCell className="font-medium">{t.nome}</TableCell>
                <TableCell><Badge variant="secondary">{tipoLabels[t.tipoTecnico]}</Badge></TableCell>
                <TableCell className="text-sm">{t.telefone}</TableCell>
                <TableCell>{t.cidade}/{t.estado}</TableCell>
                <TableCell className="text-sm">{t.especialidade}</TableCell>
                <TableCell className="text-sm">{t.regiaoAtuacao || "--"}</TableCell>
                <TableCell>{t.avaliacao}</TableCell>
                <TableCell>{t.instalacoesMes}</TableCell>
                <TableCell><Badge variant={statusMap[t.statusAtivo === "inativo" ? "inativo" : t.status]?.variant}>{statusMap[t.statusAtivo === "inativo" ? "inativo" : t.status]?.label}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Tecnico</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome Completo</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label>CPF</Label><Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipoTecnico} onValueChange={v => setForm(f => ({ ...f, tipoTecnico: v as "avulso" | "parceiro" | "proprio" }))}>
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
            <div><Label>Regiao de Atuacao</Label><Input value={form.regiaoAtuacao} onChange={e => setForm(f => ({ ...f, regiaoAtuacao: e.target.value }))} placeholder="Grande SP, Interior PR..." /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
            <div><Label>Estado</Label><Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="SP" /></div>
            <div><Label>Status</Label>
              <Select value={form.statusAtivo} onValueChange={v => setForm(f => ({ ...f, statusAtivo: v as "ativo" | "inativo" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Valor por Instalacao (R$)</Label><Input type="number" value={form.valorInstalacao} onChange={e => setForm(f => ({ ...f, valorInstalacao: +e.target.value }))} /></div>
            <div><Label>Adicional KM (R$/km)</Label><Input type="number" step="0.1" value={form.adicionalKm} onChange={e => setForm(f => ({ ...f, adicionalKm: +e.target.value }))} /></div>
            <div><Label>Periodo Pagamento</Label>
              <Select value={form.periodoPagamento} onValueChange={v => setForm(f => ({ ...f, periodoPagamento: v as "quinzenal" | "mensal" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="quinzenal">Quinzenal</SelectItem><SelectItem value="mensal">Mensal</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Chave PIX</Label><Input value={form.chavePix} onChange={e => setForm(f => ({ ...f, chavePix: e.target.value }))} /></div>
            <div><Label>Banco</Label><Input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>{detalhe.nome}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tipo</span><p className="font-medium capitalize">{tipoLabels[detalhe.tipoTecnico]}</p></div>
                  <div><span className="text-muted-foreground">CPF</span><p className="font-medium">{detalhe.cpf}</p></div>
                  <div><span className="text-muted-foreground">Telefone</span><p className="font-medium">{detalhe.telefone}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{detalhe.email}</p></div>
                  <div><span className="text-muted-foreground">Cidade/UF</span><p className="font-medium">{detalhe.cidade}/{detalhe.estado}</p></div>
                  <div><span className="text-muted-foreground">Especialidade</span><p className="font-medium">{detalhe.especialidade}</p></div>
                  <div><span className="text-muted-foreground">Regiao de Atuacao</span><p className="font-medium">{detalhe.regiaoAtuacao || "--"}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusMap[detalhe.statusAtivo === "inativo" ? "inativo" : detalhe.status]?.variant}>{detalhe.statusAtivo === "inativo" ? "Inativo" : statusMap[detalhe.status]?.label}</Badge></p></div>
                  <div><span className="text-muted-foreground">Valor/Instalacao</span><p className="font-medium">R$ {detalhe.valorInstalacao}</p></div>
                  <div><span className="text-muted-foreground">Adicional KM</span><p className="font-medium">R$ {detalhe.adicionalKm}/km</p></div>
                  <div><span className="text-muted-foreground">Prazo Pagamento</span><p className="font-medium">{detalhe.prazoPagamento}</p></div>
                  <div><span className="text-muted-foreground">Avaliacao</span><p className="font-medium">{detalhe.avaliacao}</p></div>
                  <div><span className="text-muted-foreground">Pagamento</span><p className="font-medium capitalize">{detalhe.periodoPagamento}</p></div>
                  <div><span className="text-muted-foreground">Chave PIX</span><p className="font-medium">{detalhe.chavePix}</p></div>
                  <div><span className="text-muted-foreground">Banco</span><p className="font-medium">{detalhe.banco}</p></div>
                  <div><span className="text-muted-foreground">Saldo Aberto</span><p className="font-semibold text-primary">R$ {detalhe.saldoAberto.toLocaleString("pt-BR")}</p></div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground font-medium">Regra Fiscal</p>
                  <p className="text-sm">{detalhe.saldoAberto > 1000 ? "Acima de R$ 1.000 - Nota Fiscal obrigatoria" : "Ate R$ 1.000 - Recibo"}</p>
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
