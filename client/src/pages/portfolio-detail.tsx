
import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  ArrowLeft, 
  MoreHorizontal, 
  Edit2, 
  Copy, 
  Trash2,
  Folder,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  description?: string;
  color: string;
  portfolioId?: number;
  createdAt: string;
}

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();
  const portfolioId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [boardFormData, setBoardFormData] = useState({
    title: "",
    description: "",
    color: "#22C55E"
  });

  // Buscar dados do portfólio
  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery<Portfolio>({
    queryKey: [`/api/portfolios/${portfolioId}`],
    enabled: !!portfolioId && !isNaN(portfolioId),
  });

  // Buscar projetos do portfólio
  const { data: boards = [], isLoading: isLoadingBoards } = useQuery<Board[]>({
    queryKey: [`/api/portfolios/${portfolioId}/boards`],
    enabled: !!portfolioId && !isNaN(portfolioId),
  });

  // Mutation para criar projeto no portfólio
  const { mutate: createBoard, isPending: isCreatingBoard } = useMutation({
    mutationFn: async (data: typeof boardFormData) => {
      const res = await apiRequest("POST", "/api/boards", {
        ...data,
        portfolioId
      });
      return await res.json();
    },
    onSuccess: (newBoard: Board) => {
      toast({
        title: "Projeto criado",
        description: "Seu projeto foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${portfolioId}/boards`] });
      setIsCreateBoardModalOpen(false);
      setBoardFormData({ title: "", description: "", color: "#22C55E" });
      navigate(`/board/${newBoard.id}`);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o projeto.",
        variant: "destructive",
      });
    },
  });

  // Mutation para copiar projeto
  const { mutate: copyBoard } = useMutation({
    mutationFn: async (board: Board) => {
      const res = await apiRequest("POST", "/api/boards", {
        title: `${board.title} (Cópia)`,
        description: board.description,
        color: board.color,
        portfolioId
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Projeto copiado",
        description: "O projeto foi copiado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${portfolioId}/boards`] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o projeto.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir projeto
  const { mutate: deleteBoard } = useMutation({
    mutationFn: async (boardId: number) => {
      await apiRequest("DELETE", `/api/boards/${boardId}`);
    },
    onSuccess: () => {
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${portfolioId}/boards`] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o projeto.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBoard = () => {
    if (!boardFormData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    createBoard(boardFormData);
  };

  const handleCopyBoard = (board: Board) => {
    copyBoard(board);
  };

  const handleDeleteBoard = (board: Board) => {
    if (confirm(`Tem certeza que deseja excluir o projeto "${board.title}"? Esta ação não pode ser desfeita.`)) {
      deleteBoard(board.id);
    }
  };

  if (isNaN(portfolioId)) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">ID do portfólio inválido</h2>
          <Button onClick={() => navigate('/portfolios')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos Portfólios
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingPortfolio || isLoadingBoards) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando portfólio...</span>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Portfólio não encontrado</h2>
          <Button onClick={() => navigate('/portfolios')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos Portfólios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header do Portfólio */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/portfolios')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: portfolio.color }}
          />
          <h1 className="text-3xl font-bold tracking-tight">{portfolio.name}</h1>
        </div>
        
        {portfolio.description && (
          <p className="text-muted-foreground mb-4">{portfolio.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {portfolio.username || 'Você'}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Criado em {new Date(portfolio.createdAt).toLocaleDateString('pt-BR')}
            </div>
            <Badge variant="secondary">
              {boards.length} projeto(s)
            </Badge>
          </div>
          
          <Dialog open={isCreateBoardModalOpen} onOpenChange={setIsCreateBoardModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
                <DialogDescription>
                  Adicione um novo projeto ao portfólio "{portfolio.name}".
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="board-title">Título do Projeto</Label>
                  <Input
                    id="board-title"
                    placeholder="Ex: Website Institucional"
                    value={boardFormData.title}
                    onChange={(e) => setBoardFormData({ ...boardFormData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="board-description">Descrição (opcional)</Label>
                  <Textarea
                    id="board-description"
                    placeholder="Descreva o objetivo deste projeto..."
                    value={boardFormData.description}
                    onChange={(e) => setBoardFormData({ ...boardFormData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="board-color">Cor</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="board-color"
                      type="color"
                      value={boardFormData.color}
                      onChange={(e) => setBoardFormData({ ...boardFormData, color: e.target.value })}
                      className="w-10 h-8 p-0 border rounded"
                    />
                    <Input
                      value={boardFormData.color}
                      onChange={(e) => setBoardFormData({ ...boardFormData, color: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateBoardModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateBoard} disabled={isCreatingBoard}>
                  {isCreatingBoard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Projeto"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Projetos */}
      {boards.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum projeto ainda</h3>
          <p className="text-muted-foreground mb-4">
            Adicione seu primeiro projeto a este portfólio
          </p>
          <Button onClick={() => setIsCreateBoardModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Projeto
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card key={board.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: board.color }}
                    />
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {board.title}
                      </CardTitle>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/board/${board.id}/edit`)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyBoard(board)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteBoard(board)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent onClick={() => navigate(`/board/${board.id}`)}>
                {board.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {board.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(board.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    Abrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
