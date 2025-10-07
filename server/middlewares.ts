import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import { storage as appStorage } from "./db-storage";

// Middleware de proteção CSRF
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

// Middleware para verificar se o usuário está autenticado
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
}

// Middleware para verificar se o usuário é administrador
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Permissão negada. É necessário ser administrador." });
}

// Middleware para verificar se o usuário é proprietário do quadro ou administrador
export function isBoardOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Implementar lógica para verificar se o usuário é proprietário do quadro ou admin
  // Esta lógica depende dos detalhes específicos da sua aplicação
  next();
}

// Middleware para verificar se o usuário tem acesso ao cartão (como membro do cartão ou membro do quadro ou admin)
export async function hasCardAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    const cardId = parseInt(req.params.cardId);
    if (isNaN(cardId)) {
      return res.status(400).json({ message: "ID do cartão inválido" });
    }
    
    // Se for admin, permitir acesso
    if (req.user.role && req.user.role === "admin") {
      return next();
    }
    
    // Buscar o cartão
    const card = await appStorage.getCard(cardId);
    if (!card) {
      return res.status(404).json({ message: "Cartão não encontrado" });
    }
    
    // Buscar a lista e o quadro do cartão
    const list = await appStorage.getList(card.listId);
    if (!list) {
      return res.status(404).json({ message: "Lista não encontrada" });
    }
    
    // Verificar se o usuário é dono do quadro
    const board = await appStorage.getBoard(list.boardId);
    if (board && board.userId === req.user.id) {
      return next();
    }
    
    // Verificar se o usuário é membro do quadro
    const boardMember = await appStorage.getBoardMember(list.boardId, req.user.id);
    if (boardMember) {
      return next();
    }
    
    // Verificar se o usuário é membro do cartão
    const cardMembers = await appStorage.getCardMembers(cardId);
    const isCardMember = cardMembers.some((member: any) => member.id === req.user?.id);
    
    if (isCardMember) {
      return next();
    }
    
    return res.status(403).json({ message: "Você não tem permissão para acessar este cartão" });
  } catch (error) {
    console.error("Erro ao verificar acesso ao cartão:", error);
    return res.status(500).json({ message: "Erro ao verificar permissões de acesso" });
  }
}

/**
 * Rate limiting middlewares para proteger contra ataques de força bruta
 */

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas por IP em 15 minutos
  message: {
    error: "Muitas tentativas de login. Tente novamente em 15 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.log(`Rate limit exceeded for IP: ${req.ip} - Login attempt blocked`);
    res.status(429).json({
      error: "Muitas tentativas de login. Tente novamente em 15 minutos."
    });
  }
});

export const changePasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 tentativas por IP por hora
  message: {
    error: "Muitas tentativas de mudança de senha. Tente novamente em 1 hora."
  },
  handler: (req: Request, res: Response) => {
    console.log(`Rate limit exceeded for IP: ${req.ip} - Password change blocked`);
    res.status(429).json({
      error: "Muitas tentativas de mudança de senha. Tente novamente em 1 hora."
    });
  }
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 registros por IP por hora
  message: {
    error: "Muitas tentativas de registro. Tente novamente em 1 hora."
  },
  handler: (req: Request, res: Response) => {
    console.log(`Rate limit exceeded for IP: ${req.ip} - Registration blocked`);
    res.status(429).json({
      error: "Muitas tentativas de registro. Tente novamente em 1 hora."
    });
  }
});

/**
 * Middleware global de tratamento de erros
 * Evita exposição de detalhes sensíveis
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log completo para desenvolvedores/auditoria
  console.error('Erro da aplicação:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  const status = err.status || err.statusCode || 500;
  
  // Mensagem genérica para o cliente
  const message = status === 500 
    ? "Erro interno do servidor" 
    : err.message || "Ocorreu um erro";

  res.status(status).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};