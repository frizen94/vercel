import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2, Clock, CheckCircle, AlertCircle, ArrowLeft, User, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TaskAssignee {
  id: number;
  name: string;
  username: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  completionTimestamp?: string;
  boardId: number;
  boardName: string;
  listName: string;
  assignees: TaskAssignee[];
}

interface ChecklistItem {
  id: number;
  content: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  checklistId: number;
  checklistTitle: string;
  cardId: number;
  cardTitle: string;
  boardId: number;
  boardName: string;
  listName: string;
  assignees: TaskAssignee[];
}

interface PortfolioTasks {
  todo: Task[];
  completed: Task[];
  overdue: Task[];
}

interface ChecklistItems {
  todo: ChecklistItem[];
  completed: ChecklistItem[];
  overdue: ChecklistItem[];
}

interface ResolutionMetrics {
  averageResolutionDays: number;
  totalCompletedTasks: number;
  filters: {
    portfolioId: number | null;
    userId: number | null;
    startDate: string | null;
    endDate: string | null;
  };
}

const PortfolioMiniDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const portfolioId = parseInt(id || "0");

  // Paginação para Projetos
  const [projectsTodoPage, setProjectsTodoPage] = useState(1);
  const [projectsCompletedPage, setProjectsCompletedPage] = useState(1);
  const [projectsOverduePage, setProjectsOverduePage] = useState(1);

  // Paginação para Tarefas (Checklist Items)
  const [tasksTodoPage, setTasksTodoPage] = useState(1);
  const [tasksCompletedPage, setTasksCompletedPage] = useState(1);
  const [tasksOverduePage, setTasksOverduePage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const { data: tasks, isLoading, error } = useQuery<PortfolioTasks>({
    queryKey: [`/api/portfolios/${portfolioId}/tasks`],
    enabled: !!portfolioId && portfolioId > 0,
  });

  const { data: checklistItems, isLoading: isLoadingChecklistItems } = useQuery<ChecklistItems>({
    queryKey: [`/api/portfolios/${portfolioId}/checklist-items`],
    enabled: !!portfolioId && portfolioId > 0,
  });

  const { data: resolutionMetrics } = useQuery<ResolutionMetrics>({
    queryKey: [`/api/dashboard/resolution-times`, { portfolioId }],
    enabled: !!portfolioId && portfolioId > 0,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

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

  const handleTaskClick = (boardId: number) => {
    navigate(`/board/${boardId}`);
  };

  const renderTaskTable = (taskList: Task[], emptyMessage: string, currentPage: number, onPageChange: (page: number) => void) => {
    if (!taskList || taskList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedTasks = taskList.slice(startIndex, endIndex);

    return (
      <>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Quadro</TableHead>
                <TableHead>Lista</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleTaskClick(task.boardId)}
                >
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.boardName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.listName}</Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="text-sm">
                          {task.assignees.map((a) => a.name).join(", ")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Não atribuído</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.dueDate || task.completionTimestamp)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={taskList.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
        />
      </>
    );
  };

  const renderChecklistItemsTable = (items: ChecklistItem[], emptyMessage: string, currentPage: number, onPageChange: (page: number) => void) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItems = items.slice(startIndex, endIndex);

    return (
      <>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead>Quadro</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.completed;
                
                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{item.content}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.cardTitle}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{item.checklistTitle}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.boardName}</TableCell>
                    <TableCell>
                      {item.assignees && item.assignees.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="text-sm">
                            {item.assignees.map((a) => a.name).join(", ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não atribuído</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        <span className={isOverdue ? 'font-medium' : ''}>{formatDate(item.dueDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/board/${item.boardId}?card=${item.cardId}`);
                        }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={items.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
        />
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dashboard do portfólio...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-muted-foreground">Erro ao carregar dashboard.</p>
        </div>
      </div>
    );
  }

  const totalTasks = (tasks?.todo.length || 0) + (tasks?.completed.length || 0) + (tasks?.overdue.length || 0);
  const completionRate = totalTasks > 0 
    ? ((tasks?.completed.length || 0) / totalTasks * 100).toFixed(1)
    : "0.0";

  // Filtrar checklist items: só mostrar se tiver responsável OU prazo
  const filterChecklistItems = (items: ChecklistItem[]) => {
    return items.filter(item => 
      (item.assignees && item.assignees.length > 0) || item.dueDate
    );
  };

  const filteredChecklistItems = checklistItems ? {
    todo: filterChecklistItems(checklistItems.todo),
    completed: filterChecklistItems(checklistItems.completed),
    overdue: filterChecklistItems(checklistItems.overdue)
  } : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header: Voltar acima do título e título alinhado mais à esquerda */}
      <div className="flex flex-col">
        <div className="mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="-ml-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard do Portfólio
          </h1>
          <p className="text-muted-foreground">
            Visão geral das tarefas e métricas
          </p>
        </div>
      </div>

      {/* Métricas resumidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.completed.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% de conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.overdue.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredChecklistItems?.overdue.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              checklist items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resolutionMetrics?.averageResolutionDays?.toFixed(1) || "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">dias para conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas de projetos */}
      <Card>
        <CardHeader>
          <CardTitle>Projetos</CardTitle>
          <CardDescription>
            Projetos organizados por status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todo" className="space-y-4">
            <TabsList>
              <TabsTrigger value="todo">
                A Fazer ({tasks?.todo.length || 0})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Concluídos ({tasks?.completed.length || 0})
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Atrasados ({tasks?.overdue.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todo">
              {renderTaskTable(
                tasks?.todo || [],
                "Não há projetos pendentes",
                projectsTodoPage,
                setProjectsTodoPage
              )}
            </TabsContent>

            <TabsContent value="completed">
              {renderTaskTable(
                tasks?.completed || [],
                "Nenhum projeto concluído ainda",
                projectsCompletedPage,
                setProjectsCompletedPage
              )}
            </TabsContent>

            <TabsContent value="overdue">
              {renderTaskTable(
                tasks?.overdue || [],
                "Não há projetos atrasados. Ótimo trabalho!",
                projectsOverduePage,
                setProjectsOverduePage
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tarefas (Checklist Items) */}
      {filteredChecklistItems && (
        <Card>
          <CardHeader>
            <CardTitle>Tarefas</CardTitle>
            <CardDescription>
              Subtarefas organizadas por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todo" className="space-y-4">
              <TabsList>
                <TabsTrigger value="todo">
                  A Fazer ({filteredChecklistItems.todo.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Concluídos ({filteredChecklistItems.completed.length})
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  Atrasados ({filteredChecklistItems.overdue.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todo">
                {renderChecklistItemsTable(
                  filteredChecklistItems.todo,
                  "Não há tarefas pendentes",
                  tasksTodoPage,
                  setTasksTodoPage
                )}
              </TabsContent>

              <TabsContent value="completed">
                {renderChecklistItemsTable(
                  filteredChecklistItems.completed,
                  "Nenhuma tarefa concluída ainda",
                  tasksCompletedPage,
                  setTasksCompletedPage
                )}
              </TabsContent>

              <TabsContent value="overdue">
                {renderChecklistItemsTable(
                  filteredChecklistItems.overdue,
                  "Não há tarefas atrasadas. Ótimo trabalho!",
                  tasksOverduePage,
                  setTasksOverduePage
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioMiniDashboard;
