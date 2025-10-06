import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  CheckSquare,
  Inbox,
  BarChart3,
  Folder,
  Plus,
  Settings,
  User,
  Users,
  LineChart,
  UserPlus,
  ChevronDown,
  Circle,
  LayoutDashboard,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBoard } from "@/lib/board-context";

interface Portfolio {
  id: number;
  name: string;
  description?: string;
  color: string;
  userId: number;
  username?: string;
  createdAt: string;
}

interface Board {
  id: number;
  title: string;
  color?: string;
  portfolioId?: number;
}

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const { boards, fetchBoards, updateBoard } = useBoard();

  // Portfolio management states
  const [isCreatePortfolioModalOpen, setIsCreatePortfolioModalOpen] = useState(false);
  const [expandedPortfolios, setExpandedPortfolios] = useState<Set<number>>(new Set());
  const [portfolioFormData, setPortfolioFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  });

  const colors = ['#22C55E', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

  const handleColorChange = async (color: string) => {
    if (!selectedBoard) return;
    try {
      await updateBoard(selectedBoard.id, { color });
      setSelectedBoard(null);
    } catch (err) {
      console.error('Failed to update board color', err);
    }
  };

  const resetPortfolioForm = () => {
    setPortfolioFormData({
      name: "",
      description: "",
      color: "#3B82F6"
    });
  };

  const handleCreatePortfolio = () => {
    if (!portfolioFormData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do portfólio é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    createPortfolio({
      ...portfolioFormData,
      userId: user.id
    } as typeof portfolioFormData & { userId: number });
  };

  const togglePortfolio = (portfolioId: number) => {
    setExpandedPortfolios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(portfolioId)) {
        newSet.delete(portfolioId);
      } else {
        newSet.add(portfolioId);
      }
      return newSet;
    });
  };

  const getBoardsByPortfolio = (portfolioId?: number) => {
    return boards.filter(board => board.portfolioId === portfolioId);
  };

  // Buscar portfólios
  const { data: portfolios = [] } = useQuery<Portfolio[]>({
    queryKey: ['/api/portfolios'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar contagem de notificações não lidas para exibir badge na sidebar
  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: () => apiRequest('GET', '/api/notifications/unread-count'),
    enabled: !!user,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000, // Reduzido de 30s para 10s
    retry: false,
  });
  const unreadCount = unreadData?.unreadCount ?? 0;



  // Load user's boards for the sidebar
  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Create portfolio mutation
  const { mutate: createPortfolio, isPending: isCreatingPortfolio } = useMutation({
    mutationFn: async (data: typeof portfolioFormData) => {
      const res = await apiRequest("POST", "/api/portfolios", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Portfólio criado",
        description: "Seu portfólio foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      setIsCreatePortfolioModalOpen(false);
      resetPortfolioForm();
    },
    onError: (error) => {
      console.error("Portfolio creation failed:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o portfólio.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const isActiveStart = (path: string) => {
    return location?.startsWith(path);
  };

  const isActiveExact = (path: string) => {
    return location === path;
  };

  if (!user) return null;

  return (
    <Sidebar variant="inset" collapsible="icon" className="h-screen">
      <SidebarHeader className="p-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 mb-4 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-600 text-primary-foreground font-bold text-lg shadow-soft shrink-0">
            K
          </div>
          <span className="text-lg font-bold text-gradient group-data-[collapsible=icon]:hidden">
            Kanban Board
          </span>
        </div>

        {/* Search */}
        {/* Search removed as requested */}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActiveExact("/")}>
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span>Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActiveStart("/portfolios")}>
                <Link href="/portfolios">
                  <Folder className="h-4 w-4" />
                  <span>Portfólios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActiveStart("/dashboard")}>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActiveStart("/inbox")}>
                <Link href="/inbox">
                  <Inbox className="h-4 w-4" />
                  <span>Notificações</span>
                  {unreadCount > 0 && (
                    <Badge className="ml-auto text-xs bg-red-600 text-white h-5 w-5 rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Portfolios Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Portfólios</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 hover:bg-white/10"
              onClick={() => setIsCreatePortfolioModalOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!Array.isArray(portfolios) || portfolios.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton className="w-full justify-start">
                    <span className="text-xs text-muted-foreground">Nenhum portfólio</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                portfolios.map((portfolio) => {
                  const portfolioBoards = getBoardsByPortfolio(portfolio.id);
                  const isExpanded = expandedPortfolios.has(portfolio.id);

                  return (
                    <div key={portfolio.id}>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          className="w-full justify-start"
                          onClick={() => togglePortfolio(portfolio.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 mr-1" />
                          ) : (
                            <ChevronRight className="h-3 w-3 mr-1" />
                          )}
                          {isExpanded ? (
                            <FolderOpen className="h-3 w-3 mr-2" style={{ color: portfolio.color }} />
                          ) : (
                            <Folder className="h-3 w-3 mr-2" style={{ color: portfolio.color }} />
                          )}
                          <span className="truncate max-w-[100px]">{portfolio.name}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {portfolioBoards.length}
                          </Badge>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {isExpanded && (
                        <SidebarMenuSub>
                          {portfolioBoards.length === 0 ? (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton className="text-xs text-muted-foreground">
                                Nenhum projeto
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ) : (
                            portfolioBoards.map((board) => (
                              <SidebarMenuSubItem key={board.id}>
                                <SidebarMenuSubButton asChild isActive={isActiveStart(`/board/${board.id}`)}>
                                  <Link href={`/board/${board.id}`}>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedBoard(board);
                                          }}
                                          aria-label="Editar cor do projeto"
                                          className="mr-2"
                                        >
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: board.color || '#22C55E' }} />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-2">
                                        <div className="grid grid-cols-3 gap-2">
                                          {colors.map(color => (
                                            <button
                                              key={color}
                                              className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500"
                                              style={{ backgroundColor: color }}
                                              onClick={() => handleColorChange(color)}
                                            />
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    <span className="truncate max-w-[110px]">{board.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))
                          )}
                        </SidebarMenuSub>
                      )}
                    </div>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projetos sem Portfólio */}
        {getBoardsByPortfolio(undefined).length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                <span>Projetos Avulsos</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 hover:bg-white/10"
                  onClick={() => navigate("/")}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getBoardsByPortfolio(undefined).slice(0, 8).map((board) => (
                    <SidebarMenuItem key={board.id}>
                      <SidebarMenuButton asChild className="w-full justify-start" isActive={isActiveStart(`/board/${board.id}`)}>
                        <Link href={`/board/${board.id}`}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button onClick={(e) => { e.preventDefault(); setSelectedBoard(board); }} aria-label="Editar cor do quadro" className="mr-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: board.color || '#22C55E' }} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                              <div className="grid grid-cols-3 gap-2">
                                {colors.map(color => (
                                  <button key={color} className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500" style={{ backgroundColor: color }} onClick={() => handleColorChange(color)} />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <span className="truncate max-w-[120px]">{board.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Admin Section (only for admins) */}
        {user.role === "admin" && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard")}
                      className="w-full justify-start"
                    >
                      <Link href="/dashboard">
                        <LineChart className="h-4 w-4" />
                        <span>Dashboard Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/users/manage")}
                      className="w-full justify-start"
                    >
                      <Link href="/users/manage">
                        <UserPlus className="h-4 w-4" />
                        <span>Gerenciar usuários</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

  {/* Teams section removed as requested */}
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto">
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto hover:bg-white/5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center"
            >
              <Avatar className="h-10 w-10 border-2 border-white/10 shrink-0">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left ml-3 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium truncate max-w-full">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-full">
                  @{user.username}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-64 glass-strong border-white/10 shadow-strong mb-2"
          >
            <div className="p-3 flex items-center gap-3 border-b border-white/10 mb-2">
              <Avatar className="h-12 w-12 border-2 border-white/10">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-500">Online</span>
                </div>
              </div>
            </div>

            <DropdownMenuItem
              onClick={() => navigate("/account/settings")}
              className="focus:bg-white/5"
            >
              <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
              <div>
                <div className="text-sm">Configurações</div>
                <div className="text-xs text-muted-foreground">
                  Gerenciar conta
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="focus:bg-white/5"
            >
              <User className="h-4 w-4 mr-3 text-muted-foreground" />
              <div>
                <div className="text-sm">Meu perfil</div>
                <div className="text-xs text-muted-foreground">
                  Ver perfil público
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={handleLogout}
            >
              <span className="text-sm">Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      {/* Modal de Criação de Portfólio */}
      <Dialog open={isCreatePortfolioModalOpen} onOpenChange={setIsCreatePortfolioModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Portfólio</DialogTitle>
            <DialogDescription>
              Crie um portfólio para organizar seus projetos relacionados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="portfolio-name">Nome do Portfólio</Label>
              <Input
                id="portfolio-name"
                placeholder="Ex: Marketing Digital"
                value={portfolioFormData.name}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="portfolio-description">Descrição (opcional)</Label>
              <Textarea
                id="portfolio-description"
                placeholder="Descreva o objetivo deste portfólio..."
                value={portfolioFormData.description}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="portfolio-color">Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  id="portfolio-color"
                  type="color"
                  value={portfolioFormData.color}
                  onChange={(e) => setPortfolioFormData({ ...portfolioFormData, color: e.target.value })}
                  className="w-10 h-8 p-0 border rounded"
                />
                <Input
                  value={portfolioFormData.color}
                  onChange={(e) => setPortfolioFormData({ ...portfolioFormData, color: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatePortfolioModalOpen(false);
                resetPortfolioForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreatePortfolio} disabled={isCreatingPortfolio}>
              {isCreatingPortfolio ? "Criando..." : "Criar Portfólio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}