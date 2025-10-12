import { useEffect, useState, FormEvent } from "react";
import { Card as CardType, List as ListType, Comment as CommentType, User } from "@shared/schema";
import { useBoardContext } from "@/lib/board-context";
import { useAuth } from "@/hooks/use-auth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogClose 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import DescriptionEditor from '@/components/description-editor';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LabelManager } from "@/components/label-manager";
import { PriorityManager } from "@/components/priority-manager";
import { MemberManager } from "@/components/member-manager";
import { ChecklistManager } from "@/components/checklist-manager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface CardModalProps {
  cardId: number | null;
  isOpen: boolean;
  onClose: () => void;
  isArchivedView?: boolean; // Para indicar se está visualizando um card arquivado
}

export function CardModal({ cardId, isOpen, onClose, isArchivedView = false }: CardModalProps) {
  const { 
    cards, 
    lists, 
    comments,
    cardLabels,
    cardMembers,
    updateCard, 
    deleteCard,
    createCard,
    fetchComments,
    createComment,
    deleteComment,
    currentBoard,
    fetchBoardData
  } = useBoardContext();
  const {
    addLabelToCard,
    addMemberToCard,
    fetchChecklists,
    fetchChecklistItems,
    createChecklist,
    createChecklistItem,
    updateChecklistItem,
  } = useBoardContext();

  // also read priorities mapping from board context
  const { cardPriorities, fetchCardPriority } = useBoardContext();

  const { user } = useAuth();
  const { toast } = useToast();

  const [card, setCard] = useState<CardType | null>(null);
  const [list, setList] = useState<ListType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentUserName, setCommentUserName] = useState("");
  const [cardComments, setCardComments] = useState<CommentType[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isPriorityManagerOpen, setIsPriorityManagerOpen] = useState(false);
  const [isChecklistManagerOpen, setIsChecklistManagerOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<string>(''); // String no formato YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(''); // String no formato YYYY-MM-DD
  const [showDurationDialog, setShowDurationDialog] = useState(false);
  const { checklists, checklistItems } = useBoardContext();

  // Set initial username from auth context
  useEffect(() => {
    if (user) {
      setCommentUserName(user.name || user.username);
    } else {
      setCommentUserName("Usuário");
    }
  }, [user]);

  useEffect(() => {
    if (cardId) {
      if (isArchivedView) {
        // Para cards arquivados, buscar diretamente da API
        loadArchivedCard(cardId);
      } else {
        // Para cards ativos, buscar do estado do contexto
        for (const [listId, listCards] of Object.entries(cards)) {
          const foundCard = listCards.find(c => c.id === cardId);
          if (foundCard) {
            setCard(foundCard);
            setTitle(foundCard.title);
            setDescription(foundCard.description || "");

            const foundList = lists.find(l => l.id === parseInt(listId));
            if (foundList) {
              setList(foundList);
            }

            // Load comments for this card
            loadComments(cardId);

            // lazy-load priority mapping for this card (so the badge shows in the Priority section)
            if (fetchCardPriority) {
              try {
                // only fetch if mapping not present yet
                // note: board-context stores null when there's no priority
                // so check for undefined
                const existing = (cardPriorities as any) && (cardPriorities as any)[cardId];
                if (typeof existing === 'undefined') {
                  fetchCardPriority(cardId).catch(() => {});
                }
              } catch (e) {
                // ignore
              }
            }

            break;
          }
        }
      }
    }
  }, [cardId, cards, lists, isArchivedView]);

  // Load comments for a card (excluding subtask comments)
  const loadComments = async (cardId: number) => {
    try {
      const loadedComments = await fetchComments(cardId);
      // Filter out comments that belong to subtasks
      const cardOnlyComments = loadedComments.filter(comment => !comment.checklistItemId);
      setCardComments(cardOnlyComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  // Load archived card data directly from API
  const loadArchivedCard = async (cardId: number) => {
    try {
      const cardData = await apiRequest("GET", `/api/cards/${cardId}`);
      setCard(cardData);
      setTitle(cardData.title);
      setDescription(cardData.description || "");

      // Find the list for this card
      const foundList = lists.find(l => l.id === cardData.listId);
      if (foundList) {
        setList(foundList);
      }

      // Load comments for this card
      loadComments(cardId);
    } catch (error) {
      console.error("Error loading archived card:", error);
    }
  };

  // Update cardComments when comments in context change (excluding subtask comments)
  useEffect(() => {
    if (cardId && comments[cardId]) {
      // Filter out comments that belong to subtasks
      const cardOnlyComments = comments[cardId].filter(comment => !comment.checklistItemId);
      setCardComments(cardOnlyComments);
    }
  }, [cardId, comments]);

  const handleTitleSave = async () => {
    if (!card) return;

    if (title.trim() !== card.title) {
      try {
        await updateCard(card.id, { title: title.trim() });
      } catch (error) {
        console.error("Error updating card title:", error);
        setTitle(card.title);
      }
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = async () => {
    if (!card) return;

    try {
      await updateCard(card.id, { description: description.trim() });
    } catch (error) {
      console.error("Error updating card description:", error);
      setDescription(card.description || "");
    }
    setIsEditingDescription(false);
  };

  const handleDeleteCard = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteCard = async () => {
    if (!card) return;

    try {
      await deleteCard(card.id);
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error("Error deleting card:", error);
      setShowDeleteDialog(false);
    }
  };

  const handleArchiveCard = async () => {
    if (!card || !currentBoard) return;

    try {
      await apiRequest("POST", `/api/cards/${card.id}/archive`);
      
      // Recarregar os dados do quadro para remover o card da visualização
      await fetchBoardData(currentBoard.id);
      
      toast({
        title: "Cartão arquivado",
        description: "O cartão foi arquivado com sucesso.",
      });
      onClose();
    } catch (error) {
      console.error("Error archiving card:", error);
      toast({
        title: "Erro",
        description: "Falha ao arquivar o cartão.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();

    if (!card || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await createComment(commentText.trim(), card.id, commentUserName);
      setCommentText("");
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentDialog(true);
  };

  // Deep copy handler: copia o cartão inteiro exceto anexos e comentários
  const handleDeepCopy = async () => {
    if (!card || !list) return;

    try {
      const titleCopy = `${card.title} (Cópia)`;
      // Cria o novo cartão na mesma lista
      const newCard = await createCard(titleCopy, list.id);

      // Atualiza campos adicionais (descrição, dueDate, completed)
      const updates: any = {};
      if (card.description) updates.description = card.description;
      if (card.dueDate) updates.dueDate = card.dueDate;
      if (typeof (card as any).completed !== 'undefined') updates.completed = (card as any).completed;

      if (Object.keys(updates).length > 0) {
        await updateCard(newCard.id, updates);
      }

      // Copiar etiquetas
      const labelsToCopy = cardLabels[card.id] || [];
      for (const lbl of labelsToCopy) {
        try {
          await addLabelToCard(newCard.id, lbl.id);
        } catch (err) {
          console.warn('Erro ao adicionar etiqueta na cópia:', err);
        }
      }

      // Copiar membros
      const membersToCopy = cardMembers[card.id] || [];
      for (const m of membersToCopy) {
        try {
          await addMemberToCard(newCard.id, m.id);
        } catch (err) {
          console.warn('Erro ao adicionar membro na cópia:', err);
        }
      }

      // Copiar checklists e itens (mantendo hierarquia)
      try {
        const originalChecklists = await fetchChecklists(card.id);
        for (const cl of originalChecklists) {
          const newChecklist = await createChecklist(cl.title, newCard.id);
          const items = await fetchChecklistItems(cl.id);

          // Map antigoId -> novoId para parentItemId
          const idMap: Record<number, number> = {};

          // Primeiro passe: criar itens na ordem e tentar atribuir parent quando possível
          for (const item of items) {
            const options: any = { completed: item.completed ?? false };
            if (item.parentItemId) {
              // se o parent já foi mapeado, passe id novo; caso contrário, omitimos e atualizamos depois
              if (idMap[item.parentItemId]) options.parentItemId = idMap[item.parentItemId];
            }

            const created = await createChecklistItem(item.content, newChecklist.id, options);
            idMap[item.id] = created.id;
          }

          // Segunda passe: garantir que parentItemId esteja ajustado quando faltou no primeiro passe
          for (const item of items) {
            if (item.parentItemId) {
              const newId = idMap[item.id];
              const newParentId = idMap[item.parentItemId];
              if (newId && newParentId) {
                try {
                  await updateChecklistItem(newId, { parentItemId: newParentId });
                } catch (err) {
                  console.warn('Erro ao atualizar parentItemId na cópia:', err);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao copiar checklists:', err);
      }

      toast({ title: 'Cartão copiado', description: 'Cópia completa criada com sucesso.' });
      // Opcional: fechar modal
      onClose();
    } catch (error) {
      console.error('Erro ao copiar cartão:', error);
      toast({ title: 'Erro', description: 'Não foi possível copiar o cartão.', variant: 'destructive' });
    }
  };

  const confirmDeleteComment = async () => {
    if (!card || !commentToDelete) return;

    try {
      await deleteComment(commentToDelete, card.id);
      setShowDeleteCommentDialog(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      setShowDeleteCommentDialog(false);
      setCommentToDelete(null);
    }
  };

  // Função para verificar se um cartão está atrasado
  const isCardOverdue = (dueDate: string | Date | null): boolean => {
    if (!dueDate) return false;

    // Criar uma data com apenas ano, mês e dia (sem horas)
    const dueDateObj = new Date(dueDate);
    const today = new Date();

    // Remove a parte de tempo para comparar apenas as datas
    const dueDateTime = new Date(
      dueDateObj.getFullYear(), 
      dueDateObj.getMonth(), 
      dueDateObj.getDate()
    ).getTime();

    const todayTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();

    return dueDateTime < todayTime;
  };

  // Função para formatar a data sem o problema de fuso horário
  const formatDateBR = (date: string | Date): string => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Handler para marcar cartão como concluído/não concluído
  const handleToggleCompleted = async () => {
    if (!card) return;

    try {
      const newCompletedStatus = !card.completed;
      await apiRequest(
        'PATCH',
        `/api/cards/${card.id}/complete`,
        { completed: newCompletedStatus }
      );
      
      // Atualizar o estado local através do contexto
      await updateCard(card.id, { completed: newCompletedStatus });
      
      toast({
        title: newCompletedStatus ? "Cartão marcado como concluído" : "Cartão marcado como não concluído",
        description: "O status do cartão foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar status do cartão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do cartão.",
        variant: "destructive",
      });
    }
  };

  // Set the initial dueDate state when the card loads
  useEffect(() => {
    if (card && card.dueDate) {
      setDueDate(new Date(card.dueDate));
    } else {
      setDueDate(null);
    }
  }, [card]);

  // Set the initial startDate and endDate states when the card loads
  useEffect(() => {
    if (card) {
      setStartDate(card.startDate || '');
      setEndDate(card.endDate || '');
    } else {
      setStartDate('');
      setEndDate('');
    }
  }, [card]);

  const handleDueDateChange = async (newDueDate: Date | null) => {
    if (!card) return;

    try {
      // Se for nulo, removemos a data
      if (newDueDate === null) {
        await updateCard(card.id, { dueDate: null });
      } else {
        // Ajustar a data para meia-noite no fuso horário local
        const localDate = new Date(
          newDueDate.getFullYear(),
          newDueDate.getMonth(),
          newDueDate.getDate()
        );

        await updateCard(card.id, { dueDate: localDate });
      }
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  const handleStartDateChange = async (newStartDate: string) => {
    if (!card) return;

    try {
      // Validar se a data não conflita com endDate
      if (newStartDate && endDate) {
        const startDateObj = new Date(newStartDate);
        const endDateObj = new Date(endDate);
        if (startDateObj > endDateObj) {
          toast({
            title: "Data inválida",
            description: "Data de início deve ser anterior ou igual à data de término",
            variant: "destructive",
          });
          return;
        }
      }

      const updateData = { startDate: newStartDate || null };
      await updateCard(card.id, updateData);
      setStartDate(newStartDate);
    } catch (error) {
      console.error("Error updating start date:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar data de início",
        variant: "destructive",
      });
    }
  };

  const handleEndDateChange = async (newEndDate: string) => {
    if (!card) return;

    try {
      // Validar se a data não conflita com startDate
      if (newEndDate && startDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(newEndDate);
        if (startDateObj > endDateObj) {
          toast({
            title: "Data inválida",
            description: "Data de término deve ser posterior ou igual à data de início",
            variant: "destructive",
          });
          return;
        }
      }

      const updateData = { endDate: newEndDate || null };
      await updateCard(card.id, updateData);
      setEndDate(newEndDate);
    } catch (error) {
      console.error("Error updating end date:", error);
      toast({
        title: "Erro", 
        description: "Erro ao atualizar data de término",
        variant: "destructive",
      });
    }
  };

  // Calcular duração entre as datas
  const calculateDuration = (): string => {
    if (!startDate && !endDate) return '';
    
    const today = new Date();
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    if (startDateObj && endDateObj) {
      // Duração fixa: ambas as datas estão definidas
      const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
    } else if (startDateObj && !endDateObj) {
      // Duração ativa: contar desde a data de início até hoje
      const diffTime = Math.abs(today.getTime() - startDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} dia${diffDays !== 1 ? 's' : ''} (ativo)`;
    }
    
    return '';
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR'); // Formato DD/MM/YYYY
  };

  if (!card || !list) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#F9FAFC] max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          {/* Card header */}
          <DialogHeader className="flex justify-between mb-4">
            <div className="flex-1">
              <div className="mb-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                    <line x1="16" y1="8" x2="2" y2="22" />
                    <line x1="17.5" y1="15" x2="9" y2="15" />
                  </svg>

                  <div className="flex-1">
                    {isEditingTitle ? (
                      <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        className="text-xl font-semibold"
                        autoFocus
                      />
                    ) : (
                      <DialogTitle 
                        className="text-xl font-semibold cursor-pointer" 
                        onClick={() => setIsEditingTitle(true)}
                      >
                        {card.title}
                      </DialogTitle>
                    )}
                  </div>
                </div>

                <DialogDescription className="text-sm text-[#5E6C84] mt-1">
                  na lista <span className="font-medium">{list.title}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Main content area */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column (main content) */}
            <div className="flex-1">
              {/* Members */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-[#5E6C84] mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h3>Membros</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cardMembers[card.id]?.map(member => (
                    <div key={member.id} className="inline-flex items-center">
                      <Avatar className="h-8 w-8">
                        {member.profilePicture ? (
                          <AvatarImage src={member.profilePicture} alt={member.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                  <button 
                    className="px-3 py-1 rounded bg-[#091E420A] text-[#5E6C84] text-xs"
                    onClick={() => setIsMemberManagerOpen(true)}
                  >
                    + Adicionar membro
                  </button>
                </div>
              </div>
                {/* Priority */}
                <div className="mb-6">
                  <div className="flex items-center text-sm text-[#5E6C84] mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6h12l-2 4 2 4H4z" />
                      <path d="M4 6v12" />
                    </svg>
                    <h3>Prioridade</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {/* Current priority (if any) */}
                      {card && cardPriorities && cardPriorities[card.id] ? (
                        <span
                          className="px-3 py-1 rounded text-white text-xs"
                          style={{ backgroundColor: (cardPriorities[card.id] as any).color || '#6B7280' }}
                        >
                          {(cardPriorities[card.id] as any).name}
                        </span>
                      ) : null}

                      <button 
                        className="px-3 py-1 rounded bg-[#091E420A] text-[#5E6C84] text-xs"
                        onClick={() => setIsPriorityManagerOpen(true)}
                      >
                        + Definir prioridade
                      </button>
                  </div>
                </div>

              {/* Labels */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-[#5E6C84] mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <h3>Etiquetas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cardLabels[card.id]?.map(label => (
                    <span 
                      key={label.id} 
                      className="px-3 py-1 rounded text-white text-xs"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                  <button 
                    className="px-3 py-1 rounded bg-[#091E420A] text-[#5E6C84] text-xs"
                    onClick={() => setIsLabelManagerOpen(true)}
                  >
                    + Adicionar etiqueta
                  </button>
                </div>
              </div>


                {/* Duration */}
                <div className="mb-6">
                  <div className="flex items-center text-sm text-[#5E6C84] mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    <h3>Tempo de Duração</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {calculateDuration() ? (
                      <button 
                        className="px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-1"
                        onClick={() => setShowDurationDialog(true)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                        {calculateDuration()}
                      </button>
                    ) : (
                      <button 
                        className="px-3 py-1 rounded bg-[#091E420A] text-[#5E6C84] text-xs"
                        onClick={() => setShowDurationDialog(true)}
                      >
                        + Definir tempo
                      </button>
                    )}
                  </div>
                </div>

              {/* Description */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-[#5E6C84] mb-2">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="21" y1="10" x2="3" y2="10" />
                      <line x1="21" y1="6" x2="3" y2="6" />
                      <line x1="21" y1="14" x2="3" y2="14" />
                      <line x1="21" y1="18" x2="3" y2="18" />
                    </svg>
                    <h3>Descrição</h3>
                  </div>
                  {!isEditingDescription && (
                    <button 
                      className="px-2 py-1 rounded bg-[#091E420A] text-xs"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      Editar
                    </button>
                  )}
                </div>

                {isEditingDescription ? (
                  <DescriptionEditor
                    value={description}
                    onChange={(v) => setDescription(v)}
                    onSave={async () => {
                      await handleDescriptionSave();
                    }}
                    onCancel={() => {
                      setIsEditingDescription(false);
                      setDescription(card.description || "");
                    }}
                    placeholder="Adicione uma descrição mais detalhada..."
                    rows={6}
                  />
                ) : (
                  <div 
                    className="bg-white p-3 rounded border border-gray-200 cursor-pointer"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {card.description ? (
                      <p className="text-sm whitespace-pre-wrap">{card.description}</p>
                    ) : (
                      <p className="text-sm text-[#5E6C84] italic">Adicione uma descrição mais detalhada...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Checklists section */}
              {cardId && <ChecklistManager cardId={cardId} />}

              {/* Comments section */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-[#5E6C84] mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <h3>Comentários</h3>
                </div>

                {/* Comment input form */}
                <div className="flex mb-4">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {commentUserName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <form onSubmit={handleSubmitComment}>
                      <div className="mb-2">
                        {user ? (
                          // Quando o usuário está logado, usamos o nome dele automaticamente
                          <div className="flex items-center mb-2 text-sm font-medium text-gray-700">
                            <span>Comentando como: {commentUserName}</span>
                          </div>
                        ) : (
                          // Se não estiver logado, permite editar o nome
                          <Input
                            type="text"
                            placeholder="Nome do usuário"
                            value={commentUserName}
                            onChange={(e) => setCommentUserName(e.target.value)}
                            className="mb-2"
                          />
                        )}
                        <Textarea
                          placeholder="Escreva um comentário..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="bg-[#0079BF] hover:bg-[#026AA7]"
                        disabled={isSubmittingComment || !commentText.trim()}
                      >
                        {isSubmittingComment ? "Enviando..." : "Enviar"}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Comments list */}
                <div className="space-y-4">
                  {cardComments.length > 0 ? (
                    cardComments.map((comment) => (
                      <div key={comment.id} className="flex">
                        <div className="flex-shrink-0 mr-3">
                          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                            {comment.userName ? comment.userName.charAt(0).toUpperCase() : "U"}
                          </div>
                        </div>
                        <div className="flex-grow bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">
                                {comment.userName || "Usuário"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                          <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column (actions) */}
            <div className="w-full md:w-48">
              <h3 className="text-xs font-medium text-[#5E6C84] mb-2">Adicionar ao cartão</h3>
              <div className="space-y-1.5 mb-6">
                <button 
                  className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={() => setIsMemberManagerOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Membros</span>
                </button>
                <button 
                  className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={() => setIsLabelManagerOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>Etiquetas</span>
                </button>
                <button 
                  className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={() => setIsChecklistManagerOpen(true)}
                  aria-label="Abrir checklist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Checklist</span>
                </button>
                {/* Subtasks count indicator (clickable) */}
                {(() => {
                  const cardChecklists = checklists[card.id] || [];
                  const allItems = cardChecklists.flatMap((cl: any) => checklistItems[cl.id] || []);
                  const subtasks = allItems.filter((i: any) => !!i.parentItemId);
                  const totalSubtasks = subtasks.length;

                  return (
                    <button
                      className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center"
                      onClick={() => setIsChecklistManagerOpen(true)}
                      title="Mostrar subtarefas"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>Subtarefas: {totalSubtasks}</span>
                    </button>
                  );
                })()}
                <button 
                  className={`w-full text-left py-1.5 px-3 text-sm rounded flex items-center ${card.dueDate ? 'bg-blue-50 text-blue-600' : 'text-[#172B4D] hover:bg-[#091E420A]'}`}
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${card.dueDate ? 'text-blue-600' : 'text-[#5E6C84]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className={isCardOverdue(card.dueDate) ? "text-red-600 font-medium" : ""}>
                    {card.dueDate 
                      ? `Prazo: ${formatDateBR(card.dueDate)}${isCardOverdue(card.dueDate) ? " (Atrasado)" : ""}`
                      : "Definir prazo"}
                  </span>
                </button>

                {isDatePickerOpen && (
                  <div className="p-3 mt-1 mb-2 bg-white rounded shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Data de vencimento</h4>
                    <div className="mb-2">
                      <Input
                        type="date"
                        value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setDueDate(null);
                            return;
                          }

                          const date = new Date(e.target.value + 'T12:00:00');
                          setDueDate(date);
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDueDate(null);
                          handleDueDateChange(null);
                        }}
                        disabled={!card.dueDate}
                      >
                        Remover
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleDueDateChange(dueDate);
                          setIsDatePickerOpen(false);
                        }}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Seção de Duração (Start Date e End Date) */}


                <button className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span>Anexo</span>
                </button>
              </div>

              <h3 className="text-xs font-medium text-[#5E6C84] mb-2">Ações</h3>
              <div className="space-y-1.5 mb-6">
                {isArchivedView ? (
                  /* Botão para desarquivar - apenas para cards arquivados */
                  <button 
                    className="w-full text-left py-1.5 px-3 text-blue-600 text-sm rounded hover:bg-blue-50 flex items-center"
                    onClick={async () => {
                      try {
                        await apiRequest("POST", `/api/cards/${card.id}/unarchive`);
                        
                        // Recarregar os dados do board para mostrar o card na visualização principal
                        if (currentBoard) {
                          await fetchBoardData(currentBoard.id);
                        }
                        
                        toast({
                          title: "Cartão desarquivado",
                          description: "O cartão foi desarquivado com sucesso.",
                        });
                        onClose();
                      } catch (error) {
                        console.error("Error unarchiving card:", error);
                        toast({
                          title: "Erro",
                          description: "Falha ao desarquivar o cartão.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="5" />
                      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                      <path d="M10 12h4" />
                    </svg>
                    <span>Desarquivar</span>
                  </button>
                ) : (
                  /* Botões normais para cards ativos */
                  <>
                    <button 
                      className={`w-full text-left py-1.5 px-3 text-sm rounded flex items-center ${
                        card.completed 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      onClick={handleToggleCompleted}
                    >
                      {card.completed ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12l2 2 4-4" />
                      </svg>
                      <span>Marcar como não concluída</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12l2 2 4-4" />
                      </svg>
                      <span>Marcar como concluída</span>
                    </>
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      <span>Mover para</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {lists.map((targetList) => (
                      <DropdownMenuItem
                        key={targetList.id}
                        onClick={() => {
                          if (targetList.id !== list.id) {
                            updateCard(card.id, { listId: targetList.id }).then(() => {
                              onClose();
                            });
                          }
                        }}
                      >
                        {targetList.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button 
                  className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={() => {
                    // Criar uma cópia completa do cartão (exceto anexos e comentários)
                    handleDeepCopy();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copiar</span>
                </button>
                <button 
                  className="w-full text-left py-1.5 px-3 text-gray-700 text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={handleArchiveCard}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="5" />
                    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                    <path d="M10 12h4" />
                  </svg>
                  <span>Arquivar</span>
                </button>
                <div className="border-b border-gray-200 my-1"></div>
                <button 
                  className="w-full text-left py-1.5 px-3 text-red-600 text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={handleDeleteCard}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Excluir</span>
                </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Label Manager */}
      {card && currentBoard && (
        <LabelManager
          isOpen={isLabelManagerOpen}
          onClose={() => setIsLabelManagerOpen(false)}
          cardId={card.id}
          boardId={currentBoard.id}
        />
      )}

      {/* Priority Manager */}
      {card && currentBoard && (
        <PriorityManager
          isOpen={isPriorityManagerOpen}
          onClose={() => setIsPriorityManagerOpen(false)}
          cardId={card.id}
          boardId={currentBoard.id}
        />
      )}

      {/* Member Manager */}
      {card && (
        <MemberManager
          isOpen={isMemberManagerOpen}
          onClose={() => setIsMemberManagerOpen(false)}
          cardId={card.id}
        />
      )}

      {/* Checklist Manager as Dialog (opened from right column) */}
      {card && (
        <Dialog open={isChecklistManagerOpen} onOpenChange={() => setIsChecklistManagerOpen(false)}>
          <DialogContent className="bg-[#F9FAFC] max-w-3xl max-h-[80vh] overflow-y-auto p-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Checklists</h3>
                <DialogClose className="p-2">Fechar</DialogClose>
              </div>
              <div>
                <ChecklistManager cardId={card.id} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de confirmação para exclusão de cartão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                Você tem certeza que deseja excluir o cartão <strong>{card?.title}</strong>?
              </div>
              <div className="flex items-center p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" />
                <span className="text-sm">
                  Esta ação não pode ser desfeita. O cartão e todos os dados associados serão removidos permanentemente.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCard} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir cartão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação para exclusão de comentário */}
      <AlertDialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                Você tem certeza que deseja excluir este comentário?
              </div>
              <div className="flex items-center p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" />
                <span className="text-sm">
                  Esta ação não pode ser desfeita. O comentário será removido permanentemente.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteComment} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir comentário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Duração */}
      <AlertDialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Definir Tempo de Duração</AlertDialogTitle>
            <AlertDialogDescription>
              Configure as datas de início e término para calcular a duração da tarefa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {/* Data de Início */}
            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-2">Data de Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
                placeholder="Selecionar data de início"
              />
              {startDate && (
                <div className="text-xs text-[#5E6C84] mt-1">
                  {formatDateForDisplay(startDate)}
                </div>
              )}
            </div>

            {/* Data de Término */}
            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-2">Data de Término</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
                placeholder="Selecionar data de término (opcional)"
              />
              {endDate && (
                <div className="text-xs text-[#5E6C84] mt-1">
                  {formatDateForDisplay(endDate)}
                </div>
              )}
            </div>

            {/* Prévia da Duração */}
            {calculateDuration() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    Duração: {calculateDuration()}
                  </span>
                </div>
                {startDate && !endDate && (
                  <div className="text-xs text-blue-600 mt-1">
                    ⏱️ Contagem ativa desde {formatDateForDisplay(startDate)}
                  </div>
                )}
              </div>
            )}
          </div>
          <AlertDialogFooter className="gap-2">
            {/* Botão para limpar */}
            {(startDate || endDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Limpar
              </Button>
            )}
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              // Salvar as alterações
              try {
                await handleStartDateChange(startDate);
                await handleEndDateChange(endDate);
                setShowDurationDialog(false);
              } catch (error) {
                // Se houver erro, não fechar o modal para que o usuário possa corrigir
                console.error('Erro ao salvar duração:', error);
              }
            }}>
              Aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}