import { Board } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { useBoardContext } from "@/lib/board-context";
import { BoardSettingsModal } from "@/components/board-settings-modal";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Users, Search, X, Eye, LayoutGrid, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoardMemberManager } from "@/components/board-member-manager";
import { useQuery } from "@tanstack/react-query";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useBoard } from "@/lib/board-context";

interface BoardHeaderProps {
  board: Board;
  currentView: 'overview' | 'board' | 'list' | 'archived';
  onViewChange: (view: 'overview' | 'board' | 'list' | 'archived') => void;
}

export function BoardHeader({ board, currentView, onViewChange }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { updateList, setCardVisibilityFilter } = useBoardContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Atualiza o filtro de visibilidade de cartões quando a consulta de pesquisa muda
    setCardVisibilityFilter(searchQuery);
  }, [searchQuery, setCardVisibilityFilter]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const { updateBoard } = useBoard();

  const [headerColor, setHeaderColor] = useState<string>(board.color || '#22C55E');

  useEffect(() => {
    setHeaderColor(board.color || '#22C55E');
  }, [board.color]);

  const handleColorChange = async (color: string) => {
    setHeaderColor(color);
    try {
      await updateBoard(board.id, { color });
    } catch (err) {
      console.error('Failed to update board color from header', err);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditing(false);
    if (title.trim() !== board.title) {
      try {
        await fetch(`/api/boards/${board.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: title.trim() }),
        });
      } catch (error) {
        console.error("Error updating board title:", error);
        setTitle(board.title);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Chamando handleTitleBlur diretamente em vez de usar blur()
      handleTitleBlur();
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 text-gray-900">
      <div className="container mx-auto px-4">
        {/* Compact header */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="p-2 text-gray-600 hover:bg-gray-100"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center" aria-label="Editar cor do quadro">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: board.color || '#22C55E' }} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headerColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-8 p-0 border rounded"
                    />
                    <input
                      type="text"
                      value={headerColor}
                      onChange={(e) => setHeaderColor(e.target.value)}
                      onBlur={() => handleColorChange(headerColor)}
                      className="w-28 p-1 border rounded text-sm"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleKeyDown}
                  className="text-lg font-semibold bg-gray-100 rounded px-2 py-1 outline-none text-gray-900"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-lg font-semibold cursor-pointer"
                  onClick={handleTitleClick}
                >
                  {board.title}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Pesquisar cartões..."
                  className="w-56 bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400"
                  autoFocus
                />
                {/* Suggestions removed: search is textual-only per user preference */}
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                className="p-2 text-gray-600 hover:bg-gray-100"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            <BoardSettingsModal board={board} onClose={() => {}} />

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-2 text-gray-600 hover:bg-gray-100"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gerenciar Membros</DialogTitle>
                </DialogHeader>
                <BoardMemberManager boardId={board.id} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Compact tabs */}
        <div className="border-t border-gray-100">
          <div className="flex space-x-1">
            <button
              onClick={() => onViewChange('overview')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentView === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Eye className="h-4 w-4 mr-2 inline" />
              Visão geral
            </button>
            <button
              onClick={() => onViewChange('board')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentView === 'board'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="h-4 w-4 mr-2 inline" />
              Quadro
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentView === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => onViewChange('archived')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentView === 'archived'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="5" />
                <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                <path d="M10 12h4" />
              </svg>
              Arquivados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
