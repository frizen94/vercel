import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Filter, Plus, Search, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ChecklistItem {
  id: number;
  content: string;
  description?: string;
  dueDate: string | null;
  completed: boolean;
  checklistId: number;
  checklistTitle: string;
  cardId: number;
  cardTitle: string;
  boardId: number;
  boardName: string;
  listName: string;
  assignees: { id: number; name: string; username: string }[];
}

interface ChecklistItemsData {
  todo: ChecklistItem[];
  completed: ChecklistItem[];
  overdue: ChecklistItem[];
}

export default function MyTasks() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: tasksData, isLoading, error } = useQuery<ChecklistItemsData>({
    queryKey: ['/api/dashboard/checklist-items'],
    enabled: !!user,
  });

  // Combinar todas as tarefas em um único array
  const allTasks = tasksData 
    ? [
        ...tasksData.todo.map(t => ({ ...t, status: 'todo' as const })),
        ...tasksData.completed.map(t => ({ ...t, status: 'completed' as const })),
        ...tasksData.overdue.map(t => ({ ...t, status: 'overdue' as const }))
      ]
    : [];

  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch = task.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.cardTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.boardName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === "todo"),
    overdue: filteredTasks.filter(t => t.status === "overdue"),
    completed: filteredTasks.filter(t => t.status === "completed"),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue": return "destructive";
      case "completed": return "secondary";
      case "todo": return "default";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "overdue": return "Atrasada";
      case "completed": return "Concluída";
      case "todo": return "A Fazer";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Tarefas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as suas tarefas em um só lugar
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="todo">Pendentes ({tasksByStatus.todo.length})</TabsTrigger>
          <TabsTrigger value="overdue">Atrasadas ({tasksByStatus.overdue.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({tasksByStatus.completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Erro ao carregar tarefas</h3>
                <p className="text-muted-foreground text-center">
                  Não foi possível carregar suas tarefas. Tente novamente mais tarde.
                </p>
              </CardContent>
            </Card>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma tarefa encontrada</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? "Tente ajustar sua pesquisa" : "Você não tem tarefas no momento"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/board/${task.boardId}?card=${task.cardId}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{task.content}</CardTitle>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>{task.boardName}</span>
                          <span>•</span>
                          <span>{task.cardTitle}</span>
                          <span>•</span>
                          <span>{task.checklistTitle}</span>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Lista: {task.listName}</span>
                        {task.assignees.length > 0 && (
                          <>
                            <span>•</span>
                            <span>Atribuído: {task.assignees.map(a => a.name).join(', ')}</span>
                          </>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}