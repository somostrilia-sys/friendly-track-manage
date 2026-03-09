import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/trackit/Clientes";
import Estoque from "@/pages/trackit/Estoque";
import Pedidos from "@/pages/trackit/Pedidos";
import LinhasSIM from "@/pages/trackit/LinhasSIM";
import Tarefas from "@/pages/trackit/Tarefas";
import Tecnicos from "@/pages/objetivo/Tecnicos";
import Servicos from "@/pages/objetivo/Servicos";
import Manutencoes from "@/pages/objetivo/Manutencoes";
import FinanceiroPage from "@/pages/objetivo/Financeiro";
import BuscarTecnicos from "@/pages/objetivo/BuscarTecnicos";
import Relatorios from "@/pages/Relatorios";
import TecnicoLink from "@/pages/servico/TecnicoLink";
import ClienteLink from "@/pages/servico/ClienteLink";
import AcompanhamentoInstalacoes from "@/pages/AcompanhamentoInstalacoes";
import ControleKMPage from "@/pages/ControleKM";
import FechamentoTecnicosPage from "@/pages/FechamentoTecnicos";
import FilaSuporte from "@/pages/FilaSuporte";
import Agendamentos from "@/pages/Agendamentos";
import Login from "@/pages/auth/Login";
import Registro from "@/pages/auth/Registro";
import EsqueciSenha from "@/pages/auth/EsqueciSenha";
import ResetPassword from "@/pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/servico/tecnico/:id" element={<TecnicoLink />} />
            <Route path="/servico/cliente/:id" element={<ClienteLink />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trackit/clientes" element={<Clientes />} />
              <Route path="/trackit/estoque" element={<Estoque />} />
              <Route path="/trackit/pedidos" element={<Pedidos />} />
              <Route path="/trackit/linhas-sim" element={<LinhasSIM />} />
              <Route path="/trackit/tarefas" element={<Tarefas />} />
              <Route path="/objetivo/tecnicos" element={<Tecnicos />} />
              <Route path="/objetivo/servicos" element={<Servicos />} />
              <Route path="/objetivo/manutencoes" element={<Manutencoes />} />
              <Route path="/objetivo/financeiro" element={<FinanceiroPage />} />
              <Route path="/objetivo/buscar-tecnicos" element={<BuscarTecnicos />} />
              <Route path="/instalacoes" element={<AcompanhamentoInstalacoes />} />
              <Route path="/controle-km" element={<ControleKMPage />} />
              <Route path="/fechamento-tecnicos" element={<FechamentoTecnicosPage />} />
              <Route path="/suporte" element={<FilaSuporte />} />
              <Route path="/agendamentos" element={<Agendamentos />} />
              <Route path="/relatorios" element={<Relatorios />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
