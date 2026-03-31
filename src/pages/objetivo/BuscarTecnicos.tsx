import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Navigation, Wrench, Check, Inbox, Star, Loader2, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useTecnicos, useInsertServico } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const estados = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

interface GooglePlace {
  id: string;
  nome: string;
  endereco: string;
  avaliacao: number;
  total_avaliacoes: number;
  aberto: boolean | null;
  lat: number;
  lng: number;
  tipos: string[];
  telefone: string;
  telefone_internacional: string;
  website: string;
}

const BuscarTecnicos = () => {
  const { data: tecnicos = [] } = useTecnicos();
  const insertServico = useInsertServico();

  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [buscou, setBuscou] = useState(false);
  const [googleResults, setGoogleResults] = useState<GooglePlace[]>([]);
  const [buscandoGoogle, setBuscandoGoogle] = useState(false);
  const [activeTab, setActiveTab] = useState("cadastrados");

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
    if (!cidade) { toast.error("Preencha a cidade"); return; }
    setBuscou(true);
    setGoogleResults([]);

    // Also search Busca Inteligente
    setBuscandoGoogle(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { cidade, estado, tipo: "autoeletrica instalador rastreador oficina" },
      });

      if (error) throw error;
      if (data?.results) {
        setGoogleResults(data.results);
        if (tecnicosFiltrados.length === 0 && data.results.length > 0) {
          setActiveTab("google");
        }
      }
    } catch (e: any) {
      console.error("Busca Inteligente error:", e);
      toast.error("Nao foi possivel buscar prestadores na regiao. Tente novamente.");
    }
    setBuscandoGoogle(false);
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
      <PageHeader title="Buscar Tecnicos" subtitle="Busca inteligente de tecnicos e prestadores na regiao" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tecnicos Cadastrados" value={tecnicos.length} icon={Wrench} accent="primary" />
        <StatCard label="Disponiveis" value={tecnicos.filter(t => t.status === "disponivel").length} icon={Check} accent="success" />
        <StatCard label="Cadastrados na Regiao" value={tecnicosFiltrados.length} icon={MapPin} accent="warning" />
        <StatCard label="Busca Inteligente" value={googleResults.length} icon={Search} accent="muted" />
      </div>

      <Card className="p-6 card-shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Cidade</label>
            <Input placeholder="Ex: Campinas" value={cidade} onChange={e => setCidade(e.target.value)} onKeyDown={e => e.key === "Enter" && handleBuscar()} />
          </div>
          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-1.5 block">Estado</label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>{estados.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleBuscar} disabled={buscandoGoogle}>
              {buscandoGoogle ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {buscou && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="cadastrados">Tecnicos Cadastrados ({tecnicosFiltrados.length})</TabsTrigger>
            <TabsTrigger value="google">
              Busca Inteligente ({buscandoGoogle ? "..." : googleResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cadastrados">
            <Card className="card-shadow">
              {tecnicosFiltrados.length === 0 ? (
                <div className="empty-state empty-state-border m-4">
                  <Inbox className="empty-state-icon" />
                  <p className="text-sm text-muted-foreground">Nenhum tecnico cadastrado encontrado nesta regiao</p>
                  <p className="text-xs text-muted-foreground/60">Veja a aba "Busca Inteligente" para encontrar prestadores proximos</p>
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
            <Card className="card-shadow">
              {buscandoGoogle ? (
                <div className="flex flex-col items-center justify-center py-14 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Buscando prestadores e oficinas na regiao...</p>
                </div>
              ) : googleResults.length === 0 ? (
                <div className="empty-state empty-state-border m-4">
                  <Inbox className="empty-state-icon" />
                  <p className="text-sm text-muted-foreground">Nenhum prestador encontrado nesta regiao</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Endereco</TableHead>
                      <TableHead>Avaliacao</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {googleResults.map(place => {
                      const phoneDigits = (place.telefone_internacional || place.telefone || "").replace(/\D/g, "");
                      const whatsappNum = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;
                      return (
                        <TableRow key={place.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{place.nome}</p>
                              <p className="text-xs text-muted-foreground">{place.tipos.slice(0, 3).join(", ")}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {place.telefone ? (
                              <span className="font-mono">{place.telefone}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Sem telefone</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm max-w-[250px]">{place.endereco}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">{place.avaliacao}</span>
                              <span className="text-xs text-muted-foreground">({place.total_avaliacoes})</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {place.aberto === true && <Badge variant="default" className="text-xs">Aberto</Badge>}
                            {place.aberto === false && <Badge variant="secondary" className="text-xs">Fechado</Badge>}
                            {place.aberto === null && <Badge variant="outline" className="text-xs">—</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {phoneDigits ? (
                                <>
                                  <Button size="sm" variant="outline" className="text-xs" asChild>
                                    <a href={`tel:${place.telefone_internacional || place.telefone}`}>
                                      <Phone className="w-3 h-3 mr-1" /> Ligar
                                    </a>
                                  </Button>
                                  <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700" asChild>
                                    <a href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(`Olá! Somos da Objetivo Auto e estamos buscando prestadores para instalação de rastreadores na região. Vocês trabalham com instalação de rastreadores veiculares?`)}`} target="_blank" rel="noopener">
                                      <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                                    </a>
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                                  navigator.clipboard.writeText(place.nome + " - " + place.endereco);
                                  toast.success("Dados copiados!");
                                }}>
                                  <MapPin className="w-3 h-3 mr-1" /> Copiar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default BuscarTecnicos;
