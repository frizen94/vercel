import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Loader2, BarChart3, Users, Layers, Clock, PlusCircle, AlertCircle, 
  ListFilter, Activity, CheckCircle, CircleDashed, ListChecks 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, 
  Area, RadialBarChart, RadialBar
} from "recharts";

// Interfaces para tipagem
interface Board {
  id: number;
  title: string;
  createdAt: string;
  userId: number | null;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  profilePicture: string | null;
}

interface OverdueCard {
  id: number;
  title: string;
  dueDate: string;
  listName: string;
  boardName: string;
  boardId: number;
}

interface ChecklistItem {
  id: number;
  content: string;
  dueDate: string | null;
  completed: boolean;
  description?: string;
  checklistId: number;
  checklistTitle: string;
  cardId: number;
  cardTitle: string;
  boardId: number;
  boardName: string;
  listName: string;
  assignees: { id: number; name: string; username: string }[];
}

interface ChecklistItems {
  todo: ChecklistItem[];
  completed: ChecklistItem[];
  overdue: ChecklistItem[];
}

interface DashboardStats {
  totalBoards: number;
  totalCards: number;
  completedCards: number;
  overdueCards: number;
  completionRate: number;
  totalUsers: number;
}

// Componente de contagem de estatísticas
const StatCard = ({ title, value, icon, description }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  description?: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de item atrasado
const OverdueItem = ({ title, dueDate, listName, boardName, boardId, cardId }: {
  title: string;
  dueDate: string;
  listName: string;
  boardName?: string;
  boardId?: number;
  cardId?: number;
}) => {
  const [, navigate] = useLocation();
  
  const handleClick = () => {
    if (boardId && typeof cardId === 'number') {
      navigate(`/board/${boardId}?card=${cardId}`);
    } else if (boardId) {
      navigate(`/board/${boardId}`);
    }
  };
  
  return (
    <div 
      className="flex items-center justify-between p-2 border-b last:border-0 hover:bg-secondary/20 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="font-medium">{title}</span>
        </div>
        {boardName && (
          <span className="text-xs text-muted-foreground ml-6">
            Quadro: {boardName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          {listName}
        </Badge>
        <span className="text-xs text-destructive">
          {new Date(dueDate).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
};

// Componente de usuário para administradores
const UserItem = ({ user, isAdmin = false }: {
  user: User;
  isAdmin?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between p-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        {user.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user.name.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      </div>
      <div>
        {isAdmin ? (
          <Badge className="bg-primary">Admin</Badge>
        ) : (
          <Badge variant="outline">Usuário</Badge>
        )}
      </div>
    </div>
  );
};

// Componente de quadro no dashboard
const BoardItem = ({ board }: { board: Board }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { mutate: createBoard } = useMutation({
    mutationFn: async (title: string) => {
      return await apiRequest("POST", "/api/boards", { title });
    },
    onSuccess: (newBoard: Board) => {
      toast({
        title: "Quadro copiado",
        description: "O quadro foi copiado com sucesso.",
      });
      // Recarregar os quadros
      queryClient.invalidateQueries({ queryKey: ['/api/user-boards'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o quadro.",
        variant: "destructive",
      });
    },
  });
  
  const { mutate: deleteBoard } = useMutation({
    mutationFn: async (boardId: number) => {
      await apiRequest("DELETE", `/api/boards/${boardId}`);
    },
    onSuccess: () => {
      toast({
        title: "Quadro excluído",
        description: "O quadro foi excluído com sucesso.",
      });
      // Recarregar os quadros
      queryClient.invalidateQueries({ queryKey: ['/api/user-boards'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o quadro.",
        variant: "destructive",
      });
    },
  });

  const handleBoardClick = () => {
    navigate(`/board/${board.id}`);
  };
  
  const handleEditBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/board/${board.id}/edit`);
  };
  
  const handleCopyBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    createBoard(`${board.title} (Cópia)`);
  };
  
  const handleDeleteBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };
  
  return (
    <>
      <div 
      className="p-4 border rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors relative"
      onClick={handleBoardClick}
    >
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuItem onClick={handleEditBoard}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyBoard}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copiar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDeleteBoard} className="text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h3 className="font-semibold text-lg pr-8">{board.title}</h3>
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm text-muted-foreground">
          {new Date(board.createdAt).toLocaleDateString("pt-BR")}
        </div>
        <Button variant="ghost" size="sm">
          Abrir
        </Button>
      </div>
    </div>

      {/* Delete Board Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Quadro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBoard(board.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
};

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Paginação para Projetos
  const [projectsTodoPage, setProjectsTodoPage] = useState(1);
  const [projectsCompletedPage, setProjectsCompletedPage] = useState(1);
  const [projectsOverduePage, setProjectsOverduePage] = useState(1);

  // Paginação para Tarefas
  const [tasksTodoPage, setTasksTodoPage] = useState(1);
  const [tasksCompletedPage, setTasksCompletedPage] = useState(1);
  const [tasksOverduePage, setTasksOverduePage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // Buscar estatísticas do dashboard
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
  });

  // Buscar quadros do usuário
  const { data: boards, isLoading: isLoadingBoards } = useQuery<Board[]>({
    queryKey: ['/api/user-boards'],
    enabled: !!user,
  });

  // Buscar usuários (somente para admin)
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user && user.role === 'admin',
  });

  // Buscar tarefas com prazo vencido
  const { data: overdueCards, isLoading: isLoadingOverdue } = useQuery<OverdueCard[]>({
    queryKey: ['/api/cards/overdue-dashboard'],
    enabled: !!user,
  });

  // Buscar cartões (projetos) categorizados para o dashboard (todo/completed/overdue)
  const { data: dashboardCards, isLoading: isLoadingDashboardCards } = useQuery<{ todo: OverdueCard[]; completed: OverdueCard[]; overdue: OverdueCard[] }>({
    queryKey: ['/api/dashboard/cards'],
    enabled: !!user,
  });
  // Buscar itens de checklist categorizados para o dashboard
  const { data: checklistItems, isLoading: isLoadingChecklistItems } = useQuery<ChecklistItems>({
    queryKey: ['/api/dashboard/checklist-items'],
    enabled: !!user,
  });

  // Buscar tempo médio de resolução (apenas para admin)
  const { data: resolutionMetrics } = useQuery<{ averageResolutionDays: number; totalCompletedTasks: number }>({
    queryKey: ['/api/dashboard/resolution-times'],
    enabled: !!user && user.role === 'admin',
  });

  const goToCreateBoard = () => {
    navigate("/board/new");
  };

  // Contadores para estatísticas
  const totalBoards = stats?.totalBoards || 0;
  const totalOverdue = stats?.overdueCards || 0;
  const totalUsers = stats?.totalUsers || 0;
  const completionRate = stats?.completionRate || 0;

  // Componentes para gráficos
  const ProjectCompletionRadialChart = ({ completionRate }: { completionRate: number }) => {
    const data = [
      { name: 'Concluído', value: completionRate, fill: '#F59E0B' }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Taxa de Conclusão</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="80%" 
                barSize={10} 
                data={data}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="chart-label">
                  <tspan x="50%" dy="-0.5em" fontSize="26" fontWeight="bold" fill="#000">
                    {completionRate}%
                  </tspan>
                  <tspan x="50%" dy="1.5em" fontSize="12" fill="#666">
                    Taxa de Conclusão
                  </tspan>
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProjectOverdueRadialChart = ({ stats }: { stats: DashboardStats }) => {
    const overduePercentage = stats?.totalCards > 0 
      ? Math.round((stats.overdueCards / stats.totalCards) * 100) 
      : 0;
    
    const data = [
      { name: 'Atrasadas', value: overduePercentage, fill: '#EF4444' }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projetos Atrasados</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="80%" 
                barSize={10} 
                data={data}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="chart-label">
                  <tspan x="50%" dy="-0.5em" fontSize="26" fontWeight="bold" fill="#000">
                    {overduePercentage}%
                  </tspan>
                  <tspan x="50%" dy="1.5em" fontSize="12" fill="#666">
                    Projetos Atrasados
                  </tspan>
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaskDistributionPieChart = ({ stats }: { stats: DashboardStats }) => {
    const data = [
      { name: 'Concluídas', value: stats?.completedCards || 0, color: '#22C55E' },
      { name: 'Atrasadas', value: stats?.overdueCards || 0, color: '#EF4444' },
      { name: 'Pendentes', value: (stats?.totalCards || 0) - (stats?.completedCards || 0) - (stats?.overdueCards || 0), color: '#F59E0B' },
    ];

    const COLORS = ['#22C55E', '#EF4444', '#F59E0B'];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projetos por Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} projeto(s)`, '']} 
                  separator=" - " 
                />
                <Legend formatter={(value, entry, index) => <span style={{ color: COLORS[index % COLORS.length] }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TasksByStageChart = ({ stats }: { stats: DashboardStats }) => {
    // Dados simulados para exemplificar o gráfico por estágio
    // Em um cenário real, esses dados viriam da API
    const data = [
      { name: 'A Fazer', valor: (stats?.totalCards || 0) - (stats?.completedCards || 0) - (stats?.overdueCards || 0), cor: '#F59E0B' },
      { name: 'Concluídas', valor: stats?.completedCards || 0, cor: '#22C55E' },
      { name: 'Atrasadas', valor: stats?.overdueCards || 0, cor: '#EF4444' },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projetos por Estágio</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} projeto(s)`, '']} />
                <Legend />
                <Bar dataKey="valor" name="Quantidade">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Função para exibir mensagem quando não houver itens
  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-muted-foreground mb-2">
        {message}
      </div>
    </div>
  );

  // Componente de paginação
  const Pagination = ({ 
    currentPage, 
    totalItems, 
    itemsPerPage, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalItems: number; 
    itemsPerPage: number; 
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="min-w-[40px]"
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Próxima
        </Button>
      </div>
    );
  };

  // Exibir carregamento
  if ((isLoadingBoards || isLoadingStats) && activeTab === "overview") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={goToCreateBoard}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Quadro
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          {user?.role === "admin" && (
            <TabsTrigger value="users">Usuários</TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {user && user.role === "admin" ? (
            <>
              {/* Métricas de Projetos (Cards) */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Métricas de Projetos</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <StatCard 
                    title="Total de Projetos" 
                    value={stats?.totalCards || 0} 
                    icon={<Layers className="h-4 w-4" />} 
                  />
                  <StatCard 
                    title="A Fazer" 
                    value={(stats?.totalCards || 0) - (stats?.completedCards || 0) - (stats?.overdueCards || 0)}
                    icon={<CircleDashed className="h-4 w-4" />} 
                    description="Projetos pendentes"
                  />
                  <StatCard 
                    title="Concluídos" 
                    value={stats?.completedCards || 0}
                    icon={<CheckCircle className="h-4 w-4 text-green-600" />} 
                    description={`${completionRate}% do total`}
                  />
                  <StatCard 
                    title="Atrasados" 
                    value={stats?.overdueCards || 0}
                    icon={<AlertCircle className="h-4 w-4 text-destructive" />} 
                    description="Projetos com prazo vencido"
                  />
                  <StatCard 
                    title="Tempo Médio" 
                    value={resolutionMetrics?.averageResolutionDays?.toFixed(1) || "0.0"}
                    icon={<Clock className="h-4 w-4" />} 
                    description="dias para conclusão"
                  />
                </div>
              </div>

              {/* Projects list removed as requested (kept metrics and analysis only) */}

              {/* Gráficos de Projetos */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Análise de Projetos</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <ProjectCompletionRadialChart completionRate={completionRate} />
                  <ProjectOverdueRadialChart stats={stats || { totalCards: 0, overdueCards: 0, completedCards: 0, totalBoards: 0, completionRate: 0, totalUsers: 0 }} />
                </div>
              </div>

              <div className="mt-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <TaskDistributionPieChart stats={stats || { totalCards: 0, overdueCards: 0, completedCards: 0, totalBoards: 0, completionRate: 0, totalUsers: 0 }} />
                  <TasksByStageChart stats={stats || { totalCards: 0, overdueCards: 0, completedCards: 0, totalBoards: 0, completionRate: 0, totalUsers: 0 }} />
                </div>
              </div>

              {/* Métricas de Tarefas (Checklist Items) movidas para depois dos gráficos de projetos */}
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Métricas de Tarefas</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <StatCard 
                    title="Total de Tarefas" 
                    value={(checklistItems?.todo.length || 0) + (checklistItems?.completed.length || 0) + (checklistItems?.overdue.length || 0)} 
                    icon={<ListChecks className="h-4 w-4" />} 
                  />
                  <StatCard 
                    title="A Fazer" 
                    value={checklistItems?.todo.length || 0}
                    icon={<CircleDashed className="h-4 w-4" />} 
                    description="Tarefas pendentes"
                  />
                  <StatCard 
                    title="Concluídas" 
                    value={checklistItems?.completed.length || 0}
                    icon={<CheckCircle className="h-4 w-4 text-green-600" />} 
                    description={`${
                      ((checklistItems?.todo.length || 0) + (checklistItems?.completed.length || 0) + (checklistItems?.overdue.length || 0)) > 0
                        ? Math.round((checklistItems?.completed.length || 0) / ((checklistItems?.todo.length || 0) + (checklistItems?.completed.length || 0) + (checklistItems?.overdue.length || 0)) * 100)
                        : 0
                    }% do total`}
                  />
                  <StatCard 
                    title="Atrasadas" 
                    value={checklistItems?.overdue.length || 0}
                    icon={<AlertCircle className="h-4 w-4 text-destructive" />} 
                    description="Tarefas com prazo vencido"
                  />
                  <StatCard 
                    title="Quadros Ativos" 
                    value={totalBoards}
                    icon={<Layers className="h-4 w-4" />} 
                    description="Total de quadros"
                  />
                </div>

                {/* Tarefas Recentes removed as requested (keeping only task metrics and analysis) */}
              </div>

              {/* Gráficos de Tarefas (Checklist Items) */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Análise de Tarefas</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Taxa de Conclusão de Tarefas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart 
                            cx="50%" 
                            cy="50%" 
                            innerRadius="60%" 
                            outerRadius="80%" 
                            barSize={10} 
                            data={[{
                              name: 'Concluído',
                              value: ((checklistItems?.todo.length || 0) + (checklistItems?.completed.length || 0) + (checklistItems?.overdue.length || 0)) > 0
                                ? Math.round((checklistItems?.completed.length || 0) / ((checklistItems?.todo.length || 0) + (checklistItems?.completed.length || 0) + (checklistItems?.overdue.length || 0)) * 100)
                                : 0,
                              fill: '#22C55E'
                            }]}
                            startAngle={180}
                            endAngle={0}
                          >
                            <RadialBar background dataKey="value" cornerRadius={10} />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="chart-label">
                              <tspan x="50%" dy="-0.5em" fontSize="26" fontWeight="bold" fill="#000">
                                {((checklistItems?.todo.length || 0) + (checklistItems?.completed.length || 0) + (checklistItems?.overdue.length || 0)) > 0
                                  ? Math.round((checklistItems?.completed.length || 0) / ((checklistItems?.todo.length || 0) + (checklistItems?.completed.length || 0) + (checklistItems?.overdue.length || 0)) * 100)
                                  : 0}%
                              </tspan>
                              <tspan x="50%" dy="1.5em" fontSize="12" fill="#666">
                                Taxa de Conclusão
                              </tspan>
                            </text>
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tarefa por Status</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Concluídas', value: checklistItems?.completed.length || 0, color: '#22C55E' },
                                { name: 'Atrasadas', value: checklistItems?.overdue.length || 0, color: '#EF4444' },
                                { name: 'A Fazer', value: checklistItems?.todo.length || 0, color: '#F59E0B' },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                              {[
                                { name: 'Concluídas', value: checklistItems?.completed.length || 0, color: '#22C55E' },
                                { name: 'Atrasadas', value: checklistItems?.overdue.length || 0, color: '#EF4444' },
                                { name: 'A Fazer', value: checklistItems?.todo.length || 0, color: '#F59E0B' },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`${value} tarefa(s)`, '']} separator=" - " />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="mt-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tarefas por Estágio</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'A Fazer', valor: checklistItems?.todo.length || 0, cor: '#F59E0B' },
                              { name: 'Concluídas', valor: checklistItems?.completed.length || 0, cor: '#22C55E' },
                              { name: 'Atrasadas', valor: checklistItems?.overdue.length || 0, cor: '#EF4444' },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => [`${value} tarefa(s)`, '']} />
                            <Legend />
                            <Bar dataKey="valor" name="Quantidade">
                              {[
                                { name: 'A Fazer', valor: checklistItems?.todo.length || 0, cor: '#F59E0B' },
                                { name: 'Concluídas', valor: checklistItems?.completed.length || 0, cor: '#22C55E' },
                                { name: 'Atrasadas', valor: checklistItems?.overdue.length || 0, cor: '#EF4444' },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.cor} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Usuários do Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-primary mb-2">{totalUsers}</div>
                        <p className="text-muted-foreground">Usuários Ativos</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Visão simplificada para usuários normais */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                  title="Total de Quadros" 
                  value={totalBoards} 
                  icon={<Layers className="h-4 w-4" />} 
                />
                <StatCard 
                  title="Itens Atrasados" 
                  value={totalOverdue}
                  icon={<AlertCircle className="h-4 w-4" />} 
                  description="Tarefas com prazo vencido"
                />
                <StatCard 
                  title="Taxa de Conclusão" 
                  value={`${completionRate}%`}
                  icon={<BarChart3 className="h-4 w-4" />} 
                  description="Média de conclusão dos projetos"
                />
                <StatCard 
                  title="Tarefas Totais" 
                  value={(checklistItems?.todo.length || 0) + (checklistItems?.completed.length || 0) + (checklistItems?.overdue.length || 0)}
                  icon={<ListChecks className="h-4 w-4" />} 
                  description="Total de checklist items"
                />
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Progresso Geral</h2>
                <Progress value={completionRate} className="h-2 mb-2" />
                <div className="text-sm text-muted-foreground">
                  {completionRate}% das tarefas foram concluídas
                </div>
              </div>
            </>
          )}

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Seus Quadros</h2>
            </div>
            
            {(boards || []).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(boards || []).map((board) => (
                  <BoardItem key={board.id} board={board} />
                ))}
              </div>
            ) : (
              renderEmptyState("Você ainda não tem quadros. Crie um novo quadro para começar!")
            )}
          </div>
        </TabsContent>

        {/* Tab: Projetos */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projetos</CardTitle>
              <CardDescription>Projetos organizados por status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDashboardCards || isLoadingChecklistItems ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                dashboardCards ? (
                  <Tabs defaultValue="todo" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="todo">A Fazer ({dashboardCards.todo.length})</TabsTrigger>
                      <TabsTrigger value="completed">Concluídos ({dashboardCards.completed.length})</TabsTrigger>
                      <TabsTrigger value="overdue">Atrasados ({dashboardCards.overdue.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="todo" className="space-y-4 mt-4">
                      {dashboardCards.todo.length > 0 ? (
                        <>
                          <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {dashboardCards.todo
                              .slice((projectsTodoPage - 1) * ITEMS_PER_PAGE, projectsTodoPage * ITEMS_PER_PAGE)
                              .map((card) => (
                                <div 
                                  key={`card-todo-${card.id}`}
                                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                                  onClick={() => navigate(`/board/${card.boardId}?card=${card.id}`)}
                                >
                                  <div className="space-y-1 flex-1">
                                    <div className="font-medium">{card.title}</div>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                      <span>{card.boardName}</span>
                                      <span>•</span>
                                      <span>{card.listName}</span>
                                    </div>
                                  </div>
                                  {card.dueDate && (
                                    <Badge variant="outline" className="flex items-center space-x-1 ml-2">
                                      <Clock className="h-3 w-3 mr-1" />
                                      <span>{new Date(card.dueDate).toLocaleDateString('pt-BR')}</span>
                                    </Badge>
                                  )}
                                </div>
                              ))}
                          </div>
                          <Pagination
                            currentPage={projectsTodoPage}
                            totalItems={dashboardCards.todo.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setProjectsTodoPage}
                          />
                        </>
                      ) : (
                        renderEmptyState('Nenhum projeto pendente')
                      )}
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-4 mt-4">
                      {dashboardCards.completed.length > 0 ? (
                        <>
                          <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {dashboardCards.completed
                              .slice((projectsCompletedPage - 1) * ITEMS_PER_PAGE, projectsCompletedPage * ITEMS_PER_PAGE)
                              .map((card) => (
                                <div 
                                  key={`card-completed-${card.id}`}
                                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                                  onClick={() => navigate(`/board/${card.boardId}?card=${card.id}`)}
                                >
                                  <div className="space-y-1 flex-1">
                                    <div className="font-medium line-through text-muted-foreground">{card.title}</div>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                      <span>{card.boardName}</span>
                                      <span>•</span>
                                      <span>{card.listName}</span>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="flex items-center space-x-1 ml-2 bg-green-50">
                                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                    <span>Concluído</span>
                                  </Badge>
                                </div>
                              ))}
                          </div>
                          <Pagination
                            currentPage={projectsCompletedPage}
                            totalItems={dashboardCards.completed.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setProjectsCompletedPage}
                          />
                        </>
                      ) : (
                        renderEmptyState('Nenhum projeto concluído')
                      )}
                    </TabsContent>

                    <TabsContent value="overdue" className="space-y-4 mt-4">
                      {dashboardCards.overdue.length > 0 ? (
                        <>
                          <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {dashboardCards.overdue
                              .slice((projectsOverduePage - 1) * ITEMS_PER_PAGE, projectsOverduePage * ITEMS_PER_PAGE)
                              .map((card) => (
                                <div 
                                  key={`card-overdue-${card.id}`}
                                  className="flex items-center justify-between p-3 border border-destructive/50 rounded-md hover:bg-muted cursor-pointer"
                                  onClick={() => navigate(`/board/${card.boardId}?card=${card.id}`)}
                                >
                                  <div className="space-y-1 flex-1">
                                    <div className="font-medium">{card.title}</div>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                      <span>{card.boardName}</span>
                                      <span>•</span>
                                      <span>{card.listName}</span>
                                    </div>
                                  </div>
                                  {card.dueDate && (
                                    <Badge variant="destructive" className="flex items-center space-x-1 ml-2">
                                      <Clock className="h-3 w-3 mr-1" />
                                      <span>Vencido em {new Date(card.dueDate).toLocaleDateString('pt-BR')}</span>
                                    </Badge>
                                  )}
                                </div>
                              ))}
                          </div>
                          <Pagination
                            currentPage={projectsOverduePage}
                            totalItems={dashboardCards.overdue.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setProjectsOverduePage}
                          />
                        </>
                      ) : (
                        renderEmptyState('Nenhum projeto atrasado. Bom trabalho!')
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  renderEmptyState('Não há projetos para exibir')
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tarefas (Checklist Items) */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas (Checklist Items)</CardTitle>
              <CardDescription>
                Subtarefas organizadas por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingChecklistItems ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs defaultValue="todo" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="todo">
                      A Fazer ({checklistItems?.todo.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      Concluídos ({checklistItems?.completed.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="overdue">
                      Atrasados ({checklistItems?.overdue.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="todo" className="space-y-4 mt-4">
                    {checklistItems && checklistItems.todo.length > 0 ? (
                      <>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                          {checklistItems.todo
                            .slice((tasksTodoPage - 1) * ITEMS_PER_PAGE, tasksTodoPage * ITEMS_PER_PAGE)
                            .map((item) => (
                              <div 
                                key={item.id}
                                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                                onClick={() => navigate(`/board/${item.boardId}?card=${item.cardId}`)}
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="font-medium">{item.content}</div>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <span>{item.boardName}</span>
                                    <span>•</span>
                                    <span>{item.cardTitle}</span>
                                    <span>•</span>
                                    <span>{item.checklistTitle}</span>
                                  </div>
                                </div>
                                {item.dueDate && (
                                  <Badge variant="outline" className="flex items-center space-x-1 ml-2">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{new Date(item.dueDate).toLocaleDateString('pt-BR')}</span>
                                  </Badge>
                                )}
                              </div>
                            ))}
                        </div>
                        <Pagination
                          currentPage={tasksTodoPage}
                          totalItems={checklistItems.todo.length}
                          itemsPerPage={ITEMS_PER_PAGE}
                          onPageChange={setTasksTodoPage}
                        />
                      </>
                    ) : (
                      renderEmptyState("Não há tarefas pendentes")
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4 mt-4">
                    {checklistItems && checklistItems.completed.length > 0 ? (
                      <>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                          {checklistItems.completed
                            .slice((tasksCompletedPage - 1) * ITEMS_PER_PAGE, tasksCompletedPage * ITEMS_PER_PAGE)
                            .map((item) => (
                              <div 
                                key={item.id}
                                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                                onClick={() => navigate(`/board/${item.boardId}?card=${item.cardId}`)}
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="font-medium line-through text-muted-foreground">{item.content}</div>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <span>{item.boardName}</span>
                                    <span>•</span>
                                    <span>{item.cardTitle}</span>
                                    <span>•</span>
                                    <span>{item.checklistTitle}</span>
                                  </div>
                                </div>
                                <Badge variant="outline" className="flex items-center space-x-1 ml-2 bg-green-50">
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                  <span>Concluído</span>
                                </Badge>
                              </div>
                            ))}
                        </div>
                        <Pagination
                          currentPage={tasksCompletedPage}
                          totalItems={checklistItems.completed.length}
                          itemsPerPage={ITEMS_PER_PAGE}
                          onPageChange={setTasksCompletedPage}
                        />
                      </>
                    ) : (
                      renderEmptyState("Nenhuma tarefa concluída ainda")
                    )}
                  </TabsContent>

                  <TabsContent value="overdue" className="space-y-4 mt-4">
                    {checklistItems && checklistItems.overdue.length > 0 ? (
                      <>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                          {checklistItems.overdue
                            .slice((tasksOverduePage - 1) * ITEMS_PER_PAGE, tasksOverduePage * ITEMS_PER_PAGE)
                            .map((item) => (
                              <div 
                                key={item.id}
                                className="flex items-center justify-between p-3 border border-destructive/50 rounded-md hover:bg-muted cursor-pointer"
                                onClick={() => navigate(`/board/${item.boardId}?card=${item.cardId}`)}
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="font-medium">{item.content}</div>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <span>{item.boardName}</span>
                                    <span>•</span>
                                    <span>{item.cardTitle}</span>
                                    <span>•</span>
                                    <span>{item.checklistTitle}</span>
                                  </div>
                                </div>
                                {item.dueDate && (
                                  <Badge variant="destructive" className="flex items-center space-x-1 ml-2">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>Vencido em {new Date(item.dueDate).toLocaleDateString('pt-BR')}</span>
                                  </Badge>
                                )}
                              </div>
                            ))}
                        </div>
                        <Pagination
                          currentPage={tasksOverduePage}
                          totalItems={checklistItems.overdue.length}
                          itemsPerPage={ITEMS_PER_PAGE}
                          onPageChange={setTasksOverduePage}
                        />
                      </>
                    ) : (
                      renderEmptyState("Não há tarefas atrasadas. Bom trabalho!")
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários (Admin) */}
        {user?.role === "admin" && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Visualize e gerencie os usuários da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    {(users || []).length > 0 ? (
                      <div className="divide-y">
                        {(users || []).map((userData) => (
                          <UserItem 
                            key={userData.id}
                            user={userData}
                            isAdmin={userData.role === "admin"}
                          />
                        ))}
                      </div>
                    ) : (
                      renderEmptyState("Nenhum usuário encontrado.")
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => navigate('/auth?mode=register')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;