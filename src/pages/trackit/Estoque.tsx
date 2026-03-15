import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { equipamentosIniciais, Equipamento, Comodato, tecnicosIniciais } from "@/data/mock-data";
import { Plus, Package, CheckCircle, AlertTriangle, XCircle, Eye, Search, Upload, Download } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  disponivel: { label: "Disponivel", variant: "default" },
  instalado: { label: "Instalado", variant: "secondary" },
  manutencao: { label: "Manutencao", variant: "outline" },
  defeito: { label: "Defeito", variant: "destructive" },
};
const tipoMap: Record<string, string> = { rastreador: "Rastreador", sensor: "Sensor", camera: "Camera", bloqueador: "Bloqueador", acessorio: "Acessorio", sim: "SIM Card" };

const emptyForm = { tipo: "rastreador" as Equipamento["tipo"], modelo: "", marca: "", serial: "", imei: "", simCard: "", iccid: "", custo: 0, preco: 0, quantidade: 1, status: "disponivel" as Equipamento["status"], localizacao: "Estoque Central SP" };

const Estoque = () => {
  const [equipamentos, setEquipamentos] = useState(equipamentosIniciais);
  const [modalOpen, setModalOpen] = useState(false);
  const [comodatoModal, setComodatoModal] = useState(false);
  const [detalhe, setDetalhe] = useState<Equipamento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [buscaImei, setBuscaImei] = useState("");
  const [comodatoForm, setComodatoForm] = useState({ destinoTipo: "tecnico" as "tecnico" | "filial", destinoNome: "", quantidade: 1, codigoRastreio: "" });
  const [comodatoEquipId, setComodatoEquipId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const disponivel = equipamentos.filter(e => e.status === "disponivel").length;
  const instalado = equipamentos.filter(e => e.status === "instalado").length;
  const manutencao = equipamentos.filter(e => e.status === "manutencao").length;
  const defeito = equipamentos.filter(e => e.status === "defeito").length;

  const filtrado = buscaImei
    ? equipamentos.filter(e => e.imei?.includes(buscaImei) || e.serial.includes(buscaImei) || e.iccid?.includes(buscaImei))
    : equipamentos;

  const salvar = () => {
    if (!form.modelo || !form.marca) { toast.error("Preencha modelo e marca"); return; }
    const novo: Equipamento = {
      ...form, id: Date.now().toString(),
      serial: form.serial || `${form.tipo.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      movimentacoes: [{ data: new Date().toISOString().split("T")[0], tipo: "entrada", descricao: `Cadastro de ${form.quantidade} unidade(s)` }],
      comodatos: [],
    };
    setEquipamentos(prev => [...prev, novo]);
    setForm(emptyForm);
    setModalOpen(false);
    toast.success("Produto adicionado ao estoque!");
  };

  const abrirComodato = (eqId: string) => {
    setComodatoEquipId(eqId);
    setComodatoForm({ destinoTipo: "tecnico", destinoNome: "", quantidade: 1, codigoRastreio: "" });
    setComodatoModal(true);
  };

  const salvarComodato = () => {
    if (!comodatoForm.destinoNome) { toast.error("Preencha o destino"); return; }
    const novoComodato: Comodato = {
      id: `COM-${Date.now()}`, ...comodatoForm, dataEnvio: new Date().toISOString().split("T")[0], status: "enviado",
    };
    setEquipamentos(prev => prev.map(e => {
      if (e.id !== comodatoEquipId) return e;
      return {
        ...e,
        comodatos: [...e.comodatos, novoComodato],
        movimentacoes: [...e.movimentacoes, { data: new Date().toISOString().split("T")[0], tipo: "saida_comodato", descricao: `Comodato: ${comodatoForm.quantidade}x para ${comodatoForm.destinoNome}` }],
      };
    }));
    setComodatoModal(false);
    toast.success("Comodato registrado!");
  };

  const baixarTemplate = () => {
    const csv = "imei_rastreador;modelo_rastreador;sim_card;iccid;numero_sim\n351756051523999;J16 4G;Vivo;8955031234567890001;(11) 99001-0001\n351756051524001;ST4955;Claro;8955031234567890002;(11) 99001-0002";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template-estoque.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.info("Template CSV baixado!");
  };

  const importarCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/);
        if (cols.length < 2) continue;
        const novo: Equipamento = {
          id: `IMP-${Date.now()}-${i}`, tipo: "rastreador", modelo: cols[1]?.trim() || "J16 4G", marca: "Trackit",
          serial: `IMP-${Date.now().toString().slice(-4)}-${i}`, imei: cols[0]?.trim() || "",
          simCard: cols[2]?.trim() || "", iccid: cols[3]?.trim() || "",
          custo: 0, preco: 0, quantidade: 1, status: "disponivel", localizacao: "Estoque Central SP",
          movimentacoes: [{ data: new Date().toISOString().split("T")[0], tipo: "entrada", descricao: "Importacao em massa" }],
          comodatos: [],
        };
        setEquipamentos(prev => [...prev, novo]);
        count++;
      }
      toast.success(`${count} itens importados!`);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" subtitle="Rastreadores, sensores e equipamentos">
        <Button variant="outline" onClick={baixarTemplate}><Download className="w-4 h-4 mr-2" /> Template CSV</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
        <Button onClick={() => { setForm(emptyForm); setModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Adicionar Produto</Button>
      </PageHeader>
      <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={importarCSV} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Disponivel" value={disponivel} icon={Package} accent="success" />
        <StatCard label="Instalado" value={instalado} icon={CheckCircle} accent="primary" />
        <StatCard label="Manutencao" value={manutencao} icon={AlertTriangle} accent="warning" />
        <StatCard label="Defeito" value={defeito} icon={XCircle} accent="destructive" />
      </div>

      <Card className="p-4 card-shadow">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Busca rapida por IMEI, Serial ou ICCID..." value={buscaImei} onChange={e => setBuscaImei(e.target.value)} className="max-w-md" />
          {buscaImei && <Button variant="outline" size="sm" onClick={() => setBuscaImei("")}>Limpar</Button>}
        </div>
      </Card>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>SIM/ICCID</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(e => (
              <TableRow key={e.id}>
                <TableCell><Badge variant="secondary">{tipoMap[e.tipo] || e.tipo}</Badge></TableCell>
                <TableCell>{e.marca}</TableCell>
                <TableCell className="font-medium">{e.modelo}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{e.serial}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{e.imei || "--"}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{e.iccid || e.simCard || "--"}</TableCell>
                <TableCell>{e.quantidade}</TableCell>
                <TableCell><Badge variant={statusMap[e.status]?.variant}>{statusMap[e.status]?.label}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetalhe(e)}><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => abrirComodato(e.id)}>Comodato</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Product Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Adicionar Produto ao Estoque</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as Equipamento["tipo"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tipoMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Marca</Label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
            <div><Label>Modelo</Label><Input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} /></div>
            <div><Label>Serial</Label><Input value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))} placeholder="Auto-gerado" /></div>
            <div><Label>IMEI Rastreador</Label><Input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} /></div>
            <div><Label>SIM Card</Label><Input value={form.simCard} onChange={e => setForm(f => ({ ...f, simCard: e.target.value }))} /></div>
            <div><Label>ICCID da Linha</Label><Input value={form.iccid} onChange={e => setForm(f => ({ ...f, iccid: e.target.value }))} /></div>
            <div><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: +e.target.value }))} /></div>
            <div><Label>Custo (R$)</Label><Input type="number" value={form.custo} onChange={e => setForm(f => ({ ...f, custo: +e.target.value }))} /></div>
            <div><Label>Preco (R$)</Label><Input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: +e.target.value }))} /></div>
            <div className="col-span-2"><Label>Localizacao</Label><Input value={form.localizacao} onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comodato Modal */}
      <Dialog open={comodatoModal} onOpenChange={setComodatoModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Comodato / Saida</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Destino</Label>
              <Select value={comodatoForm.destinoTipo} onValueChange={v => setComodatoForm(f => ({ ...f, destinoTipo: v as "tecnico" | "filial" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="tecnico">Tecnico</SelectItem><SelectItem value="filial">Filial</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Nome do Destino</Label>
              {comodatoForm.destinoTipo === "tecnico" ? (
                <Select value={comodatoForm.destinoNome} onValueChange={v => setComodatoForm(f => ({ ...f, destinoNome: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tecnicosIniciais.map(t => <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={comodatoForm.destinoNome} onChange={e => setComodatoForm(f => ({ ...f, destinoNome: e.target.value }))} placeholder="Nome da filial" />
              )}
            </div>
            <div><Label>Quantidade</Label><Input type="number" value={comodatoForm.quantidade} onChange={e => setComodatoForm(f => ({ ...f, quantidade: +e.target.value }))} /></div>
            <div><Label>Codigo Rastreio (Correios)</Label><Input value={comodatoForm.codigoRastreio} onChange={e => setComodatoForm(f => ({ ...f, codigoRastreio: e.target.value }))} placeholder="BR000000000XX" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComodatoModal(false)}>Cancelar</Button>
            <Button onClick={salvarComodato}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>{detalhe.marca} {detalhe.modelo}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Tipo</span><p className="font-medium">{tipoMap[detalhe.tipo]}</p></div>
                  <div><span className="text-muted-foreground">Serial</span><p className="font-mono">{detalhe.serial}</p></div>
                  <div><span className="text-muted-foreground">IMEI</span><p className="font-mono">{detalhe.imei || "--"}</p></div>
                  <div><span className="text-muted-foreground">SIM Card</span><p className="font-mono">{detalhe.simCard || "--"}</p></div>
                  <div><span className="text-muted-foreground">ICCID</span><p className="font-mono">{detalhe.iccid || "--"}</p></div>
                  <div><span className="text-muted-foreground">Quantidade</span><p>{detalhe.quantidade}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusMap[detalhe.status]?.variant}>{statusMap[detalhe.status]?.label}</Badge></p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Localizacao</span><p>{detalhe.localizacao}</p></div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Comodatos</h4>
                  {detalhe.comodatos.length === 0 ? <p className="text-muted-foreground">Nenhum comodato registrado.</p> : (
                    <div className="space-y-2">
                      {detalhe.comodatos.map(c => (
                        <div key={c.id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{c.destinoNome}</span>
                            <Badge variant="outline">{c.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.quantidade}x - Envio: {c.dataEnvio} {c.codigoRastreio && `- Rastreio: ${c.codigoRastreio}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Historico de Movimentacoes</h4>
                  {detalhe.movimentacoes.length === 0 ? <p className="text-muted-foreground">Nenhuma movimentacao registrada.</p> : (
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
