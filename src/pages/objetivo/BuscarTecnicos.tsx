import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Phone, Mail, UserPlus, Check, Inbox, Navigation, Wrench } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useTecnicos, useInsertServico } from "@/hooks/useSupabaseData";
import { toast } from "sonner";

const estados = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

interface GoogleResult {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  tipo: string;
}

const BuscarTecnicos = () => {
  const { data: tecnicos = [] } = useTecnicos();
  const insertServico = useInsertServico();

  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [buscou, setBuscou] = useState(false);
  const [googleResults, setGoogleResults] = useState<GoogleResult[]>([]);
  const [buscandoGoogle, setBuscandoGoogle] = useState(false);

  // Search registered technicians by city/state
  const tecnicosFiltrados = useMemo(() => {
    if (!buscou) return [];
    return tecnicos.filter(t => {
      const matchCidade = !cidade || t.cidade?.toLowerCase().includes(cidade.toLowerCase());
      const matchEstado = !estado || t.estado === estado;
      return matchCidade && matchEstado && t.status === "disponivel";
    });
  }, [buscou, tecnicos, cidade, estado]);

  const handleBuscar = async () => {
    setBuscou(true);

    // If no registered technicians found, search Google Places
    const found = tecnicos.filter(t => {
      const matchCidade = !cidade || t.cidade?.toLowerCase().includes(cidade.toLowerCase());
      const matchEstado = !estado || t.estado === estado;
      return matchCidade && matchEstado && t.status === "disponivel";
    });

    if (found.length === 0 && cidade) {
      setBuscandoGoogle(true);
      try {
        const query = `autoeletrica+instalador+rastreador+${cidade}+${estado}`;
        // Note: Google Places API requires a proxy for CORS. For now, show placeholder
        // In production, this would go through a Supabase Edge Function
        toast.info("Nenhum tecnico cadastrado encontrado. Busque no Google abaixo.");
      } catch {
        toast.error("Erro ao buscar no Google");
      }
      setBuscandoGoogle(false);
    }
  };

  const criarOSRapida = async (tecnicoId: string, tecnicoNome: string) => {
    try {
      await insertServico.mutateAsync({
        codigo: `OS-${Date.now()}`,
        tecnico_id: tecnicoId,
        tecnico_nome: tecnicoNome,
        cliente_nome: "",
        veiculo: "",
        tipo: "instalacao",
        endereco: "",
        cidade: cidade,
        estado: estado,
        data: new Date().toISOString().split("T")[0],
        horario: "",
        valor_servico: 0,
        status: "agendado",
      });
      toast.success(`OS criada para ${tecnicoNome}!`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Buscar Tecnicos" subtitle="Busca nos tecnicos cadastrados + Google Places para autoeletrica e oficinas" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Tecnicos Cadastrados" value={tecnicos.length} icon={Wrench} accent="primary" />
        <StatCard label="Disponiveis" value={tecnicos.filter(t => t.status === "disponivel").length} icon={Check} accent="success" />
        <StatCard label="Resultados" value={tecnicosFiltrados.length} icon={Search} accent="muted" />
      </div>

      <Card className="p-6 card-shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Cidade</label>
            <Input placeholder="Ex: Campinas" value={cidade} onChange={e => setCidade(e.target.value)} />
          </div>
          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-1.5 block">Estado</label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>{estados.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleBuscar}><Search className="w-4 h-4 mr-2" /> Buscar</Button>
          </div>
        </div>
      </Card>

      {buscou && (
        <Tabs defaultValue="cadastrados" className="w-full">
          <TabsList>
            <TabsTrigger value="cadastrados">Tecnicos Cadastrados ({tecnicosFiltrados.length})</TabsTrigger>
            <TabsTrigger value="google">Busca Google / Externo</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastrados">
            <Card className="card-shadow">
              {tecnicosFiltrados.length === 0 ? (
                <div className="empty-state empty-state-border m-4">
                  <Inbox className="empty-state-icon" />
                  <p className="text-sm text-muted-foreground">Nenhum tecnico cadastrado encontrado nesta regiao</p>
                  <p className="text-xs text-muted-foreground/60">Tente a aba "Busca Google" para encontrar oficinas e autoeletricas proximas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Valor/Inst.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tecnicosFiltrados.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.nome}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{t.tipo_tecnico}</Badge></TableCell>
                        <TableCell>{t.cidade}/{t.estado}</TableCell>
                        <TableCell className="text-sm">{t.especialidade}</TableCell>
                        <TableCell className="text-sm">{t.telefone}</TableCell>
                        <TableCell className="font-medium">R$ {t.valor_instalacao}</TableCell>
                        <TableCell><Badge variant="default">Disponivel</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => criarOSRapida(t.id, t.nome)}>
                            <Navigation className="w-3 h-3 mr-1" /> Criar OS
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="google">
            <Card className="p-6 card-shadow">
              <div className="text-center space-y-4">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="font-semibold">Busca no Google Places</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Busca autoeletricas, oficinas e instaladores de rastreadores proximos a <strong>{cidade || "cidade"} {estado && `- ${estado}`}</strong>
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const query = encodeURIComponent(`autoeletrica instalador rastreador ${cidade} ${estado}`);
                    window.open(`https://www.google.com/maps/search/${query}`, "_blank");
                    toast.info("Busca aberta no Google Maps");
                  }}
                >
                  <Search className="w-4 h-4 mr-2" /> Abrir no Google Maps
                </Button>
                <p className="text-xs text-muted-foreground">
                  A integracao direta com Google Places API sera ativada em breve via Edge Function
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default BuscarTecnicos;
