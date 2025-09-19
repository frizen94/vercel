
import { Board } from "@shared/schema";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Edit3, Save, X, FileText, Users, Target } from "lucide-react";
import { BoardMemberManager } from "@/components/board-member-manager";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

interface BoardOverviewProps {
  board: Board;
  onBoardUpdate: (updatedBoard: Board) => void;
}

export function BoardOverview({ board, onBoardUpdate }: BoardOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(board.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveDescription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Falha ao atualizar descrição");
      
      const updatedBoard = await response.json();
      onBoardUpdate(updatedBoard);
      setIsEditing(false);
      
      toast({
        title: "Sucesso",
        description: "Descrição do projeto atualizada!",
      });
    } catch (error) {
      console.error("Erro ao atualizar descrição:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar descrição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDescription(board.description || "");
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Descrição do Projeto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descrição do projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva os objetivos gerais e propósito deste projeto..."
                  className="min-h-[120px] resize-none"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveDescription}
                    disabled={isLoading}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {board.description ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {board.description}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    Adicione uma descrição para explicar o propósito e objetivos deste projeto.
                  </div>
                )}
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {board.description ? "Editar descrição" : "Adicionar descrição"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funções no projeto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funções no projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <BoardMemberManager boardId={board.id} />
            </div>
          </CardContent>
        </Card>

  {/* Recursos principais removed as requested */}
      </div>
    </div>
  );
}
