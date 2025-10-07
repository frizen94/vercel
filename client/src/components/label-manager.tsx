import { useState, useEffect } from "react";
import { useBoardContext } from "@/lib/board-context";
import { Label } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: number;
  boardId: number;
}

// Lista de cores disponíveis para etiquetas
const LABEL_COLORS = [
  { name: "Verde", value: "#4CAF50" },
  { name: "Amarelo", value: "#FFC107" },
  { name: "Laranja", value: "#FF9800" },
  { name: "Vermelho", value: "#F44336" },
  { name: "Roxo", value: "#9C27B0" },
  { name: "Azul", value: "#2196F3" },
  { name: "Azul Claro", value: "#03A9F4" },
  { name: "Ciano", value: "#00BCD4" },
  { name: "Verde-água", value: "#009688" },
  { name: "Rosa", value: "#E91E63" }
];

export function LabelManager({ isOpen, onClose, cardId, boardId }: LabelManagerProps) {
  const { 
    labels, 
    cardLabels, 
    fetchLabels, 
    createLabel, 
    addLabelToCard, 
    removeLabelFromCard,
    fetchCardLabels,
    updateLabel,
    deleteLabel
  } = useBoardContext();
  
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);
  const [currentCardLabels, setCurrentCardLabels] = useState<Label[]>([]);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [view, setView] = useState<"list" | "create">("list");
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(LABEL_COLORS[0].value);
  const [deletingLabelId, setDeletingLabelId] = useState<number | null>(null);
  
  // Carregar etiquetas do quadro
  useEffect(() => {
    if (boardId && isOpen) {
      fetchLabels(boardId);
    }
  }, [boardId, isOpen, fetchLabels]);
  
  // Carregar etiquetas do cartão (se cardId for fornecido)
  useEffect(() => {
    if (cardId && isOpen) {
      const loadCardLabels = async () => {
        const fetchedLabels = await fetchCardLabels(cardId);
        setCurrentCardLabels(fetchedLabels);
      };
      
      loadCardLabels();
    }
  }, [cardId, isOpen, fetchCardLabels]);
  
  // Atualizar labels do cartão quando cardLabels mudar
  useEffect(() => {
    if (cardId && cardLabels[cardId]) {
      setCurrentCardLabels(cardLabels[cardId]);
    }
  }, [cardId, cardLabels]);
  
  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !selectedColor) return;
    
    setIsCreatingLabel(true);
    try {
      await createLabel(newLabelName.trim(), selectedColor, boardId);
      setNewLabelName("");
      setSelectedColor(LABEL_COLORS[0].value);
      setView("list");
    } catch (error) {
      console.error("Error creating label:", error);
    } finally {
      setIsCreatingLabel(false);
    }
  };
  
  const toggleLabelOnCard = async (label: Label) => {
    if (!cardId) return;
    
    const isLabelApplied = currentCardLabels.some(l => l.id === label.id);
    
    try {
      if (isLabelApplied) {
        // Remover etiqueta
        await removeLabelFromCard(cardId, label.id);
        // Atualizar estado local imediatamente
        setCurrentCardLabels(prev => prev.filter(l => l.id !== label.id));
      } else {
        // Verificar novamente se a etiqueta já não foi adicionada
        const doubleCheck = currentCardLabels.some(l => l.id === label.id);
        if (!doubleCheck) {
          // Adicionar etiqueta
          await addLabelToCard(cardId, label.id);
          // Atualizar estado local imediatamente
          setCurrentCardLabels(prev => [...prev, label]);
        }
      }
    } catch (error) {
      console.error("Error toggling label on card:", error);
      
      // Reverter mudanças locais em caso de erro
      const cardLabelsFromContext = cardLabels[cardId] || [];
      setCurrentCardLabels(cardLabelsFromContext);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-white max-w-2xl max-h-[72vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {view === "list" ? "Etiquetas" : "Criar etiqueta"}
          </DialogTitle>
        </DialogHeader>
        
        {view === "list" ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {cardId ? "Selecione etiquetas para adicionar a este cartão:" : "Etiquetas disponíveis neste quadro:"}
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {labels.length > 0 ? (
                  labels.map(label => (
                    <div key={label.id} className="group flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-2 rounded hover:bg-gray-50 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-4 rounded border flex-shrink-0" style={{ backgroundColor: label.color }} />
                        {!editingLabelId || editingLabelId !== label.id ? (
                          <span className="text-sm truncate min-w-0">{label.name}</span>
                        ) : null}
                      </div>

                      {editingLabelId === label.id ? (
                        <div className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-0 sm:px-4 min-w-0">
                          <input
                            className="w-full sm:flex-1 border rounded px-3 py-2 text-sm min-w-0 bg-white"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <div className="relative w-6 h-6">
                              <div className="w-6 h-6 rounded border" style={{ backgroundColor: editColor }} aria-hidden />
                              <input
                                id={`color-picker-${label.id}`}
                                type="color"
                                value={editColor}
                                onChange={(e) => setEditColor((e.target as HTMLInputElement).value)}
                                className="absolute inset-0 w-6 h-6 opacity-0 cursor-pointer"
                                title="Abrir seletor de cores"
                              />
                            </div>
                            <input type="text" value={editColor} onChange={(e) => setEditColor((e.target as HTMLInputElement).value)} className="w-20 sm:w-28 text-sm border rounded px-2 py-1 bg-white" aria-label="Cor (hex)" />
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button aria-label="Salvar etiqueta" title="Salvar" className="px-2 py-1 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                              if (!editName.trim()) return;
                              try {
                                await updateLabel(label.id, { name: editName.trim(), color: editColor });
                                if (boardId) await fetchLabels(boardId);
                                setEditingLabelId(null);
                              } catch (err) {
                                console.error('Erro ao atualizar etiqueta', err);
                              }
                            }}>Salvar</button>
                            <button aria-label="Cancelar edição" title="Cancelar" className="px-2 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => setEditingLabelId(null)}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {cardId && (
                            <Button variant={currentCardLabels.some(l => l.id === label.id) ? "default" : "outline"} size="sm" onClick={() => toggleLabelOnCard(label)} className="!px-3 mr-2">{currentCardLabels.some(l => l.id === label.id) ? "Remover" : "Adicionar"}</Button>
                          )}
                          <button title="Editar etiqueta" className="p-2 text-gray-500 hover:text-gray-700 rounded" onClick={() => { setEditingLabelId(label.id); setEditName(label.name); setEditColor(label.color || LABEL_COLORS[0].value); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                          </button>
                          {deletingLabelId === label.id ? (
                            <div className="flex items-center gap-1">
                              <button aria-label="Confirmar exclusão" title="Excluir etiqueta" className="px-2 py-1 text-sm rounded text-white bg-red-600 hover:bg-red-700" onClick={async () => { try { await deleteLabel(label.id); if (boardId) await fetchLabels(boardId); setDeletingLabelId(null); } catch (err) { console.error('Erro ao deletar etiqueta', err); } }}>Excluir</button>
                              <button aria-label="Cancelar exclusão" title="Cancelar" className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => setDeletingLabelId(null)}>Cancelar</button>
                            </div>
                          ) : (
                            <button title="Excluir etiqueta" className="p-2 text-red-500 hover:text-red-700 rounded" onClick={() => setDeletingLabelId(label.id)}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Nenhuma etiqueta criada ainda.
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => setView("create")}
            >
              Criar nova etiqueta
            </Button>
          </>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da etiqueta
              </label>
              <Input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Digite o nome da etiqueta"
                className="mb-3"
              />
              
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <div className="w-8 h-8 rounded border" style={{ backgroundColor: selectedColor }} aria-hidden />
                    <input
                      id="new-color-picker"
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor((e.target as HTMLInputElement).value)}
                      className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                      title="Abrir seletor de cores"
                    />
                  </div>
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor((e.target as HTMLInputElement).value)}
                    className="w-28 text-sm border rounded px-2 py-1 bg-white"
                    aria-label="Cor (hex)"
                  />
                </div>
                {/* removed color palette grid: kept only swatch + hex input per request */}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setView("list")}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateLabel}
                disabled={!newLabelName.trim() || isCreatingLabel}
              >
                {isCreatingLabel ? "Criando..." : "Criar etiqueta"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}