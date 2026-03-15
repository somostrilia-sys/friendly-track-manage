import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import FechamentoTecnicosTab from "./financeiro/FechamentoTecnicosTab";
import FaturamentoB2BTab from "./financeiro/FaturamentoB2BTab";
import ConferenciaFornecedorTab from "./financeiro/ConferenciaFornecedorTab";

const FinanceiroPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" subtitle="Hub financeiro completo - fechamentos, faturamento B2B e conferencia" />

      <Tabs defaultValue="fechamento" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="fechamento">Fechamento Tecnicos</TabsTrigger>
          <TabsTrigger value="b2b">Faturamento B2B</TabsTrigger>
          <TabsTrigger value="conferencia">Conferencia Fornecedor</TabsTrigger>
        </TabsList>
        <TabsContent value="fechamento">
          <FechamentoTecnicosTab />
        </TabsContent>
        <TabsContent value="b2b">
          <FaturamentoB2BTab />
        </TabsContent>
        <TabsContent value="conferencia">
          <ConferenciaFornecedorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceiroPage;
