import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServicoById } from "@/hooks/useSupabaseData";
import { MapPin, Navigation, Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TecnicoLink = () => {
  const { id } = useParams();
  const { data: servico, isLoading } = useServicoById(id);
  const [aceito, setAceito] = useState(false);
  const [compartilhandoGPS, setCompartilhandoGPS] = useState(false);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!servico) return <div className="p-8 text-center"><h1 className="text-xl font-bold">Ordem de Serviço não encontrada</h1></div>;

  const enderecoEncoded = encodeURIComponent(`${servico.endereco}, ${servico.cidade} - ${servico.estado}`);
  const isAceito = aceito || servico.status !== "agendado";

  const aceitarServico = () => { setAceito(true); toast.success("Serviço aceito com sucesso!"); };
  const compartilharGPS = () => { setCompartilhandoGPS(true); toast.success("GPS compartilhado! O cliente pode acompanhar sua localização."); };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ordem de Serviço</h1>
        <p className="text-muted-foreground text-sm">Painel do Técnico — {servico.codigo}</p>
      </div>
      <Card className="p-6 card-shadow space-y-5">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{servico.tipo === "instalacao" ? "Instalação" : servico.tipo === "manutencao" ? "Manutenção" : servico.tipo === "remocao" ? "Remoção" : "Troca"}</Badge>
          {isAceito && <Badge variant="default">Aceito</Badge>}
        </div>
        <div className="space-y-3 text-sm">
          <div><span className="text-muted-foreground">Cliente</span><p className="font-medium text-lg">{servico.cliente_nome}</p></div>
          <div><span className="text-muted-foreground">Veículo</span><p className="font-medium">{servico.veiculo}</p></div>
          <div><span className="text-muted-foreground">Data / Horário</span><p className="font-medium">{servico.data} às {servico.horario}</p></div>
          <div><span className="text-muted-foreground">Endereço</span>
            <p className="font-medium flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" /> {servico.endereco}</p>
            <p className="text-muted-foreground">{servico.cidade}/{servico.estado}</p>
          </div>
          <div><span className="text-muted-foreground">Valor</span><p className="font-semibold text-lg text-primary">R$ {servico.valor_servico}</p></div>
        </div>
        <div className="grid gap-3 pt-4 border-t">
          {!isAceito && (
            <Button size="lg" className="w-full" onClick={aceitarServico}>
              <Check className="w-5 h-5 mr-2" /> Aceitar Serviço
            </Button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" asChild>
              <a href={`https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4 mr-2" /> Google Maps
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`https://waze.com/ul?q=${enderecoEncoded}`} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4 mr-2" /> Waze
              </a>
            </Button>
          </div>
          <Button variant={compartilhandoGPS ? "secondary" : "default"} className="w-full" onClick={compartilharGPS} disabled={compartilhandoGPS}>
            <Share2 className="w-4 h-4 mr-2" /> {compartilhandoGPS ? "GPS Compartilhado ✓" : "Compartilhar GPS"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TecnicoLink;
