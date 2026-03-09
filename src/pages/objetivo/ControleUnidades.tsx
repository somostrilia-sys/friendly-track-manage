import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { controleUnidadesIniciais, ControleUnidade } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Building2, Cpu, Smartphone, DollarSign } from "lucide-react";

const acessoVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ativo: "default",
  pendente: "secondary",
  bloqueado: "destructive",
};

const ControleUnidades = () => {
  const [unidades] = useState(controleUnidadesIniciais);
  const [detalhe, setDetalhe] = useState<ControleUnidade | null>(null);

  const totalRastreadores = unidades.reduce((a, u) => a + u.totalRastreadores, 0);
  const totalChips = unidades.reduce((a, u) => a + u.totalChips, 0);
  const valorTotal = unidades.reduce((a, u) => a + u.valorMensal, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Controle por Unidade</h1>
        <p className="text-muted-foreground text-sm">Rastreadores, chips e acessos por unidade Objetivo Auto Truck</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Unidades" value={unidades.length} icon={Building2} accent="primary" />
        <StatCard label="Rastreadores" value={totalRastreadores} icon={Cpu} accent="success" />
        <StatCard label="Chips" value={totalChips} icon={Smartphone} accent="warning" />
        <StatCard label="Valor Mensal" value={`R$ ${valorTotal}`} icon={DollarSign} accent="primary" />
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Responsavel</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Rastreadores</TableHead>
              <TableHead>Chips</TableHead>
              <TableHead>Acesso Plataforma</TableHead>
              <TableHead>Valor Mensal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidades.map(u => (
              <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetalhe(u)}>
                <TableCell className="font-medium">{u.unidade}</TableCell>
                <TableCell>{u.responsavel}</TableCell>
                <TableCell>{u.cidade}/{u.estado}</TableCell>
                <TableCell>{u.totalRastreadores}</TableCell>
                <TableCell>{u.totalChips}</TableCell>
                <TableCell><Badge variant={acessoVariant[u.acessoPlataforma]} className="capitalize">{u.acessoPlataforma}</Badge></TableCell>
                <TableCell className="font-medium">R$ {u.valorMensal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                  <div><span className="text-muted-foreground">Acesso Plataforma</span><p><Badge variant={acessoVariant[detalhe.acessoPlataforma]} className="capitalize">{detalhe.acessoPlataforma}</Badge></p></div>
                  <div><span className="text-muted-foreground">Valor Mensal</span><p className="font-semibold text-primary">R$ {detalhe.valorMensal}</p></div>
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

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground font-medium">Base de Cobranca</p>
                  <p className="text-sm mt-1">{detalhe.totalRastreadores} rastreador(es) + {detalhe.totalChips} chip(s) + plataforma = <strong>R$ {detalhe.valorMensal}/mes</strong></p>
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
