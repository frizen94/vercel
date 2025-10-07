/**
 * notification-service.ts
 * 
 * Serviço para gerenciar notificações automatizadas do sistema.
 * Implementa as regras de negócio para quando notificar usuários sobre:
 * - Conclusão de tarefas/subtarefas
 * - Tarefas atrasadas
 * - Atribuições de tarefas
 */

import { storage as appStorage } from "./db-storage";
import { InsertNotification } from "@shared/schema";

export interface NotificationContext {
  cardId?: number;
  checklistItemId?: number;
  boardId?: number;
  actionUserId: number; // Usuário que executou a ação
  actionType: 'task_completed' | 'task_overdue' | 'subtask_completed' | 'subtask_overdue';
}

/**
 * Cria notificações automáticas baseadas nas regras de negócio:
 * 
 * 1. Quando uma tarefa é concluída ou fica atrasada:
 *    - Notifica o usuário que foi atribuído à tarefa (se não for o mesmo que executou a ação)
 *    - Notifica todos os administradores do projeto
 * 
 * 2. Quando uma subtarefa é concluída ou fica atrasada:
 *    - Notifica o usuário que foi atribuído à subtarefa (se não for o mesmo que executou a ação)
 *    - Notifica todos os administradores do projeto
 */
export async function createAutomaticNotifications(context: NotificationContext): Promise<void> {
  try {
    const { cardId, checklistItemId, boardId, actionUserId, actionType } = context;

    // Buscar informações necessárias
    let targetBoardId = boardId;
    let assignedUserId: number | null = null;
    let taskTitle = '';

    if (checklistItemId) {
      // É uma subtarefa
      const checklistItem = await appStorage.getChecklistItem(checklistItemId);
      if (!checklistItem) return;

      assignedUserId = checklistItem.assignedToUserId;
      taskTitle = checklistItem.content;

      if (!targetBoardId && cardId) {
        const card = await appStorage.getCard(cardId);
        if (card) {
          const list = await appStorage.getList(card.listId);
          if (list) {
            targetBoardId = list.boardId;
          }
        }
      }
    } else if (cardId) {
      // É uma tarefa (cartão)
      const card = await appStorage.getCard(cardId);
      if (!card) return;

      taskTitle = card.title;

      // Para cartões, buscar o primeiro membro atribuído
      const cardMembers = await appStorage.getCardMembers(cardId);
      if (cardMembers.length > 0) {
        assignedUserId = cardMembers[0].id;
      }

      if (!targetBoardId) {
        const list = await appStorage.getList(card.listId);
        if (list) {
          targetBoardId = list.boardId;
        }
      }
    }

    if (!targetBoardId) return;

    // Buscar informações do quadro para contexto (buscar primeiro para pegar o criador)
    const board = await appStorage.getBoard(targetBoardId);
    const boardTitle = board?.title || 'Projeto';
    const boardCreatorId = board?.userId; // Criador do quadro

    // Buscar administradores do projeto
    const boardMembers = await appStorage.getBoardMembers(targetBoardId);
    const admins = boardMembers.filter(member => 
      member.boardRole === 'owner' || member.boardRole === 'admin'
    );

    // Buscar informações do usuário que executou a ação
    const actionUser = await appStorage.getUser(actionUserId);
    const actionUserName = actionUser?.name || actionUser?.username || 'Usuário';

    // Lista de usuários para notificar (evitar duplicatas)
    const usersToNotify = new Set<number>();



    // 1. Notificar usuário atribuído (se existir e não for o mesmo que executou a ação)
    if (assignedUserId && assignedUserId !== actionUserId) {
      usersToNotify.add(assignedUserId);
    }

    // 2. Notificar todos os administradores do projeto (exceto o que executou a ação)
    admins.forEach(admin => {
      if (admin.id !== actionUserId) {
        usersToNotify.add(admin.id);
      }
    });

    // 3. Notificar o criador do quadro (se não for o mesmo que executou a ação)
    if (boardCreatorId && boardCreatorId !== actionUserId) {
      usersToNotify.add(boardCreatorId);
    }

    // Criar notificações
    const notifications = Array.from(usersToNotify).map(userId => {
      const isAssignedUser = userId === assignedUserId;
      
      return createNotificationData({
        userId,
        actionType,
        taskTitle,
        boardTitle,
        actionUserName,
        isAssignedUser,
        cardId,
        checklistItemId
      });
    });

    // Inserir todas as notificações
    await Promise.all(
      notifications.map(notification => appStorage.createNotification(notification))
    );

    console.log(`Criadas ${notifications.length} notificações para ${actionType} em "${taskTitle}"`);

  } catch (error) {
    console.error('Erro ao criar notificações automáticas:', error);
  }
}

/**
 * Cria os dados de notificação baseados no contexto
 */
function createNotificationData({
  userId,
  actionType,
  taskTitle,
  boardTitle,
  actionUserName,
  isAssignedUser,
  cardId,
  checklistItemId
}: {
  userId: number;
  actionType: string;
  taskTitle: string;
  boardTitle: string;
  actionUserName: string;
  isAssignedUser: boolean;
  cardId?: number;
  checklistItemId?: number;
}): InsertNotification {
  
  let title: string;
  let message: string;
  let type: string;

  const taskType = checklistItemId ? 'subtarefa' : 'tarefa';
  
  switch (actionType) {
    case 'task_completed':
    case 'subtask_completed':
      if (isAssignedUser) {
        title = `${taskType === 'tarefa' ? 'Tarefa' : 'Subtarefa'} concluída`;
        message = `Sua ${taskType} "${taskTitle}" foi marcada como concluída por ${actionUserName} no projeto "${boardTitle}".`;
      } else {
        title = `${taskType === 'tarefa' ? 'Tarefa' : 'Subtarefa'} concluída no projeto`;
        message = `A ${taskType} "${taskTitle}" foi marcada como concluída por ${actionUserName} no projeto "${boardTitle}".`;
      }
      type = 'task_completed';
      break;

    case 'task_overdue':
    case 'subtask_overdue':
      if (isAssignedUser) {
        title = `${taskType === 'tarefa' ? 'Tarefa' : 'Subtarefa'} atrasada`;
        message = `Sua ${taskType} "${taskTitle}" está atrasada no projeto "${boardTitle}".`;
      } else {
        title = `${taskType === 'tarefa' ? 'Tarefa' : 'Subtarefa'} atrasada no projeto`;
        message = `A ${taskType} "${taskTitle}" está atrasada no projeto "${boardTitle}".`;
      }
      type = 'deadline';
      break;

    default:
      title = 'Notificação';
      message = `Atividade em "${taskTitle}" no projeto "${boardTitle}".`;
      type = 'general';
  }

  // URL de ação para redirecionar ao clicar na notificação
  let actionUrl = `/board/${cardId ? `card/${cardId}` : ''}`;
  if (checklistItemId) {
    actionUrl += `?checklist_item=${checklistItemId}`;
  }

  return {
    userId,
    type,
    title,
    message,
    read: false,
    actionUrl,
    relatedCardId: cardId || null,
    relatedChecklistItemId: checklistItemId || null,
    fromUserId: null // Sistema automático
  };
}

/**
 * Verifica e cria notificações para tarefas atrasadas
 * Esta função deve ser executada periodicamente (por exemplo, diariamente)
 */
export async function checkOverdueTasks(): Promise<void> {
  try {
    console.log('Verificando tarefas atrasadas...');
    
    // Esta seria implementada com uma query específica no banco
    // Por enquanto, vamos deixar como placeholder para implementação futura
    
    // TODO: Implementar verificação de tarefas atrasadas
    // 1. Buscar todos os cartões com dueDate < hoje e completed = false
    // 2. Buscar todos os checklist items com dueDate < hoje e completed = false
    // 3. Para cada item atrasado, verificar se já foi enviada notificação hoje
    // 4. Se não foi enviada, criar notificação usando createAutomaticNotifications
    
  } catch (error) {
    console.error('Erro ao verificar tarefas atrasadas:', error);
  }
}