import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BoardProvider } from "@/lib/board-context";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AppSidebar } from "@/components/AppSidebar";
import { MinimalHeader } from "@/components/MinimalHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { initializeCsrf } from "@/lib/csrf";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BoardPage from "@/pages/board";
import CardView from "@/pages/card-view";
import BoardEdit from "@/pages/board-edit";
import BoardNew from "@/pages/board-new";
import Dashboard from "@/pages/dashboard";
import UserDashboard from "@/pages/user-dashboard";
import UserManagement from "@/pages/user-management";
import AccountSettings from "@/pages/account-settings";
import Portfolios from "@/pages/portfolios";
import PortfolioDetail from "@/pages/portfolio-detail";
import Login from "@/pages/login";
import Register from "@/pages/register";
import MyTasks from "@/pages/my-tasks";
import Inbox from "@/pages/inbox";
import { AuditLogs } from "@/components/AuditLogs";

function Router() {
  return (
    <Switch>
      <Route path="/login">
        {() => (
          <>
            <MinimalHeader />
            <main className="flex-1">
              <Login />
            </main>
          </>
        )}
      </Route>
      <Route path="/register">
        {() => (
          <>
            <MinimalHeader />
            <main className="flex-1">
              <Register />
            </main>
          </>
        )}
      </Route>
      <ProtectedRoute path="/">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <Home />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/my-tasks">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <MyTasks />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/inbox">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <Inbox />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/my-dashboard">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <UserDashboard />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/account/settings">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <AccountSettings />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/dashboard">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <Dashboard />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/users/manage">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <UserManagement />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/admin/audit-logs">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <AuditLogs />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/board/new">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <BoardNew />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/portfolios">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <Portfolios />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/portfolios/:id">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <PortfolioDetail />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>

      <ProtectedRoute path="/boards/:boardId/cards/:cardId">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <CardView />
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/board/:id">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <BoardPage />
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/board/:id/edit">
        {() => (
          <SidebarProvider>
            <div className="sidebar-layout">
              <AppSidebar />
              <SidebarInset className="sidebar-main-content">
                <MinimalHeader />
                <main className="flex-1 p-4 md:p-6">
                  <BoardEdit />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        )}
      </ProtectedRoute>
      <Route>
        {() => (
          <>
            <MinimalHeader />
            <main className="flex-1">
              <NotFound />
            </main>
          </>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  // Inicializar CSRF ao carregar a aplicação
  useEffect(() => {
    initializeCsrf().catch(err => {
      console.warn('CSRF initialization failed:', err);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BoardProvider>
          <div className="flex flex-col min-h-screen">
            <Router />
          </div>
          <Toaster />
        </BoardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;