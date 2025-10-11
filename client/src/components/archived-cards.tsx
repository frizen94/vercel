import { useState, useEffect } from "react";
import { Card, Board } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBoardContext } from "@/lib/board-context";
import { CardModal } from "@/components/card-modal";
import { CalendarDays, Users, RotateCcw } from "lucide-react";

interface ArchivedCardsProps {
  board: Board;
}

export function ArchivedCards({ board }: ArchivedCardsProps) {
  const [archivedCards, setArchivedCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchBoardData, lists } = useBoardContext();
  const { toast } = useToast();

  // Buscar cards arquivados quando o componente carrega
  useEffect(() => {
    fetchArchivedCards();
  }, [board.id]);

  const fetchArchivedCards = async () => {
    try {
      setIsLoading(true);
      const cards = await apiRequest("GET", `/api/cards/archived?boardId=${board.id}`);
      setArchivedCards(cards);
    } catch (error) {
      console.error("Error fetching archived cards:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar cartões arquivados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCardModal = (cardId: number) => {
    console.log("Opening modal for card:", cardId);
    setSelectedCardId(cardId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCardId(null);
    // Recarregar cards arquivados caso o card tenha sido desarquivado no modal
    fetchArchivedCards();
  };

  const handleUnarchiveCard = async (cardId: number) => {
    try {
      await apiRequest("POST", `/api/cards/${cardId}/unarchive`);
      
      // Atualizar a lista local removendo o card desarquivado
      setArchivedCards(prev => prev.filter(card => card.id !== cardId));
      
      // Recarregar os dados do quadro para mostrar o card na visualização principal
      await fetchBoardData(board.id);
      
      toast({
        title: "Cartão desarquivado",
        description: "O cartão foi movido de volta para o quadro.",
      });
    } catch (error) {
      console.error("Error unarchiving card:", error);
      toast({
        title: "Erro",
        description: "Falha ao desarquivar o cartão.",
        variant: "destructive",
      });
    }
  };

  const getListName = (listId: number): string => {
    const list = lists.find(l => l.id === listId);
    return list?.title || "Lista desconhecida";
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Cartões Arquivados</h2>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cartões Arquivados</h2>
          <p className="text-gray-600">
            {archivedCards.length === 0 
              ? "Nenhum cartão foi arquivado ainda." 
              : `${archivedCards.length} cartão${archivedCards.length !== 1 ? 's' : ''} arquivado${archivedCards.length !== 1 ? 's' : ''}.`
            }
          </p>
        </div>

        {archivedCards.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="5" />
                <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                <path d="M10 12h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum cartão arquivado</h3>
            <p className="text-gray-600">
              Cartões arquivados aparecerão aqui. Use a opção "Arquivar" no menu de ações de qualquer cartão.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {archivedCards.map((card) => (
              <div key={card.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button 
                        onClick={() => handleOpenCardModal(card.id)}
                        className="text-lg font-medium text-gray-800 hover:text-blue-600 cursor-pointer transition-colors text-left"
                      >
                        {card.title}
                      </button>
                      <Badge variant="secondary" className="text-xs">
                        {getListName(card.listId)}
                      </Badge>
                    </div>
                    
                    {card.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {card.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {card.dueDate && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          <span>{new Date(card.dueDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="5" />
                          <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                          <path d="M10 12h4" />
                        </svg>
                        <span>Arquivado em {new Date(card.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUnarchiveCard(card.id)}
                    className="ml-4 flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Desarquivar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal para visualizar card arquivado */}
      <CardModal 
        cardId={selectedCardId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isArchivedView={true}
      />
    </div>
  );
}