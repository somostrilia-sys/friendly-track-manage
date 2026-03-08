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
import { equipamentosIniciais, Equipamento } from "@/data/mock-data";
import { Plus, Package, CheckCircle, AlertTriangle, XCircle, Eye } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  disponivel: { label: "Disponível", variant: "default" },
  instalado: { label: "Instalado", variant: "secondary" },
  manutencao: { label: "Manutenção", variant: "outline" },
  defeito: { label: "Defeito", variant: "destructive" },
};
const tipoMap: Record<string, string> = { rastreador: "Rastreador", sensor: "Sensor", camera: "Câmera", bloqueador: "Bloqueador", acessorio: "Acessório", sim: "SIM Card" };

const emptyForm = { tipo: "rastreador" as Equipamento["tipo"], modelo: "", marca: "", serial: "", custo: 0, preco: 0, quantidade: 1, status: "disponivel" as Equipamento["status"], localizacao: "Estoque Central SP" };

const Estoque = () => {
  const [equipamentos, setEquipamentos] = useState(equipamentosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [detalhe, setDetalhe] = useState<Equipamento | null>(null);

  const disponivel = equipamentos.filter(e => e.status === "disponivel").length;
  const instalado = equipamentos.filter(e => e.status === "instalado").length;
  const manutencao = equipamentos.filter(e => e.status === "manutencao").length;
  const defeito = equipamentos.filter(e => e.status === "defeito").length;

  const salvar = () => {
    if (!form.modelo || !form.marca) { toast.error("Preencha modelo e marca"); return; }
    const novo: Equipamento = {
      ...form, id: Date.now().toString(),
      serial: form.serial || `${form.tipo.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      movimentacoes: [{ data: new Date().toISOString().split("T")[0], tipo: "entrada", descricao: `Cadastro de ${form.quantidade} unidade(s)` }],
    };
    setEquipamentos(prev => [...prev, novo]);
    setForm(emptyForm);
    setModalOpen(false);
    toast.success("Produto adicionado ao estoque!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-muted-foreground text-sm">Rastreadores, sensores e equipamentos</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Adicionar Produto</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Disponível" value={disponivel} icon={Package} accent="success" />
        <StatCard label="Instalado" value={instalado} icon={CheckCircle} accent="primary" />
        <StatCard label="Manutenção" value={manutencao} icon={AlertTriangle} accent="warning" />
        <StatCard label="Defeito" value={defeito} icon={XCircle} accent="destructive" />
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipamentos.map(e => (
              <TableRow key={e.id}>
                <TableCell><Badge variant="secondary">{tipoMap[e.tipo] || e.tipo}</Badge></TableCell>
                <TableCell>{e.marca}</TableCell>
                <TableCell className="font-medium">{e.modelo}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{e.serial}</TableCell>
                <TableCell>R$ {e.custo}</TableCell>
                <TableCell>R$ {e.preco}</TableCell>
                <TableCell>{e.quantidade}</TableCell>
                <TableCell>{e.localizacao}</TableCell>
                <TableCell><Badge variant={statusMap[e.status]?.variant}>{statusMap[e.status]?.label}</Badge></TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => setDetalhe(e)}><Eye className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Adicionar Produto ao Estoque</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as Equipamento["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Marca</Label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
            <div><Label>Modelo</Label><Input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} /></div>
            <div><Label>Serial</Label><Input value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))} placeholder="Auto-gerado" /></div>
            <div><Label>Custo (R$)</Label><Input type="number" value={form.custo} onChange={e => setForm(f => ({ ...f, custo: +e.target.value }))} /></div>
            <div><Label>Preço (R$)</Label><Input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: +e.target.value }))} /></div>
            <div><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: +e.target.value }))} /></div>
            <div><Label>Localização</Label><Input value={form.localizacao} onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[480px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>{detalhe.marca} {detalhe.modelo}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tipo</span><p className="font-medium">{tipoMap[detalhe.tipo]}</p></div>
                  <div><span className="text-muted-foreground">Serial</span><p className="font-mono">{detalhe.serial}</p></div>
                  <div><span className="text-muted-foreground">Custo</span><p>R$ {detalhe.custo}</p></div>
                  <div><span className="text-muted-foreground">Preço</span><p>R$ {detalhe.preco}</p></div>
                  <div><span className="text-muted-foreground">Quantidade</span><p>{detalhe.quantidade}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusMap[detalhe.status]?.variant}>{statusMap[detalhe.status]?.label}</Badge></p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Localização</span><p>{detalhe.localizacao}</p></div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Histórico de Movimentações</h4>
                  {detalhe.movimentacoes.length === 0 ? <p className="text-muted-foreground">Nenhuma movimentação registrada.</p> : (
                    <div className="space-y-2">
                      {detalhe.movimentacoes.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <Badge variant="outline">{m.tipo}</Badge>
                          <div><p className="text-xs">{m.descricao}</p><p className="text-xs text-muted-foreground">{m.data}</p></div>
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

export default Estoque;
