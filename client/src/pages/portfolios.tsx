
import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Folder, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Eye,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useBoard } from "@/lib/board-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
  portfolioId?: number;
}

export default function Portfolios() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  });

  // Buscar portfólios
  const { data: portfolios = [], isLoading: isLoadingPortfolios } = useQuery<Portfolio[]>({
    queryKey: ['/api/portfolios'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/portfolios');
      if (!res.ok) {
        throw new Error('Falha ao buscar portfólios');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  // Buscar quadros para contar projetos em cada portfólio
  const { data: boards = [] } = useQuery<Board[]>({
    queryKey: ['/api/boards'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/boards');
      if (!res.ok) {
        throw new Error('Falha ao buscar boards');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  // Tentar usar os quadros do board-context (mesmo que a sidebar) para manter as contagens consistentes
  let ctxBoards: Board[] = [];
  let ctxFetchBoards = async () => {};
  try {
    const ctx = useBoard();
    ctxBoards = ctx.boards || [];
    ctxFetchBoards = ctx.fetchBoards;
  } catch (err) {
    // ignore if board context isn't available
  }

  // Garantir que o board-context tenha carregado os quadros (a sidebar/outros lugares dependem disso)
  React.useEffect(() => {
    if (ctxFetchBoards) {
      try {
        ctxFetchBoards();
      } catch (e) {
        // ignore
      }
    }
  }, [ctxFetchBoards]);

  // Mutation para criar portfólio
  const { mutate: createPortfolio, isPending: isCreating } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/portfolios", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao criar portfólio');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Portfólio criado",
        description: "Seu portfólio foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o portfólio.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar portfólio
  const { mutate: updatePortfolio, isPending: isUpdating } = useMutation({
    mutationFn: async (data: { id: number; updates: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/portfolios/${data.id}`, data.updates);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Portfólio atualizado",
        description: "Seu portfólio foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o portfólio.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir portfólio
  const { mutate: deletePortfolio } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/portfolios/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Portfólio excluído",
        description: "O portfólio foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o portfólio.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6"
    });
    setSelectedPortfolio(null);
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do portfólio é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    createPortfolio(formData);
  };

  const handleUpdate = () => {
    if (!selectedPortfolio || !formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do portfólio é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    updatePortfolio({ id: selectedPortfolio.id, updates: formData });
  };

  const handleEdit = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setFormData({
      name: portfolio.name,
      description: portfolio.description || "",
      color: portfolio.color
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (portfolio: Portfolio) => {
    if (confirm(`Tem certeza que deseja excluir o portfólio "${portfolio.name}"? Esta ação não pode ser desfeita.`)) {
      deletePortfolio(portfolio.id);
    }
  };

  const getProjectCount = (portfolioId: number) => {
    const source = (ctxBoards && ctxBoards.length > 0) ? ctxBoards : boards;
    return source.filter(board => board.portfolioId === portfolioId).length;
  };

  if (isLoadingPortfolios) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando portfólios...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfólios</h1>
          <p className="text-muted-foreground">Organize seus projetos em portfólios</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Portfólio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Portfólio</DialogTitle>
              <DialogDescription>
                Crie um portfólio para organizar seus projetos relacionados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Portfólio</Label>
                <Input
                  id="name"
                  placeholder="Ex: Marketing Digital"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo deste portfólio..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="color">Cor</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-8 p-0 border rounded"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Portfólio"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!Array.isArray(portfolios) || portfolios.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum portfólio ainda</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro portfólio para organizar seus projetos
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Portfólio
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: portfolio.color }}
                    />
                    <div>
                      <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3" />
                        {portfolio.username || 'Você'}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/portfolios/${portfolio.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Projetos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(portfolio)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(portfolio)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {portfolio.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {portfolio.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {getProjectCount(portfolio.id)} projeto(s)
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(portfolio.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                >
                  Ver Projetos
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Portfólio</DialogTitle>
            <DialogDescription>
              Atualize as informações do seu portfólio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome do Portfólio</Label>
              <Input
                id="edit-name"
                placeholder="Ex: Marketing Digital"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição (opcional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Descreva o objetivo deste portfólio..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-8 p-0 border rounded"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
