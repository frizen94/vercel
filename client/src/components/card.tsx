import React, { useState, useEffect } from "react";
import { Card as CardType, Label } from "@shared/schema";
import { useBoardContext } from "@/lib/board-context";
import { Draggable } from "react-beautiful-dnd";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface CardProps {
  card: CardType;
  index: number;
  openCardModal: (cardId: number) => void;
}

export function Card({ card, index, openCardModal }: CardProps) {
  const { cardLabels, fetchCardLabels, deleteCard, updateCard, createCard, cardMembers, fetchCardMembers } = useBoardContext();
  const { toast } = useToast();
  
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
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  };
  
  const { checklists, checklistItems } = useBoardContext();

  // Fetch labels for this card if they don't exist yet
  useEffect(() => {
    if (!cardLabels[card.id]) {
      fetchCardLabels(card.id);
    }
  }, [card.id, cardLabels, fetchCardLabels]);

  // Fetch first card members (used to display avatar on card preview)
  useEffect(() => {
    if (!cardMembers[card.id]) {
      fetchCardMembers(card.id).catch(() => {});
    }
  }, [card.id, cardMembers, fetchCardMembers]);
  
  const handleCardClick = () => {
    openCardModal(card.id);
  };
  
  // Handler para excluir cartão
  const handleDeleteCard = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne que o cartão seja aberto quando clicamos nas reticências
    
    try {
      await deleteCard(card.id);
      toast({
        title: "Cartão excluído",
        description: "O cartão foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cartão.",
        variant: "destructive",
      });
    }
  };
  
  // Handler para editar o título do cartão (vai para a modal de edição completa)
  const handleEditCard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne que o cartão seja aberto quando clicamos nas reticências
    
    // Simplesmente abre o modal do cartão para edição
    openCardModal(card.id);
  };
  
  // Handler para copiar o cartão
  const handleCopyCard = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne que o cartão seja aberto quando clicamos nas reticências
    
    try {
      // Criar uma cópia do cartão na mesma lista
      const cardCopy = {
        title: `${card.title} (Cópia)`,
        description: card.description,
        dueDate: card.dueDate
      };
      
      await createCard(cardCopy.title, card.listId);
      toast({
        title: "Cartão copiado",
        description: "Uma cópia do cartão foi criada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o cartão.",
        variant: "destructive",
      });
    }
  };

  return (
    <Draggable draggableId={`card-${card.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded shadow-sm p-4 mb-2 flex flex-col justify-between min-h-[96px] cursor-pointer hover:bg-[#F4F5F7] ${snapshot.isDragging ? 'rotate-2 shadow-md' : ''}`}
          onClick={handleCardClick}
        >
          {/* Card labels */}
          {cardLabels[card.id] && cardLabels[card.id].length > 0 && (
            <div className="labels flex flex-wrap gap-1 mb-2">
              {cardLabels[card.id].map((label: Label) => (
                <div 
                  key={label.id} 
                  className="block h-2 w-10 rounded-full" 
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                />
              ))}
            </div>
          )}
          
          {/* Content wrapper: ensures title occupies its own row so side elements don't push it */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <p className="text-sm break-words">{card.title}</p>
              </div>
            </div>
            
            {/* Right-side: checklist badge + menu */}
            <div className="relative flex items-center gap-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              {/* Checklist badge: show completed / total for top-level items */}
              {(() => {
                const cardChecklists = checklists[card.id] || [];
                const allItems = cardChecklists.flatMap((cl: any) => checklistItems[cl.id] || []);
                const topLevel = allItems.filter((i: any) => !i.parentItemId);
                const total = topLevel.length;
                const completed = topLevel.filter((i: any) => i.completed).length;

                if (total === 0) return null;

                return (
                  <span className="flex items-center text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {completed}/{total}
                  </span>
                );
              })()}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 -mt-1 -mr-1 rounded-sm hover:bg-gray-100 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48">
                  <DropdownMenuItem onClick={handleEditCard}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyCard}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDeleteCard} className="text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bottom row: members (left) and due date (right) */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              {(() => {
                const members = cardMembers[card.id] || [];
                const assignee = members[0];
                if (!assignee) return null;

                const initials = (assignee.name || assignee.username || '')
                  .split(' ')
                  .map((s: string) => s.charAt(0))
                  .join('')
                  .slice(0,2)
                  .toUpperCase();

                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer" aria-hidden title={assignee.name || assignee.username}>
                        <Avatar className="h-6 w-6 shadow-sm ring-1 ring-white">
                          {assignee.profilePicture ? (
                            <AvatarImage src={assignee.profilePicture} alt={assignee.name || assignee.username} className="object-cover" />
                          ) : (
                            <AvatarFallback className={`text-xs bg-[linear-gradient(135deg,#e6eefc,#cfe4ff)] flex items-center justify-center`}>{initials}</AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                    </PopoverTrigger>

                    <PopoverContent className="w-56 p-3">
                      <div className="flex items-start gap-4">
                        <div>
                          <Avatar className="h-14 w-14">
                            {assignee.profilePicture ? (
                              <AvatarImage src={assignee.profilePicture} alt={assignee.name || assignee.username} className="object-cover" />
                            ) : (
                              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{assignee.name || assignee.username}</div>
                          {assignee.email && <div className="text-xs text-muted-foreground">{assignee.email}</div>}
                          <div className="mt-3 flex gap-2">
                            <button className="text-xs px-2 py-1 bg-gray-100 rounded">Atribuir tarefa</button>
                            <button className="text-xs px-2 py-1 bg-white border rounded">Ver o perfil</button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })()}
            </div>

            <div className="flex items-center justify-end text-xs">
              {card.dueDate && (
                (() => {
                  const isOverdue = isCardOverdue(card.dueDate);

                  // Determinar se é hoje ou amanhã
                  const dueDate = new Date(card.dueDate);
                  const today = new Date();

                  // Remover a parte de tempo para comparar apenas as datas
                  const dueDateNoTime = new Date(
                    dueDate.getFullYear(),
                    dueDate.getMonth(),
                    dueDate.getDate()
                  );

                  const todayNoTime = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                  );

                  const tomorrowNoTime = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() + 1
                  );

                  const isToday = dueDateNoTime.getTime() === todayNoTime.getTime();
                  const isTomorrow = dueDateNoTime.getTime() === tomorrowNoTime.getTime();

                  // Determinar a cor do badge
                  let badgeColor = 'bg-gray-100 text-gray-700'; // Default
                  if (isOverdue) {
                    badgeColor = 'bg-red-100 text-red-700';
                  } else if (isToday) {
                    badgeColor = 'bg-yellow-100 text-yellow-700';
                  } else if (isTomorrow) {
                    badgeColor = 'bg-orange-100 text-orange-700';
                  }

                  return (
                    <span className={`flex items-center rounded px-1.5 py-0.5 ${badgeColor}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {formatDateBR(card.dueDate)}
                      {isOverdue && ' (Atrasado)'}
                    </span>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
