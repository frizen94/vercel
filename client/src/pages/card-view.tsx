import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function CardView() {
  const params = useParams<{ boardId: string; cardId: string }>();
  const { boardId, cardId } = params as { boardId?: string; cardId?: string };
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!boardId || !cardId) {
      toast({ title: 'Rota inválida', description: 'Board ou card inválido', variant: 'destructive' });
      navigate('/');
      return;
    }

    // Navega para a rota do board existente (frontend usa /board/:id)
    navigate(`/board/${boardId}`);

    // Aguarda um pouco para garantir que o BoardPage monte e registre o listener
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('open-card-modal', { detail: { cardId: Number(cardId) } }));
      } catch (err) {
        console.error('Erro ao abrir modal do card via evento:', err);
      }
    }, 200);
  }, [boardId, cardId, navigate, toast]);

  return null;
}
