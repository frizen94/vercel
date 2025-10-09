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
function parseEntityFromUrl(path: string): { entityType?: EntityType; entityId?: string } {
  const segments = path.split('/').filter(Boolean);
  
  // Mapear caminhos da API para tipos de entidade
  if (segments.includes('users')) {
    return {
      entityType: EntityType.USER,
      entityId: segments[segments.indexOf('users') + 1]
    };
  }
  
  if (segments.includes('boards')) {
    return {
      entityType: EntityType.BOARD,
      entityId: segments[segments.indexOf('boards') + 1]
    };
  }
  
  if (segments.includes('lists')) {
    return {
      entityType: EntityType.LIST,
      entityId: segments[segments.indexOf('lists') + 1]
    };
  }
  
  if (segments.includes('cards')) {
    return {
      entityType: EntityType.CARD,
      entityId: segments[segments.indexOf('cards') + 1]
    };
  }
  
  if (segments.includes('checklists')) {
    return {
      entityType: EntityType.CHECKLIST,
      entityId: segments[segments.indexOf('checklists') + 1]
    };
  }
  
  if (segments.includes('checklist-items')) {
    return {
      entityType: EntityType.CHECKLIST_ITEM,
      entityId: segments[segments.indexOf('checklist-items') + 1]
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
  // Só processar métodos mutantes
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) {
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
  const { entityType, entityId } = parseEntityFromUrl(req.path);
  
  // Se não conseguimos determinar o tipo de entidade, pular auditoria automática
  if (!entityType) {
    return next();
  }

  const action = methodToAction[req.method];
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
            contentType: req.get('Content-Type')
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
            contentType: req.get('Content-Type')
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
              contentType: req.get('Content-Type')
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