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

      {/* search removed as requested */}

      {/* not rendering bell/help buttons as requested */}
      </div>
    </header>
  );
}