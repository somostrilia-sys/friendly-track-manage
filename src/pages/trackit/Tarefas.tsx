import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tarefas } from "@/data/mock-data";
import { useState } from "react";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

const prioridadeStyles = {
  urgente: "bg-destructive text-destructive-foreground",
  alta: "bg-warning text-warning-foreground",
  media: "bg-primary text-primary-foreground",
  baixa: "bg-secondary text-secondary-foreground",
};

const statusIcons = {
  pendente: Clock,
  em_andamento: Loader2,
  concluida: CheckCircle,
};

const Tarefas = () => {
  const [filtro, setFiltro] = useState<string>("all");
  const filtrado = filtro === "all" ? tarefas : tarefas.filter(t => t.prioridade === filtro);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-muted-foreground text-sm">Gestão de tarefas por prioridade</p>
      </div>

      <div className="flex gap-2">
        {["all", "urgente", "alta", "media", "baixa"].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {f === "all" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtrado.map(t => {
          const StatusIcon = statusIcons[t.status];
          return (
            <Card key={t.id} className="p-4 card-shadow hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <StatusIcon className={`w-5 h-5 mt-0.5 ${t.status === "concluida" ? "text-success" : t.status === "em_andamento" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <h3 className="font-medium">{t.titulo}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.descricao}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Responsável: {t.responsavel}</span>
                      <span>Prazo: {t.dataLimite}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${prioridadeStyles[t.prioridade]}`}>
                  {t.prioridade.charAt(0).toUpperCase() + t.prioridade.slice(1)}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Tarefas;
