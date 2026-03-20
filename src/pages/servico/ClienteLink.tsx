import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServicoById } from "@/hooks/useSupabaseData";
import { MapPin, User, Truck } from "lucide-react";

const statusMap: Record<string, { label: string; class: string }> = {
  agendado: { label: "Agendado", class: "bg-secondary text-secondary-foreground" },
  aceito: { label: "Técnico Confirmou", class: "bg-primary text-primary-foreground" },
  em_deslocamento: { label: "Técnico a Caminho", class: "bg-warning text-warning-foreground" },
  em_execucao: { label: "Em Execução", class: "bg-primary text-primary-foreground" },
  concluido: { label: "Concluído", class: "bg-success text-success-foreground" },
  cancelado: { label: "Cancelado", class: "bg-destructive text-destructive-foreground" },
};

const ClienteLink = () => {
  const { id } = useParams();
  const { data: servico, isLoading } = useServicoById(id);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!servico) return <div className="p-8 text-center"><h1 className="text-xl font-bold">Ordem de Serviço não encontrada</h1></div>;

  const statusInfo = statusMap[servico.status];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Acompanhe seu Serviço</h1>
        <p className="text-muted-foreground text-sm">Ordem {servico.codigo}</p>
      </div>
      <Card className="p-6 card-shadow space-y-5">
        <div className="flex justify-center">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo?.class}`}>{statusInfo?.label}</span>
        </div>
        <div className="w-full h-48 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Localização do técnico em tempo real</p>
            <p className="text-xs text-muted-foreground mt-1">{servico.endereco}</p>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <User className="w-5 h-5 text-primary" />
            <div><p className="text-muted-foreground text-xs">Técnico</p><p className="font-medium">{servico.tecnico_nome}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Truck className="w-5 h-5 text-primary" />
            <div><p className="text-muted-foreground text-xs">Veículo</p><p className="font-medium">{servico.veiculo}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <MapPin className="w-5 h-5 text-primary" />
            <div><p className="text-muted-foreground text-xs">Local do Serviço</p><p className="font-medium">{servico.endereco}</p><p className="text-muted-foreground">{servico.cidade}/{servico.estado}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-muted-foreground text-xs">Data</p><p className="font-medium">{servico.data}</p></div>
            <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-muted-foreground text-xs">Horário</p><p className="font-medium">{servico.horario}</p></div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Acompanhamento</h4>
          <div className="space-y-3">
            {["agendado", "aceito", "em_deslocamento", "em_execucao", "concluido"].map((step, i) => {
              const steps = ["agendado", "aceito", "em_deslocamento", "em_execucao", "concluido"];
              const currentIdx = steps.indexOf(servico.status);
              const isCompleted = i <= currentIdx;
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isCompleted ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  <span className={`text-sm ${isCompleted ? "font-medium" : "text-muted-foreground"}`}>{statusMap[step]?.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClienteLink;
