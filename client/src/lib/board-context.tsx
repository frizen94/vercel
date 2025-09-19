import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Board, List, Card, Comment, Label, CardLabel, User, Checklist, ChecklistItem } from "@shared/schema";

interface BoardContextType {
  currentBoard: Board | null;
  lists: List[];
  cards: { [listId: number]: Card[] };
  comments: { [cardId: number]: Comment[] };
  labels: Label[];
  cardLabels: { [cardId: number]: Label[] };
  cardMembers: { [cardId: number]: User[] };
  users: User[];
  checklists: { [cardId: number]: Checklist[] };
  checklistItems: { [checklistId: number]: ChecklistItem[] };
  isLoading: boolean;
  visibleCards: { [listId: number]: Card[] };
  setCardVisibilityFilter: (searchTerm: string) => void;
  fetchBoardData: (boardId: number) => Promise<void>;
  boards: any[];
  fetchBoards: () => Promise<void>;
  createBoard: (boardData: { title: string, color?: string, userId?: number | undefined }) => Promise<Board>;
  updateBoard: (id: number, updates: Partial<Board>) => Promise<Board>;
  deleteBoard: (id: number) => Promise<boolean>;
  createList: (title: string, boardId: number) => Promise<List>;
  updateList: (id: number, updates: Partial<List>) => Promise<List>;
  deleteList: (id: number) => Promise<void>;
  createCard: (title: string, listId: number) => Promise<Card>;
  updateCard: (id: number, updates: Partial<Card>) => Promise<Card>;
  deleteCard: (id: number) => Promise<void>;
  moveCard: (cardId: number, sourceListId: number, destinationListId: number, newIndex: number) => Promise<void>;
  moveList: (listId: number, newIndex: number) => Promise<void>;
  fetchComments: (cardId: number, checklistItemId?: number) => Promise<Comment[]>;
  createComment: (content: string, cardId: number, userName?: string, checklistItemId?: number | null) => Promise<Comment>;
  deleteComment: (id: number, cardId: number) => Promise<void>;
  fetchLabels: (boardId: number) => Promise<Label[]>;
  createLabel: (name: string, color: string, boardId: number) => Promise<Label>;
  fetchCardLabels: (cardId: number) => Promise<Label[]>;
  addLabelToCard: (cardId: number, labelId: number) => Promise<void>;
  removeLabelFromCard: (cardId: number, labelId: number) => Promise<void>;
  fetchCardMembers: (cardId: number) => Promise<User[]>;
  fetchUsers: () => Promise<User[]>;
  addMemberToCard: (cardId: number, userId: number) => Promise<void>;
  removeMemberFromCard: (cardId: number, userId: number) => Promise<void>;
  // Métodos para checklists
  fetchChecklists: (cardId: number) => Promise<Checklist[]>;
  createChecklist: (title: string, cardId: number) => Promise<Checklist>;
  updateChecklist: (id: number, updates: Partial<Checklist>) => Promise<Checklist>;
  deleteChecklist: (id: number) => Promise<void>;
  // Métodos para itens das checklists
  fetchChecklistItems: (checklistId: number) => Promise<ChecklistItem[]>;
  createChecklistItem: (content: string, checklistId: number, options?: { completed?: boolean; parentItemId?: number }) => Promise<ChecklistItem>;
  updateChecklistItem: (id: number, updates: Partial<ChecklistItem>) => Promise<ChecklistItem>;
  deleteChecklistItem: (id: number, checklistId: number) => Promise<void>;
  // Checklist item members (subtask collaborators)
  fetchChecklistItemMembers: (checklistItemId: number) => Promise<User[]>;
  addMemberToChecklistItem: (checklistItemId: number, userId: number) => Promise<void>;
  removeMemberFromChecklistItem: (checklistItemId: number, userId: number) => Promise<void>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoardContext must be used within a BoardProvider");
  }
  return context;
}

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
}

interface BoardProviderProps {
  children: ReactNode;
}

export function BoardProvider({ children }: BoardProviderProps) {
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<{ [listId: number]: Card[] }>({});
  const [visibleCards, setVisibleCards] = useState<{ [listId: number]: Card[] }>({});
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [comments, setComments] = useState<{ [cardId: number]: Comment[] }>({});
  // Label-related states must be declared before the filter effect
  const [labels, setLabels] = useState<Label[]>([]);
  const [cardLabels, setCardLabels] = useState<{ [cardId: number]: Label[] }>({});
  const [cardMembers, setCardMembers] = useState<{ [cardId: number]: User[] }>({});
  const [users, setUsers] = useState<User[]>([]);
  const [checklists, setChecklists] = useState<{ [cardId: number]: Checklist[] }>({});
  const [checklistItems, setChecklistItems] = useState<{ [checklistId: number]: ChecklistItem[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [boards, setBoards] = useState<any[]>([]);
  // Label and related states
  
  
  
  // Efeito para filtrar os cartões visíveis com base na pesquisa
  useEffect(() => {
    if (!searchFilter.trim()) {
      setVisibleCards(cards);
      return;
    }
    
    const filtered: { [listId: number]: Card[] } = {};
    
    Object.entries(cards).forEach(([listId, listCards]) => {
      const filteredCards = listCards.filter(card => {
        const q = searchFilter.toLowerCase();
        // Match title
        if (card.title && card.title.toLowerCase().includes(q)) return true;
        // Match description if present
        if ((card as any).description && String((card as any).description).toLowerCase().includes(q)) return true;
        // Match labels applied to this card
        const applied = cardLabels[card.id] || [];
  if (applied.some((lbl: Label) => lbl.name && lbl.name.toLowerCase().includes(q))) return true;
        return false;
      });
      
      if (filteredCards.length > 0) {
        filtered[Number(listId)] = filteredCards;
      } else {
        filtered[Number(listId)] = [];
      }
    });
    
    setVisibleCards(filtered);
  }, [searchFilter, cards, cardLabels]);
  
  // Função para definir o filtro de pesquisa
  const setCardVisibilityFilter = (searchTerm: string) => {
    setSearchFilter(searchTerm);
  };
  

  const fetchBoardData = async (boardId: number) => {
    setIsLoading(true);
    try {
      // Fetch board details
      const boardRes = await fetch(`/api/boards/${boardId}`);
      if (!boardRes.ok) throw new Error("Failed to fetch board");
      const board: Board = await boardRes.json();
      setCurrentBoard(board);

      // Fetch lists
      const listsRes = await fetch(`/api/boards/${boardId}/lists`);
      if (!listsRes.ok) throw new Error("Failed to fetch lists");
      const lists: List[] = await listsRes.json();
      setLists(lists);

      // Fetch cards for each list
      const cardsMap: { [listId: number]: Card[] } = {};
      for (const list of lists) {
        const cardsRes = await fetch(`/api/lists/${list.id}/cards`);
        if (!cardsRes.ok) throw new Error(`Failed to fetch cards for list ${list.id}`);
        const cards: Card[] = await cardsRes.json();
        cardsMap[list.id] = cards;
      }
      setCards(cardsMap);
      // Fetch card-label associations for the whole board (single request)
      try {
        const resp = await fetch(`/api/boards/${boardId}/cards/labels`);
        if (resp.ok) {
          const rows: { cardId: number; labelId: number }[] = await resp.json();
          // Build mapping from cardId -> Label[] using the labels list (fetched below)
          const map: { [cardId: number]: Label[] } = {};
          rows.forEach(r => {
            if (!map[r.cardId]) map[r.cardId] = [];
            // We'll map labelId -> Label objects after fetching board labels
            (map[r.cardId] as any).push(r.labelId);
          });
          // Temporarily store labelId arrays; we'll convert to Label[] after labels are loaded
          setCardLabels(map as any);
        }
      } catch (err) {
        console.warn('Failed to fetch board card labels during board load', err);
      }
      // Inicializar visibleCards com os mesmos cards carregados
      setVisibleCards(cardsMap);
      
      // Fetch labels for the board
      const labelsRes = await fetch(`/api/boards/${boardId}/labels`);
      if (labelsRes.ok) {
        const boardLabels: Label[] = await labelsRes.json();
        setLabels(boardLabels);
        // If we had stored temporary labelId arrays in cardLabels, convert them to Label[] now
        setCardLabels(prev => {
          const next: { [cardId: number]: Label[] } = {};
          for (const [cardIdStr, arr] of Object.entries(prev)) {
            const cardId = Number(cardIdStr);
            next[cardId] = (arr as any).map((lid: number) => boardLabels.find(l => l.id === lid)).filter(Boolean) as Label[];
          }
          return next;
        });
      }
    } catch (error) {
      console.error("Error fetching board data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBoards = useCallback(async () => {
    try {
      const res = await fetch('/api/boards');
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch (err) {
      console.error('Failed to fetch boards', err);
    }
  }, []);

  const createList = async (title: string, boardId: number): Promise<List> => {
    const newList = await apiRequest("POST", "/api/lists", { 
      title, 
      boardId, 
      order: lists.length 
    });
    setLists(prevLists => [...prevLists, newList]);
    setCards(prevCards => ({ ...prevCards, [newList.id]: [] }));
    return newList;
  };

  const updateList = async (id: number, updates: Partial<List>): Promise<List> => {
    const updatedList = await apiRequest("PATCH", `/api/lists/${id}`, updates);
    setLists(prevLists => 
      prevLists.map(list => list.id === id ? updatedList : list)
    );
    return updatedList;
  };

  const deleteList = async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/lists/${id}`);
    setLists(prevLists => prevLists.filter(list => list.id !== id));
    setCards(prevCards => {
      const newCards = { ...prevCards };
      delete newCards[id];
      return newCards;
    });
  };

  const createCard = async (title: string, listId: number): Promise<Card> => {
    const listCards = cards[listId] || [];
    const newCard = await apiRequest("POST", "/api/cards", { 
      title, 
      listId, 
      order: listCards.length 
    });
    
    // Atualizar cards e também o visibleCards para consistência
    const updatedCards = {
      ...cards,
      [listId]: [...(cards[listId] || []), newCard]
    };
    
    setCards(updatedCards);
    
    // Se não houver filtro de pesquisa ativo, atualizar visibleCards também
    if (!searchFilter.trim()) {
      setVisibleCards(updatedCards);
    }
    return newCard;
  };

  const updateCard = async (id: number, updates: Partial<Card>): Promise<Card> => {
    const updatedCard = await apiRequest("PATCH", `/api/cards/${id}`, updates);
    
    setCards(prevCards => {
      const newCards = { ...prevCards };
      
      // Find which list the card is in
      for (const [listId, cardsList] of Object.entries(newCards)) {
        const cardIndex = cardsList.findIndex(card => card.id === id);
        if (cardIndex !== -1) {
          // If the list hasn't changed, just update the card
          if (!updates.listId || updates.listId === Number(listId)) {
            newCards[Number(listId)] = cardsList.map(card => 
              card.id === id ? updatedCard : card
            );
          } else {
            // If the card moved to a different list
            // Remove from the old list
            newCards[Number(listId)] = cardsList.filter(card => card.id !== id);
            // Add to the new list
            const newListId = updates.listId;
            newCards[newListId] = [...(newCards[newListId] || []), updatedCard];
          }
          break;
        }
      }
      
      // Se não houver filtro de pesquisa ativo, atualizar visibleCards também
      if (!searchFilter.trim()) {
        setVisibleCards(newCards);
      } else {
        // Atualizar visibleCards, mas manter o filtro de pesquisa
        setCardVisibilityFilter(searchFilter);
      }
      
      return newCards;
    });
    
    return updatedCard;
  };

  const deleteCard = async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/cards/${id}`);
    
    setCards(prevCards => {
      const newCards = { ...prevCards };
      
      // Find which list the card is in and remove it
      for (const listId in newCards) {
        const cardIndex = newCards[Number(listId)].findIndex(card => card.id === id);
        if (cardIndex !== -1) {
          newCards[Number(listId)] = newCards[Number(listId)].filter(card => card.id !== id);
          break;
        }
      }
      
      // Atualizar também visibleCards para manter consistência
      if (!searchFilter.trim()) {
        setVisibleCards(newCards);
      } else {
        // Atualizar visibleCards, mas manter o filtro de pesquisa
        setCardVisibilityFilter(searchFilter);
      }
      
      return newCards;
    });
  };

  const moveCard = async (
    cardId: number, 
    sourceListId: number, 
    destinationListId: number, 
    newIndex: number
  ): Promise<void> => {
    // Find the card
    const cardToMove = cards[sourceListId].find(card => card.id === cardId);
    if (!cardToMove) return;

    // Optimistically update the UI
    setCards(prevCards => {
      const newCards = { ...prevCards };
      
      // Remove the card from the source list
      newCards[sourceListId] = prevCards[sourceListId].filter(card => card.id !== cardId);
      
      // Insert the card at the new position in the destination list
      const destinationCards = [...(prevCards[destinationListId] || [])];
      destinationCards.splice(newIndex, 0, { ...cardToMove, listId: destinationListId });
      newCards[destinationListId] = destinationCards;
      
      // Atualizar também visibleCards para arrastar e soltar funcionar com o filtro de pesquisa
      if (!searchFilter.trim()) {
        setVisibleCards(newCards);
      } else {
        // Durante drag-and-drop, atualizar visibleCards diretamente para UX consistente
        const visibleNewCards = { ...visibleCards };
        
        if (visibleNewCards[sourceListId]) {
          visibleNewCards[sourceListId] = visibleNewCards[sourceListId].filter(card => card.id !== cardId);
        }
        
        if (visibleNewCards[destinationListId]) {
          const visDestCards = [...(visibleNewCards[destinationListId] || [])];
          const canAddToVisible = cardToMove.title.toLowerCase().includes(searchFilter.toLowerCase());
          
          if (canAddToVisible) {
            visDestCards.splice(newIndex, 0, { ...cardToMove, listId: destinationListId });
            visibleNewCards[destinationListId] = visDestCards;
          }
        }
        
        setVisibleCards(visibleNewCards);
      }
      
      return newCards;
    });

    // Update the cards in the destination list to have the correct order
    const destinationCards = cards[destinationListId] || [];
    const updatedCards = [
      ...destinationCards.slice(0, newIndex),
      { ...cardToMove, listId: destinationListId },
      ...destinationCards.slice(newIndex)
    ];
    
    // Update the card in the backend with the new list ID and order
    try {
      await apiRequest("PATCH", `/api/cards/${cardId}`, { 
        listId: destinationListId, 
        order: newIndex 
      });
      
      // Update the order of all cards in the destination list
      const updatePromises = updatedCards.map((card, index) => 
        apiRequest("PATCH", `/api/cards/${card.id}`, { order: index })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error moving card:", error);
      // If there's an error, refetch the data to ensure UI consistency
      if (currentBoard) {
        fetchBoardData(currentBoard.id);
      }
    }
  };

  const moveList = async (listId: number, newIndex: number): Promise<void> => {
    // Find the list
    const listToMove = lists.find(list => list.id === listId);
    if (!listToMove) return;

    // Optimistically update the UI
    setLists(prevLists => {
      const newLists = [...prevLists];
      const oldIndex = newLists.findIndex(list => list.id === listId);
      
      // Remove the list from its current position
      const [removed] = newLists.splice(oldIndex, 1);
      // Insert it at the new position
      newLists.splice(newIndex, 0, removed);
      
      return newLists;
    });

    // Update the lists to have the correct order in the backend
    try {
      // Update the order of all lists
      const updatePromises = lists.map((list, index) => 
        apiRequest("PATCH", `/api/lists/${list.id}`, { order: index })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error moving list:", error);
      // If there's an error, refetch the data to ensure UI consistency
      if (currentBoard) {
        fetchBoardData(currentBoard.id);
      }
    }
  };

  // Comment methods
  const fetchComments = async (cardId: number, checklistItemId?: number): Promise<Comment[]> => {
    try {
      const query = checklistItemId ? `?checklistItemId=${checklistItemId}` : '';
      const fetchedComments: Comment[] = await apiRequest("GET", `/api/cards/${cardId}/comments${query}`);
      
      // Update the comments state
      setComments(prevComments => ({
        ...prevComments,
        [cardId]: fetchedComments
      }));
      
      return fetchedComments;
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  };

  const createComment = async (content: string, cardId: number, userName?: string, checklistItemId?: number | null): Promise<Comment> => {
    try {
      const body: any = { content, cardId, userName: userName || "Anonymous" };
      if (typeof checklistItemId !== 'undefined') body.checklistItemId = checklistItemId;

      const newComment: Comment = await apiRequest("POST", "/api/comments", body);
      
      // Update the comments state
      setComments(prevComments => ({
        ...prevComments,
        [cardId]: [...(prevComments[cardId] || []), newComment]
      }));
      
      return newComment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw new Error("Failed to create comment");
    }
  };

  const deleteComment = async (id: number, cardId: number, checklistItemId?: number): Promise<void> => {
    try {
      await apiRequest("DELETE", `/api/comments/${id}`);
      
      // Update the comments state
      setComments(prevComments => {
        const cardComments = prevComments[cardId] || [];
        return {
          ...prevComments,
          [cardId]: cardComments.filter(comment => comment.id !== id)
        };
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw new Error("Failed to delete comment");
    }
  };
  
  // Label methods
  const fetchLabels = async (boardId: number): Promise<Label[]> => {
    try {
      const fetchedLabels: Label[] = await apiRequest("GET", `/api/boards/${boardId}/labels`);
      
      setLabels(fetchedLabels);
      return fetchedLabels;
    } catch (error) {
      console.error("Error fetching labels:", error);
      return [];
    }
  };
  
  const createLabel = async (name: string, color: string, boardId: number): Promise<Label> => {
    try {
      const newLabel: Label = await apiRequest("POST", "/api/labels", {
        name,
        color,
        boardId
      });
      
      setLabels(prevLabels => [...prevLabels, newLabel]);
      
      return newLabel;
    } catch (error) {
      console.error("Error creating label:", error);
      throw new Error("Failed to create label");
    }
  };
  
  const fetchCardLabels = async (cardId: number): Promise<Label[]> => {
    try {
      const fetchedCardLabels: CardLabel[] = await apiRequest("GET", `/api/cards/${cardId}/labels`);
      
      // We need to map the label IDs to actual label objects
      const cardLabelObjects = fetchedCardLabels.map(cl => {
        return labels.find(label => label.id === cl.labelId);
      }).filter(Boolean) as Label[];
      
      setCardLabels(prevCardLabels => ({
        ...prevCardLabels,
        [cardId]: cardLabelObjects
      }));
      
      return cardLabelObjects;
    } catch (error) {
      console.error("Error fetching card labels:", error);
      return [];
    }
  };
  
  const addLabelToCard = async (cardId: number, labelId: number): Promise<void> => {
    try {
      // Verificar se a etiqueta já está aplicada ao cartão
      const currentLabels = cardLabels[cardId] || [];
      const isAlreadyApplied = currentLabels.some(label => label.id === labelId);
      
      if (isAlreadyApplied) {
        console.log(`Etiqueta ${labelId} já está aplicada ao cartão ${cardId}`);
        return; // Não faz nada se já está aplicada
      }

      // Find the label immediately
      const label = labels.find(l => l.id === labelId);
      
      if (!label) {
        throw new Error("Etiqueta não encontrada");
      }
      
      // Atualiza o estado local imediatamente para evitar atraso na UI
      setCardLabels(prevCardLabels => ({
        ...prevCardLabels,
        [cardId]: [...currentLabels, label]
      }));
      
      // Faz a requisição à API
      await apiRequest("POST", "/api/card-labels", {
        cardId,
        labelId
      });
    } catch (error) {
      console.error("Error adding label to card:", error);
      
      // Se houver erro, reverte a mudança no estado local
      const label = labels.find(l => l.id === labelId);
      if (label) {
        setCardLabels(prevCardLabels => ({
          ...prevCardLabels,
          [cardId]: (prevCardLabels[cardId] || []).filter(l => l.id !== labelId)
        }));
      }
      
      throw new Error("Falha ao adicionar etiqueta ao cartão");
    }
  };
  
  const removeLabelFromCard = async (cardId: number, labelId: number): Promise<void> => {
    try {
      // Atualiza o estado local imediatamente para evitar atraso na UI
      const previousCardLabels = cardLabels[cardId] || [];
      setCardLabels(prevCardLabels => {
        const cardLbls = prevCardLabels[cardId] || [];
        return {
          ...prevCardLabels,
          [cardId]: cardLbls.filter(label => label.id !== labelId)
        };
      });
      
      // Faz a requisição à API em paralelo
      await apiRequest("DELETE", `/api/cards/${cardId}/labels/${labelId}`);
    } catch (error) {
      console.error("Error removing label from card:", error);
      
      // Se houver erro, reverte a mudança no estado local
      const label = labels.find(l => l.id === labelId);
      if (label && cardLabels[cardId]) {
        setCardLabels(prevCardLabels => ({
          ...prevCardLabels,
          [cardId]: [...(prevCardLabels[cardId] || []), label]
        }));
      }
      
      throw new Error("Falha ao remover etiqueta do cartão");
    }
  };
  
  // Card Members methods
  const fetchUsers = async (): Promise<User[]> => {
    try {
      const fetchedUsers: User[] = await apiRequest("GET", "/api/users");
      
      setUsers(fetchedUsers);
      return fetchedUsers;
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  };
  
  const fetchCardMembers = async (cardId: number): Promise<User[]> => {
    try {
      const fetchedMembers: User[] = await apiRequest("GET", `/api/cards/${cardId}/members`);
      
      // Update the card members state
      setCardMembers(prevCardMembers => ({
        ...prevCardMembers,
        [cardId]: fetchedMembers
      }));
      
      return fetchedMembers;
    } catch (error) {
      console.error("Erro ao buscar membros do cartão:", error);
      return [];
    }
  };
  
  const addMemberToCard = async (cardId: number, userId: number): Promise<void> => {
    try {
      await apiRequest("POST", "/api/card-members", {
        cardId,
        userId
      });
      
      // Find the user and add them to the card's members
      const user = users.find(u => u.id === userId);
      if (user) {
        setCardMembers(prevCardMembers => ({
          ...prevCardMembers,
          [cardId]: [...(prevCardMembers[cardId] || []), user]
        }));
      }
    } catch (error) {
      console.error("Erro ao adicionar membro ao cartão:", error);
      throw new Error("Falha ao adicionar membro ao cartão");
    }
  };
  
  const removeMemberFromCard = async (cardId: number, userId: number): Promise<void> => {
    try {
      await apiRequest("DELETE", `/api/cards/${cardId}/members/${userId}`);
      
      // Remove the user from the card's members
      setCardMembers(prevCardMembers => {
        const cardMbrs = prevCardMembers[cardId] || [];
        return {
          ...prevCardMembers,
          [cardId]: cardMbrs.filter(member => member.id !== userId)
        };
      });
    } catch (error) {
      console.error("Erro ao remover membro do cartão:", error);
      throw new Error("Falha ao remover membro do cartão");
    }
  };

  // Checklist methods
  const fetchChecklists = async (cardId: number): Promise<Checklist[]> => {
    try {
      const fetchedChecklists: Checklist[] = await apiRequest("GET", `/api/cards/${cardId}/checklists`);
      
      // Update the checklists state
      setChecklists(prevChecklists => ({
        ...prevChecklists,
        [cardId]: fetchedChecklists
      }));
      
      return fetchedChecklists;
    } catch (error) {
      console.error("Erro ao buscar checklists:", error);
      return [];
    }
  };
  
  const createChecklist = async (title: string, cardId: number): Promise<Checklist> => {
    try {
      // Get existing checklists to determine order
      const cardChecklists = checklists[cardId] || [];
      
      const newChecklist: Checklist = await apiRequest("POST", "/api/checklists", {
        title,
        cardId,
        order: cardChecklists.length
      });
      
      // Update the checklists state
      setChecklists(prevChecklists => ({
        ...prevChecklists,
        [cardId]: [...(prevChecklists[cardId] || []), newChecklist]
      }));
      
      // Initialize empty items array for this checklist
      setChecklistItems(prevItems => ({
        ...prevItems,
        [newChecklist.id]: []
      }));
      
      return newChecklist;
    } catch (error) {
      console.error("Erro ao criar checklist:", error);
      throw new Error("Falha ao criar checklist");
    }
  };
  
  const updateChecklist = async (id: number, updates: Partial<Checklist>): Promise<Checklist> => {
    try {
      const updatedChecklist: Checklist = await apiRequest("PATCH", `/api/checklists/${id}`, updates);
      
      // Find which card this checklist belongs to
      let cardId = 0;
      for (const [cId, checklistList] of Object.entries(checklists)) {
        if (checklistList.some(cl => cl.id === id)) {
          cardId = Number(cId);
          break;
        }
      }
      
      if (cardId > 0) {
        // Update the checklists state
        setChecklists(prevChecklists => {
          const cardChecklists = prevChecklists[cardId] || [];
          return {
            ...prevChecklists,
            [cardId]: cardChecklists.map(cl => cl.id === id ? updatedChecklist : cl)
          };
        });
      }
      
      return updatedChecklist;
    } catch (error) {
      console.error("Erro ao atualizar checklist:", error);
      throw new Error("Falha ao atualizar checklist");
    }
  };
  
  const deleteChecklist = async (id: number): Promise<void> => {
    try {
      await apiRequest("DELETE", `/api/checklists/${id}`);
      
      // Find which card this checklist belongs to
      let cardId = 0;
      for (const [cId, checklistList] of Object.entries(checklists)) {
        if (checklistList.some(cl => cl.id === id)) {
          cardId = Number(cId);
          break;
        }
      }
      
      if (cardId > 0) {
        // Remove checklist from state
        setChecklists(prevChecklists => {
          const cardChecklists = prevChecklists[cardId] || [];
          return {
            ...prevChecklists,
            [cardId]: cardChecklists.filter(cl => cl.id !== id)
          };
        });
      }
      
      // Also remove all items for this checklist
      setChecklistItems(prevItems => {
        const newItems = { ...prevItems };
        delete newItems[id];
        return newItems;
      });
    } catch (error) {
      console.error("Erro ao excluir checklist:", error);
      throw new Error("Falha ao excluir checklist");
    }
  };
  
  // Checklist Item methods
  const fetchChecklistItems = async (checklistId: number): Promise<ChecklistItem[]> => {
    try {
      const fetchedItems: ChecklistItem[] = await apiRequest("GET", `/api/checklists/${checklistId}/items`);
      
      // Update the checklistItems state
      setChecklistItems(prevItems => ({
        ...prevItems,
        [checklistId]: fetchedItems
      }));
      
      return fetchedItems;
    } catch (error) {
      console.error("Erro ao buscar itens da checklist:", error);
      return [];
    }
  };
  
  const createChecklistItem = async (content: string, checklistId: number, options: { completed?: boolean; parentItemId?: number } = {}): Promise<ChecklistItem> => {
    try {
      // Get existing items to determine order
      const checklistItemsList = checklistItems[checklistId] || [];
      const body: any = {
        content,
        checklistId,
        order: checklistItemsList.length,
        completed: options.completed ?? false,
      };
      if (options.parentItemId !== undefined && options.parentItemId !== null) {
        body.parentItemId = options.parentItemId;
      }

      const newItem: ChecklistItem = await apiRequest("POST", "/api/checklist-items", body);
      
      // Update the checklistItems state
      setChecklistItems(prevItems => ({
        ...prevItems,
        [checklistId]: [...(prevItems[checklistId] || []), newItem]
      }));
      
      return newItem;
    } catch (error) {
      console.error("Erro ao criar item da checklist:", error);
      throw new Error("Falha ao criar item da checklist");
    }
  };
  
  const updateChecklistItem = async (id: number, updates: Partial<ChecklistItem>): Promise<ChecklistItem> => {
    try {
      const updatedItem: ChecklistItem = await apiRequest("PATCH", `/api/checklist-items/${id}`, updates);
      
      // Find which checklist this item belongs to
      let checklistId = 0;
      for (const [clId, itemsList] of Object.entries(checklistItems)) {
        if (itemsList.some(item => item.id === id)) {
          checklistId = Number(clId);
          break;
        }
      }
      
      if (checklistId > 0) {
        // Update the checklistItems state
        setChecklistItems(prevItems => {
          const items = prevItems[checklistId] || [];
          return {
            ...prevItems,
            [checklistId]: items.map(item => item.id === id ? updatedItem : item)
          };
        });
      }
      
      return updatedItem;
    } catch (error) {
      console.error("Erro ao atualizar item da checklist:", error);
      throw new Error("Falha ao atualizar item da checklist");
    }
  };
  
  const deleteChecklistItem = async (id: number, checklistId: number): Promise<void> => {
    try {
      await apiRequest("DELETE", `/api/checklist-items/${id}`);
      
      // Update the checklistItems state
      setChecklistItems(prevItems => {
        const items = prevItems[checklistId] || [];
        return {
          ...prevItems,
          [checklistId]: items.filter(item => item.id !== id)
        };
      });
    } catch (error) {
      console.error("Erro ao excluir item da checklist:", error);
      throw new Error("Falha ao excluir item da checklist");
    }
  };

  // Board methods
  const createBoard = async (boardData: { title: string, color?: string, userId?: number | undefined }): Promise<Board> => {
    try {
      const newBoard: Board = await apiRequest("POST", "/api/boards", boardData);
      await fetchBoards(); // Refresh boards list after creation
      return newBoard;
    } catch (error) {
      console.error("Erro ao criar quadro:", error);
      throw new Error("Falha ao criar quadro");
    }
  };

  const updateBoard = async (id: number, updates: Partial<Board>): Promise<Board> => {
    try {
      const updatedBoard: Board = await apiRequest("PATCH", `/api/boards/${id}`, updates);
      
      if (currentBoard && currentBoard.id === id) {
        setCurrentBoard(updatedBoard);
      }
      
      await fetchBoards(); // Refresh boards list after update
      return updatedBoard;
    } catch (error) {
      console.error("Erro ao atualizar quadro:", error);
      throw new Error("Falha ao atualizar quadro");
    }
  };

  const deleteBoard = async (id: number): Promise<boolean> => {
    try {
      await apiRequest("DELETE", `/api/boards/${id}`);
      
      if (currentBoard && currentBoard.id === id) {
        setCurrentBoard(null);
        setLists([]);
        setCards({});
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao excluir quadro:", error);
      throw new Error("Falha ao excluir quadro");
    }
  };
  
  const value = useMemo(() => ({
    currentBoard,
    lists,
    cards,
    comments,
    labels,
    cardLabels,
    cardMembers,
    users,
    checklists,
    checklistItems,
    isLoading,
    visibleCards, // Adicionado para suporte à pesquisa
    setCardVisibilityFilter, // Adicionado para suporte à pesquisa
    fetchBoardData,
    boards,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    moveList,
    fetchComments,
    createComment,
    deleteComment,
    fetchLabels,
    createLabel,
    fetchCardLabels,
    addLabelToCard,
    removeLabelFromCard,
    fetchCardMembers,
    fetchUsers,
    addMemberToCard,
    removeMemberFromCard,
    // Checklist methods
    fetchChecklists,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    // Checklist Item methods
    fetchChecklistItems,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    // Checklist item members
    fetchChecklistItemMembers: async (checklistItemId: number): Promise<User[]> => {
      const members: User[] = await apiRequest("GET", `/api/checklist-items/${checklistItemId}/members`);
      return members;
    },
    addMemberToChecklistItem: async (checklistItemId: number, userId: number): Promise<void> => {
      await apiRequest("POST", `/api/checklist-items/${checklistItemId}/members`, { userId });
    },
    removeMemberFromChecklistItem: async (checklistItemId: number, userId: number): Promise<void> => {
      await apiRequest("DELETE", `/api/checklist-items/${checklistItemId}/members/${userId}`);
    }
  }), [
    currentBoard,
    lists,
    cards,
    comments,
    labels,
    cardLabels,
    cardMembers,
    users,
    checklists,
    checklistItems,
    isLoading,
    visibleCards,
    setCardVisibilityFilter,
    fetchBoardData,
    boards,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    moveList,
    fetchComments,
    createComment,
    deleteComment,
    fetchLabels,
    createLabel,
    fetchCardLabels,
    addLabelToCard,
    removeLabelFromCard,
    fetchCardMembers,
    fetchUsers,
    addMemberToCard,
    removeMemberFromCard,
    fetchChecklists,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    fetchChecklistItems,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem
  ]);

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
}

