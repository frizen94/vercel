import * as React from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, SidebarContext } from "@/components/ui/sidebar";
import { Search, Bell, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export function MinimalHeader() {
  const context = React.useContext(SidebarContext)
  const [location] = useLocation()
  const isLogin = location === "/login" || location === "/"

  return (
    <header className="sticky top-0 z-20 border-b border-sidebar-border bg-background">
      <div className="mx-auto max-w-screen-2xl w-full flex h-14 items-center gap-4 px-4 md:px-6">
      {context && <SidebarTrigger data-testid="button-toggle-sidebar" />}

      {context && !isLogin && (
        <div className="flex-1 flex items-center gap-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tarefas, projetos..."
              className="pl-10 bg-white/5 border-white/10 focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {!isLogin && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
      </div>
    </header>
  );
}