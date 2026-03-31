import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Auth pages (keep eager - needed on first load)
import Login from "@/pages/auth/Login";
import Registro from "@/pages/auth/Registro";
import EsqueciSenha from "@/pages/auth/EsqueciSenha";
import ResetPassword from "@/pages/auth/ResetPassword";

// Public service pages (keep eager - external access)
import TecnicoLink from "@/pages/servico/TecnicoLink";
import ClienteLink from "@/pages/servico/ClienteLink";
import TecnicoRegistro from "@/pages/servico/TecnicoRegistro";

import NotFound from "./pages/NotFound";

// Lazy-loaded protected pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Clientes = lazy(() => import("@/pages/trackit/Clientes"));
const Fornecedores = lazy(() => import("@/pages/trackit/Fornecedores"));
const Estoque = lazy(() => import("@/pages/trackit/Estoque"));
const Pedidos = lazy(() => import("@/pages/trackit/Pedidos"));
const LinhasSIM = lazy(() => import("@/pages/trackit/LinhasSIM"));
const FinanceiroPage = lazy(() => import("@/pages/objetivo/Financeiro"));
const Tecnicos = lazy(() => import("@/pages/objetivo/Tecnicos"));
const Servicos = lazy(() => import("@/pages/objetivo/Servicos"));
const Manutencoes = lazy(() => import("@/pages/objetivo/Manutencoes"));
const BuscarTecnicos = lazy(() => import("@/pages/objetivo/BuscarTecnicos"));
const ControleUnidades = lazy(() => import("@/pages/objetivo/ControleUnidades"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const AcompanhamentoInstalacoes = lazy(() => import("@/pages/AcompanhamentoInstalacoes"));
const ControleKMPage = lazy(() => import("@/pages/ControleKM"));
const FilaSuporte = lazy(() => import("@/pages/FilaSuporte"));
const Agendamentos = lazy(() => import("@/pages/Agendamentos"));
const FechamentoTecnicos = lazy(() => import("@/pages/FechamentoTecnicos"));
const LogisticaRastreadores = lazy(() => import("@/pages/operacional/LogisticaRastreadores"));
const Rastreadores = lazy(() => import("@/pages/operacional/Rastreadores"));
const ConfiguracaoDispositivos = lazy(() => import("@/pages/operacional/ConfiguracaoDispositivos"));

const LazyFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
            <Route path="/registro-tecnico" element={<TecnicoRegistro />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute><ErrorBoundary><Layout /></ErrorBoundary></ProtectedRoute>}>
              <Route path="/" element={<Suspense fallback={<LazyFallback />}><Dashboard /></Suspense>} />
              <Route path="/trackit/clientes" element={<Suspense fallback={<LazyFallback />}><Clientes /></Suspense>} />
              <Route path="/trackit/fornecedores" element={<Suspense fallback={<LazyFallback />}><Fornecedores /></Suspense>} />
              <Route path="/trackit/estoque" element={<Suspense fallback={<LazyFallback />}><Estoque /></Suspense>} />
              <Route path="/trackit/pedidos" element={<Suspense fallback={<LazyFallback />}><Pedidos /></Suspense>} />
              <Route path="/trackit/linhas-sim" element={<Suspense fallback={<LazyFallback />}><LinhasSIM /></Suspense>} />
              <Route path="/trackit/financeiro" element={<Suspense fallback={<LazyFallback />}><FinanceiroPage /></Suspense>} />

              <Route path="/objetivo/tecnicos" element={<Suspense fallback={<LazyFallback />}><Tecnicos /></Suspense>} />
              <Route path="/objetivo/servicos" element={<Suspense fallback={<LazyFallback />}><Servicos /></Suspense>} />
              <Route path="/objetivo/manutencoes" element={<Suspense fallback={<LazyFallback />}><Manutencoes /></Suspense>} />
              <Route path="/objetivo/buscar-tecnicos" element={<Suspense fallback={<LazyFallback />}><BuscarTecnicos /></Suspense>} />
              <Route path="/objetivo/controle-unidades" element={<Suspense fallback={<LazyFallback />}><ControleUnidades /></Suspense>} />
              <Route path="/instalacoes" element={<Suspense fallback={<LazyFallback />}><AcompanhamentoInstalacoes /></Suspense>} />
              <Route path="/controle-km" element={<Suspense fallback={<LazyFallback />}><ControleKMPage /></Suspense>} />
              <Route path="/suporte" element={<Suspense fallback={<LazyFallback />}><FilaSuporte /></Suspense>} />
              <Route path="/agendamentos" element={<Suspense fallback={<LazyFallback />}><Agendamentos /></Suspense>} />
              <Route path="/fechamento-tecnicos" element={<Suspense fallback={<LazyFallback />}><FechamentoTecnicos /></Suspense>} />
              <Route path="/rastreadores" element={<Suspense fallback={<LazyFallback />}><Rastreadores /></Suspense>} />
              <Route path="/logistica-rastreadores" element={<Suspense fallback={<LazyFallback />}><LogisticaRastreadores /></Suspense>} />
              <Route path="/config-dispositivos" element={<Suspense fallback={<LazyFallback />}><ConfiguracaoDispositivos /></Suspense>} />
              <Route path="/relatorios" element={<Suspense fallback={<LazyFallback />}><Relatorios /></Suspense>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
