import { useState, useEffect } from "react";
import { useBoardContext } from "@/lib/board-context";
import { Label } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  // Try to get board context; in dev HMR the component can mount outside provider.
   // Tenta obter o contexto do board; em HMR/desenvolvimento o componente pode ser montado fora do provider.
  let boardCtx: any;
  try {
    boardCtx = useBoardContext();
  } catch (err) {
    boardCtx = undefined;
    // Use import.meta.env.DEV which is provided by Vite instead of process.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) console.warn('LabelManager: board context not available, falling back to API calls.', err);
  }
  const { toast } = useToast();

  // Local fallbacks
   // Fallbacks locais
  const [localLabels, setLocalLabels] = useState<Label[]>([]);
  const [localCardLabels, setLocalCardLabels] = useState<{ [cardId: number]: Label[] }>({});

  // Wrappers seguros para a API
   // Wrappers seguros para chamadas à API
  const safeFetchLabels = async (bId: number) => {
    try {
      const data = await apiRequest('GET', `/api/boards/${bId}/labels`);
      setLocalLabels(data || []);
      return data || [];
    } catch (err) {
      console.error('safeFetchLabels error', err);
      return [];
    }
  };

  const safeCreateLabel = async (name: string, color: string, bId: number) => {
    const created = await apiRequest('POST', '/api/labels', { name, color, boardId: bId });
    setLocalLabels(prev => [...prev, created]);
    return created;
  };

  const safeUpdateLabel = async (id: number, updates: { name?: string; color?: string }) => {
    const updated = await apiRequest('PATCH', `/api/labels/${id}`, updates);
    setLocalLabels(prev => prev.map(l => l.id === id ? updated : l));
    return updated;
  };

  const safeDeleteLabel = async (id: number) => {
    await apiRequest('DELETE', `/api/labels/${id}`);
    setLocalLabels(prev => prev.filter(l => l.id !== id));
    setLocalCardLabels(prev => {
      const next: any = {};
      for (const k of Object.keys(prev)) {
        next[Number(k)] = prev[Number(k)].filter((lbl: Label) => lbl.id !== id);
      }
      return next;
    });
    return true;
  };

  const safeFetchCardLabels = async (cId: number) => {
    try {
      const data = await apiRequest('GET', `/api/cards/${cId}/labels`);
  // normalizar dados quando necessário
      // normalizar dados quando necessário
      if (Array.isArray(data) && data.length > 0 && data[0].labelId !== undefined) {
        const mapped = data.map((cl: any) => (boardCtx?.labels || localLabels).find((l: Label) => l.id === cl.labelId)).filter(Boolean) as Label[];
        setLocalCardLabels(prev => ({ ...prev, [cId]: mapped }));
        return mapped;
      }
      setLocalCardLabels(prev => ({ ...prev, [cId]: data }));
      return data;
    } catch (err) {
      console.error('safeFetchCardLabels error', err);
      return [];
    }
  };

  const safeAddLabelToCard = async (cId: number, labelId: number) => {
    await apiRequest('POST', '/api/card-labels', { cardId: cId, labelId });
    const labelObj = (boardCtx?.labels || localLabels).find((l: Label) => l.id === labelId);
    if (labelObj) setLocalCardLabels(prev => ({ ...prev, [cId]: [...(prev[cId] || []), labelObj] }));
  };

  const safeRemoveLabelFromCard = async (cId: number, labelId: number) => {
    await apiRequest('DELETE', `/api/cards/${cId}/labels/${labelId}`);
    setLocalCardLabels(prev => ({ ...prev, [cId]: (prev[cId] || []).filter(l => l.id !== labelId) }));
  };

  // Expose variables used by the component (either from context or safe wrappers)
   // Expõe as variáveis usadas pelo componente (vindas do contexto ou dos wrappers seguros)
  const labels = boardCtx?.labels ?? localLabels;
  const cardLabels = boardCtx?.cardLabels ?? localCardLabels;
  const fetchLabels = boardCtx?.fetchLabels ?? safeFetchLabels;
  const createLabel = boardCtx?.createLabel ?? safeCreateLabel;
  const updateLabel = boardCtx?.updateLabel ?? safeUpdateLabel;
  const deleteLabel = boardCtx?.deleteLabel ?? safeDeleteLabel;
  const fetchCardLabels = boardCtx?.fetchCardLabels ?? safeFetchCardLabels;
  const addLabelToCard = boardCtx?.addLabelToCard ?? safeAddLabelToCard;
  const removeLabelFromCard = boardCtx?.removeLabelFromCard ?? safeRemoveLabelFromCard;
  
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);
  const [currentCardLabels, setCurrentCardLabels] = useState<Label[]>([]);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [view, setView] = useState<"list" | "create">("list");
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(LABEL_COLORS[0].value);
  const [confirmDeleteLabel, setConfirmDeleteLabel] = useState<Label | null>(null);
  // confirmação agora usa Dialog estilizado em vez de controles inline
  // confirmação agora usa Dialog estilizado em vez de controles inline
  
  // Carregar etiquetas do quadro - somente se não estiverem já carregadas
  useEffect(() => {
    if (boardId && isOpen && labels.length === 0) {
      fetchLabels(boardId);
    }
  }, [boardId, isOpen, labels.length, fetchLabels]);
  
  // Carregar etiquetas do cartão (se cardId for fornecido) - usa dados do cache quando possível
  useEffect(() => {
    if (cardId && isOpen) {
      // Primeiro tenta usar os dados já em cache
      if (cardLabels[cardId]) {
        setCurrentCardLabels(cardLabels[cardId]);
      } else {
        // Só faz fetch se não houver dados em cache
        const loadCardLabels = async () => {
          const fetchedLabels = await fetchCardLabels(cardId);
          setCurrentCardLabels(fetchedLabels);
        };
        loadCardLabels();
      }
    }
  }, [cardId, isOpen, cardLabels, fetchCardLabels]);
  
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
          <DialogDescription className="sr-only">Gerencie etiquetas deste quadro: adicione, edite ou remova etiquetas.</DialogDescription>
        </DialogHeader>
        
        {view === "list" ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {cardId ? "Selecione etiquetas para adicionar a este cartão:" : "Etiquetas disponíveis neste quadro:"}
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {labels.length > 0 ? (
                  labels.map((label: Label) => (
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
                                let updatedLabel: any;
                                if (typeof updateLabel === 'function') {
                                  updatedLabel = await updateLabel(label.id, { name: editName.trim(), color: editColor });
                                } else {
                                  // Fallback to direct API call when context method is unavailable
                                  updatedLabel = await apiRequest('PATCH', `/api/labels/${label.id}`, { name: editName.trim(), color: editColor });
                                  // Atualizar estado local quando não está usando contexto
                                  setLocalLabels(prev => prev.map(l => l.id === label.id ? updatedLabel : l));
                                }
                                
                                // Atualizar currentCardLabels se esta label está no card atual
                                if (cardId && currentCardLabels.some(l => l.id === label.id)) {
                                  setCurrentCardLabels(prev => prev.map(l => 
                                    l.id === label.id ? { ...l, name: editName.trim(), color: editColor } : l
                                  ));
                                }
                                
                                toast({ title: 'Etiqueta atualizada', description: `Etiqueta "${editName.trim()}" atualizada.` });
                                setEditingLabelId(null);
                              } catch (err) {
                                console.error('Erro ao atualizar etiqueta', err);
                                toast({ title: 'Erro', description: 'Não foi possível atualizar a etiqueta.', variant: 'destructive' });
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
                          <button title="Excluir etiqueta" className="p-2 text-red-500 hover:text-red-700 rounded" onClick={() => {
                           // Abre diálogo de confirmação estilizado
                             // Abre o diálogo de confirmação estilizado
                            setConfirmDeleteLabel(label);
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>
                          </button>
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
  {/* Diálogo de confirmação para excluir uma etiqueta */}
      <Dialog open={!!confirmDeleteLabel} onOpenChange={(open) => { if (!open) setConfirmDeleteLabel(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>Deseja realmente excluir a etiqueta "{confirmDeleteLabel?.name}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <div className="w-full flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteLabel(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={async () => {
                if (!confirmDeleteLabel) return;
                try {
                  // Usa preferencialmente deleteLabel do contexto quando disponível
                  if (typeof deleteLabel === 'function') {
                    await deleteLabel(confirmDeleteLabel.id);
                  } else {
                    // Fallback: chama a API diretamente se o método do contexto não estiver presente (casos HMR/edge)
                    await apiRequest('DELETE', `/api/labels/${confirmDeleteLabel.id}`);
                  }
                  toast({ title: 'Etiqueta excluída', description: `Etiqueta "${confirmDeleteLabel.name}" removida.` });
                } catch (err) {
                  console.error('Erro ao deletar etiqueta', err);
                  toast({ title: 'Erro', description: 'Não foi possível excluir a etiqueta.', variant: 'destructive' });
                } finally {
                  setConfirmDeleteLabel(null);
                }
              }}>Excluir</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}