import { useState, useEffect } from "react";
import { useBoardContext } from "@/lib/board-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardId?: number;
  boardId: number;
}

export function PriorityManager({ isOpen, onClose, cardId, boardId }: Props) {
  let boardCtx: any;
  try { boardCtx = useBoardContext(); } catch (e) { boardCtx = undefined; }
  const { toast } = useToast();

  const [priorities, setPriorities] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#FF9800');
  const [selectedPriorityId, setSelectedPriorityId] = useState<number | null>(null);

  const fetchPriorities = async (bId: number) => {
    try {
      let data;
      if (boardCtx) {
        data = await boardCtx.fetchPriorities(bId);
      } else {
        data = await apiRequest('GET', `/api/boards/${bId}/priorities`);
      }
      setPriorities(data || []);
      return data || [];
    } catch (err) {
      console.error('fetchPriorities error', err);
      return [];
    }
  };

  useEffect(() => {
    if (boardId && isOpen) fetchPriorities(boardId);
  }, [boardId, isOpen]);

  useEffect(() => {
    if (cardId) {
      (async () => {
        try {
          const cp = await apiRequest('GET', `/api/cards/${cardId}/priority`);
          if (cp && cp.priorityId) setSelectedPriorityId(cp.priorityId);
        } catch (err) {
          console.error('Error fetching card priority', err);
        }
      })();
    }
  }, [cardId]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      let created;
      if (boardCtx) {
        created = await boardCtx.createPriority(name.trim(), color, boardId);
      } else {
        created = await apiRequest('POST', '/api/priorities', { name: name.trim(), color, boardId });
      }
      setPriorities(prev => [...prev, created]);
      setName('');
      toast({ title: 'Prioridade criada' });
    } catch (err) {
      console.error('Error creating priority', err);
      toast({ title: 'Erro', description: 'Falha ao criar prioridade', variant: 'destructive' });
    }
  };

  const applyPriorityToCard = async (priorityId: number | null) => {
    if (!cardId) return;
    try {
      if (priorityId === null) {
        if (boardCtx) {
          await boardCtx.removeCardPriority(cardId);
        } else {
          await apiRequest('DELETE', `/api/cards/${cardId}/priority`);
        }
        setSelectedPriorityId(null);
        toast({ title: 'Prioridade removida' });
        return;
      }
      if (boardCtx) {
        await boardCtx.setCardPriority(cardId, priorityId);
      } else {
        await apiRequest('POST', '/api/card-priorities', { cardId, priorityId });
      }
      setSelectedPriorityId(priorityId);
      toast({ title: 'Prioridade aplicada' });
    } catch (err) {
      console.error('Error applying priority', err);
      toast({ title: 'Erro', description: 'Falha ao aplicar prioridade', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>Prioridades</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm">Nome</label>
            <Input value={name} onChange={(e:any) => setName(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm">Cor</label>
            <input type="color" value={color} onChange={(e:any) => setColor(e.target.value)} className="w-12 h-8" />
          </div>
          <div className="mb-4">
            <Button onClick={handleCreate} className="w-full">Criar prioridade</Button>
          </div>

          <div className="space-y-2">
            {priorities.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded" style={{ backgroundColor: p.color }} />
                  <div>{p.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-2 py-1 rounded ${selectedPriorityId === p.id ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                    onClick={() => {
                      // If this priority is already selected, remove it; otherwise apply it
                      if (selectedPriorityId === p.id) {
                        applyPriorityToCard(null);
                      } else {
                        applyPriorityToCard(p.id);
                      }
                    }}
                  >
                    {selectedPriorityId === p.id ? 'Remover' : 'Aplicar'}
                  </button>
                  <button className="px-2 py-1 text-sm text-red-600" onClick={async () => {
                    try {
                      await apiRequest('DELETE', `/api/priorities/${p.id}`);
                      setPriorities(prev => prev.filter(x => x.id !== p.id));
                      if (selectedPriorityId === p.id) setSelectedPriorityId(null);
                    } catch (err) {
                      console.error('Error deleting priority', err);
                      toast({ title: 'Erro', description: 'Não foi possível excluir prioridade', variant: 'destructive' });
                    }
                  }}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
