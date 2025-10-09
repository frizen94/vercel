import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Filter, Eye, Calendar, User, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: number;
  userId?: number;
  sessionId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldData?: string;
  newData?: string;
  metadata?: string;
  timestamp: string;
  user?: {
    id: number;
    name: string;
    username: string;
  };
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  READ: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  UPDATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const entityTypeLabels: Record<string, string> = {
  user: "Usuário",
  board: "Quadro",
  card: "Cartão",
  list: "Lista",
  checklist: "Checklist",
  checklistItem: "Item de Checklist",
  comment: "Comentário",
  label: "Etiqueta",
  notification: "Notificação",
  portfolio: "Portfólio",
};

export function AuditLogs() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Redirect non-admins
  React.useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch audit logs
  const { data, isLoading, error } = useQuery<AuditLogsResponse>({
    queryKey: ['/api/admin/audit-logs', { 
      page, 
      limit, 
      search: searchTerm || undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter !== "all") params.append('action', actionFilter);
      if (entityTypeFilter !== "all") params.append('entityType', entityTypeFilter);
      
      const response = await apiRequest('GET', `/api/admin/audit-logs?${params.toString()}`);
      return response.json();
    },
    enabled: !!user && user.role === "admin",
    staleTime: 30 * 1000, // 30 segundos
  });

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
  };

  const handleReset = () => {
    setSearchTerm("");
    setActionFilter("all");
    setEntityTypeFilter("all");
    setPage(1);
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  const parseJsonSafely = (jsonString?: string) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  if (user?.role !== "admin") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Erro ao carregar logs de auditoria. Tente novamente.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="CREATE">Criação</SelectItem>
                <SelectItem value="READ">Leitura</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                {Object.entries(entityTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleReset}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Resultados ({total} {total === 1 ? 'log' : 'logs'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log de auditoria encontrado.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {log.user?.name || "Sistema"}
                            </div>
                            {log.user?.username && (
                              <div className="text-xs text-muted-foreground">
                                @{log.user.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={actionColors[log.action] || "bg-gray-100 text-gray-800"}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {entityTypeLabels[log.entityType] || log.entityType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.entityId || "-"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.ipAddress || "-"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
            <DialogDescription>
              Informações completas sobre a operação registrada.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">ID do Log</h4>
                  <p className="text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Data/Hora</h4>
                  <p className="text-sm">
                    {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Usuário</h4>
                  <p className="text-sm">
                    {selectedLog.user ? `${selectedLog.user.name} (@${selectedLog.user.username})` : "Sistema"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Ação</h4>
                  <Badge className={actionColors[selectedLog.action] || "bg-gray-100 text-gray-800"}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Entidade</h4>
                  <p className="text-sm">{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">ID da Entidade</h4>
                  <p className="text-sm">{selectedLog.entityId || "-"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Endereço IP</h4>
                  <p className="text-sm font-mono">{selectedLog.ipAddress || "-"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">ID da Sessão</h4>
                  <p className="text-sm font-mono">{selectedLog.sessionId || "-"}</p>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">User Agent</h4>
                  <p className="text-xs bg-muted p-2 rounded font-mono break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {selectedLog.oldData && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Dados Anteriores</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(parseJsonSafely(selectedLog.oldData), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Dados Novos</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(parseJsonSafely(selectedLog.newData), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Metadados</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(parseJsonSafely(selectedLog.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}