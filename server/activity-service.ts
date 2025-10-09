/**
 * activity-service.ts
 * 
 * Serviço de atividades de negócio para o dashboard administrativo.
 * Registra eventos específicos relevantes para métricas de produtividade e timeline.
 */

import { Request } from "express";
import { storage as appStorage } from "./db-storage";
import { InsertActivity } from "@shared/schema";

/**
 * Tipos de atividades de negócio
 */
export enum ActivityType {
  // Board/Portfolio activities
  BOARD_CREATED = "board_created",
  BOARD_UPDATED = "board_updated",
  BOARD_DELETED = "board_deleted",
  PORTFOLIO_CREATED = "portfolio_created",
  
  // List activities
  LIST_CREATED = "list_created",
  LIST_UPDATED = "list_updated",
  LIST_DELETED = "list_deleted",
  
  // Card activities
  CARD_CREATED = "card_created",
  CARD_UPDATED = "card_updated",
  CARD_DELETED = "card_deleted",
  CARD_MOVED = "card_moved",
  CARD_ASSIGNED = "card_assigned",
  
  // Task/Checklist activities
  CHECKLIST_CREATED = "checklist_created",
  CHECKLIST_COMPLETED = "checklist_completed",
  TASK_COMPLETED = "task_completed",
  TASK_ASSIGNED = "task_assigned",
  SUBTASK_COMPLETED = "subtask_completed",
  SUBTASK_ASSIGNED = "subtask_assigned",
  
  // Comment activities
  COMMENT_CREATED = "comment_created",
  
  // Member activities
  MEMBER_INVITED = "member_invited",
  MEMBER_JOINED = "member_joined",
  MEMBER_REMOVED = "member_removed",
  
  // User activities
  USER_REGISTERED = "user_registered"
}

/**
 * Tipos de entidades para atividades
 */
export enum ActivityEntityType {
  BOARD = "board",
  LIST = "list",
  CARD = "card",
  CHECKLIST = "checklist",
  CHECKLIST_ITEM = "checklist_item",
  COMMENT = "comment",
  USER = "user",
  PORTFOLIO = "portfolio"
}

/**
 * Interface para metadados de atividade
 */
interface ActivityMetadata {
  [key: string]: any;
}

/**
 * Serviço principal de atividades
 */
export class ActivityService {
  
  /**
   * Registra uma atividade de negócio de forma assíncrona
   */
  static async log(params: {
    req?: Request;
    userId?: number;
    boardId?: number;
    activityType: ActivityType;
    entityType: ActivityEntityType;
    entityId?: number;
    description: string;
    metadata?: ActivityMetadata;
  }): Promise<void> {
    // Executa de forma assíncrona para não bloquear a operação principal
    setImmediate(async () => {
      try {
        const activityData: InsertActivity = {
          userId: params.userId || params.req?.user?.id!,
          boardId: params.boardId,
          activityType: params.activityType,
          entityType: params.entityType,
          entityId: params.entityId,
          description: params.description,
          metadata: params.metadata ? JSON.stringify(params.metadata) : undefined
        };

        await appStorage.createActivity(activityData);
        
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 [ACTIVITY] ${params.activityType}: ${params.description}`);
        }
        
      } catch (error) {
        // Log de erro mas não falha a operação principal
        console.error('❌ [ACTIVITY] Erro ao registrar atividade:', error);
      }
    });
  }

  /**
   * Métodos de conveniência para atividades específicas de Board
   */
  
  static async logBoardCreated(req: Request, boardId: number, boardTitle: string): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.BOARD_CREATED,
      entityType: ActivityEntityType.BOARD,
      entityId: boardId,
      description: `Criou o quadro "${boardTitle}"`,
      metadata: {
        boardTitle,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async logBoardUpdated(req: Request, boardId: number, boardTitle: string, changes: any): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.BOARD_UPDATED,
      entityType: ActivityEntityType.BOARD,
      entityId: boardId,
      description: `Atualizou o quadro "${boardTitle}"`,
      metadata: {
        boardTitle,
        changes,
        updatedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Métodos de conveniência para atividades de Card
   */
  
  static async logCardCreated(req: Request, boardId: number, cardId: number, cardTitle: string): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.CARD_CREATED,
      entityType: ActivityEntityType.CARD,
      entityId: cardId,
      description: `Criou o cartão "${cardTitle}"`,
      metadata: {
        cardTitle,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async logCardMoved(req: Request, boardId: number, cardId: number, cardTitle: string, fromList: string, toList: string): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.CARD_MOVED,
      entityType: ActivityEntityType.CARD,
      entityId: cardId,
      description: `Moveu "${cardTitle}" de "${fromList}" para "${toList}"`,
      metadata: {
        cardTitle,
        fromList,
        toList,
        movedAt: new Date().toISOString()
      }
    });
  }

  static async logCardAssigned(req: Request, boardId: number, cardId: number, cardTitle: string, assignedToUserId: number, assignedToUsername: string): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.CARD_ASSIGNED,
      entityType: ActivityEntityType.CARD,
      entityId: cardId,
      description: `Atribuiu o cartão "${cardTitle}" para ${assignedToUsername}`,
      metadata: {
        cardTitle,
        assignedToUserId,
        assignedToUsername,
        assignedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Métodos de conveniência para atividades de Task/Checklist
   */
  
  static async logTaskCompleted(req: Request, boardId: number, cardId: number, taskTitle: string): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.TASK_COMPLETED,
      entityType: ActivityEntityType.CHECKLIST_ITEM,
      entityId: cardId,
      description: `Concluiu a tarefa "${taskTitle}"`,
      metadata: {
        taskTitle,
        completedAt: new Date().toISOString()
      }
    });
  }

  static async logSubtaskCompleted(req: Request, boardId: number, subtaskId: number, subtaskTitle: string, parentTaskTitle: string): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.SUBTASK_COMPLETED,
      entityType: ActivityEntityType.CHECKLIST_ITEM,
      entityId: subtaskId,
      description: `Concluiu a subtarefa "${subtaskTitle}" em "${parentTaskTitle}"`,
      metadata: {
        subtaskTitle,
        parentTaskTitle,
        completedAt: new Date().toISOString()
      }
    });
  }

  static async logChecklistCompleted(req: Request, boardId: number, checklistId: number, checklistTitle: string): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.CHECKLIST_COMPLETED,
      entityType: ActivityEntityType.CHECKLIST,
      entityId: checklistId,
      description: `Concluiu o checklist "${checklistTitle}"`,
      metadata: {
        checklistTitle,
        completedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Métodos de conveniência para atividades de Member
   */
  
  static async logMemberInvited(req: Request, boardId: number, invitedUserId: number, invitedUsername: string): Promise<void> {
    return this.log({
      req,
      boardId,
      activityType: ActivityType.MEMBER_INVITED,
      entityType: ActivityEntityType.USER,
      entityId: invitedUserId,
      description: `Convidou ${invitedUsername} para o projeto`,
      metadata: {
        invitedUsername,
        invitedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Métodos de conveniência para atividades de Comment
   */
  
  static async logCommentCreated(req: Request, boardId: number, cardId: number, commentContent: string): Promise<void> {
    const truncatedContent = commentContent.length > 50 
      ? commentContent.substring(0, 50) + "..." 
      : commentContent;
      
    return this.log({
      req,
      boardId,
      activityType: ActivityType.COMMENT_CREATED,
      entityType: ActivityEntityType.COMMENT,
      entityId: cardId,
      description: `Comentou: "${truncatedContent}"`,
      metadata: {
        fullContent: commentContent,
        cardId,
        commentedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Métodos de conveniência para atividades de User
   */
  
  static async logUserRegistered(userId: number, username: string): Promise<void> {
    return this.log({
      userId,
      activityType: ActivityType.USER_REGISTERED,
      entityType: ActivityEntityType.USER,
      entityId: userId,
      description: `Usuário ${username} se registrou no sistema`,
      metadata: {
        username,
        registeredAt: new Date().toISOString()
      }
    });
  }
}