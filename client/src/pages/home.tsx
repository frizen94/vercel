import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  CheckCircle2,
  Plus,
  Users,
  Folder,
  ChevronRight,
  Clock,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  Loader2
} from "lucide-react";

// Interfaces para os dados
interface Task {
  id: number;
  title: string;
  dueDate?: string;
  boardTitle?: string;
  priority?: 'high' | 'medium' | 'low';
  completed?: boolean;
}

interface Project {
  id: number;
  title: string;
  description?: string;
  tasksCount?: number;
  completedTasks?: number;
  lastActivity?: string;
}

interface Collaborator {
  id: number;
  name: string;
  username: string;
  profilePicture?: string;
  role?: string;
  lastSeen?: string;
}

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Parallel queries using react-query pattern
  const { data: recentTasks = [], isLoading: isLoadingTasks, error: tasksError } = useQuery<Task[]>({
    queryKey: ['/api/dashboard/recent-tasks'],
    enabled: !!user,
  });

  const { data: boards = [], isLoading: isLoadingBoards, error: boardsError } = useQuery<any[]>({
    queryKey: ['/api/boards'],
    enabled: !!user,
  });

  const { data: collaborators = [], isLoading: isLoadingCollaborators, error: collaboratorsError } = useQuery<Collaborator[]>({
    queryKey: ['/api/dashboard/collaborators'],
    enabled: !!user,
  });

  // Transform boards into projects format
  const recentProjects: Project[] = boards.slice(0, 4).map((board: any) => ({
    id: board.id,
    title: board.title,
    description: board.description,
    tasksCount: 0,
    completedTasks: 0,
    lastActivity: new Date(board.createdAt).toLocaleDateString('pt-BR')
  }));

  // Show error toasts when queries fail - using useEffect to prevent infinite re-renders
  useEffect(() => {
    if (tasksError && !isLoadingTasks) {
      toast({
        title: "Erro ao carregar tarefas",
        description: "Não foi possível carregar suas tarefas recentes",
        variant: "destructive",
      });
    }
  }, [tasksError, isLoadingTasks, toast]);

  useEffect(() => {
    if (boardsError && !isLoadingBoards) {
      toast({
        title: "Erro ao carregar projetos",
        description: "Não foi possível carregar seus projetos",
        variant: "destructive",
      });
    }
  }, [boardsError, isLoadingBoards, toast]);

  useEffect(() => {
    if (collaboratorsError && !isLoadingCollaborators) {
      toast({
        title: "Erro ao carregar colaboradores",
        description: "Não foi possível carregar informações dos colaboradores",
        variant: "destructive",
      });
    }
  }, [collaboratorsError, isLoadingCollaborators, toast]);

  // Função para obter saudação baseada na hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Função para formatar data
  const formatDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Check if any query is loading
  const isLoading = isLoadingTasks || isLoadingBoards || isLoadingCollaborators;

  // Handle authentication and redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar o dashboard.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, toast, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header com saudação */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-greeting">
              {getGreeting()}, {user?.name?.trim().split(/\s+/)[0] ?? 'Usuário'}
            </h1>
            <p className="text-muted-foreground mt-1 capitalize" data-testid="text-date">
              {formatDate()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/portfolios')} className="gap-2" data-testid="button-create-project">
              <Plus className="h-4 w-4" />
              Criar portfólio
            </Button>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Seção Minhas Tarefas */}
        <div className="lg:col-span-2">
          <Card data-testid="card-tasks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Minhas tarefas
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/my-tasks')}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-view-all-tasks"
              >
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTasks ? (
                <div className="space-y-3" data-testid="skeleton-tasks">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTasks.length > 0 ? (
                <div data-testid="list-tasks">
                  {recentTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" data-testid={`task-item-${task.id}`}>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`task-title-${task.id}`}>{task.title}</p>
                        {task.boardTitle && (
                          <p className="text-xs text-muted-foreground" data-testid={`task-board-${task.id}`}>{task.boardTitle}</p>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`task-due-date-${task.id}`}>
                          <Clock className="h-3 w-3" />
                          {task.dueDate}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-tasks">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma tarefa pendente</p>
                  <p className="text-sm">Você está em dia! 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção Pessoas */}
        <div>
          <Card data-testid="card-collaborators">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pessoas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingCollaborators ? (
                <div className="space-y-3" data-testid="skeleton-collaborators">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : collaborators.length > 0 ? (
                <div data-testid="list-collaborators">
                  {collaborators.slice(0, 6).map((person) => (
                    <div key={person.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" data-testid={`collaborator-item-${person.id}`}>
                      <Avatar className="h-8 w-8">
                        {person.profilePicture ? (
                          <AvatarImage src={person.profilePicture} alt={person.name} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {person.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`collaborator-name-${person.id}`}>{person.name}</p>
                        <p className="text-xs text-muted-foreground" data-testid={`collaborator-username-${person.id}`}>@{person.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground" data-testid="empty-collaborators">
                  <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum colaborador encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção Projetos */}
      <Card data-testid="card-projects">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Projetos
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portfolios')}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-create-project-section"
          >
            <Plus className="h-4 w-4 mr-1" />
            Criar portfólio
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingBoards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="skeleton-projects">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="list-projects">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/board/${project.id}`)}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer group"
                  data-testid={`project-item-${project.id}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2" data-testid={`project-title-${project.id}`}>
                        {project.title}
                      </h3>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto" data-testid={`project-menu-${project.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`project-description-${project.id}`}>
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1" data-testid={`project-task-count-${project.id}`}>
                        <Briefcase className="h-3 w-3" />
                        {project.tasksCount || 0} tarefas
                      </span>
                      <span data-testid={`project-activity-${project.id}`}>{project.lastActivity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="empty-projects">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum projeto ainda</p>
              <p className="text-sm mb-4">Crie seu primeiro projeto para começar</p>
              <Button onClick={() => navigate('/portfolios')} data-testid="button-create-first-project">
                <Plus className="h-4 w-4 mr-2" />
                Criar portfólio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}