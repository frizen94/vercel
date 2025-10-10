import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  MessageCircle, 
  UserPlus, 
  Calendar, 
  AlertCircle,
  Check,
  X,
  Archive
} from "lucide-react";

interface Notification {
  id: number;
  type: "task_assigned" | "task_unassigned" | "task_completed" | "comment" | "mention" | "invitation" | "deadline";
  title: string;
  message: string;
  fromUser: {
    id: number;
    name: string;
    username: string;
    profilePicture?: string;
  } | null;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
  relatedCardId?: number;
  relatedChecklistItemId?: number;
}

export default function Inbox() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [, setLocation] = useLocation();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: () => apiRequest('GET', '/api/notifications'),
    enabled: !!user,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000, // Atualiza a cada 10 segundos
    retry: false,
  });

  const filteredNotifications = (notifications as Notification[]).filter((notification: Notification) => {
    if (filter === "unread") return !notification.read;
    if (filter === "read") return notification.read;
    return true;
  });

  const unreadCount = (notifications as Notification[]).filter((n: Notification) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "task_assigned": return <Calendar className="h-4 w-4" />;
      case "task_unassigned": return <X className="h-4 w-4" />;
      case "task_completed": return <Check className="h-4 w-4 text-green-600" />;
      case "comment": return <MessageCircle className="h-4 w-4" />;
      case "mention": return <AlertCircle className="h-4 w-4" />;
      case "invitation": return <UserPlus className="h-4 w-4" />;
      case "deadline": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "task_assigned": return "Tarefa Atribuída";
      case "task_unassigned": return "Tarefa Removida";
      case "task_completed": return "Subtarefa Concluída";
      case "comment": return "Comentário";
      case "mention": return "Menção";
      case "invitation": return "Convite";
      case "deadline": return "⚠️ Prazo Vencido";
      default: return "Notificação";
    }
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/notifications/mark-all-read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const clearNotificationMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/notifications/${id}/clear`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const clearNotification = (id: number) => {
    clearNotificationMutation.mutate(id);
  };

  const clearAllMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/notifications/clear-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const clearAllNotifications = () => {
    clearAllMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navegar para actionUrl se existir e for uma rota interna segura
    if (notification.actionUrl && notification.actionUrl.startsWith('/')) {
      setLocation(notification.actionUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa de Entrada</h1>
          <p className="text-muted-foreground">
            Acompanhe suas notificações e atualizações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={markAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            data-testid="mark-all-read"
          >
            <Check className="h-4 w-4 mr-2" />
            {markAllAsReadMutation.isPending ? 'Marcando...' : 'Marcar todas como lidas'}
          </Button>
          <Button 
            variant="outline" 
            onClick={clearAllNotifications}
            disabled={clearAllMutation.isPending}
            data-testid="clear-all"
          >
            <Archive className="h-4 w-4 mr-2" />
            {clearAllMutation.isPending ? 'Limpando...' : 'Limpar tudo'}
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({(notifications as Notification[]).length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Lidas ({(notifications as Notification[]).length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Caixa de entrada vazia</h3>
                <p className="text-muted-foreground text-center">
                  Você não tem notificações no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification: Notification) => (
                <Card 
                  key={notification.id} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    !notification.read && notification.type === 'task_completed' ? "border-green-500/50 bg-green-50/50" :
                    !notification.read && notification.type === 'deadline' ? "border-l-4 border-l-orange-500 bg-orange-50/50" :
                    !notification.read ? "border-primary/50 bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        {notification.fromUser?.profilePicture ? (
                          <AvatarImage src={notification.fromUser.profilePicture} />
                        ) : null}
                        <AvatarFallback>
                          {notification.fromUser?.name.charAt(0).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getIcon(notification.type)}
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              !notification.read && notification.type === 'deadline' ? 'bg-orange-100 text-orange-800' :
                              !notification.read && notification.type === 'task_completed' ? 'bg-green-100 text-green-800' : ''
                            }`}
                          >
                            {getTypeLabel(notification.type)}
                          </Badge>
                          {!notification.read && (
                            <div className={`w-2 h-2 rounded-full ${
                              notification.type === 'task_completed' ? 'bg-green-500' : 'bg-primary'
                            }`} />
                          )}
                        </div>
                        
                        <h4 className={`font-medium text-sm mb-1 ${
                          !notification.read && notification.type === 'deadline' ? 'text-red-600' : ''
                        }`}>
                          {notification.title}
                        </h4>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {notification.fromUser?.name || 'Sistema'} • {" "}
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                data-testid={`mark-read-${notification.id}`}
                                title="Marcar como lida"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              data-testid={`clear-${notification.id}`}
                              title="Limpar da caixa de entrada"
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
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