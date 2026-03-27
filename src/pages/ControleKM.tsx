import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useControleKM, useInsertControleKM, useTecnicos } from "@/hooks/useSupabaseData";
import type { DbControleKM } from "@/types/database";
import { StatCard } from "@/components/StatCard";
import { Plus, MapPin, Route, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface InstalacaoDia { endereco: string; horario: string; kmTrecho: number; }

const ControleKMPage = () => {
  const { data: registros = [], isLoading } = useControleKM();
  const { data: tecnicos = [] } = useTecnicos();
  const insertKM = useInsertControleKM();

  const [modalOpen, setModalOpen] = useState(false);
  const [filtroTecnico, setFiltroTecnico] = useState("all");
  const [filtroData, setFiltroData] = useState("");
  const [formTecnicoId, setFormTecnicoId] = useState("");
  const [formData, setFormData] = useState("");
  const [instalacoes, setInstalacoes] = useState<InstalacaoDia[]>([{ endereco: "", horario: "", kmTrecho: 0 }]);

  const addInstalacao = () => setInstalacoes(prev => [...prev, { endereco: "", horario: "", kmTrecho: 0 }]);
  const removeInstalacao = (i: number) => setInstalacoes(prev => prev.filter((_, idx) => idx !== i));
  const updateInstalacao = (i: number, field: keyof InstalacaoDia, value: string | number) => {
    setInstalacoes(prev => prev.map((inst, idx) => idx === i ? { ...inst, [field]: value } : inst));
  };
  const kmTotalForm = instalacoes.reduce((a, inst) => a + inst.kmTrecho, 0);

  const filtrado = registros.filter(r => {
    if (filtroTecnico !== "all" && r.tecnico_id !== filtroTecnico) return false;
    if (filtroData && r.data !== filtroData) return false;
    return true;
  });

  const totais = filtrado.reduce((acc, r) => {
    const key = `${r.tecnico_nome} - ${r.data}`;
    acc[key] = (acc[key] || 0) + r.km_calculado;
    return acc;
  }, {} as Record<string, number>);

  const totalKm = filtrado.reduce((a, r) => a + r.km_calculado, 0);
  const tecnicosUnicos = [...new Set(filtrado.map(r => r.tecnico_nome))].length;

  const salvar = async () => {
    if (!formTecnicoId || instalacoes.length === 0) { toast.error("Preencha tecnico e pelo menos uma instalacao"); return; }
    const tec = tecnicos.find(t => t.id === formTecnicoId);
    const data = formData || new Date().toISOString().split("T")[0];
    let count = 0;
    for (const inst of instalacoes.filter(i => i.endereco)) {
      try {
        await insertKM.mutateAsync({
          tecnico_id: formTecnicoId, tecnico_nome: tec?.nome || "",
          endereco_instalacao: inst.endereco, horario: inst.horario, data, km_calculado: inst.kmTrecho,
        });
        count++;
      } catch { /* skip */ }
    }
    setModalOpen(false);
    setFormTecnicoId(""); setFormData("");
    setInstalacoes([{ endereco: "", horario: "", kmTrecho: 0 }]);
    toast.success(`${count} instalacao(es) registrada(s) - Total: ${kmTotalForm} km`);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Controle de KM" subtitle="Registre todas as instalacoes do dia com KM total automatico">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Registrar Dia</Button>
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total KM" value={`${totalKm} km`} icon={Route} accent="primary" />
        <StatCard label="Registros" value={filtrado.length} icon={MapPin} />
        <StatCard label="Tecnicos" value={tecnicosUnicos} icon={MapPin} accent="success" />
      </div>
      <Card className="card-shadow">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tecnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tecnicos</SelectItem>
              {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-[160px]" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tecnico</TableHead><TableHead>Endereco</TableHead><TableHead>Horario</TableHead>
              <TableHead>Data</TableHead><TableHead>KM Trecho</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrado.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.tecnico_nome}</TableCell>
                <TableCell className="text-sm">{r.endereco_instalacao}</TableCell>
                <TableCell>{r.horario}</TableCell>
                <TableCell>{r.data}</TableCell>
                <TableCell><Badge variant="secondary">{r.km_calculado} km</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {Object.keys(totais).length > 0 && (
        <Card className="p-6 card-shadow">
          <h3 className="font-semibold mb-4">Totalizacao por Tecnico / Dia</h3>
          <div className="space-y-2">
            {Object.entries(totais).map(([key, km]) => (
              <div key={key} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="font-medium text-sm">{key}</span><Badge>{km} km</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Instalacoes do Dia</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tecnico</Label>
                <Select value={formTecnicoId} onValueChange={setFormTecnicoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data</Label><Input type="date" value={formData} onChange={e => setFormData(e.target.value)} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Instalacoes do Dia</Label>
                <Button size="sm" variant="outline" onClick={addInstalacao}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
              </div>
              <div className="space-y-3">
                {instalacoes.map((inst, i) => (
                  <div key={i} className="flex gap-2 items-end p-3 rounded-lg bg-muted/30 border">
                    <div className="flex-1"><Label className="text-xs">Endereco #{i + 1}</Label><Input value={inst.endereco} onChange={e => updateInstalacao(i, "endereco", e.target.value)} placeholder="Rua, cidade..." /></div>
                    <div className="w-20"><Label className="text-xs">Horario</Label><Input value={inst.horario} onChange={e => updateInstalacao(i, "horario", e.target.value)} placeholder="09:00" /></div>
                    <div className="w-24"><Label className="text-xs">KM Trecho</Label><Input type="number" value={inst.kmTrecho} onChange={e => updateInstalacao(i, "kmTrecho", +e.target.value)} /></div>
                    {instalacoes.length > 1 && <Button size="icon" variant="ghost" onClick={() => removeInstalacao(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium">KM Total do Dia: <strong>{kmTotalForm} km</strong></p>
              <p className="text-xs text-muted-foreground mt-1">Rota: {instalacoes.filter(i => i.endereco).map(i => i.endereco.split(",")[0]).join(" -> ")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Registrar Dia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ControleKMPage;
