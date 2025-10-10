/**
 * audit-service.ts
 * 
 * Serviço de logs de auditoria para capturar todas as operações importantes do sistema.
 * Implementa logging assíncrono para não impactar a performance das operações principais.
 */

import { Request } from "express";
import { storage as appStorage } from "./db-storage";
import { InsertAuditLog } from "@shared/schema";

/**
 * Tipos de ações de auditoria
 */
export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ", 
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  ASSIGN = "ASSIGN",
  UNASSIGN = "UNASSIGN",
  COMPLETE = "COMPLETE",
  UNCOMPLETE = "UNCOMPLETE",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  UPLOAD = "UPLOAD",
  VIEW = "VIEW"
}

/**
 * Tipos de entidades que podem ser auditadas
 */
export enum EntityType {
  USER = "user",
  BOARD = "board",
  LIST = "list", 
  CARD = "card",
  COMMENT = "comment",
  LABEL = "label",
  CHECKLIST = "checklist",
  CHECKLIST_ITEM = "checklist_item",
  PORTFOLIO = "portfolio",
  NOTIFICATION = "notification",
  BOARD_MEMBER = "board_member",
  CARD_MEMBER = "card_member",
  CARD_LABEL = "card_label",
  SESSION = "session"
}

/**
 * Interface para metadados de auditoria
 */
interface AuditMetadata {
  [key: string]: any;
}

/**
 * Serviço principal de auditoria
 */
export class AuditService {
  
  /**
   * Registra uma operação de auditoria de forma assíncrona
   */
  static async log(params: {
    req?: Request;
    userId?: number;
    sessionId?: string;
    action: AuditAction;
    entityType: EntityType;
    entityId?: string | number;
    oldData?: any;
    newData?: any;
    metadata?: AuditMetadata;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    // Executa de forma assíncrona para não bloquear a operação principal
    setImmediate(async () => {
      try {
        const auditData: InsertAuditLog = {
          userId: params.userId || params.req?.user?.id,
          sessionId: params.sessionId || params.req?.sessionID,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId?.toString(),
          ipAddress: params.ipAddress || params.req?.ip,
          userAgent: params.userAgent || params.req?.get('User-Agent'),
          oldData: params.oldData ? JSON.stringify(params.oldData) : undefined,
          newData: params.newData ? JSON.stringify(params.newData) : undefined,
          metadata: params.metadata ? JSON.stringify(params.metadata) : undefined
        };

        await appStorage.createAuditLog(auditData);
        
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 [AUDIT] ${params.action} ${params.entityType} ${params.entityId || ''} por usuário ${auditData.userId || 'anônimo'}`);
        }
        
      } catch (error) {
        // Log de erro mas não falha a operação principal
        console.error('❌ [AUDIT] Erro ao registrar log de auditoria:', error);
      }
    });
  }

  /**
   * Métodos de conveniência para ações específicas
   */
  
  static async logLogin(req: Request, userId: number): Promise<void> {
    return this.log({
      req,
      userId,
      action: AuditAction.LOGIN,
      entityType: EntityType.SESSION,
      metadata: {
        loginTime: new Date().toISOString(),
        method: 'local'
      }
    });
  }

  static async logLogout(req: Request, userId: number): Promise<void> {
    return this.log({
      req,
      userId,
      action: AuditAction.LOGOUT,
      entityType: EntityType.SESSION,
      metadata: {
        logoutTime: new Date().toISOString()
      }
    });
  }

  static async logCreate(req: Request, entityType: EntityType, entityId: string | number, newData: any): Promise<void> {
    return this.log({
      req,
      action: AuditAction.CREATE,
      entityType,
      entityId,
      newData
    });
  }

  static async logUpdate(req: Request, entityType: EntityType, entityId: string | number, oldData: any, newData: any): Promise<void> {
    return this.log({
      req,
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      oldData,
      newData
    });
  }

  static async logDelete(req: Request, entityType: EntityType, entityId: string | number, oldData: any): Promise<void> {
    return this.log({
      req,
      action: AuditAction.DELETE,
      entityType,
      entityId,
      oldData
    });
  }

  static async logPasswordChange(req: Request, targetUserId: number): Promise<void> {
    return this.log({
      req,
      action: AuditAction.PASSWORD_CHANGE,
      entityType: EntityType.USER,
      entityId: targetUserId,
      metadata: {
        changedBy: req.user?.id,
        changeTime: new Date().toISOString()
      }
    });
  }

  static async logPermissionChange(req: Request, targetUserId: number, oldRole: string, newRole: string): Promise<void> {
    return this.log({
      req,
      action: AuditAction.PERMISSION_CHANGE,
      entityType: EntityType.USER,
      entityId: targetUserId,
      oldData: { role: oldRole },
      newData: { role: newRole },
      metadata: {
        changedBy: req.user?.id,
        changeTime: new Date().toISOString()
      }
    });
  }

  static async logAssignment(req: Request, entityType: EntityType, entityId: string | number, targetUserId: number): Promise<void> {
    return this.log({
      req,
      action: AuditAction.ASSIGN,
      entityType,
      entityId,
      newData: { assignedUserId: targetUserId },
      metadata: {
        assignedBy: req.user?.id,
        assignmentTime: new Date().toISOString()
      }
    });
  }

  static async logUnassignment(req: Request, entityType: EntityType, entityId: string | number, targetUserId: number): Promise<void> {
    return this.log({
      req,
      action: AuditAction.UNASSIGN,
      entityType,
      entityId,
      oldData: { assignedUserId: targetUserId },
      metadata: {
        unassignedBy: req.user?.id,
        unassignmentTime: new Date().toISOString()
      }
    });
  }

  static async logTaskCompletion(req: Request, entityType: EntityType, entityId: string | number, completed: boolean): Promise<void> {
    return this.log({
      req,
      action: completed ? AuditAction.COMPLETE : AuditAction.UNCOMPLETE,
      entityType,
      entityId,
      newData: { completed },
      metadata: {
        completedBy: req.user?.id,
        completionTime: new Date().toISOString()
      }
    });
  }

  static async logFileUpload(req: Request, fileName: string, fileSize: number, entityId: string | number): Promise<void> {
    return this.log({
      req,
      action: AuditAction.UPLOAD,
      entityType: EntityType.USER,
      entityId,
      newData: { fileName, fileSize },
      metadata: {
        uploadTime: new Date().toISOString(),
        fileType: fileName.split('.').pop(),
        uploadBy: req.user?.id
      }
    });
  }

  static async logNotificationAction(req: Request, notificationId: number, action: 'read' | 'delete' | 'mark_all_read'): Promise<void> {
    return this.log({
      req,
      action: action === 'read' || action === 'mark_all_read' ? AuditAction.UPDATE : AuditAction.DELETE,
      entityType: EntityType.NOTIFICATION,
      entityId: notificationId,
      metadata: {
        notificationAction: action,
        actionTime: new Date().toISOString()
      }
    });
  }

  static async logSystemOperation(req: Request, operation: string, metadata?: AuditMetadata): Promise<void> {
    return this.log({
      req,
      action: AuditAction.VIEW,
      entityType: EntityType.SESSION,
      entityId: 'system',
      metadata: {
        operation,
        operationTime: new Date().toISOString(),
        ...metadata
      }
    });
  }
}