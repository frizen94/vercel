
import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  fromUser?: {
    id: number;
    name: string;
    username: string;
    profilePicture?: string;
  };
}

async function apiRequest(method: string = 'GET', url: string, body?: any) {
  const config: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Buscar notificações não lidas
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: () => apiRequest('GET', '/api/notifications?limit=10'),
  });

  // Marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/notifications/mark-all-read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Deletar notificação
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task_assigned': return 'bg-blue-100 text-blue-800';
      case 'task_completed': return 'bg-green-100 text-green-800';
      case 'task_unassigned': return 'bg-red-100 text-red-800';
      case 'comment': return 'bg-green-100 text-green-800';
      case 'mention': return 'bg-yellow-100 text-yellow-800';
      case 'invitation': return 'bg-purple-100 text-purple-800';
      case 'deadline': return 'bg-red-100 text-red-800 font-semibold';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Notificações</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer ${
                    !notification.read ? 'bg-muted/30' : ''
                  } ${
                    notification.type === 'deadline' ? 'border-l-4 border-l-orange-500 bg-orange-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getTypeColor(notification.type)}`}
                        >
                          {notification.type === 'deadline' ? '⚠️ Prazo Vencido' : notification.type.replace('_', ' ')}
                        </Badge>
                        {!notification.read && (
                          <div className={`w-2 h-2 rounded-full ${
                            notification.type === 'task_completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                        )}
                      </div>
                      
                      <p className={`font-medium text-sm line-clamp-1 ${
                        notification.type === 'deadline' ? 'text-red-600' : ''
                      }`}>
                        {notification.title}
                      </p>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {notification.fromUser?.name || 'Sistema'} • {formatTime(notification.createdAt)}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate(notification.id);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  window.location.href = '/inbox';
                  setIsOpen(false);
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
