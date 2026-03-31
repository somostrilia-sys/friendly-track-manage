import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useAgendamentos, useEquipamentos } from "@/hooks/useSupabaseData";
import { Search, Radio, CheckCircle2, XCircle, Clock, MapPin } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

const statusBadge = (status: string) => {
  if (status === "ativo") return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">Ativo</Badge>;
  if (status === "inativo") return <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200">Inativo</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const Rastreadores = () => {
  const { data: agendamentos = [], isLoading: loadingAg } = useAgendamentos();
  const { data: equipamentos = [], isLoading: loadingEq } = useEquipamentos();
  const [busca, setBusca] = useState("");

  const isLoading = loadingAg || loadingEq;

  // Build a map from serial → equipamento for quick lookup
  const equipMap = useMemo(() => {
    const m: Record<string, typeof equipamentos[0]> = {};
    equipamentos.forEach(e => { if (e.serial) m[e.serial] = e; });
    return m;
  }, [equipamentos]);

  // Build list: one entry per placa, using latest instalação realizada
  const rastreadores = useMemo(() => {
    const placaMap: Record<string, typeof agendamentos[0]> = {};
    agendamentos
      .filter(a => a.tipo === "instalacao")
      .forEach(a => {
        const placa = a.placa?.trim().toUpperCase();
        if (!placa) return;
        const prev = placaMap[placa];
        if (!prev || a.data > prev.data) placaMap[placa] = a;
      });

    return Object.values(placaMap).map(a => {
      const serial = a.rastreador_serial?.trim() || "";
      const eq = equipMap[serial];
      const status = a.status === "realizado" ? "ativo" : "inativo";
      return {
        placa: a.placa?.toUpperCase() || "—",
        modelo: eq?.modelo || eq?.marca ? `${eq?.marca || ""} ${eq?.modelo || ""}`.trim() : (serial ? `Rastreador ${serial}` : "—"),
        serial: serial || "—",
        status,
        ultimoSinal: a.data ? `${a.data}T${a.horario || "00:00"}:00` : null,
        tecnico: a.tecnico_nome || "—",
        cidade: a.cidade || "—",
        associado: a.associado || "—",
      };
    });
  }, [agendamentos, equipMap]);

  const filtered = busca
    ? rastreadores.filter(r =>
        r.placa.includes(busca.toUpperCase()) ||
        r.modelo.toLowerCase().includes(busca.toLowerCase()) ||
        r.serial.toLowerCase().includes(busca.toLowerCase()) ||
        r.associado.toLowerCase().includes(busca.toLowerCase())
      )
    : rastreadores;

  const ativos = rastreadores.filter(r => r.status === "ativo").length;
  const inativos = rastreadores.filter(r => r.status === "inativo").length;
  const total = rastreadores.length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rastreadores"
        subtitle="Veículos monitorados — status, placa e modelo"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} icon={<Radio className="h-4 w-4" />} />
        <StatCard title="Ativos" value={ativos} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
        <StatCard title="Inativos" value={inativos} icon={<XCircle className="h-4 w-4 text-slate-400" />} />
        <StatCard title="Cidades" value={new Set(rastreadores.map(r => r.cidade)).size} icon={<MapPin className="h-4 w-4" />} />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar placa, modelo, serial..."
              className="pl-9"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="ml-auto">{filtered.length} veículo{filtered.length !== 1 ? "s" : ""}</Badge>
        </div>

        {isLoading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="rounded-full bg-muted/60 p-4">
              <Radio className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-muted-foreground">
              {busca ? "Nenhum veículo encontrado para esta busca" : "Nenhum rastreador instalado ainda"}
            </p>
            <p className="text-sm text-muted-foreground/60 max-w-xs">
              {busca
                ? "Tente outro termo de busca"
                : "Registre instalações em Agendamentos para os veículos aparecerem aqui"}
            </p>
            {busca && (
              <Button variant="outline" size="sm" onClick={() => setBusca("")}>
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Modelo / Serial</TableHead>
                <TableHead>Cliente / Associado</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Último Sinal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={`${r.placa}-${i}`}>
                  <TableCell className="font-mono font-semibold text-sm">{r.placa}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{r.modelo}</div>
                    {r.serial !== "—" && (
                      <div className="text-xs text-muted-foreground font-mono">{r.serial}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.associado}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.cidade}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      {formatDate(r.ultimoSinal)}
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Rastreadores;
