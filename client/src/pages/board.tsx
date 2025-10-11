import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Board as BoardComponent } from "@/components/board";
import { BoardHeader } from "@/components/board-header";
import { CardModal } from "@/components/card-modal";
import { BoardOverview } from "@/components/board-overview";
import { BoardList } from "@/components/board-list";
import { ArchivedCards } from "@/components/archived-cards";
import { useBoardContext } from "@/lib/board-context";
import type { Board, List } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = parseInt(id);
  const { currentBoard, fetchBoardData, isLoading } = useBoardContext();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'overview' | 'board' | 'list' | 'archived'>('overview');
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Listen for list-view requests to open a card modal
  useEffect(() => {
    const handler = (e: any) => {
      const cardId = e?.detail?.cardId;
      if (cardId) {
        setActiveCardId(cardId);
        setIsCardModalOpen(true);
      }
    };
    window.addEventListener('open-card-modal', handler as EventListener);
    return () => window.removeEventListener('open-card-modal', handler as EventListener);
  }, []);

  useEffect(() => {
    if (isNaN(boardId)) {
      toast({
        title: "Invalid Board ID",
        description: "The board ID is not valid.",
        variant: "destructive",
      });
      return;
    }

    fetchBoardData(boardId).catch((error) => {
      console.error("Error fetching board data:", error);
      toast({
        title: "Error",
        description: "Failed to load board data. Please try again.",
        variant: "destructive",
      });
    });
  }, [boardId]);

  const handleBoardUpdate = (updatedBoard: Board) => {
    // The board update will be handled by refetching data
    fetchBoardData(boardId);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] flex flex-col">
      {isLoading ? (
        <LoadingState />
      ) : !currentBoard ? (
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Board not found</h2>
            <p className="text-gray-500 mb-6">
              The board you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </div>
      ) : (
        <>
          <BoardHeader
            board={currentBoard}
            currentView={currentView}
            onViewChange={setCurrentView}
          />
          {currentView === 'overview' ? (
            <BoardOverview
              board={currentBoard}
              onBoardUpdate={handleBoardUpdate}
            />
          ) : currentView === 'board' ? (
            <BoardComponent boardId={parseInt(id || "0")} />
          ) : currentView === 'archived' ? (
            <ArchivedCards board={currentBoard} />
          ) : (
            <BoardList board={currentBoard} openCardModal={(id: number) => {
              // Reuse the Board component's modal by delegating to the parent via window event
              // The Board page already renders BoardComponent which manages its own modal.
              // For now, we open the card modal by navigating to the card route or triggering a custom event.
              // Simple approach: dispatch an event that a parent Board component can listen to.
              window.dispatchEvent(new CustomEvent('open-card-modal', { detail: { cardId: id } }));
            }} />
          )}

          {/* Card modal used by list view (board view uses its own modal inside `BoardComponent`) */}
          {activeCardId && (
            <div className="modal-backdrop">
              <CardModal
                cardId={activeCardId}
                isOpen={isCardModalOpen}
                onClose={() => { setIsCardModalOpen(false); setActiveCardId(null); }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="bg-[#0079BF]/90 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between">
            <Skeleton className="h-8 w-48 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex space-x-4 overflow-x-auto">
          <Skeleton className="h-[300px] w-[272px] rounded-md bg-gray-200" />
          <Skeleton className="h-[300px] w-[272px] rounded-md bg-gray-200" />
          <Skeleton className="h-[300px] w-[272px] rounded-md bg-gray-200" />
        </div>
      </div>
    </>
  );
}