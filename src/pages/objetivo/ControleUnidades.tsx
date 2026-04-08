import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUnidadesCompletas, useDespachos, useInsertControleUnidade, useUpdateControleUnidade, useRealtimeSubscription } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import type { DbControleUnidade, DbUnidadeRastreador, DbUnidadeChip, DbDespacho } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Building2, Cpu, Smartphone, DollarSign, Truck, Package, Plus, Download } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type UnidadeCompleta = DbControleUnidade & { rastreadores: DbUnidadeRastreador[]; chips: DbUnidadeChip[] };

// Generate dynamic months
const generateMeses = (): string[] => {
  const meses: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    meses.push(`${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
  }
  return meses;
};

const ControleUnidades = () => {
  const { data: unidades = [], isLoading } = useUnidadesCompletas();
  const { data: allDespachos = [] } = useDespachos();
  const insertUnidade = useInsertControleUnidade();
  const updateUnidade = useUpdateControleUnidade();

  useRealtimeSubscription("controle_unidades", ["controle_unidades", "unidades_completas"]);

  const meses = useMemo(() => generateMeses(), []);
  const [detalhe, setDetalhe] = useState<UnidadeCompleta | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState(meses[meses.length - 1]);
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaForm, setNovaForm] = useState({ unidade: "", responsavel: "", cidade: "", estado: "", valor_mensal: 0 });

  const uns = unidades as UnidadeCompleta[];

  // Filtrar registros pelo mês selecionado
  const isNoMes = (dataEnvio: string | null) => {
    if (!dataEnvio) return false;
    const mes = dataEnvio.substring(5, 7) + "/" + dataEnvio.substring(0, 4);
    return mes === mesSelecionado;
  };

  // Total do mês = acumulados (modelo "Acumulado") do mês selecionado
  const getRastTotal = (u: UnidadeCompleta) => u.rastreadores
    .filter((r: any) => r.modelo === "Acumulado" && isNoMes(r.data_envio))
    .reduce((a, r) => a + ((r as any).quantidade || 0), 0);
  const getChipTotal = (u: UnidadeCompleta) => u.chips
    .filter((c: any) => isNoMes(c.data_envio))
    .reduce((a, c) => a + ((c as any).quantidade || 0), 0);

  // Envios do mês = registros que NÃO são acumulados, no mês selecionado
  const getEnviosMes = (u: UnidadeCompleta) => u.rastreadores
    .filter((r: any) => r.modelo !== "Acumulado" && isNoMes(r.data_envio))
    .reduce((a, r) => a + ((r as any).quantidade || 0), 0);

  const enviosPorUnidade = useMemo(() => {
    const map: Record<string, number> = {};
    for (const u of uns) {
      const qtd = getEnviosMes(u);
      if (qtd > 0) map[u.unidade] = qtd;
    }
    allDespachos.forEach((d: DbDespacho) => {
      if (!d.data_envio) return;
      const mes = d.data_envio.substring(5, 7) + "/" + d.data_envio.substring(0, 4);
      if (mes === mesSelecionado) {
        map[d.unidade_destino] = (map[d.unidade_destino] || 0) + 1;
      }
    });
    return map;
  }, [mesSelecionado, allDespachos, uns]);

  const totalRastreadores = uns.reduce((a, u) => a + getRastTotal(u), 0);
  const totalChips = uns.reduce((a, u) => a + getChipTotal(u), 0);
  const valorTotal = totalRastreadores * 7;
  const rastreadoresEnviados = Object.values(enviosPorUnidade).reduce((a, b) => a + b, 0);
  const estoque = 0;
  const ativos = totalRastreadores;

  const criarUnidade = async () => {
    if (!novaForm.unidade || !novaForm.cidade) { toast.error("Preencha unidade e cidade"); return; }
    try {
      await insertUnidade.mutateAsync(novaForm as any);
      setNovaOpen(false);
      setNovaForm({ unidade: "", responsavel: "", cidade: "", estado: "", valor_mensal: 0 });
      toast.success("Unidade criada!");
    } catch (e: any) { toast.error(e.message); }
  };

  const exportarXLSX = () => {
    const data = uns.map(u => ({
      Unidade: u.unidade,
      Responsavel: u.responsavel,
      "Cidade/UF": `${u.cidade}/${u.estado}`,
      Rastreadores: getRastTotal(u),
      Ativos: getRastTotal(u),
      Chips: getChipTotal(u),
      "Envios no Mes": enviosPorUnidade[u.unidade] || 0,
      "Valor Mensal": getRastTotal(u) * 7,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Unidades");

    // Add summary sheet
    const summary = [
      { Metrica: "Total Rastreadores", Valor: totalRastreadores },
      { Metrica: "Ativos/Instalados", Valor: ativos },
      { Metrica: "Em Estoque", Valor: estoque },
      { Metrica: "Total Chips", Valor: totalChips },
      { Metrica: "Enviados no Mes", Valor: rastreadoresEnviados },
      { Metrica: "Faturamento Mensal", Valor: valorTotal },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws2, "Resumo");

    XLSX.writeFile(wb, `controle-unidades-${mesSelecionado.replace("/", "-")}.xlsx`);
    toast.success("Planilha exportada!");
  };

  // Sincronismo automático com Faturamento B2B
  const lastSync = useRef("");
  useEffect(() => {
    const key = `${mesSelecionado}-${totalRastreadores}-${rastreadoresEnviados}`;
    if (key === lastSync.current || isLoading) return;
    if (totalRastreadores === 0 && rastreadoresEnviados === 0) return;
    lastSync.current = key;

    const [mesNum, ano] = mesSelecionado.split("/");
    const mesesNome: Record<string, string> = { "01": "JANEIRO", "02": "FEVEREIRO", "03": "MARÇO", "04": "ABRIL", "05": "MAIO", "06": "JUNHO", "07": "JULHO", "08": "AGOSTO", "09": "SETEMBRO", "10": "OUTUBRO", "11": "NOVEMBRO", "12": "DEZEMBRO" };
    const mesRef = `${mesesNome[mesNum]} ${ano}`;
    const dataFech = `${ano}-${mesNum}-25`;

    (async () => {
      try {
        if (totalRastreadores > 0) {
          const { data: existing } = await supabase.from("faturamento_b2b")
            .select("id").eq("mes_referencia", mesRef).eq("empresa", "Objetivo Auto Beneficios").limit(1);
          const record = {
            mes_referencia: mesRef, data_fechamento: dataFech, empresa: "Objetivo Auto Beneficios",
            qtd_placas: totalRastreadores, valor_por_placa: 7, total_plataforma: totalRastreadores * 7,
            qtd_linhas_smartsim: 0, valor_smartsim: 0, total_smartsim: 0,
            qtd_linhas_linkfield: 0, valor_linkfield: 0, total_linkfield: 0,
            qtd_linhas_arqia: 0, valor_arqia: 0, total_arqia: 0,
            total_linhas: 0, total_geral: totalRastreadores * 7,
          };
          if (existing?.length) await supabase.from("faturamento_b2b").update(record).eq("id", existing[0].id);
          else await supabase.from("faturamento_b2b").insert({ ...record, situacao: "aberto" });
        }

        if (rastreadoresEnviados > 0) {
          const { data: existing2 } = await supabase.from("faturamento_b2b")
            .select("id").eq("mes_referencia", mesRef).eq("empresa", "Objetivo Equipamentos").limit(1);
          const record2 = {
            mes_referencia: mesRef, data_fechamento: dataFech, empresa: "Objetivo Equipamentos",
            qtd_placas: rastreadoresEnviados, valor_por_placa: 120, total_plataforma: rastreadoresEnviados * 120,
            qtd_linhas_smartsim: 0, valor_smartsim: 0, total_smartsim: 0,
            qtd_linhas_linkfield: 0, valor_linkfield: 0, total_linkfield: 0,
            qtd_linhas_arqia: 0, valor_arqia: 0, total_arqia: 0,
            total_linhas: 0, total_geral: rastreadoresEnviados * 120,
          };
          if (existing2?.length) await supabase.from("faturamento_b2b").update(record2).eq("id", existing2[0].id);
          else await supabase.from("faturamento_b2b").insert({ ...record2, situacao: "aberto" });
        }
      } catch (e) {
        console.error("Erro sync financeiro:", e);
      }
    })();
  }, [mesSelecionado, totalRastreadores, rastreadoresEnviados, isLoading]);

  if (isLoading) return (
    <div className="space-y-8">
      <PageHeader title="Controle de Unidades" subtitle="Fechamento mensal por unidade Objetivo Auto Truck" />
      <TableSkeleton rows={6} cols={10} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Controle de Unidades" subtitle="Fechamento mensal por unidade Objetivo Auto Truck">
        <div className="flex items-center gap-3">
          <Label className="text-sm">Periodo:</Label>
          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={exportarXLSX}><Download className="w-4 h-4 mr-2" /> Exportar XLSX</Button>
          <Button onClick={() => setNovaOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Unidade</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Unidades" value={uns.length} icon={Building2} accent="primary" />
        <StatCard label="Rastreadores Ativos" value={ativos} icon={Cpu} accent="success" />
        <StatCard label="Em Estoque" value={estoque} icon={Package} accent="warning" />
        <StatCard label="Enviados no Mes" value={rastreadoresEnviados} icon={Truck} accent="primary" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Chips" value={totalChips} icon={Smartphone} accent="muted" />
        <StatCard label="Valor Mensal Total" value={`R$ ${(valorTotal || 0).toLocaleString("pt-BR")}`} icon={DollarSign} accent="success" />
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead><TableHead>Responsavel</TableHead><TableHead>Cidade/UF</TableHead>
              <TableHead>Rastreadores</TableHead><TableHead>Em Estoque</TableHead><TableHead>Ativos</TableHead>
              <TableHead>Chips</TableHead><TableHead>Envios no Mes</TableHead><TableHead>Acesso</TableHead><TableHead>Valor Mensal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uns.map(u => (
              <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetalhe(u)}>
                <TableCell className="font-medium">{u.unidade}</TableCell>
                <TableCell>{u.responsavel}</TableCell>
                <TableCell>{u.cidade}/{u.estado}</TableCell>
                <TableCell>{getRastTotal(u)}</TableCell>
                <TableCell>--</TableCell>
                <TableCell>{getRastTotal(u)}</TableCell>
                <TableCell>{getChipTotal(u)}</TableCell>
                <TableCell><Badge variant="outline">{enviosPorUnidade[u.unidade] || 0}</Badge></TableCell>
                <TableCell>--</TableCell>
                <TableCell className="font-medium">R$ {(getRastTotal(u) * 7).toLocaleString("pt-BR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6 card-shadow">
        <h3 className="font-semibold mb-4">Resumo Consolidado - {mesSelecionado}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-muted/50 text-center"><p className="text-2xl font-bold">{totalRastreadores}</p><p className="text-xs text-muted-foreground">Total Rastreadores</p></div>
          <div className="p-4 rounded-lg bg-muted/50 text-center"><p className="text-2xl font-bold">{ativos}</p><p className="text-xs text-muted-foreground">Ativos/Instalados</p></div>
          <div className="p-4 rounded-lg bg-muted/50 text-center"><p className="text-2xl font-bold">{estoque}</p><p className="text-xs text-muted-foreground">Em Estoque</p></div>
          <div className="p-4 rounded-lg bg-muted/50 text-center"><p className="text-2xl font-bold text-primary">R$ {(valorTotal || 0).toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Faturamento Mensal</p></div>
        </div>
      </Card>

      {/* Nova Unidade */}
      <Dialog open={novaOpen} onOpenChange={setNovaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Unidade</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome da Unidade</Label><Input value={novaForm.unidade} onChange={e => setNovaForm(f => ({ ...f, unidade: e.target.value }))} placeholder="Objetivo Campinas" /></div>
            <div><Label>Responsavel</Label><Input value={novaForm.responsavel} onChange={e => setNovaForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cidade</Label><Input value={novaForm.cidade} onChange={e => setNovaForm(f => ({ ...f, cidade: e.target.value }))} /></div>
              <div><Label>Estado</Label><Input value={novaForm.estado} onChange={e => setNovaForm(f => ({ ...f, estado: e.target.value }))} placeholder="SP" /></div>
            </div>
            <div><Label>Valor Mensal (R$)</Label><Input type="number" value={novaForm.valor_mensal || ""} onChange={e => setNovaForm(f => ({ ...f, valor_mensal: +e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaOpen(false)}>Cancelar</Button>
            <Button onClick={criarUnidade}>Criar Unidade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhe */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>{detalhe.unidade}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Responsavel</span><p className="font-medium">{detalhe.responsavel}</p></div>
                  <div><span className="text-muted-foreground">Cidade/UF</span><p className="font-medium">{detalhe.cidade}/{detalhe.estado}</p></div>
                  <div><span className="text-muted-foreground">Acesso Plataforma</span><p><Badge variant={detalhe.acesso_plataforma === "ativo" ? "default" : "secondary"} className="capitalize">{detalhe.acesso_plataforma}</Badge></p></div>
                  <div><span className="text-muted-foreground">Valor Mensal</span><p className="font-semibold text-primary">R$ {detalhe.valor_mensal?.toLocaleString("pt-BR") ?? "0"}</p></div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Rastreadores ({detalhe.rastreadores.length})</h4>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {detalhe.rastreadores.map((r, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="font-mono text-xs">{r.serial} - {r.modelo}</span>
                        <Badge variant="outline" className="capitalize text-xs">{r.status}</Badge>
                      </div>
                    ))}
                    {detalhe.rastreadores.length === 0 && <p className="text-muted-foreground">Nenhum rastreador.</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Chips ({detalhe.chips.length})</h4>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {detalhe.chips.map((c, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="font-mono text-xs">{c.iccid} ({c.operadora})</span>
                        <Badge variant={c.status === "ativo" ? "default" : "destructive"} className="text-xs capitalize">{c.status}</Badge>
                      </div>
                    ))}
                    {detalhe.chips.length === 0 && <p className="text-muted-foreground">Nenhum chip.</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Envios Recentes</h4>
                  {allDespachos.filter((d: DbDespacho) => d.unidade_destino === detalhe.unidade).slice(0, 10).map((d: DbDespacho) => (
                    <div key={d.id} className="flex justify-between p-2 rounded bg-muted/50 mb-1">
                      <div><p className="font-mono text-xs">{d.serial} - {d.rastreador_modelo}</p><p className="text-xs text-muted-foreground">{d.data_envio}</p></div>
                      <Badge variant="outline" className="text-xs capitalize">{d.status_entrega.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground font-medium">Regra: 1 rastreador = 1 chip</p>
                  <p className="text-sm mt-1">{detalhe.total_rastreadores} rastreador(es) + {detalhe.total_chips} chip(s) = <strong>R$ {detalhe.valor_mensal?.toLocaleString("pt-BR") ?? "0"}/mes</strong></p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ControleUnidades;
