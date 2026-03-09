import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { configuracoesDispositivosIniciais, ConfiguracaoDispositivo } from "@/data/mock-data";
import { StatCard } from "@/components/StatCard";
import { Settings, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const statusLabels: Record<string, string> = { pendente: "Pendente", configurado: "Configurado", testado: "Testado" };
const statusVariants: Record<string, "default" | "secondary" | "outline"> = { pendente: "outline", configurado: "secondary", testado: "default" };

const ConfiguracaoDispositivos = () => {
  const [configs, setConfigs] = useState(configuracoesDispositivosIniciais);
  const [detalhe, setDetalhe] = useState<ConfiguracaoDispositivo | null>(null);

  const testados = configs.filter(c => c.status === "testado").length;
  const configurados = configs.filter(c => c.status === "configurado").length;
  const pendentes = configs.filter(c => c.status === "pendente").length;

  const toggleChecklist = (configId: string, itemIndex: number) => {
    setConfigs(prev => prev.map(c => {
      if (c.id !== configId) return c;
      const checklist = c.checklist.map((item, i) => i === itemIndex ? { ...item, feito: !item.feito } : item);
      const allDone = checklist.every(i => i.feito);
      const newStatus = allDone ? "configurado" as const : "pendente" as const;
      const updated = { ...c, checklist, checklistConcluido: allDone, status: c.status === "testado" ? c.status : newStatus };
      if (detalhe?.id === configId) setDetalhe(updated);
      return updated;
    }));
    toast.success("Checklist atualizado");
  };

  const marcarTestado = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, status: "testado" as const } : c));
    if (detalhe?.id === id) setDetalhe(prev => prev ? { ...prev, status: "testado" } : null);
    toast.success("Dispositivo marcado como testado!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuracao de Dispositivos</h1>
        <p className="text-muted-foreground text-sm">Registro tecnico e checklist de rastreadores</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={configs.length} icon={Settings} accent="primary" />
        <StatCard label="Testados" value={testados} icon={CheckCircle} accent="success" />
        <StatCard label="Configurados" value={configurados} icon={AlertCircle} accent="warning" />
        <StatCard label="Pendentes" value={pendentes} icon={Clock} accent="destructive" />
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>Firmware</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsavel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map(c => {
              const progresso = Math.round((c.checklist.filter(i => i.feito).length / c.checklist.length) * 100);
              return (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetalhe(c)}>
                  <TableCell className="font-mono text-sm">{c.serial}</TableCell>
                  <TableCell>{c.modelo}</TableCell>
                  <TableCell className="font-mono text-xs">{c.imei}</TableCell>
                  <TableCell>{c.firmware}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progresso} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground">{progresso}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={statusVariants[c.status]}>{statusLabels[c.status]}</Badge></TableCell>
                  <TableCell>{c.responsavelConfig || "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>{detalhe.modelo} - {detalhe.serial}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">IMEI</span><p className="font-mono font-medium">{detalhe.imei}</p></div>
                  <div><span className="text-muted-foreground">Firmware</span><p className="font-medium">{detalhe.firmware}</p></div>
                  <div><span className="text-muted-foreground">APN</span><p className="font-medium">{detalhe.apn}</p></div>
                  <div><span className="text-muted-foreground">IP:Porta</span><p className="font-mono font-medium">{detalhe.ip}:{detalhe.porta}</p></div>
                  <div><span className="text-muted-foreground">Intervalo TX</span><p className="font-medium">{detalhe.intervaloTransmissao}s</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusVariants[detalhe.status]}>{statusLabels[detalhe.status]}</Badge></p></div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Checklist de Configuracao</h4>
                  <div className="space-y-2">
                    {detalhe.checklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                        <Checkbox checked={item.feito} onCheckedChange={() => toggleChecklist(detalhe.id, i)} />
                        <span className={item.feito ? "line-through text-muted-foreground" : ""}>{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {detalhe.status === "configurado" && (
                  <Button className="w-full" onClick={() => marcarTestado(detalhe.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Marcar como Testado
                  </Button>
                )}

                {detalhe.observacoes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground font-medium">Observacoes</p>
                    <p className="text-sm mt-1">{detalhe.observacoes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ConfiguracaoDispositivos;
