import { useState, useEffect, useRef, FormEvent } from "react";
import { Checklist, ChecklistItem, User } from "@shared/schema";
import { useBoardContext } from "@/lib/board-context";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Trash2, Plus, Edit2, Calendar, User as UserIcon, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import DescriptionEditor from '@/components/description-editor';

interface ChecklistManagerProps {
  cardId: number;
}

export function ChecklistManager({ cardId }: ChecklistManagerProps) {
  const { user } = useAuth();
  const {
    checklists,
    checklistItems,
    fetchChecklists,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    fetchChecklistItems,
    createChecklistItem,
    updateChecklistItem,
  deleteChecklistItem,
  fetchComments,
  createComment,
  fetchChecklistItemMembers,
  addMemberToChecklistItem,
  removeMemberFromChecklistItem,
  deleteComment, // Import deleteComment
  } = useBoardContext();

  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemContents, setNewItemContents] = useState<{ [checklistId: number]: string }>({});
  const [editMode, setEditMode] = useState<{ [checklistId: number]: boolean }>({});
  const [editTitles, setEditTitles] = useState<{ [checklistId: number]: string }>({});

  // Novo estado para edição de itens
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemContent, setEditingItemContent] = useState("");
  const [itemAssignees, setItemAssignees] = useState<{ [itemId: number]: User | null }>({});
  const [itemDueDates, setItemDueDates] = useState<{ [itemId: number]: Date | null }>({});
  const [users, setUsers] = useState<User[]>([]);

  // Estado para controlar popups de atribuição e data
  const [openDatePickerId, setOpenDatePickerId] = useState<number | null>(null);
  const [openMemberPickerId, setOpenMemberPickerId] = useState<number | null>(null);

  // Referência para o formulário de edição de item
  const editItemInputRef = useRef<HTMLInputElement>(null);

  // Novo estado para subtarefas (modal estilo Asana)
  const [openSubtaskModalId, setOpenSubtaskModalId] = useState<number | null>(null);
  const [subtaskModalData, setSubtaskModalData] = useState<ChecklistItem | null>(null);
  const [newSubtaskContent, setNewSubtaskContent] = useState("");

  // State for modal inline editing
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<string>("");
  const [isEditingSubtaskDescription, setIsEditingSubtaskDescription] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>("");
  const [subtaskMembers, setSubtaskMembers] = useState<User[]>([]);
  const [subtaskComments, setSubtaskComments] = useState<any[]>([]);



  // Função para buscar usuários do sistema
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Falha ao buscar usuários');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  useEffect(() => {
    // Initialize modal editing fields when subtask changes
    if (subtaskModalData) {
      setEditingTitle(subtaskModalData.content || "");
      setIsEditingTitle(false);
      setEditingDescription(subtaskModalData.description || "");
      setIsEditingSubtaskDescription(false);
      setNewComment("");
    }
  }, [subtaskModalData]);

  useEffect(() => {
    if (cardId) {
      fetchChecklists(cardId).then((fetchedChecklists) => {
        // Fetch items for each checklist
        fetchedChecklists.forEach(checklist => {
          fetchChecklistItems(checklist.id);
          // Initialize new item content state for this checklist
          setNewItemContents(prev => ({ ...prev, [checklist.id]: "" }));
        });
      });

      // Buscar usuários para a atribuição de tarefas
      fetchUsers();
    }
  }, [cardId]);

  // When opening a subtask modal, fetch only comments related to that subtask
  useEffect(() => {
    if (subtaskModalData) {
      // fetch comments filtered by checklist item id
      fetchComments(cardId, subtaskModalData.id).then(comments => {
        setSubtaskComments(comments);
      }).catch(err => console.error(err));
      // fetch members for this subtask
      (async () => {
        try {
          const members = await fetchChecklistItemMembers(subtaskModalData.id);
          setSubtaskMembers(members);
        } catch (err) {
          console.error('Erro ao buscar membros da subtarefa:', err);
        }
      })();
    }
  }, [subtaskModalData]);

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) return;

    try {
      await createChecklist(newChecklistTitle, cardId);
      setNewChecklistTitle("");
    } catch (error) {
      console.error("Erro ao criar checklist:", error);
    }
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    try {
      await deleteChecklist(checklistId);
    } catch (error) {
      console.error("Erro ao excluir checklist:", error);
    }
  };

  const handleCreateItem = async (checklistId: number) => {
    const content = newItemContents[checklistId];
    if (!content.trim()) return;

    try {
      await createChecklistItem(content, checklistId);
      setNewItemContents(prev => ({ ...prev, [checklistId]: "" }));
    } catch (error) {
      console.error("Erro ao criar item:", error);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    try {
      await updateChecklistItem(item.id, { completed: !item.completed });
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  const handleDeleteItem = async (itemId: number, checklistId: number) => {
    try {
      await deleteChecklistItem(itemId, checklistId);
    } catch (error) {
      console.error("Erro ao excluir item:", error);
    }
  };

  // Função para iniciar a edição de um item
  const startEditingItem = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingItemContent(item.content);

    // Foco no input após renderização
    setTimeout(() => {
      if (editItemInputRef.current) {
        editItemInputRef.current.focus();
      }
    }, 0);
  };

  // Função para salvar a edição de um item
  const saveItemEdit = async (itemId: number, checklistId: number) => {
    if (!editingItemContent.trim()) return;

    try {
      await updateChecklistItem(itemId, { content: editingItemContent });
      setEditingItemId(null);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  // Função para cancelar a edição de um item
  const cancelItemEdit = () => {
    setEditingItemId(null);
    setEditingItemContent("");
  };

  // Função para verificar se um item está atrasado
  const isItemOverdue = (dueDate: string | Date | null): boolean => {
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
    // Usar UTC para evitar problemas de fuso horário
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  // Função para atribuir um membro ao item
  const assignMemberToItem = async (itemId: number, userId: number | null) => {
    try {
      await updateChecklistItem(itemId, { assignedToUserId: userId });
      // Atualiza estado local e, se o modal estiver aberto para este item, atualiza também os dados do modal
      const assignedUser = users.find(u => u.id === userId) || null;
      setItemAssignees(prev => ({ ...prev, [itemId]: assignedUser }));
      if (subtaskModalData && subtaskModalData.id === itemId) {
        setSubtaskModalData({ ...subtaskModalData, assignedToUserId: userId });
      }
    } catch (error) {
      console.error("Erro ao atribuir membro ao item:", error);
    }
  };

  // Função para definir prazo para um item
  const setItemDueDate = async (itemId: number, date: Date | null) => {
    try {
      // Se a data for nula, removemos o prazo
      if (date === null) {
        await updateChecklistItem(itemId, { dueDate: null });
        // Atualiza estado local e modal
        setItemDueDates(prev => ({ ...prev, [itemId]: null }));
        if (subtaskModalData && subtaskModalData.id === itemId) {
          setSubtaskModalData({ ...subtaskModalData, dueDate: null });
        }
        return;
      } else {
        // Garantir que a data está em UTC para evitar problemas de fuso horário
        const utcDate = new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ));

        await updateChecklistItem(itemId, { dueDate: utcDate });
      // Atualiza estado local e modal
      setItemDueDates(prev => ({ ...prev, [itemId]: date }));
      if (subtaskModalData && subtaskModalData.id === itemId) {
        setSubtaskModalData({ ...subtaskModalData, dueDate: utcDate });
      }
      return;
      }
    } catch (error) {
      console.error("Erro ao definir prazo para o item:", error);
    }
  };

  const startEditingTitle = (checklist: Checklist) => {
    setEditMode(prev => ({ ...prev, [checklist.id]: true }));
    setEditTitles(prev => ({ ...prev, [checklist.id]: checklist.title }));
  };

  const saveChecklistTitle = async (checklistId: number) => {
    const newTitle = editTitles[checklistId];
    if (!newTitle.trim()) return;

    try {
      await updateChecklist(checklistId, { title: newTitle });
      setEditMode(prev => ({ ...prev, [checklistId]: false }));
    } catch (error) {
      console.error("Erro ao atualizar título da checklist:", error);
    }
  };

  const calculateProgress = (checklistId: number): number => {
  // Only consider top-level items (no parent) for progress
  const allItems = checklistItems[checklistId] || [];
  const items = allItems.filter(i => !i.parentItemId);
  if (items.length === 0) return 0;

  const completedCount = items.filter(item => item.completed).length;
  return Math.round((completedCount / items.length) * 100);
  };



  const cardChecklists = checklists[cardId] || [];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Checklists</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Input
            placeholder="Título da checklist"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            className="w-48"
          />
          <Button size="sm" onClick={handleCreateChecklist}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Checklist
          </Button>
        </div>
      </div>

      {cardChecklists.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Nenhuma checklist adicionada. Crie uma nova checklist para começar.
        </div>
      ) : (
        <div className="space-y-4">
          {cardChecklists.map(checklist => {
            // Show only top-level items in the main checklist view; subtasks are shown in the subtask modal
            const allItems = checklistItems[checklist.id] || [];
            const items = allItems.filter(i => !i.parentItemId);
            const progress = calculateProgress(checklist.id);

            return (
              <Card key={checklist.id} className="border shadow-sm">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    {editMode[checklist.id] ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editTitles[checklist.id] || ""}
                          onChange={(e) => setEditTitles(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                          className="h-8"
                        />
                        <Button size="sm" variant="outline" onClick={() => saveChecklistTitle(checklist.id)}>
                          Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditMode(prev => ({ ...prev, [checklist.id]: false }))}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-base font-medium">{checklist.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEditingTitle(checklist)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Checklist</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso irá excluir permanentemente a checklist e todos os seus itens.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteChecklist(checklist.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{progress}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ul className="space-y-2">
                    {items.map(item => (
                      <li key={item.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.completed} 
                            onChange={() => handleToggleItem(item)}
                            id={`item-${item.id}`}
                            className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />

                          {editingItemId === item.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                ref={editItemInputRef}
                                value={editingItemContent}
                                onChange={(e) => setEditingItemContent(e.target.value)}
                                className="h-8 flex-1"
                              />
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => saveItemEdit(item.id, checklist.id)}
                              >
                                Salvar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={cancelItemEdit}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span 
                                className={`flex-1 text-sm cursor-pointer ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpenSubtaskModalId(item.id);
                                  setSubtaskModalData(item);
                                }}
                              >
                                {item.content}
                              </span>

                              <div className="flex items-center gap-1">
                                {/* Botão de atribuir membro */}
                                    {/* Subtasks badge before member button (completed/total) */}
                                    {(() => {
                                      const checklistId = checklist.id;
                                      const allItems = checklistItems[checklistId] || [];
                                      const subtasks = allItems.filter(i => i.parentItemId === item.id);
                                      const totalSub = subtasks.length;
                                      const completedSub = subtasks.filter(s => s.completed).length;
                                      if (totalSub === 0) return null;

                                      return (
                                        <button
                                          className="mr-1 text-xs bg-gray-100 px-2 py-0.5 rounded text-muted-foreground"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenSubtaskModalId(item.id);
                                            setSubtaskModalData(item);
                                          }}
                                          title={`Subtarefas: ${completedSub}/${totalSub}`}
                                        >
                                          {completedSub}/{totalSub}
                                        </button>
                                      );
                                    })()}

                                    <Popover open={openMemberPickerId === item.id} onOpenChange={(open) => !open && setOpenMemberPickerId(null)}>
                                    <PopoverTrigger asChild>
                                      <Button 
                                        size="icon" 
                                        variant={item.assignedToUserId ? "outline" : "ghost"}
                                        className={`h-7 w-7 ${item.assignedToUserId ? "border-blue-400" : ""}`}
                                        onClick={() => setOpenMemberPickerId(item.id)}
                                      >
                                        <UserIcon className={`h-3 w-3 ${item.assignedToUserId ? "text-blue-500" : "text-muted-foreground"}`} />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-52 p-2">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium mb-1">Atribuir membro</h4>
                                      <div className="space-y-1">
                                        {users.map(user => (
                                          <div 
                                            key={user.id} 
                                            className={`flex items-center gap-2 p-1.5 rounded hover:bg-muted text-sm cursor-pointer ${item.assignedToUserId === user.id ? "bg-blue-50" : ""}`}
                                            onClick={() => {
                                              assignMemberToItem(item.id, user.id === item.assignedToUserId ? null : user.id);
                                              setOpenMemberPickerId(null);
                                            }}
                                          >
                                            <Avatar className="h-6 w-6">
                                              <AvatarFallback className="text-xs">
                                                {user.name?.charAt(0) || user.username.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>{user.name || user.username}</span>
                                          </div>
                                        ))}

                                        {item.assignedToUserId && (
                                          <div 
                                            className="flex items-center gap-2 p-1.5 rounded hover:bg-muted text-sm cursor-pointer text-muted-foreground"
                                            onClick={() => {
                                              assignMemberToItem(item.id, null);
                                              setOpenMemberPickerId(null);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            <span>Remover atribuição</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {/* Botão de definir prazo */}
                                <Popover open={openDatePickerId === item.id} onOpenChange={(open) => !open && setOpenDatePickerId(null)}>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant={item.dueDate ? "outline" : "ghost"}
                                      className={`h-7 w-7 ${item.dueDate ? "border-green-400" : ""}`}
                                      onClick={() => setOpenDatePickerId(item.id)}
                                    >
                                      <Calendar className={`h-3 w-3 ${item.dueDate ? "text-green-500" : "text-muted-foreground"}`} />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium mb-1">Definir prazo</h4>
                                      <div className="space-y-2">
                                        <Input
                                            type="date"
                                            value={item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                              if (!e.target.value) {
                                                setItemDueDate(item.id, null);
                                                return;
                                              }

                                              const date = new Date(e.target.value + 'T12:00:00');
                                              setItemDueDate(item.id, date);
                                            }}
                                            className="w-full"
                                        />

                                        {item.dueDate && (
                                          <Button 
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-destructive"
                                            onClick={() => {
                                              setItemDueDate(item.id, null);
                                              setOpenDatePickerId(null);
                                            }}
                                          >
                                            Remover prazo
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {/* Menu de ações */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="h-7 w-7"
                                    >
                                      <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuItem onClick={() => startEditingItem(item)}>
                                      <Edit2 className="h-3.5 w-3.5 mr-2" />
                                      <span>Editar</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteItem(item.id, checklist.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      <span>Excluir</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Informações adicionais do item */}
                        {!editingItemId && (item.assignedToUserId || item.dueDate) && (
                          <div className="pl-8 flex items-center gap-2 text-xs text-muted-foreground">
                            {item.assignedToUserId && users.find(u => u.id === item.assignedToUserId) && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                <span>
                                  {users.find(u => u.id === item.assignedToUserId)?.name || 
                                   users.find(u => u.id === item.assignedToUserId)?.username}
                                </span>
                              </div>
                            )}

                            {item.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className={item.dueDate && isItemOverdue(item.dueDate) && !item.completed ? "text-red-500 font-medium" : ""}>
                                  {item.dueDate && formatDateBR(item.dueDate)}
                                  {item.dueDate && isItemOverdue(item.dueDate) && !item.completed && " (Atrasado)"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      placeholder="Adicionar item"
                      value={newItemContents[checklist.id] || ""}
                      onChange={(e) => setNewItemContents(prev => ({ 
                        ...prev, 
                        [checklist.id]: e.target.value 
                      }))}
                      className="h-8"
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleCreateItem(checklist.id)}
                      className="whitespace-nowrap"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Subtarefa (estilo Asana) */}
      {openSubtaskModalId && subtaskModalData && (
        <Dialog open={!!openSubtaskModalId} onOpenChange={() => {
          setOpenSubtaskModalId(null);
          setSubtaskModalData(null);
        }}>
          <DialogContent className="bg-[#F9FAFC] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0" aria-describedby="subtask-description">
            <DialogTitle className="sr-only">Detalhes da Subtarefa: {subtaskModalData?.content}</DialogTitle>
            <div id="subtask-description" className="sr-only">
              Modal para editar e gerenciar detalhes da subtarefa, incluindo descrição, colaboradores e comentários.
            </div>
        <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <div className="flex flex-col">
                      <h2 className="text-xl font-semibold">
                        {isEditingTitle ? (
                          <div className="flex items-center gap-2">
                            <Input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="h-8" />
                            <Button size="sm" onClick={async () => {
                              if (!subtaskModalData) return;
                              try {
                                await updateChecklistItem(subtaskModalData.id, { content: editingTitle });
                                setSubtaskModalData({ ...subtaskModalData, content: editingTitle });
                                setIsEditingTitle(false);
                              } catch (err) { console.error(err); }
                            }}>Salvar</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>Cancelar</Button>
                          </div>
                        ) : (
                          <span onClick={() => { setEditingTitle(subtaskModalData?.content || ''); setIsEditingTitle(true); }} className="cursor-pointer">{subtaskModalData?.content}</span>
                        )}
                      </h2>
                      {subtaskModalData && (subtaskModalData as any).checklistTitle && (
                        <p className="text-sm text-[#5E6C84] mt-1">da checklist: {(subtaskModalData as any).checklistTitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Esta tarefa é visível para pessoas que podem ver a tarefa principal.</span>
                    <button className="text-blue-600 hover:underline">Tornar pública</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* header toolbar (no close button here) */}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    checked={subtaskModalData.completed}
                    onChange={() => {
                      updateChecklistItem(subtaskModalData.id, { completed: !subtaskModalData.completed });
                      setSubtaskModalData({...subtaskModalData, completed: !subtaskModalData.completed});
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={`text-sm ${subtaskModalData.completed ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                    Marcar como concluída
                  </span>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1">
                  {/* removed static description box to avoid duplication; editable description below is the single source */}

                  {/* Subtarefas block moved below description (rendered later) */}

                  <div className="mb-6">
                    {/* description header rendered below with edit button */}

                    {/* Editable description area - shared component (behaves like CardModal) */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <h3 className="text-sm font-medium text-gray-700">Descrição</h3>
                        <div className="flex-1" />
                        {!isEditingSubtaskDescription && (
                          <button className="px-2 py-1 rounded bg-[#091E420A] text-xs" onClick={() => setIsEditingSubtaskDescription(true)}>Editar</button>
                        )}
                      </div>

                      {isEditingSubtaskDescription ? (
                        <DescriptionEditor
                          value={editingDescription}
                          onChange={(v) => setEditingDescription(v)}
                          onSave={async () => {
                            if (!subtaskModalData) return;
                            // Fechar o editor de forma otimista para melhorar UX (como no card principal)
                            setIsEditingSubtaskDescription(false);
                            try {
                              console.debug('[Subtask] Saving description (optimistic)', { id: subtaskModalData.id, description: editingDescription });
                              const updated = await updateChecklistItem(subtaskModalData.id, { description: editingDescription });
                              console.debug('[Subtask] Update response', updated);
                              setSubtaskModalData({ ...subtaskModalData, description: editingDescription });
                            } catch (err) {
                              console.error('[Subtask] Failed to save description', err);
                              // Se falhar, reabrir o editor para que o usuário possa tentar novamente
                              setIsEditingSubtaskDescription(true);
                            }
                          }}
                          onCancel={() => {
                            setEditingDescription(subtaskModalData?.description || '');
                            setIsEditingSubtaskDescription(false);
                          }}
                          placeholder="Do que se trata esta tarefa?"
                          rows={4}
                        />
                      ) : (
                        <div className="bg-white p-3 rounded border border-gray-200 cursor-pointer" onClick={() => setIsEditingSubtaskDescription(true)}>
                          {subtaskModalData?.description ? (
                            <p className="text-sm whitespace-pre-wrap">{subtaskModalData.description}</p>
                          ) : (
                            <p className="text-sm text-[#5E6C84] italic">Adicione uma descrição mais detalhada...</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Subtarefas: add + list (moved and cleaned) */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Nova subtarefa"
                          value={newSubtaskContent}
                          onChange={(e) => setNewSubtaskContent(e.target.value)}
                          className="flex-1"
                          aria-label="Conteúdo da nova subtarefa"
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!subtaskModalData) return;
                            const parentId = subtaskModalData.id;
                            const checklistId = subtaskModalData.checklistId;
                            if (!newSubtaskContent.trim()) return;
                            try {
                              await createChecklistItem(newSubtaskContent.trim(), checklistId, { parentItemId: parentId });
                              setNewSubtaskContent("");
                            } catch (err) {
                              console.error('Erro ao criar subtarefa:', err);
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                      </div>

                      {/* Subtasks list for this item */}
                      {subtaskModalData && (() => {
                        const checklistId = subtaskModalData.checklistId;
                        const items = checklistItems[checklistId] || [];
                        const subtasks = items.filter(i => i.parentItemId === subtaskModalData.id);

                        return (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Subtarefas</h4>
                            {subtasks.length === 0 ? (
                              <div className="text-sm text-muted-foreground">Nenhuma subtarefa</div>
                            ) : (
                              <ul className="space-y-3">
                                {subtasks.map(st => (
                                  <li key={st.id} className="flex flex-col gap-2 p-3 bg-white border rounded">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={st.completed}
                                          onChange={async () => {
                                            try {
                                              await updateChecklistItem(st.id, { completed: !st.completed });
                                            } catch (err) {
                                              console.error('Erro ao alternar subtarefa:', err);
                                            }
                                          }}
                                          className="w-4 h-4"
                                        />
                                        <span className={`text-sm flex-1 ${st.completed ? 'line-through text-muted-foreground' : ''}`}>{st.content}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {/* Atribuir membro à subtarefa */}
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button 
                                              size="icon" 
                                              variant={st.assignedToUserId ? "outline" : "ghost"}
                                              className={`h-6 w-6 ${st.assignedToUserId ? "border-blue-400" : ""}`}
                                            >
                                              <UserIcon className={`h-3 w-3 ${st.assignedToUserId ? "text-blue-500" : "text-muted-foreground"}`} />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-52 p-2">
                                            <div className="space-y-2">
                                              <h4 className="text-sm font-medium mb-1">Atribuir membro</h4>
                                              <div className="space-y-1">
                                                {users.map(user => (
                                                  <div 
                                                    key={user.id} 
                                                    className={`flex items-center gap-2 p-1.5 rounded hover:bg-muted text-sm cursor-pointer ${st.assignedToUserId === user.id ? "bg-blue-50" : ""}`}
                                                    onClick={async () => {
                                                      try {
                                                        await updateChecklistItem(st.id, { assignedToUserId: user.id === st.assignedToUserId ? null : user.id });
                                                      } catch (err) {
                                                        console.error('Erro ao atribuir membro:', err);
                                                      }
                                                    }}
                                                  >
                                                    <Avatar className="h-6 w-6">
                                                      <AvatarFallback className="text-xs">{user.name?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{user.name || user.username}</span>
                                                  </div>
                                                ))}

                                                {st.assignedToUserId && (
                                                  <div 
                                                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted text-sm cursor-pointer text-muted-foreground"
                                                    onClick={async () => {
                                                      try {
                                                        await updateChecklistItem(st.id, { assignedToUserId: null });
                                                      } catch (err) {
                                                        console.error('Erro ao remover atribuição:', err);
                                                      }
                                                    }}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span>Remover atribuição</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </PopoverContent>
                                        </Popover>

                                        {/* Data de vencimento da subtarefa */}
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button 
                                              size="icon" 
                                              variant={st.dueDate ? "outline" : "ghost"}
                                              className={`h-6 w-6 ${st.dueDate ? "border-green-400" : ""}`}
                                            >
                                              <Calendar className={`h-3 w-3 ${st.dueDate ? "text-green-500" : "text-muted-foreground"}`} />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-2">
                                            <div className="space-y-2">
                                              <h4 className="text-sm font-medium mb-1">Definir prazo</h4>
                                              <div className="space-y-2">
                                                <Input
                                                  type="date"
                                                  value={st.dueDate ? new Date(st.dueDate).toISOString().split('T')[0] : ''}
                                                  onChange={async (e) => {
                                                    try {
                                                      if (!e.target.value) {
                                                        await updateChecklistItem(st.id, { dueDate: null });
                                                        return;
                                                      }
                                                      const date = new Date(e.target.value + 'T12:00:00');
                                                      await updateChecklistItem(st.id, { dueDate: date });
                                                    } catch (err) {
                                                      console.error('Erro ao definir data:', err);
                                                    }
                                                  }}
                                                  className="w-full"
                                                />

                                                {st.dueDate && (
                                                  <Button 
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full text-destructive"
                                                    onClick={async () => {
                                                      try {
                                                        await updateChecklistItem(st.id, { dueDate: null });
                                                      } catch (err) {
                                                        console.error('Erro ao remover data:', err);
                                                      }
                                                    }}
                                                  >
                                                    Remover prazo
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          </PopoverContent>
                                        </Popover>

                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-6 w-6"
                                          onClick={async () => {
                                            try {
                                              await deleteChecklistItem(st.id, checklistId);
                                            } catch (err) {
                                              console.error('Erro ao excluir subtarefa:', err);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Informações adicionais da subtarefa */}
                                    {(st.assignedToUserId || st.dueDate) && (
                                      <div className="pl-6 flex items-center gap-3 text-xs text-muted-foreground">
                                        {st.assignedToUserId && users.find(u => u.id === st.assignedToUserId) && (
                                          <div className="flex items-center gap-1">
                                            <UserIcon className="h-3 w-3" />
                                            <span>
                                              {users.find(u => u.id === st.assignedToUserId)?.name || 
                                               users.find(u => u.id === st.assignedToUserId)?.username}
                                            </span>
                                          </div>
                                        )}

                                        {st.dueDate && (
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span className={st.dueDate && isItemOverdue(st.dueDate) && !st.completed ? "text-red-500 font-medium" : ""}>
                                              {formatDateBR(st.dueDate)}
                                              {st.dueDate && isItemOverdue(st.dueDate) && !st.completed && " (Atrasado)"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Comments input */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Comentários</h4>
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold text-sm" aria-hidden="true">U</div>
                        <div className="flex-1">
                          <Input 
                            placeholder="Adicionar um comentário..." 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)}
                            aria-label="Novo comentário"
                            className="w-full"
                          />
                          <div className="flex gap-2 mt-2">
                              <Button size="sm" onClick={async () => {
                                if (!newComment.trim() || !subtaskModalData) return;
                                try {
                                  // Create comment specifically for the subtask with userId
                                  await createComment(newComment.trim(), cardId, user?.name || user?.username || 'Usuário', subtaskModalData.id);
                                  // Refresh comments for the subtask only
                                  const updatedComments = await fetchComments(cardId, subtaskModalData.id);
                                  setSubtaskComments(updatedComments);
                                } catch (err) {
                                  console.error('Erro ao criar comentário da subtarefa:', err);
                                }
                                setNewComment('');
                              }}>Enviar</Button>
                            <Button size="sm" variant="ghost" onClick={() => setNewComment('')}>Cancelar</Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments display for this subtask */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Comentários da subtarefa</h4>
                      {subtaskComments.length > 0 ? (
                        <div className="space-y-4 max-h-40 overflow-y-auto">
                          {subtaskComments.map((comment) => (
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
                                    onClick={async () => {
                                      if (!window.confirm("Tem certeza que deseja excluir este comentário?")) return;
                                      try {
                                        await deleteComment(comment.id, cardId);
                                        // Atualizar lista de comentários
                                        if (subtaskModalData) {
                                          const updatedComments = await fetchComments(cardId, subtaskModalData.id);
                                          setSubtaskComments(updatedComments);
                                        }
                                      } catch (err) {
                                        console.error('Erro ao excluir comentário:', err);
                                      }
                                    }}
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
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Nenhum comentário ainda. Seja o primeiro a comentar!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-64">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Colaboradores</h4>
                    <div className="flex items-center gap-2">
                      {/* Circle collaborator button shows assigned avatar and opens popover to manage collaborators */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="h-8 w-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400">
                            {subtaskModalData?.assignedToUserId ? (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-sm">{users.find(u => u.id === subtaskModalData.assignedToUserId)?.name?.charAt(0) || users.find(u => u.id === subtaskModalData.assignedToUserId)?.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2">
                            <div className="space-y-3">
                              <div>
                                <h5 className="text-sm font-medium">Colaboradores</h5>
                                {subtaskMembers.length === 0 ? (
                                  <div className="text-sm text-muted-foreground">Nenhum colaborador</div>
                                ) : (
                                  <div className="flex flex-col gap-2 mt-2">
                                    {subtaskMembers.map(member => (
                                      <div key={member.id} className="flex items-center justify-between gap-2 p-1">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarFallback className="text-xs">{member.name?.charAt(0) || member.username.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm">{member.name || member.username}</span>
                                        </div>
                                        <Button size="icon" variant="ghost" onClick={async () => {
                                          try {
                                            await removeMemberFromChecklistItem(subtaskModalData!.id, member.id);
                                            const members = await fetchChecklistItemMembers(subtaskModalData!.id);
                                            setSubtaskMembers(members);
                                          } catch (err) { console.error('Erro ao remover membro:', err); }
                                        }}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <h5 className="text-sm font-medium">Adicionar</h5>
                                <div className="flex flex-col gap-1 mt-2">
                                  {users.filter(u => !subtaskMembers.some(m => m.id === u.id)).map(user => (
                                    <div key={user.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted text-sm cursor-pointer" onClick={async () => {
                                      // Prevent adding if already a member or if operation is in progress
                                      if (subtaskMembers.some(m => m.id === user.id)) {
                                        console.warn('User is already a member, skipping add operation');
                                        return;
                                      }
                                      
                                      try {
                                        await addMemberToChecklistItem(subtaskModalData!.id, user.id);
                                        const members = await fetchChecklistItemMembers(subtaskModalData!.id);
                                        setSubtaskMembers(members);
                                      } catch (err) { 
                                        console.error('Erro ao adicionar membro:', err);
                                        // If it's a duplicate error, refresh the members list anyway
                                        if (err instanceof Error && err.message.includes('duplicate')) {
                                          const members = await fetchChecklistItemMembers(subtaskModalData!.id);
                                          setSubtaskMembers(members);
                                        }
                                      }
                                    }}>
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">{user.name?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span>{user.name || user.username}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Replace 'Sair da tarefa' with date display / picker */}
                  <div className="p-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full text-left text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 py-2">
                          <Calendar className="h-4 w-4" />
                          <span>{subtaskModalData?.dueDate ? formatDateBR(subtaskModalData.dueDate) : 'Adicionar prazo'}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2">
                        <div className="space-y-2">
                          <Input
                            type="date"
                            value={subtaskModalData?.dueDate ? new Date(subtaskModalData.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              if (!e.target.value) {
                                setItemDueDate(subtaskModalData!.id, null);
                                return;
                              }
                              const date = new Date(e.target.value + 'T12:00:00');
                              setItemDueDate(subtaskModalData!.id, date);
                            }}
                            className="w-full"
                          />
                          {subtaskModalData?.dueDate && (
                            <Button size="sm" variant="outline" className="w-full text-destructive" onClick={() => setItemDueDate(subtaskModalData!.id, null)}>
                              Remover prazo
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}