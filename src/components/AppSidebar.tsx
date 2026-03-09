import {
  LayoutDashboard, Users, Package, ShoppingCart, Smartphone, ListTodo,
  Wrench, Calendar, Settings2, DollarSign, Search, FileText,
  ChevronDown, ClipboardCheck, Route, Headphones, CalendarDays, Receipt,
  LogOut, Truck, Building2, Settings, ArrowUpCircle,
} from "lucide-react";
import logoTrackit from "@/assets/logo-trackit-cropped.png";
import { NavLink } from "@/components/NavLink";
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
  { title: "Tecnicos", url: "/objetivo/tecnicos", icon: Wrench },
  { title: "Servicos", url: "/objetivo/servicos", icon: Calendar },
  { title: "Manutencoes", url: "/objetivo/manutencoes", icon: Settings2 },
  { title: "Financeiro", url: "/objetivo/financeiro", icon: DollarSign },
  { title: "Buscar Tecnicos", url: "/objetivo/buscar-tecnicos", icon: Search },
  { title: "Controle Unidades", url: "/objetivo/controle-unidades", icon: Building2 },
  { title: "Escalonamentos", url: "/objetivo/escalonamentos", icon: ArrowUpCircle },
];

const operacionalItems = [
  { title: "Acomp. Instalacoes", url: "/instalacoes", icon: ClipboardCheck },
  { title: "Controle de KM", url: "/controle-km", icon: Route },
  { title: "Agendamentos", url: "/agendamentos", icon: CalendarDays },
  { title: "Fila de Suporte", url: "/suporte", icon: Headphones },
  { title: "Logistica Rastreadores", url: "/logistica-rastreadores", icon: Truck },
  { title: "Config. Dispositivos", url: "/config-dispositivos", icon: Settings },
];

const financeiroItems = [
  { title: "Fechamento Tecnicos", url: "/fechamento-tecnicos", icon: Receipt },
];

interface NavSectionProps {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
}

function NavSection({ label, items, open, onOpenChange, collapsed }: NavSectionProps) {
  return (
    <SidebarGroup className="py-0">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel className="cursor-pointer flex items-center justify-between px-4 py-2 text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
            {!collapsed && (
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
            )}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink
                      to={item.url}
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      className="transition-colors duration-150"
                    >
                      <item.icon className="h-[15px] w-[15px] shrink-0" />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const [trackitOpen, setTrackitOpen] = useState(true);
  const [objetivoOpen, setObjetivoOpen] = useState(true);
  const [operacionalOpen, setOperacionalOpen] = useState(true);
  const [financeiroOpen, setFinanceiroOpen] = useState(true);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarContent className="pt-0 pb-2 flex flex-col">
        {/* Logo */}
        <div className="-ml-2 pr-4 -mb-1">
          {!collapsed ? (
            <img
              src={logoTrackit}
              alt="Trackit - Solucoes em Rastreamento e IoT"
              className="w-full max-w-[150px] object-contain"
              style={{ mixBlendMode: 'lighten', filter: 'contrast(1.15)' }}
            />
          ) : (
            <div className="flex justify-center py-3 px-2">
              <span className="text-xs font-black text-sidebar-primary">T</span>
            </div>
          )}
        </div>

        {/* Dashboard */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-9">
                  <NavLink
                    to="/"
                    end
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    className="transition-colors duration-150"
                  >
                    <LayoutDashboard className="h-[15px] w-[15px] shrink-0" />
                    {!collapsed && <span className="text-[13px]">Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation Sections */}
        <NavSection label="Trackit" items={trackitItems} open={trackitOpen} onOpenChange={setTrackitOpen} collapsed={collapsed} />
        <NavSection label="Objetivo" items={objetivoItems} open={objetivoOpen} onOpenChange={setObjetivoOpen} collapsed={collapsed} />
        <NavSection label="Operacional" items={operacionalItems} open={operacionalOpen} onOpenChange={setOperacionalOpen} collapsed={collapsed} />
        <NavSection label="Financeiro" items={financeiroItems} open={financeiroOpen} onOpenChange={setFinanceiroOpen} collapsed={collapsed} />

        <div className="mx-4 my-2 border-t border-sidebar-border/30" />

        {/* Relatorios */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-9">
                  <NavLink
                    to="/relatorios"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    className="transition-colors duration-150"
                  >
                    <FileText className="h-[15px] w-[15px] shrink-0" />
                    {!collapsed && <span className="text-[13px]">Relatorios</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout & Footer */}
        <div className="mt-auto">
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-9 cursor-pointer text-sidebar-foreground/60 hover:text-destructive"
                    onClick={() => {
                      import('@/integrations/supabase/client').then(({ supabase }) => {
                        supabase.auth.signOut();
                      });
                    }}
                  >
                    <LogOut className="h-[15px] w-[15px] shrink-0" />
                    {!collapsed && <span className="text-[13px]">Sair</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {!collapsed && (
            <div className="px-5 pb-4 pt-2">
              <p className="text-[9px] text-sidebar-foreground/25 tracking-wide">
                &copy; 2026 Trackit - v1.0
              </p>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
