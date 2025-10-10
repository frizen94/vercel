/**
 * audit-middleware.ts
 * 
 * Middleware automático para capturar todas as operações mutantes (POST/PUT/PATCH/DELETE)
 * e registrar logs de auditoria de forma transparente.
 */

import { Request, Response, NextFunction } from "express";
import { AuditService, AuditAction, EntityType } from "./audit-service";
import { storage as appStorage } from "./db-storage";

/**
 * Mapeamento de métodos HTTP para ações de auditoria
 */
const methodToAction: { [key: string]: AuditAction } = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE
};

/**
 * Extrai informações da URL para determinar o tipo de entidade e ID
 */
function parseEntityFromUrl(path: string): { entityType?: EntityType; entityId?: string; subAction?: string } {
  const segments = path.split('/').filter(Boolean);
  
  // Mapear caminhos da API para tipos de entidade
  if (segments.includes('users')) {
    const userIndex = segments.indexOf('users');
    const userId = segments[userIndex + 1];
    const subAction = segments[userIndex + 2]; // pode ser 'change-password', 'profile-image', etc.
    return {
      entityType: EntityType.USER,
      entityId: userId,
      subAction
    };
  }
  
  if (segments.includes('boards')) {
    const boardIndex = segments.indexOf('boards');
    const boardId = segments[boardIndex + 1];
    const subAction = segments[boardIndex + 2]; // pode ser 'members', 'labels', etc.
    return {
      entityType: EntityType.BOARD,
      entityId: boardId,
      subAction
    };
  }
  
  if (segments.includes('lists')) {
    return {
      entityType: EntityType.LIST,
      entityId: segments[segments.indexOf('lists') + 1]
    };
  }
  
  if (segments.includes('cards')) {
    const cardIndex = segments.indexOf('cards');
    const cardId = segments[cardIndex + 1];
    const subAction = segments[cardIndex + 2]; // pode ser 'members', 'labels', 'complete', etc.
    return {
      entityType: EntityType.CARD,
      entityId: cardId,
      subAction
    };
  }
  
  if (segments.includes('checklists')) {
    return {
      entityType: EntityType.CHECKLIST,
      entityId: segments[segments.indexOf('checklists') + 1]
    };
  }
  
  if (segments.includes('checklist-items')) {
    const itemIndex = segments.indexOf('checklist-items');
    const itemId = segments[itemIndex + 1];
    const subAction = segments[itemIndex + 2]; // pode ser 'members', etc.
    return {
      entityType: EntityType.CHECKLIST_ITEM,
      entityId: itemId,
      subAction
    };
  }
  
  if (segments.includes('comments')) {
    return {
      entityType: EntityType.COMMENT,
      entityId: segments[segments.indexOf('comments') + 1]
    };
  }
  
  if (segments.includes('labels')) {
    return {
      entityType: EntityType.LABEL,
      entityId: segments[segments.indexOf('labels') + 1]
    };
  }
  
  if (segments.includes('portfolios')) {
    return {
      entityType: EntityType.PORTFOLIO,
      entityId: segments[segments.indexOf('portfolios') + 1]
    };
  }

  // Capturar operações especiais
  if (segments.includes('card-labels')) {
    return {
      entityType: EntityType.LABEL,
      subAction: 'card-association'
    };
  }

  if (segments.includes('card-members')) {
    return {
      entityType: EntityType.CARD,
      subAction: 'member-association'
    };
  }

  if (segments.includes('board-members')) {
    return {
      entityType: EntityType.BOARD,
      subAction: 'member-association'
    };
  }

  if (segments.includes('notifications')) {
    return {
      entityType: EntityType.SESSION, // Usar SESSION como tipo genérico para notificações
      entityId: segments[segments.indexOf('notifications') + 1],
      subAction: 'notification'
    };
  }

  return {};
}

/**
 * Captura o estado atual da entidade antes da operação (para UPDATE e DELETE)
 */
async function captureCurrentState(entityType: EntityType, entityId: string): Promise<any> {
  try {
    const id = parseInt(entityId);
    if (isNaN(id)) return null;

    switch (entityType) {
      case EntityType.USER:
        const user = await appStorage.getUser(id);
        return user ? { ...user, password: '[REDACTED]' } : null;
        
      case EntityType.BOARD:
        return await appStorage.getBoard(id);
        
      case EntityType.LIST:
        return await appStorage.getList(id);
        
      case EntityType.CARD:
        return await appStorage.getCard(id);
        
      case EntityType.CHECKLIST:
        return await appStorage.getChecklist(id);
        
      case EntityType.CHECKLIST_ITEM:
        return await appStorage.getChecklistItem(id);
        
      case EntityType.PORTFOLIO:
        return await appStorage.getPortfolio(id);
        
      default:
        return null;
    }
  } catch (error) {
    console.warn(`[AUDIT MIDDLEWARE] Erro ao capturar estado atual para ${entityType}:${entityId}`, error);
    return null;
  }
}

/**
 * Middleware de auditoria automática
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Marcar o tempo de início para calcular tempo de processamento
  (req as any).auditStartTime = Date.now();

  // Definir métodos e rotas que devem ser auditados
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const importantReadPaths = [
    '/api/admin/', // Todas as rotas administrativas
    '/api/user', // Informações do usuário logado
    '/api/cards/overdue-dashboard', // Cards atrasados
    '/api/dashboard/', // Todas as rotas de dashboard
  ];
  
  const isMutatingMethod = mutatingMethods.includes(req.method);
  const isImportantRead = req.method === 'GET' && importantReadPaths.some(path => req.path.startsWith(path));
  
  if (!isMutatingMethod && !isImportantRead) {
    return next();
  }

  // Só processar rotas da API
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Pular rotas específicas que não precisam de auditoria
  const skipPaths = [
    '/api/csrf-token',
    '/api/user', // GET user info
    '/api/notifications/unread-count',
    '/api/health'
  ];
  
  if (skipPaths.includes(req.path)) {
    return next();
  }

  // Extrair informações da entidade da URL
  const { entityType, entityId, subAction } = parseEntityFromUrl(req.path);
  
  // Se não conseguimos determinar o tipo de entidade, registrar como operação genérica do sistema
  if (!entityType) {
            // Registrar operação genérica para debug e auditoria completa apenas se não for uma rota de health/debug
        if (!req.path.includes('/health') && !req.path.includes('/debug') && !req.path.includes('/csrf-token')) {
          setImmediate(() => {
            AuditService.log({
              req,
              action: methodToAction[req.method] || AuditAction.READ,
              entityType: EntityType.SESSION, // Usar SESSION como fallback
              entityId: 'system',
              metadata: {
                method: req.method,
                path: req.path,
                body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
                query: Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : undefined,
                userAgent: req.get('User-Agent'),
                contentType: req.get('Content-Type'),
                reason: 'generic_api_operation'
              }
            });
          });
        }
    return next();
  }

  const action = methodToAction[req.method] || AuditAction.READ;
  let oldData: any = null;

  // Capturar estado anterior para UPDATE e DELETE
  const captureOldData = async () => {
    if ((action === AuditAction.UPDATE || action === AuditAction.DELETE) && entityId) {
      oldData = await captureCurrentState(entityType, entityId);
    }
  };

  // Interceptar a resposta para capturar os dados novos
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end as any;
  
  res.send = function(body: any) {
    // Registrar auditoria após a operação bem-sucedida
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setImmediate(() => {
        let newData: any = null;
        
        try {
          // Tentar parsear o corpo da resposta
          if (typeof body === 'string') {
            newData = JSON.parse(body);
          } else if (typeof body === 'object') {
            newData = body;
          }
          
          // Remover dados sensíveis
          if (newData && typeof newData === 'object' && 'password' in newData) {
            newData = { ...newData, password: '[REDACTED]' };
          }
        } catch (error) {
          // Se não conseguir parsear, usar uma representação simples
          newData = { response: 'success', statusCode: res.statusCode };
        }

        // Registrar log de auditoria
        AuditService.log({
          req,
          action,
          entityType,
          entityId,
          oldData,
          newData: action === AuditAction.DELETE ? null : newData,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            contentType: req.get('Content-Type'),
            subAction: subAction || undefined,
            requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
            queryParams: Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : undefined,
            responseSize: typeof body === 'string' ? body.length : JSON.stringify(body || {}).length,
            processingTime: Date.now() - ((req as any).auditStartTime || Date.now())
          }
        });
      });
    }
    
    return originalSend.call(this, body);
  };

  res.json = function(obj: any) {
    // Similar ao send, mas específico para JSON
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setImmediate(() => {
        let newData = obj;
        
        // Remover dados sensíveis
        if (newData && typeof newData === 'object' && 'password' in newData) {
          newData = { ...newData, password: '[REDACTED]' };
        }

        // Registrar log de auditoria
        AuditService.log({
          req,
          action,
          entityType,
          entityId,
          oldData,
          newData: action === AuditAction.DELETE ? null : newData,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            contentType: req.get('Content-Type'),
            subAction: subAction || undefined,
            requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
            queryParams: Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : undefined,
            responseSize: JSON.stringify(obj || {}).length,
            processingTime: Date.now() - ((req as any).auditStartTime || Date.now())
          }
        });
      });
    }
    
    return originalJson.call(this, obj);
  };

  // Also wrap res.end to catch handlers that call res.end() directly (e.g. 204 No Content)
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    try {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(() => {
          let newData: any = null;

          try {
            if (chunk) {
              // chunk can be Buffer or string
              if (Buffer.isBuffer(chunk)) {
                const str = chunk.toString(encoding || 'utf8');
                newData = str ? JSON.parse(str) : null;
              } else if (typeof chunk === 'string') {
                newData = chunk ? JSON.parse(chunk) : null;
              } else if (typeof chunk === 'object') {
                newData = chunk;
              }
            }
          } catch (error) {
            newData = { response: 'success', statusCode: res.statusCode };
          }

          // For DELETE actions we keep newData as null
          AuditService.log({
            req,
            action,
            entityType,
            entityId,
            oldData,
            newData: action === AuditAction.DELETE ? null : newData,
            metadata: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              userAgent: req.get('User-Agent'),
              contentType: req.get('Content-Type'),
              subAction: subAction || undefined,
              requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
              queryParams: Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : undefined,
              responseSize: chunk ? (Buffer.isBuffer(chunk) ? chunk.length : chunk.toString().length) : 0,
              processingTime: Date.now() - ((req as any).auditStartTime || Date.now())
            }
          });
        });
      }
    } catch (err) {
      // swallow errors to not interfere with response
    }

    return originalEnd.call(this, chunk, encoding, cb);
  };

  // Capturar estado anterior se necessário e continuar
  if ((action === AuditAction.UPDATE || action === AuditAction.DELETE) && entityId) {
    captureOldData().finally(() => next());
  } else {
    next();
  }
};