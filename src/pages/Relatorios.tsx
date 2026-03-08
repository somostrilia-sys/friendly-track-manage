import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const relatorios = [
  { id: "1", titulo: "Relatório de Faturamento Mensal", descricao: "Faturamento consolidado por cliente e período", tipo: "Financeiro" },
  { id: "2", titulo: "Relatório de Instalações", descricao: "Instalações realizadas por técnico e região", tipo: "Operacional" },
  { id: "3", titulo: "Relatório de Linhas SIM", descricao: "Status de conectividade e consumo de dados", tipo: "Técnico" },
  { id: "4", titulo: "Relatório de Estoque", descricao: "Movimentação de equipamentos e inventário", tipo: "Logístico" },
  { id: "5", titulo: "Relatório de Manutenções", descricao: "Chamados abertos, tempo de resolução e reincidência", tipo: "Operacional" },
  { id: "6", titulo: "Relatório de Desempenho de Técnicos", descricao: "Avaliações, produtividade e fechamento financeiro", tipo: "RH" },
];

const Relatorios = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Relatórios</h1>
      <p className="text-muted-foreground text-sm">Geração e download de relatórios do sistema</p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {relatorios.map(r => (
        <Card key={r.id} className="p-5 card-shadow hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{r.titulo}</h3>
              <p className="text-xs text-muted-foreground mt-1">{r.descricao}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{r.tipo}</span>
                <Button size="sm" variant="outline" className="text-xs">
                  <Download className="w-3 h-3 mr-1" /> Gerar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default Relatorios;
