import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useBoardContext } from "@/lib/board-context";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Portfolio {
  id: number;
  name: string;
  color: string;
}

export default function BoardNew() {
  const { createBoard } = useBoardContext();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string>('#22C55E');
  const [portfolioId, setPortfolioId] = useState<string>("none");
  const [isCreating, setIsCreating] = useState(false);

  // Buscar portfólios do usuário
  const { data: portfolios = [] } = useQuery<Portfolio[]>({
    queryKey: ['/api/portfolios'],
    enabled: !!user,
  });

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      toast({ title: "Erro", description: "O título do quadro não pode estar vazio.", variant: "destructive" });
      return;
    }
    try {
      setIsCreating(true);
      const boardData = { 
        title, 
        color,
        ...(portfolioId && { portfolioId: parseInt(portfolioId) })
      };
      const newBoard = await createBoard(boardData);
      toast({ title: "Quadro criado", description: "Seu quadro foi criado.", });
      navigate(`/board/${newBoard.id}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao criar quadro.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Criar novo quadro</CardTitle>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input id="title" placeholder="Título do quadro" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="portfolio">Portfólio (opcional)</Label>
                <Select value={portfolioId} onValueChange={setPortfolioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um portfólio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum portfólio</SelectItem>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: portfolio.color }}
                          />
                          {portfolio.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color">Cor do projeto</Label>
                <div className="flex items-center gap-2">
                  <input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 p-0 border rounded" />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-full" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
