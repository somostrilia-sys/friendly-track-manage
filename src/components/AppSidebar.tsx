import {
  LayoutDashboard, Users, Package, ShoppingCart, Smartphone, ListTodo,
  Wrench, Calendar, Settings2, DollarSign, Search, FileText,
  ChevronDown, ClipboardCheck, Route, Headphones, CalendarDays, Receipt,
} from "lucide-react";
import logoTrackit from "@/assets/logo-trackit-clean.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const trackitItems = [
  { title: "Clientes", url: "/trackit/clientes", icon: Users },
  { title: "Estoque", url: "/trackit/estoque", icon: Package },
  { title: "Pedidos", url: "/trackit/pedidos", icon: ShoppingCart },
  { title: "Linhas SIM", url: "/trackit/linhas-sim", icon: Smartphone },
  { title: "Tarefas", url: "/trackit/tarefas", icon: ListTodo },
];

const objetivoItems = [
  { title: "Técnicos", url: "/objetivo/tecnicos", icon: Wrench },
  { title: "Serviços", url: "/objetivo/servicos", icon: Calendar },
  { title: "Manutenções", url: "/objetivo/manutencoes", icon: Settings2 },
  { title: "Financeiro", url: "/objetivo/financeiro", icon: DollarSign },
  { title: "Buscar Técnicos", url: "/objetivo/buscar-tecnicos", icon: Search },
];

const operacionalItems = [
  { title: "Acomp. Instalações", url: "/instalacoes", icon: ClipboardCheck },
  { title: "Controle de KM", url: "/controle-km", icon: Route },
  { title: "Agendamentos", url: "/agendamentos", icon: CalendarDays },
  { title: "Fila de Suporte", url: "/suporte", icon: Headphones },
];

const financeiroItems = [
  { title: "Fechamento Técnicos", url: "/fechamento-tecnicos", icon: Receipt },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const [trackitOpen, setTrackitOpen] = useState(true);
  const [objetivoOpen, setObjetivoOpen] = useState(true);
  const [operacionalOpen, setOperacionalOpen] = useState(true);
  const [financeiroOpen, setFinanceiroOpen] = useState(true);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="py-4">
        {/* Logo */}
        <div className="px-2 mb-6">
          {!collapsed ? (
            <img src={logoTrackit} alt="Trackit - Soluções em Rastreamento e IoT" className="w-full max-w-[180px] mx-auto rounded" />
          ) : (
            <div className="flex justify-center">
              <span className="text-lg font-extrabold text-sidebar-primary">T</span>
            </div>
          )}
        </div>

        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Dashboard Geral</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Trackit */}
        <SidebarGroup>
          <Collapsible open={trackitOpen} onOpenChange={setTrackitOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Trackit</span>
                {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${trackitOpen ? "" : "-rotate-90"}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {trackitItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Objetivo */}
        <SidebarGroup>
          <Collapsible open={objetivoOpen} onOpenChange={setObjetivoOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Objetivo</span>
                {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${objetivoOpen ? "" : "-rotate-90"}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {objetivoItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Operacional */}
        <SidebarGroup>
          <Collapsible open={operacionalOpen} onOpenChange={setOperacionalOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Operacional</span>
                {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${operacionalOpen ? "" : "-rotate-90"}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {operacionalItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Financeiro */}
        <SidebarGroup>
          <Collapsible open={financeiroOpen} onOpenChange={setFinanceiroOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Financeiro</span>
                {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${financeiroOpen ? "" : "-rotate-90"}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {financeiroItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Relatórios */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/relatorios" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <FileText className="h-4 w-4" />
                    {!collapsed && <span>Relatórios</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
