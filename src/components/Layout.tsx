import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/30 bg-background/80 backdrop-blur-xl px-6 gap-4 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Buscar..."
                className="pl-9 h-9 bg-muted/30 border-border/30 rounded-lg text-sm"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded font-mono">
                ⌘K
              </kbd>
            </div>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <div className="ml-2 h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                US
              </div>
            </div>
          </header>
          <main className="flex-1 px-6 py-6 md:px-8 md:py-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
