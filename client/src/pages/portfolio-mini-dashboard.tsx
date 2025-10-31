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

interface PortfolioTasks {
  todo: Task[];
  completed: Task[];
  overdue: Task[];
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

  const { data: tasks, isLoading, error } = useQuery<PortfolioTasks>({
    queryKey: [`/api/portfolios/${portfolioId}/tasks`],
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

  const handleTaskClick = (boardId: number) => {
    navigate(`/board/${boardId}`);
  };

  const renderTaskTable = (taskList: Task[], emptyMessage: string) => {
    if (!taskList || taskList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarefa</TableHead>
              <TableHead>Quadro</TableHead>
              <TableHead>Lista</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskList.map((task) => (
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/portfolios")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard do Portfólio
            </h1>
            <p className="text-muted-foreground">
              Visão geral das tarefas e métricas
            </p>
          </div>
        </div>
      </div>

      {/* Métricas resumidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
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
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.overdue.length || 0}</div>
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

      {/* Tabelas de tarefas */}
      <Tabs defaultValue="todo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todo">
            A Fazer ({tasks?.todo.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas ({tasks?.completed.length || 0})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Atrasadas ({tasks?.overdue.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas a Fazer</CardTitle>
              <CardDescription>
                Tarefas pendentes que precisam ser executadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTaskTable(
                tasks?.todo || [],
                "Não há tarefas pendentes"
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas Concluídas</CardTitle>
              <CardDescription>
                Tarefas que já foram finalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTaskTable(
                tasks?.completed || [],
                "Nenhuma tarefa concluída ainda"
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas Atrasadas</CardTitle>
              <CardDescription>
                Tarefas com prazo vencido que precisam de atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTaskTable(
                tasks?.overdue || [],
                "Não há tarefas atrasadas. Ótimo trabalho!"
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioMiniDashboard;
