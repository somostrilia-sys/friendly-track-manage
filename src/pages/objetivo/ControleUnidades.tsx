import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUnidadesCompletas, useDespachos } from "@/hooks/useSupabaseData";
import type { DbControleUnidade, DbUnidadeRastreador, DbUnidadeChip, DbDespacho } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Building2, Cpu, Smartphone, DollarSign, Truck, Package } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";

const meses = ["01/2024", "02/2024", "03/2024"];

type UnidadeCompleta = DbControleUnidade & { rastreadores: DbUnidadeRastreador[]; chips: DbUnidadeChip[] };

const ControleUnidades = () => {
  const { data: unidades = [], isLoading } = useUnidadesCompletas();
  const { data: allDespachos = [] } = useDespachos();
  const [detalhe, setDetalhe] = useState<UnidadeCompleta | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState("03/2024");

  const uns = unidades as UnidadeCompleta[];
  const totalRastreadores = uns.reduce((a, u) => a + u.total_rastreadores, 0);
  const totalChips = uns.reduce((a, u) => a + u.total_chips, 0);
  const valorTotal = uns.reduce((a, u) => a + u.valor_mensal, 0);

  const enviosPorUnidade = useMemo(() => {
    const map: Record<string, number> = {};
    allDespachos.forEach((d: DbDespacho) => {
      const mes = d.data_envio.substring(5, 7) + "/" + d.data_envio.substring(0, 4);
      if (mes === mesSelecionado) {
        map[d.unidade_destino] = (map[d.unidade_destino] || 0) + 1;
      }
    });
    return map;
  }, [mesSelecionado, allDespachos]);

  const rastreadoresEnviados = Object.values(enviosPorUnidade).reduce((a, b) => a + b, 0);
  const estoque = uns.reduce((a, u) => a + u.rastreadores.filter(r => r.status === "estoque").length, 0);
  const ativos = uns.reduce((a, u) => a + u.rastreadores.filter(r => r.status === "instalado").length, 0);

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
        <StatCard label="Valor Mensal Total" value={`R$ ${valorTotal}`} icon={DollarSign} accent="success" />
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
                <TableCell>{u.total_rastreadores}</TableCell>
                <TableCell>{u.rastreadores.filter(r => r.status === "estoque").length}</TableCell>
                <TableCell>{u.rastreadores.filter(r => r.status === "instalado").length}</TableCell>
                <TableCell>{u.total_chips}</TableCell>
                <TableCell><Badge variant="outline">{enviosPorUnidade[u.unidade] || 0}</Badge></TableCell>
                <TableCell><Badge variant={u.acesso_plataforma === "ativo" ? "default" : u.acesso_plataforma === "pendente" ? "secondary" : "destructive"} className="capitalize">{u.acesso_plataforma}</Badge></TableCell>
                <TableCell className="font-medium">R$ {u.valor_mensal}</TableCell>
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
          <div className="p-4 rounded-lg bg-muted/50 text-center"><p className="text-2xl font-bold text-primary">R$ {valorTotal}</p><p className="text-xs text-muted-foreground">Faturamento Mensal</p></div>
        </div>
      </Card>
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
                  <div><span className="text-muted-foreground">Valor Mensal</span><p className="font-semibold text-primary">R$ {detalhe.valor_mensal}</p></div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Rastreadores ({detalhe.rastreadores.length})</h4>
                  <div className="space-y-1">
                    {detalhe.rastreadores.map((r, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="font-mono text-xs">{r.serial} - {r.modelo}</span>
                        <Badge variant="outline" className="capitalize text-xs">{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Chips ({detalhe.chips.length})</h4>
                  <div className="space-y-1">
                    {detalhe.chips.map((c, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="font-mono text-xs">{c.iccid} ({c.operadora})</span>
                        <Badge variant={c.status === "ativo" ? "default" : "destructive"} className="text-xs capitalize">{c.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Envios Recentes</h4>
                  {allDespachos.filter((d: DbDespacho) => d.unidade_destino === detalhe.unidade).map((d: DbDespacho) => (
                    <div key={d.id} className="flex justify-between p-2 rounded bg-muted/50 mb-1">
                      <div><p className="font-mono text-xs">{d.serial} - {d.rastreador_modelo}</p><p className="text-xs text-muted-foreground">{d.data_envio}</p></div>
                      <Badge variant="outline" className="text-xs capitalize">{d.status_entrega.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground font-medium">Base de Cobranca</p>
                  <p className="text-sm mt-1">{detalhe.total_rastreadores} rastreador(es) + {detalhe.total_chips} chip(s) + plataforma = <strong>R$ {detalhe.valor_mensal}/mes</strong></p>
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
