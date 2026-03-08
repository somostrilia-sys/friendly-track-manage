import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { servicosAgendados } from "@/data/mock-data";
import { MapPin, Navigation, ExternalLink } from "lucide-react";

const statusMap = {
  agendado: { label: "Agendado", class: "bg-secondary text-secondary-foreground" },
  aceito: { label: "Aceito", class: "bg-primary text-primary-foreground" },
  em_deslocamento: { label: "Em Deslocamento", class: "bg-warning text-warning-foreground" },
  em_execucao: { label: "Em Execução", class: "bg-primary text-primary-foreground" },
  concluido: { label: "Concluído", class: "bg-success text-success-foreground" },
  cancelado: { label: "Cancelado", class: "bg-destructive text-destructive-foreground" },
};

const tipoMap = { instalacao: "Instalação", manutencao: "Manutenção", remocao: "Remoção", troca: "Troca" };

const Servicos = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Serviços Agendados</h1>
        <p className="text-muted-foreground text-sm">Ordens de serviço e acompanhamento</p>
      </div>
      <Button><MapPin className="w-4 h-4 mr-2" /> Nova OS</Button>
    </div>

    <div className="grid gap-4">
      {servicosAgendados.map(s => (
        <Card key={s.id} className="p-5 card-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-sm">{s.id}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[s.status].class}`}>
                  {statusMap[s.status].label}
                </span>
                <Badge variant="secondary">{tipoMap[s.tipo]}</Badge>
              </div>
              <div className="text-sm">
                <p><strong>Técnico:</strong> {s.tecnicoNome}</p>
                <p><strong>Cliente:</strong> {s.clienteNome}</p>
                <p><strong>Veículo:</strong> {s.veiculo}</p>
                <p className="text-muted-foreground">{s.endereco} — {s.cidade}/{s.estado}</p>
                <p className="text-muted-foreground">{s.data} às {s.horario}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span className="font-semibold">R$ {s.valorServico}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs">
                  <Navigation className="w-3 h-3 mr-1" /> Link Técnico
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" /> Link Cliente
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default Servicos;
