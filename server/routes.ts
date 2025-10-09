/**
 * routes.ts
 * 
 * Este arquivo define todas as rotas da API REST do sistema Kanban.
 * Implementa os endpoints para gerenciamento de quadros, listas, cartões,
 * etiquetas, comentários, usuários e outras funcionalidades.
 * 
 * Características principais:
 * - Autenticação e autorização em rotas protegidas
 * - Validação de dados com Zod
 * - Upload de arquivos (fotos de perfil) com Multer
 * - Controle de acesso baseado em papéis (admin, user)
 * - Implementação de permissões granulares por quadro
 * 
 * Grupos de endpoints:
 * 1. Autenticação: login, logout, registro, informações do usuário
 * 2. Quadros: criação, leitura, atualização, exclusão
 * 3. Listas: gerenciamento de colunas dentro de quadros 
 * 4. Cartões: tarefas individuais com descrições, datas, etc.
 * 5. Etiquetas: classificação visual de cartões
 * 6. Comentários: comunicação em cartões
 * 7. Usuários: gerenciamento de contas
 * 8. Checklists: listas de verificação em cartões
 * 9. Membros: gerenciamento de convites e permissões
 * 10. Dashboard: estatísticas e informações gerais
 */

import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage as appStorage } from "./db-storage";
import { db } from "./database";
import { z } from "zod";
import { eq, and, or, lt, desc, isNotNull } from "drizzle-orm";
import * as schema from "@shared/schema";
import { 
  insertPortfolioSchema,
  insertBoardSchema, 
  insertListSchema, 
  insertCardSchema, 
  insertLabelSchema, 
  insertCardLabelSchema,
  insertCommentSchema,
  insertCardMemberSchema,
  insertBoardMemberSchema
} from "@shared/schema";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { isAuthenticated, isAdmin, isBoardOwnerOrAdmin, hasCardAccess, changePasswordRateLimit, csrfProtection } from "./middlewares";
import { sql } from "./database";
import { createAutomaticNotifications } from "./notification-service";

/**
 * Função principal para registrar todas as rotas da API
 *
 * Esta função configura:
 * - Diretórios para arquivos estáticos
 * - Upload de arquivos
 * - Middleware de autenticação
 * - Todas as rotas de API REST
 * - Tratamento de erros
 * 
 * @param app Instância do Express para registro das rotas
 * @returns Servidor HTTP configurado
 */
export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * Rota de Health Check
   * Verifica o status da aplicação e do banco de dados
   */
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      // Testar conexão com banco
      const result = await sql`SELECT 1 as health_check;`;

      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        database: "disconnected",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    }
  });



  /**
   * Configuração de diretório para servir arquivos estáticos
   * Permite acessar imagens de perfil e outros uploads através de URLs
   */
  app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

  /**
   * Configuração do sistema de upload de arquivos com Multer
   * 
   * Gerencia o armazenamento em disco de fotos de perfil:
   * - Define o destino dos arquivos no sistema de arquivos
   * - Gera nomes de arquivo únicos para evitar colisões
   * - Preserva a extensão original do arquivo
   */
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), "public/uploads/profile_pictures");

      // Verificar se o diretório existe e criar se necessário
      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
          console.log(`Diretório criado: ${uploadDir}`);
        } catch (err) {
          console.error(`Erro ao criar diretório de upload: ${err}`);
          return cb(new Error("Falha ao configurar armazenamento"), "");
        }
      }

      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "profile-" + uniqueSuffix + ext);
    },
  });

  /**
   * Configuração do middleware de upload Multer
   * 
   * Define:
   * - Limite de tamanho de arquivo (3MB)
   * - Filtro de tipo de arquivo (apenas imagens)
   * - Armazenamento personalizado no disco
   */
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 3 * 1024 * 1024, // 3MB
    },
    fileFilter: function (req, file, cb) {
      // Aceitar apenas imagens
      if (!file.mimetype.match(/^image\/(jpeg|png|jpg|gif)$/)) {
        return cb(new Error("Apenas imagens são permitidas"));
      }
      cb(null, true);
    },
  });

  /**
   * Middleware para tratamento centralizado de erros do multer
   * 
   * Intercepta e trata erros específicos do sistema de upload:
   * - Erros de limite de tamanho de arquivo
   * - Erros de tipo de arquivo inválido
   * - Outros erros relacionados à upload
   * 
   * Formata as mensagens de erro para serem amigáveis ao usuário final
   */
  const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      // Tratamento específico para erros do multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "O arquivo é muito grande. Tamanho máximo: 3MB" });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // Outros erros não relacionados diretamente ao multer
      return res.status(400).json({ message: err.message });
    }
    next();
  };

  /**
   * Configuração do sistema de autenticação
   * 
   * Inicializa o Passport.js com estratégia local (username/password)
   * Configura as rotas de autenticação: 
   * - /api/login
   * - /api/logout
   * - /api/register
   * - /api/user
   */
  setupAuth(app);

  // ✅ CSRF Token Endpoint - APÓS configuração de sessões e COM middleware CSRF aplicado
  /**
   * Rota para obtenção de token CSRF
   * 
   * Retorna um token CSRF válido para proteção contra ataques CSRF.
   * Deve ser incluído nas requisições POST/PUT/PATCH/DELETE.
   * 
   * IMPORTANTE: Aplicamos o middleware csrfProtection para esta rota específica
   * para que req.csrfToken() funcione corretamente.
   * 
   * @returns {object} - Objeto contendo o token CSRF
   */
  app.get("/api/csrf-token", csrfProtection, async (req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`� [CSRF] Token solicitado para sessão: ${req.session?.id?.substring(0, 8)}...`);
      }

      // Gerar token CSRF - disponível após aplicação do middleware
      const token = req.csrfToken();
      
      res.status(200).json({ csrfToken: token });
    } catch (error: any) {
      console.error(`❌ [CSRF] Erro ao gerar token:`, error.message);
      
      res.status(500).json({ 
        error: "Falha ao gerar token CSRF", 
        message: "Token CSRF temporariamente indisponível" 
      });
    }
  });

  // Middleware CSRF condicional
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Aplicar CSRF apenas em métodos que modificam estado
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const isApiRoute = req.path.startsWith('/api');
    const isCsrfTokenRoute = req.path === '/api/csrf-token';
    const isLogoutRoute = req.path === '/api/logout';
    const isLoginRoute = req.path === '/api/login';
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`� [CSRF] ${req.method} ${req.path} - ${mutatingMethods.includes(req.method) && isApiRoute ? 'Protegido' : 'Permitido'}`);
    }
    
    // Skip CSRF para rotas de autenticação e token
    if (isCsrfTokenRoute || isLogoutRoute || isLoginRoute || !isApiRoute || !mutatingMethods.includes(req.method)) {
      return next();
    }
    
    // Aplicar proteção CSRF para rotas mutantes da API
    csrfProtection(req, res, (err: any) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ [CSRF] Erro na validação CSRF para ${req.path}:`, err.message);
      }
      next(err);
    });
  });

  /**
   * Rotas para gerenciar Portfólios (Portfolios)
   */
  app.get("/api/portfolios", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Administradores podem ver todos os portfólios
      if (req.user.role && req.user.role.toUpperCase() === "ADMIN") {
        const allPortfolios = await appStorage.getPortfolios();
        return res.json(allPortfolios);
      }

      // Para usuários normais, retorna apenas os portfólios que podem acessar
      const userId = req.user.id;
      const accessiblePortfolios = await appStorage.getPortfoliosUserCanAccess(userId);
      res.json(accessiblePortfolios);
    } catch (error) {
      console.error("Erro ao buscar portfólios:", error);
      res.status(500).json({ message: "Falha ao buscar portfólios" });
    }
  });

  app.get("/api/portfolios/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do portfólio inválido" });
      }

      const portfolio = await appStorage.getPortfolio(id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfólio não encontrado" });
      }

      // Verificar se o usuário tem permissão para acessar este portfólio
      if (req.isAuthenticated() && req.user) {
        // Administradores podem acessar qualquer portfólio
        if (req.user.role && req.user.role.toLowerCase() === "admin") {
          return res.json(portfolio);
        }

        // Se é o dono do portfólio, permitir acesso
        if (portfolio.userId === req.user.id) {
          return res.json(portfolio);
        }
      }

      return res.status(403).json({ message: "Acesso negado a este portfólio" });
    } catch (error) {
      console.error("Erro ao buscar portfólio:", error);
      res.status(500).json({ message: "Falha ao buscar portfólio" });
    }
  });

  app.get("/api/portfolios/:id/boards", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do portfólio inválido" });
      }

      const boards = await appStorage.getBoardsByPortfolio(id);
      res.json(boards);
    } catch (error) {
      console.error("Erro ao buscar quadros do portfólio:", error);
      res.status(500).json({ message: "Falha ao buscar quadros do portfólio" });
    }
  });

  app.post("/api/portfolios", csrfProtection, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const portfolioData = {
        name: req.body.name,
        description: req.body.description || null,
        color: req.body.color || "#3B82F6",
        userId: req.user.id
      };

      const validatedData = insertPortfolioSchema.parse(portfolioData);
      const portfolio = await appStorage.createPortfolio(validatedData);

      res.status(201).json(portfolio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Dados do portfólio inválidos", 
          errors: error.errors 
        });
      }
      console.error("Portfolio creation error:", error);
      res.status(500).json({ message: "Falha ao criar portfólio", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/portfolios/:id", csrfProtection, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do portfólio inválido" });
      }

      const existingPortfolio = await appStorage.getPortfolio(id);
      if (!existingPortfolio) {
        return res.status(404).json({ message: "Portfólio não encontrado" });
      }

      const validatedData = insertPortfolioSchema.partial().parse(req.body);
      const updatedPortfolio = await appStorage.updatePortfolio(id, validatedData);
      res.json(updatedPortfolio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados do portfólio inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao atualizar portfólio" });
    }
  });

  app.delete("/api/portfolios/:id", csrfProtection, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do portfólio inválido" });
      }

      const success = await appStorage.deletePortfolio(id);
      if (!success) {
        return res.status(404).json({ message: "Portfólio não encontrado" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Falha ao excluir portfólio" });
    }
  });

  /**
   * Rota para buscar quadros do usuário logado especificamente
   */
  app.get("/api/user-boards", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const userId = req.user.id;
      const userBoards = await appStorage.getBoardsUserCanAccess(userId);
      res.json(userBoards);
    } catch (error) {
      console.error("Erro ao buscar quadros do usuário:", error);
      res.status(500).json({ message: "Falha ao buscar quadros do usuário" });
    }
  });

  /**
   * Rotas para gerenciar Quadros (Boards)
   * 
   * Estas rotas controlam:
   * - Listagem de quadros acessíveis ao usuário
   * - Detalhes de um quadro específico
   * - Criação de novos quadros
   * - Atualização de quadros existentes
   * - Exclusão de quadros
   * 
   * Controle de acesso:
   * - Administradores podem ver todos os quadros
   * - Usuários normais só veem quadros para os quais foram convidados
   * - Autenticação obrigatória para criação
   */
  app.get("/api/boards", async (req: Request, res: Response) => {
    try {
      // Verifica se o usuário está autenticado
      if (!req.isAuthenticated() || !req.user) {
        // Se não estiver autenticado, retorna quadros públicos (se houver)
        const boards = await appStorage.getBoards();
        return res.json(boards);
      }

      // Verifica se o usuário é administrador
      if (req.user.role && req.user.role.toUpperCase() === "ADMIN") {
        // Administradores podem ver todos os quadros
        const allBoards = await appStorage.getBoards();
        return res.json(allBoards);
      }

      // Para usuários normais, retorna apenas os quadros que podem acessar
      const userId = req.user.id;
      const accessibleBoards = await appStorage.getBoardsUserCanAccess(userId);
      res.json(accessibleBoards);
    } catch (error) {
      console.error("Erro ao buscar quadros:", error);
      res.status(500).json({ message: "Falha ao buscar quadros" });
    }
  });

  app.get("/api/boards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do quadro inválido" });
      }

      const board = await appStorage.getBoard(id);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar se o usuário tem permissão para acessar este quadro
      if (req.isAuthenticated() && req.user) {
        // Administradores podem acessar qualquer quadro
        if (req.user.role && req.user.role.toLowerCase() === "admin") {
          return res.json(board);
        }

        // Se é o dono do quadro, permitir acesso
        if (board.userId === req.user.id) {
          return res.json(board);
        }

        // Se não é o dono, verifica se é membro do quadro
        const boardMember = await appStorage.getBoardMember(id, req.user.id);
        if (!boardMember) {
          return res.status(403).json({ message: "Acesso negado a este quadro" });
        }
      } else if (board.userId !== null) {
        // Se o quadro não é público e o usuário não está autenticado
        return res.status(403).json({ message: "Acesso negado a este quadro" });
      }

      res.json(board);
    } catch (error) {
      console.error("Erro ao buscar quadro:", error);
      res.status(500).json({ message: "Falha ao buscar quadro" });
    }
  });

  app.post("/api/boards", csrfProtection, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const validatedData = insertBoardSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const board = await appStorage.createBoard(validatedData);
      res.status(201).json(board);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid board data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create board" });
    }
  });

  app.patch("/api/boards/:id", csrfProtection, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const existingBoard = await appStorage.getBoard(id);
      if (!existingBoard) {
        return res.status(404).json({ message: "Board not found" });
      }

      const validatedData = insertBoardSchema.partial().parse(req.body);
      const updatedBoard = await appStorage.updateBoard(id, validatedData);
      res.json(updatedBoard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid board data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update board" });
    }
  });

  app.delete("/api/boards/:id", csrfProtection, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const success = await appStorage.deleteBoard(id);
      if (!success) {
        return res.status(404).json({ message: "Board not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  /**
   * Rotas para gerenciar Listas (Colunas do Kanban)
   */
  app.get("/api/boards/:boardId/lists", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const lists = await appStorage.getLists(boardId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lists" });
    }
  });

  app.post("/api/lists", async (req: Request, res: Response) => {
    try {
      const validatedData = insertListSchema.parse(req.body);

      // Ensure boardId exists
      const board = await appStorage.getBoard(validatedData.boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      // If order is not provided, set it as the highest order + 1
      if (validatedData.order === undefined) {
        const lists = await appStorage.getLists(validatedData.boardId);
        const maxOrder = lists.length > 0 
          ? Math.max(...lists.map(list => list.order))
          : -1;
        validatedData.order = maxOrder + 1;
      }

      const list = await appStorage.createList(validatedData);
      res.status(201).json(list);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create list" });
    }
  });

  app.patch("/api/lists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      const existingList = await appStorage.getList(id);
      if (!existingList) {
        return res.status(404).json({ message: "List not found" });
      }

      const validatedData = insertListSchema.partial().parse(req.body);
      const updatedList = await appStorage.updateList(id, validatedData);
      res.json(updatedList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update list" });
    }
  });

  app.delete("/api/lists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      const success = await appStorage.deleteList(id);
      if (!success) {
        return res.status(404).json({ message: "List not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete list" });
    }
  });

  /**
   * Rotas para gerenciar Cartões (Cards)
   */

  /**
   * Obtém cards com prazo vencido para o dashboard
   */
  app.get("/api/cards/overdue-dashboard", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const now = new Date();
      let overdueCards: any[] = [];

      if (req.user.role === "admin") {
        // Admin vê todos os cards atrasados do sistema
        overdueCards = await db
          .select({
            id: schema.cards.id,
            title: schema.cards.title,
            dueDate: schema.cards.dueDate,
            listName: schema.lists.title,
            boardName: schema.boards.title,
            boardId: schema.boards.id,
          })
          .from(schema.cards)
          .innerJoin(schema.lists, eq(schema.cards.listId, schema.lists.id))
          .innerJoin(schema.boards, eq(schema.lists.boardId, schema.boards.id))
          .where(
            and(
              lt(schema.cards.dueDate, now),
              isNotNull(schema.cards.dueDate)
            )
          )
          .limit(20);
      } else {
        // Usuários normais veem apenas cards dos quadros onde participam
        overdueCards = await db
          .select({
            id: schema.cards.id,
            title: schema.cards.title,
            dueDate: schema.cards.dueDate,
            listName: schema.lists.title,
            boardName: schema.boards.title,
            boardId: schema.boards.id,
          })
          .from(schema.cards)
          .innerJoin(schema.lists, eq(schema.cards.listId, schema.lists.id))
          .innerJoin(schema.boards, eq(schema.lists.boardId, schema.boards.id))
          .leftJoin(schema.boardMembers, eq(schema.boards.id, schema.boardMembers.boardId))
          .where(
            and(
              lt(schema.cards.dueDate, now),
              isNotNull(schema.cards.dueDate),
              or(
                eq(schema.boards.userId, req.user.id),
                eq(schema.boardMembers.userId, req.user.id)
              )
            )
          )
          .limit(20);
      }

      res.json(overdueCards);
    } catch (error) {
      console.error("Erro ao buscar cards atrasados do dashboard:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/lists/:listId/cards", async (req: Request, res: Response) => {
    try {
      const listId = parseInt(req.params.listId);
      if (isNaN(listId)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      const cards = await appStorage.getCards(listId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.get("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const card = await appStorage.getCard(id);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card" });
    }
  });

  app.get("/api/cards/:cardId/details", hasCardAccess, async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "ID do cartão inválido" });
      }

      // Buscar o cartão
      const card = await appStorage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Cartão não encontrado" });
      }

      // Buscar informações relacionadas
      const list = await appStorage.getList(card.listId);
      const board = list ? await appStorage.getBoard(list.boardId) : null;
      const members = await appStorage.getCardMembers(cardId);
      const cardLabels = await appStorage.getCardLabels(cardId);
      const checklists = await appStorage.getChecklists(cardId);

      // Buscar os detalhes das etiquetas
      let labels: any[] = [];
      if (cardLabels && cardLabels.length > 0) {
        const labelIds = cardLabels.map(cl => cl.labelId);
        labels = await appStorage.getLabels(board?.id || 0); // Usar 0 como fallback, não afetará a lógica
        labels = labels.filter(label => labelIds.includes(label.id));
      }

      // Buscar os itens de cada checklist
      const checklistsWithItems = [];
      for (const checklist of checklists) {
        const items = await appStorage.getChecklistItems(checklist.id);
        checklistsWithItems.push({
          ...checklist,
          items
        });
      }

      // Retornar informações completas
      res.json({
        card,
        list,
        board,
        members,
        labels,
        checklists: checklistsWithItems
      });
    } catch (error) {
      console.error("Erro ao buscar detalhes do cartão:", error);
      res.status(500).json({ message: "Falha ao buscar detalhes do cartão" });
    }
  });

  app.post("/api/cards", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCardSchema.parse(req.body);

      // Ensure listId exists
      const list = await appStorage.getList(validatedData.listId);
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }

      // If order is not provided, set it as the highest order + 1
      if (validatedData.order === undefined) {
        const cards = await appStorage.getCards(validatedData.listId);
        const maxOrder = cards.length > 0 
          ? Math.max(...cards.map(card => card.order))
          : -1;
        validatedData.order = maxOrder + 1;
      }

      const card = await appStorage.createCard(validatedData);
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.patch("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const existingCard = await appStorage.getCard(id);
      if (!existingCard) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Preparando os dados do cartão para atualização
      const cardData = { ...req.body };

      // Verificar se dueDate está sendo enviado
      if (cardData.dueDate !== undefined) {
        // Se é uma string ou um objeto Date, normalizar para Date
        if (cardData.dueDate !== null) {
          cardData.dueDate = new Date(cardData.dueDate);
        }
      }

      const validatedData = insertCardSchema.partial().parse(cardData);
      const updatedCard = await appStorage.updateCard(id, validatedData);
      res.json(updatedCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      console.error("Erro ao atualizar cartão:", error);
      res.status(500).json({ message: "Failed to update card" });
    }
  });

  /**
   * Marcar/desmarcar cartão como concluído
   * Similar à funcionalidade do Asana
   */
  app.patch("/api/cards/:id/complete", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const existingCard = await appStorage.getCard(id);
      if (!existingCard) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Verificar se o usuário tem permissão para modificar este cartão
      // (usuário deve ser membro do cartão, do quadro, ou admin)
      if (req.user.role !== "admin") {
        const list = await appStorage.getList(existingCard.listId);
        if (!list) {
          return res.status(404).json({ message: "List not found" });
        }

        const board = await appStorage.getBoard(list.boardId);
        if (!board) {
          return res.status(404).json({ message: "Board not found" });
        }

        // Verificar se é dono do quadro
        const isOwner = board.userId === req.user.id;
        
        // Verificar se é membro do quadro
        const boardMember = await appStorage.getBoardMember(board.id, req.user.id);
        const isBoardMember = !!boardMember;
        
        // Verificar se é membro do cartão
        const cardMembers = await appStorage.getCardMembers(id);
        const isCardMember = cardMembers.some((member: any) => member.id === req.user.id);

        if (!isOwner && !isBoardMember && !isCardMember) {
          return res.status(403).json({ message: "Você não tem permissão para modificar este cartão" });
        }
      }

      // Obter o novo status (toggle ou valor específico)
      const { completed } = req.body;
      const newCompletedStatus = completed !== undefined ? completed : !existingCard.completed;

      // Atualizar o cartão
      const updatedCard = await appStorage.updateCard(id, { completed: newCompletedStatus });
      
      // Se o cartão foi marcado como concluído, criar notificações automáticas
      if (newCompletedStatus) {
        const list = await appStorage.getList(existingCard.listId);
        if (list) {
          await createAutomaticNotifications({
            cardId: id,
            boardId: list.boardId,
            actionUserId: req.user.id,
            actionType: 'task_completed'
          });
        }
      }
      
      res.json({ 
        message: newCompletedStatus ? "Cartão marcado como concluído" : "Cartão marcado como pendente",
        card: updatedCard 
      });
    } catch (error) {
      console.error("Erro ao alterar status do cartão:", error);
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  app.delete("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const success = await appStorage.deleteCard(id);
      if (!success) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete card" });
    }
  });

  /**
   * Rotas para gerenciar Etiquetas (Labels)
   */
  app.get("/api/boards/:boardId/labels", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const labels = await appStorage.getLabels(boardId);
      res.json(labels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch labels" });
    }
  });

  app.post("/api/labels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLabelSchema.parse(req.body);
      const label = await appStorage.createLabel(validatedData);
      res.status(201).json(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid label data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create label" });
    }
  });

  app.patch('/api/labels/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid label id' });

      const updates = req.body;
      const updated = await appStorage.updateLabel(id, updates);
      if (!updated) return res.status(404).json({ message: 'Label not found' });
      res.json(updated);
    } catch (error) {
      console.error('Failed to update label', error);
      res.status(500).json({ message: 'Failed to update label' });
    }
  });

  app.delete('/api/labels/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid label id' });

      const success = await appStorage.deleteLabel(id);
      if (!success) return res.status(404).json({ message: 'Label not found' });
      res.status(204).end();
    } catch (error) {
      console.error('Failed to delete label', error);
      res.status(500).json({ message: 'Failed to delete label' });
    }
  });

  /**
   * Rotas para gerenciar associações entre Cartões e Etiquetas
   */
  app.get("/api/cards/:cardId/labels", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const cardLabels = await appStorage.getCardLabels(cardId);
      res.json(cardLabels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card labels" });
    }
  });

  // Aggregated endpoint: return all card-label associations for a board
  app.get("/api/boards/:boardId/cards/labels", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const boardCardLabels = await appStorage.getBoardCardsLabels(boardId);
      res.json(boardCardLabels);
    } catch (error) {
      console.error("Failed to fetch board card labels:", error);
      res.status(500).json({ message: "Failed to fetch board card labels" });
    }
  });

  app.post("/api/card-labels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCardLabelSchema.parse(req.body);
      const cardLabel = await appStorage.addLabelToCard(validatedData);
      res.status(201).json(cardLabel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card label data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add label to card" });
    }
  });

  app.delete("/api/cards/:cardId/labels/:labelId", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const labelId = parseInt(req.params.labelId);

      if (isNaN(cardId) || isNaN(labelId)) {
        return res.status(400).json({ message: "Invalid card ID or label ID" });
      }

      const success = await appStorage.removeLabelFromCard(cardId, labelId);
      if (!success) {
        return res.status(404).json({ message: "Card label association not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove label from card" });
    }
  });

  /**
   * Rotas para gerenciar Comentários
   */
  app.get("/api/cards/:cardId/comments", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

  // Optional query param to filter comments for a specific checklist item (subtask)
  const checklistItemId = req.query.checklistItemId ? parseInt(String(req.query.checklistItemId)) : undefined;
  const comments = await appStorage.getComments(cardId, checklistItemId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);

      // Ensure cardId exists
      const card = await appStorage.getCard(validatedData.cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

  const comment = await appStorage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const success = await appStorage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  /**
   * Rotas para gerenciar Usuários
   */
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await appStorage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar usuários" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Verificar se o usuário existe
      const existingUser = await appStorage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Restringir atualizações de role apenas para administradores atuais
      if (req.body.role && (!req.user || req.user.role.toLowerCase() !== "admin")) {
        return res.status(403).json({ message: "Permissão negada para alteração de função do usuário" });
      }

      const userData = { ...req.body };
      delete userData.password; // Impede a atualização de senha por esta rota

      const updatedUser = await appStorage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao atualizar usuário" });
    }
  });

  /**
   * Checklist item members (subtask collaborators)
   */
  app.get('/api/checklist-items/:id/members', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid checklist item id' });
      const members = await appStorage.getChecklistItemMembers(id);
      res.json(members);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get checklist item members' });
    }
  });

  app.post('/api/checklist-items/:id/members', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { userId } = req.body;

      // Validar dados de entrada

      if (isNaN(id) || !userId) return res.status(400).json({ message: 'Invalid data' });

      // Verify checklist item exists
      const item = await appStorage.getChecklistItem(id);
      if (!item) return res.status(404).json({ message: 'Checklist item not found' });

      // Adicionar membro ao item da checklist

      await appStorage.addMemberToChecklistItem(id, userId);

      // Criar notificação para o usuário atribuído à subtarefa
      if (req.user && req.user.id !== userId) {
        try {
          // Buscar informações do checklist e do card
          const checklist = await appStorage.getChecklist(item.checklistId);
          const card = checklist ? await appStorage.getCard(checklist.cardId) : null;
          const list = card ? await appStorage.getList(card.listId) : null;
          const boardId = list?.boardId;

          await appStorage.createNotification({
            userId: userId,
            type: 'task_assigned',
            title: 'Você foi atribuído a uma subtarefa',
            message: `Você foi atribuído à subtarefa "${item.content}"${card ? ` no cartão "${card.title}"` : ''}`,
            relatedChecklistItemId: id,
            relatedCardId: card?.id,
            fromUserId: req.user.id,
            actionUrl: boardId && card ? `/boards/${boardId}/cards/${card.id}` : undefined
          });
        } catch (notificationError) {
          console.error('Erro ao criar notificação de atribuição de subtarefa:', notificationError);
        }
      }

      res.status(201).end();
    } catch (err) {
      console.error(`[api] POST /api/checklist-items/${req.params.id}/members - error:`, err);
      // Check if it's a duplicate key error
      if (err instanceof Error && err.message.includes('duplicate key value violates unique constraint')) {
        return res.status(409).json({ message: 'User is already a member of this checklist item' });
      }
      // Include error message in response to help debugging in dev
      res.status(500).json({ message: 'Failed to add member to checklist item', error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.delete('/api/checklist-items/:id/members/:userId', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      if (isNaN(id) || isNaN(userId)) return res.status(400).json({ message: 'Invalid ids' });
      // Buscar informações antes de remover o membro
      const item = await appStorage.getChecklistItem(id);
      if (!item) return res.status(404).json({ message: 'Checklist item not found' });

      await appStorage.removeMemberFromChecklistItem(id, userId);

      // Criar notificação para o usuário removido da subtarefa
      if (req.user && req.user.id !== userId) {
        try {
          // Buscar informações do checklist e do card
          const checklist = await appStorage.getChecklist(item.checklistId);
          const card = checklist ? await appStorage.getCard(checklist.cardId) : null;
          const list = card ? await appStorage.getList(card.listId) : null;
          const boardId = list?.boardId;

          await appStorage.createNotification({
            userId: userId,
            type: 'task_unassigned',
            title: 'Você foi removido de uma subtarefa',
            message: `Você foi removido da subtarefa "${item.content}"${card ? ` no cartão "${card.title}"` : ''}`,
            relatedChecklistItemId: id,
            relatedCardId: card?.id,
            fromUserId: req.user.id,
            actionUrl: boardId && card ? `/boards/${boardId}/cards/${card.id}` : undefined
          });
        } catch (notificationError) {
          console.error('Erro ao criar notificação de remoção de subtarefa:', notificationError);
        }
      }

      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: 'Failed to remove member from checklist item' });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) =>{
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Apenas administradores podem excluir usuários
      if (!req.user || req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Permissão negada. Apenas administradores podem excluir usuários." });
      }

      // Não permitir que um administrador exclua sua própria conta
      if (req.user.id === id) {
        return res.status(400).json({ message: "Não é possível excluir sua própria conta." });
      }

      const success = await appStorage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado ou não pode ser excluído" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Falha ao excluir usuário" });
    }
  });

  /**
   * Rotas para gerenciar Etiquetas (Labels)
   */
  app.get("/api/boards/:boardId/labels", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const labels = await appStorage.getLabels(boardId);
      res.json(labels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch labels" });
    }
  });

  app.post("/api/labels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLabelSchema.parse(req.body);
      const label = await appStorage.createLabel(validatedData);
      res.status(201).json(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid label data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create label" });
    }
  });

  /**
   * Rotas para gerenciar associações entre Cartões e Etiquetas
   */
  app.get("/api/cards/:cardId/labels", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const cardLabels = await appStorage.getCardLabels(cardId);
      res.json(cardLabels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card labels" });
    }
  });

  app.post("/api/card-labels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCardLabelSchema.parse(req.body);
      const cardLabel = await appStorage.addLabelToCard(validatedData);
      res.status(201).json(cardLabel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card label data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add label to card" });
    }
  });

  app.delete("/api/cards/:cardId/labels/:labelId", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const labelId = parseInt(req.params.labelId);

      if (isNaN(cardId) || isNaN(labelId)) {
        return res.status(400).json({ message: "Invalid card ID or label ID" });
      }

      const success = await appStorage.removeLabelFromCard(cardId, labelId);
      if (!success) {
        return res.status(404).json({ message: "Card label association not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove label from card" });
    }
  });

  /**
   * Rotas para gerenciar Comentários
   */
  app.get("/api/cards/:cardId/comments", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const comments = await appStorage.getComments(cardId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);

      // Ensure cardId exists
      const card = await appStorage.getCard(validatedData.cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      const comment = await appStorage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const success = await appStorage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  /**
   * Rotas para o Dashboard - Monitoramento de Tarefas com Checklists
   */

  /**
   * Obtém colaboradores do dashboard
   * Retorna usuários que são membros dos quadros acessíveis pelo usuário
   */
  app.get("/api/dashboard/collaborators", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      // Buscar quadros acessíveis pelo usuário
      const boards = await appStorage.getBoardsUserCanAccess(req.user.id);
      const collaboratorIds = new Set<number>();

      // Coletar IDs únicos de colaboradores
      for (const board of boards) {
        try {
          const members = await appStorage.getBoardMembers(board.id);
          members.forEach((member: any) => {
            if (member.id !== req.user?.id) {
              collaboratorIds.add(member.id);
            }
          });
        } catch (error) {
          console.warn(`Erro ao buscar membros do quadro ${board.id}:`, error);
          continue;
        }
      }

      // Buscar informações dos colaboradores
      const collaborators = [];
      for (const userId of collaboratorIds) {
        try {
          const user = await appStorage.getUser(userId);
          if (user) {
            collaborators.push({
              id: user.id,
              name: user.name,
              username: user.username,
              profilePicture: user.profilePicture,
              role: user.role,
              lastSeen: new Date().toISOString() // Placeholder - pode ser implementado no futuro
            });
          }
        } catch (error) {
          console.warn(`Erro ao buscar usuário ${userId}:`, error);
          continue;
        }
      }

      res.json(collaborators);
    } catch (error) {
      console.error("Erro ao buscar colaboradores do dashboard:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  /**
   * Obtém estatísticas do dashboard
   * Retorna contadores e métricas para o usuário logado
   */
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      // Buscar quadros acessíveis pelo usuário
      const boards = await appStorage.getBoardsUserCanAccess(req.user.id);
      let totalCards = 0;
      let completedCards = 0;
      let overdueCards = 0;
      const now = new Date();

      for (const board of boards) {
        try {
          const lists = await appStorage.getLists(board.id);

          for (const list of lists) {
            const cards = await appStorage.getCards(list.id);
            totalCards += cards.length;

            for (const card of cards) {
              // Verificar se está atrasado
              if (card.dueDate && new Date(card.dueDate) < now) {
                overdueCards++;
              }

              // Verificar se está concluído (assumindo que cartões em listas com "concluído" no nome são concluídos)
              if (list.title.toLowerCase().includes('concluído') || 
                  list.title.toLowerCase().includes('done') || 
                  list.title.toLowerCase().includes('finalizado')) {
                completedCards++;
              }
            }
          }
        } catch (listError) {
          console.warn(`Erro ao processar listas do quadro ${board.id}:`, listError);
          continue;
        }
      }

      const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

      // Para admin, incluir total de usuários
      let totalUsers = 0;
      if (req.user.role === 'admin') {
        const users = await appStorage.getUsers();
        totalUsers = users.length;
      }

      const stats = {
        totalBoards: boards.length,
        totalCards,
        completedCards,
        overdueCards,
        completionRate,
        totalUsers
      };

      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas do dashboard:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  /**
   * Obtém tarefas recentes do dashboard
   * Retorna cartões recentemente atualizados dos quadros acessíveis pelo usuário
   */
  app.get("/api/dashboard/recent-tasks", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      // Buscar quadros acessíveis pelo usuário
      const boards = await appStorage.getBoardsUserCanAccess(req.user.id);
      const recentTasks: any[] = [];

      for (const board of boards) {
        try {
          const lists = await appStorage.getLists(board.id);

          for (const list of lists) {
            const cards = await appStorage.getCards(list.id);

            // Filtrar cartões e adicionar informações
            for (const card of cards) {
              // Verificar se o usuário é membro do cartão ou se é recente
              const cardMembers = await appStorage.getCardMembers(card.id);
              const isCardMember = cardMembers.some((member: any) => member.id === req.user?.id);

              if (isCardMember || !card.dueDate || new Date(card.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
                recentTasks.push({
                  id: card.id,
                  title: card.title,
                  description: card.description,
                  priority: card.dueDate ? (new Date(card.dueDate) < new Date() ? 'alta' : 'média') : 'baixa',
                  status: list.title,
                  dueDate: card.dueDate,
                  boardId: board.id,
                  boardName: board.title,
                  listName: list.title,
                  createdAt: card.createdAt,
                  updatedAt: card.updatedAt
                });
              }
            }
          }
        } catch (listError) {
          console.warn(`Erro ao processar listas do quadro ${board.id}:`, listError);
          continue;
        }
      }

      // Ordenar por data de atualização (mais recentes primeiro) e limitar a 10
      recentTasks.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      const limitedTasks = recentTasks.slice(0, 10);

      res.json(limitedTasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas recentes do dashboard:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  /**
   * Obtém itens de checklist para o dashboard
   */
  app.get("/api/dashboard/checklist-items", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Por enquanto, retornar array vazio - funcionalidade será implementada em versão futura
      res.json([]);
    } catch (error) {
      console.error("Erro ao buscar itens de checklist do dashboard:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  /**
   * Rotas para gerenciar Usuários
   */
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await appStorage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar usuários" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Verificar se o usuário existe
      const existingUser = await appStorage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Restringir atualizações de role apenas para administradores atuais
      if (req.body.role && (!req.user || req.user.role.toLowerCase() !== "admin")) {
        return res.status(403).json({ message: "Permissão negada para alteração de função do usuário" });
      }

      const userData = { ...req.body };
      delete userData.password; // Impede a atualização de senha por esta rota

      const updatedUser = await appStorage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) =>{
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Apenas administradores podem excluir usuários
      if (!req.user || req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Permissão negada. Apenas administradores podem excluir usuários." });
      }

      // Não permitir que um administrador exclua sua própria conta
      if (req.user.id === id) {
        return res.status(400).json({ message: "Não é possível excluir sua própria conta." });
      }

      const success = await appStorage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado ou não pode ser excluído" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Falha ao excluir usuário" });
    }
  });

  /**
   * Rota para alteração de senha de usuário
   * 
   * Implementa mecanismos de segurança:
   * - Verificação de autenticação
   * - Validação de autorização (próprio usuário ou admin)
   * - Verificação da senha atual para não-administradores
   * - Validação de complexidade da nova senha
   * - Geração segura de hash com salt único
   */
  app.post("/api/users/:id/change-password", changePasswordRateLimit, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Apenas administradores ou o próprio usuário podem alterar a senha
      if (req.user.id !== id && req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Permissão negada. Você não pode alterar a senha de outro usuário." });
      }

      // Validar dados de entrada
      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      // Validações adicionais de segurança para senha
      if (newPassword.length > 128) {
        return res.status(400).json({ message: "A senha não pode ter mais de 128 caracteres" });
      }

      // Prevenir uso de senhas comuns
      const commonPasswords = ['123456', 'password', 'admin', 'admin123', 'qwerty'];
      if (commonPasswords.includes(newPassword.toLowerCase())) {
        return res.status(400).json({ message: "Escolha uma senha mais segura" });
      }

      // Obter usuário
      const user = await appStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Validar senha atual: 
      // - Sempre para usuários comuns
      // - Para admins, apenas quando alterando a própria senha
      const shouldValidateCurrentPassword = req.user.role.toLowerCase() !== "admin" || req.user.id === id;
      
      if (shouldValidateCurrentPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "A senha atual é obrigatória" });
        }

        const isPasswordValid = await comparePasswords(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Senha atual incorreta" });
        }
      }

      // Gerar hash da nova senha
      const hashedNewPassword = await hashPassword(newPassword);

      // Atualizar senha
      const updatedUser = await appStorage.updateUser(id, { password: hashedNewPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar senha" });
      }

      res.status(200).json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({ message: "Falha ao alterar senha" });
    }
  });

  /**
   * Rota para upload de imagem de perfil
   * 
   * Utiliza multer para processamento de arquivos multipart/form-data:
   * - Validação de permissões de usuário
   * - Tratamento de erros específicos de upload
   * - Armazenamento de arquivos no sistema de arquivos
   * - Atualização da referência no banco de dados
   * - Limpeza de arquivos em caso de erro
   */
  app.post("/api/users/:id/profile-image", upload.single('profile_image'), handleMulterError, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }

      // Verificar permissões
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Apenas o próprio usuário ou um administrador pode alterar a imagem de perfil
      if (req.user.id !== id && req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Permissão negada. Você não pode alterar a imagem de outro usuário." });
      }

      // Verificar se um arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }

      // Obter o caminho do arquivo salvo
      const filePath = req.file.path;
      const relativePath = path.relative(path.join(process.cwd(), "public"), filePath);
      const fileUrl = `/${relativePath.replace(/\\/g, '/')}`;

      // Atualizar a URL da imagem de perfil no banco de dados
      const user = await appStorage.updateUser(id, { profilePicture: fileUrl });

      if (!user) {
        // Se a atualização falhar, remover o arquivo enviado
        fs.unlink(filePath, (err) => {
          if (err) console.error("Erro ao remover arquivo temporário:", err);
        });
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json(user);
    } catch (error) {
      console.error("Erro ao fazer upload de imagem de perfil:", error);
      // Remover o arquivo se ocorrer um erro
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Erro ao remover arquivo temporário:", err);
        });
      }
      res.status(500).json({ message: "Falha ao atualizar imagem de perfil" });
    }
  });

  /**
   * Rotas para gerenciar Membros dos Cartões
   */
  app.get("/api/cards/:cardId/members", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "ID do cartão inválido" });
      }

      const members = await appStorage.getCardMembers(cardId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar membros do cartão" });
    }
  });

  app.post("/api/card-members", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCardMemberSchema.parse(req.body);

      // Verificar se o cartão existe
      const card = await appStorage.getCard(validatedData.cardId);
      if (!card) {
        return res.status(404).json({ message: "Cartão não encontrado" });
      }

      // Verificar se o usuário existe
      const user = await appStorage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const cardMember = await appStorage.addMemberToCard(validatedData);

      // Criar notificação para o usuário atribuído
      if (req.user && req.user.id !== validatedData.userId) {
        try {
          // Buscar lista para obter boardId
          const list = await appStorage.getList(card.listId);
          const boardId = list?.boardId;

          await appStorage.createNotification({
            userId: validatedData.userId,
            type: 'task_assigned',
            title: 'Você foi atribuído a um cartão',
            message: `Você foi atribuído ao cartão "${card.title}"`,
            relatedCardId: validatedData.cardId,
            fromUserId: req.user.id,
            actionUrl: boardId ? `/boards/${boardId}/cards/${card.id}` : undefined
          });
        } catch (notificationError) {
          console.error('Erro ao criar notificação de atribuição:', notificationError);
        }
      }

      res.status(201).json(cardMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao adicionar membro ao cartão" });
    }
  });

  app.delete("/api/cards/:cardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const userId = parseInt(req.params.userId);

      if (isNaN(cardId) || isNaN(userId)) {
        return res.status(400).json({ message: "ID do cartão ou ID do usuário inválido" });
      }

      // Buscar informações do cartão antes de remover o membro
      const card = await appStorage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Cartão não encontrado" });
      }

      const success = await appStorage.removeMemberFromCard(cardId, userId);
      if (!success) {
        return res.status(404).json({ message: "Membro não encontrado no cartão" });
      }

      // Criar notificação para o usuário removido
      if (req.user && req.user.id !== userId) {
        try {
          // Buscar lista para obter boardId
          const list = await appStorage.getList(card.listId);
          const boardId = list?.boardId;

          await appStorage.createNotification({
            userId: userId,
            type: 'task_unassigned',
            title: 'Você foi removido de um cartão',
            message: `Você foi removido do cartão "${card.title}"`,
            relatedCardId: cardId,
            fromUserId: req.user.id,
            actionUrl: boardId ? `/boards/${boardId}/cards/${card.id}` : undefined
          });
        } catch (notificationError) {
          console.error('Erro ao criar notificação de remoção:', notificationError);
        }
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Falha ao remover membro do cartão" });
    }
  });

  /**
   * Rotas para gerenciar Checklists
   */
  app.get("/api/cards/:cardId/checklists", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);

      if (isNaN(cardId)) {
        return res.status(400).json({ message: "ID do cartão inválido" });
      }

      const checklists = await appStorage.getChecklists(cardId);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar checklists" });
    }
  });

  app.get("/api/checklists/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const checklist = await appStorage.getChecklist(id);

      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrada" });
      }

      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar checklist" });
    }
  });

  app.post("/api/checklists", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { title, cardId, order } = req.body;

      if (!title || !cardId) {
        return res.status(400).json({ message: "Título e ID do cartão são obrigatórios" });
      }

      const checklist = await appStorage.createChecklist({ title, cardId, order });
      res.status(201).json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Falha ao criar checklist" });
    }
  });

  app.patch("/api/checklists/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const checklist = await appStorage.updateChecklist(id, req.body);

      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrada" });
      }

      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Falha ao atualizar checklist" });
    }
  });

  app.delete("/api/checklists/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      // First check if checklist exists
      const existingChecklist = await appStorage.getChecklist(id);
      if (!existingChecklist) {
        return res.status(404).json({ message: "Checklist não encontrada" });
      }

      // Verificar se o usuário tem permissão para deletar esta checklist
      // Buscar o card associado à checklist
      const card = await appStorage.getCard(existingChecklist.cardId);
      if (!card) {
        return res.status(404).json({ message: "Cartão associado não encontrado" });
      }

      // Buscar a lista do card
      const list = await appStorage.getList(card.listId);
      if (!list) {
        return res.status(404).json({ message: "Lista não encontrada" });
      }

      // Buscar o quadro
      const board = await appStorage.getBoard(list.boardId);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar permissões: admin, dono do quadro, ou membro do quadro
      const isAdmin = req.user?.role === "admin";
      const isBoardOwner = board.userId === req.user?.id;
      const boardMember = await appStorage.getBoardMember(list.boardId, req.user!.id);
      
      if (!isAdmin && !isBoardOwner && !boardMember) {
        return res.status(403).json({ message: "Permissão negada para excluir esta checklist" });
      }

      const success = await appStorage.deleteChecklist(id);

      if (!success) {
        return res.status(500).json({ message: "Falha ao excluir checklist no banco de dados" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir checklist:", error);
      res.status(500).json({ message: "Falha ao excluir checklist" });
    }
  });

  /**
   * Rotas para gerenciar Itens de Checklist
   */
  app.get("/api/checklists/:checklistId/items", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const checklistId = parseInt(req.params.checklistId);

      if (isNaN(checklistId)) {
        return res.status(400).json({ message: "ID da checklist inválido" });
      }

      const items = await appStorage.getChecklistItems(checklistId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar itens da checklist" });
    }
  });

  app.post("/api/checklist-items", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { content, description, checklistId, order, completed, parentItemId, parent_item_id, assignedToUserId, dueDate } = req.body;

      if (!content || !checklistId) {
        return res.status(400).json({ message: "Conteúdo e ID da checklist são obrigatórios" });
      }

      const parent = parentItemId ?? parent_item_id ?? null;

      const itemData = {
        content: content.trim(),
        description: description && description.trim() ? description.trim() : undefined,
        checklistId: parseInt(checklistId),
        order: order || 0,
        completed: completed || false,
        parentItemId: parent,
        assignedToUserId: assignedToUserId || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined
      };

      // Criar item da checklist
      const item = await appStorage.createChecklistItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Erro detalhado ao criar item da checklist:", error);
      res.status(500).json({ message: "Falha ao criar item da checklist", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch("/api/checklist-items/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      // Processar dados de atualização

      // Buscar item atual para comparar mudanças
      const currentItem = await appStorage.getChecklistItem(id);
      if (!currentItem) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      // Preparando os dados do item para atualização
      const itemData = { ...req.body };

      // Verificar se dueDate está sendo enviado
      if (itemData.dueDate !== undefined) {
        // Se é uma string ou um objeto Date, normalizar para Date
        if (itemData.dueDate !== null) {
          itemData.dueDate = new Date(itemData.dueDate);
        }
      }

      const item = await appStorage.updateChecklistItem(id, itemData);

      // Se a subtarefa foi marcada como concluída, criar notificações automáticas
      if (req.user && itemData.completed && !currentItem.completed) {
        try {
          const checklist = await appStorage.getChecklist(currentItem.checklistId);
          const card = checklist ? await appStorage.getCard(checklist.cardId) : null;
          const list = card ? await appStorage.getList(card.listId) : null;
          
          if (list) {
            await createAutomaticNotifications({
              checklistItemId: id,
              cardId: card?.id,
              boardId: list.boardId,
              actionUserId: req.user.id,
              actionType: 'subtask_completed'
            });
          }
        } catch (notificationError) {
          console.error('Erro ao criar notificação de conclusão de subtarefa:', notificationError);
        }
      }

      // Criar notificação se um usuário foi atribuído
      if (req.user && itemData.assignedToUserId && itemData.assignedToUserId !== currentItem.assignedToUserId) {
        try {
          const checklist = await appStorage.getChecklist(currentItem.checklistId);
          const card = checklist ? await appStorage.getCard(checklist.cardId) : null;
          const list = card ? await appStorage.getList(card.listId) : null;
          const boardId = list?.boardId;

          await appStorage.createNotification({
            userId: itemData.assignedToUserId,
            type: 'task_assigned',
            title: 'Você foi atribuído a uma subtarefa',
            message: `Você foi atribuído à subtarefa "${currentItem.content}"${card ? ` no cartão "${card.title}"` : ''}`,
            relatedChecklistItemId: id,
            relatedCardId: card?.id,
            fromUserId: req.user.id,
            actionUrl: boardId && card ? `/boards/${boardId}/cards/${card.id}` : undefined
          });
        } catch (notificationError) {
          console.error('Erro ao criar notificação de atribuição de subtarefa:', notificationError);
        }
      }

      // Item atualizado com sucesso

      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.json(item);
    } catch (error) {
      console.error("Erro ao atualizar item da checklist:", error);
      res.status(500).json({ message: "Falha ao atualizar item da checklist" });
    }
  });

  app.delete("/api/checklist-items/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await appStorage.deleteChecklistItem(id);

      if (!success) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Falha ao excluir item da checklist" });
    }
  });

  /**
   * Rotas para gerenciar Membros dos Quadros
   */
  app.get("/api/boards/:boardId/members", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "ID do quadro inválido" });
      }

      const members = await appStorage.getBoardMembers(boardId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar membros do quadro" });
    }
  });

  app.get("/api/boards/:boardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const userId = parseInt(req.params.userId);

      if (isNaN(boardId) || isNaN(userId)) {
        return res.status(400).json({ message: "ID do quadro ou ID do usuário inválido" });
      }

      const member = await appStorage.getBoardMember(boardId, userId);
      if (!member) {
        return res.status(404).json({ message: "Membro não encontrado neste quadro" });
      }

      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar membro do quadro" });
    }
  });

  app.post("/api/board-members", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBoardMemberSchema.parse(req.body);

      // Verificar se o quadro existe
      const board = await appStorage.getBoard(validatedData.boardId);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar se o usuário existe
      const user = await appStorage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Verificar se o usuário atual tem permissão para adicionar membros
      // Apenas o criador do quadro ou um admin pode adicionar membros
      if (req.user && (board.userId === req.user.id || req.user.role.toLowerCase() === "admin")) {
        // Verificar se o usuário já é membro
        const existingMember = await appStorage.getBoardMember(validatedData.boardId, validatedData.userId);
        if (existingMember) {
          return res.status(409).json({ message: "Usuário já é membro deste quadro" });
        }
        
        const boardMember = await appStorage.addMemberToBoard(validatedData);
        res.status(201).json(boardMember);
      } else {
        res.status(403).json({ message: "Permissão negada para adicionar membros a este quadro" });
      }
    } catch (error) {
      console.error("Erro ao adicionar membro ao quadro:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao adicionar membro ao quadro" });
    }
  });

  app.patch("/api/boards/:boardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      if (isNaN(boardId) || isNaN(userId) || !role) {
        return res.status(400).json({ message: "Dados inválidos para atualização de membro" });
      }

      // Verificar se o quadro existe
      const board = await appStorage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar se o usuário atual tem permissão para atualizar membros
      if (req.user && (board.userId === req.user.id || req.user.role.toLowerCase() === "admin")) {
        const updatedMember = await appStorage.updateBoardMember(boardId, userId, role);
        if (!updatedMember) {
          return res.status(404).json({ message: "Membro não encontrado neste quadro" });
        }
        res.json(updatedMember);
      } else {
        res.status(403).json({ message: "Permissão negada para atualizar membros deste quadro" });
      }
    } catch (error) {
      console.error("Erro ao atualizar membro do quadro:", error);
      res.status(500).json({ message: "Falha ao atualizar membro do quadro" });
    }
  });

  app.delete("/api/boards/:boardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const userId = parseInt(req.params.userId);

      if (isNaN(boardId) || isNaN(userId)) {
        return res.status(400).json({ message: "ID do quadro ou ID do usuário inválido" });
      }

      // Verificar se o quadro existe
      const board = await appStorage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar se o usuário atual tem permissão para remover membros
      if (req.user && (board.userId === req.user.id || req.user.role.toLowerCase() === "admin" || req.user.id === userId)) {
        const success = await appStorage.removeMemberFromBoard(boardId, userId);
        if (!success) {
          return res.status(404).json({ message: "Membro não encontrado neste quadro" });
        }
        res.status(204).end();
      } else {
        res.status(403).json({ message: "Permissão negada para remover membros deste quadro" });
      }
    } catch (error) {
      res.status(500).json({ message: "Falha ao remover membro do quadro" });
    }
  });

  /**
   * Rota para verificar e notificar tarefas/subtarefas atrasadas
   */
  app.post("/api/check-overdue-tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Delegate to shared overdue check implementation
      const { runOverdueCheck } = await import('./overdue-tasks');
      const notificationsCreated = await runOverdueCheck();
      res.json({ success: true, notificationsCreated });
    } catch (error) {
      console.error('Erro ao verificar tarefas atrasadas:', error);
      res.status(500).json({ message: 'Erro ao verificar tarefas atrasadas' });
    }
  });

  /**
   * === ROTAS DE NOTIFICAÇÕES ===
   * Gerenciamento de notificações do sistema
   */

  /**
   * GET /api/notifications
   * Lista todas as notificações do usuário logado
   * Suporte para paginação e filtro por não lidas
   */
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const { limit, offset, unreadOnly } = req.query;
      const notifications = await appStorage.getNotifications(req.user.id, {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        unreadOnly: unreadOnly === 'true'
      });

      // Buscar informações dos usuários que enviaram as notificações
      const notificationsWithUsers = await Promise.all(
        notifications.map(async (notification) => {
          if (notification.fromUserId) {
            const fromUser = await appStorage.getUser(notification.fromUserId);
            // Retornar apenas campos seguros do usuário para evitar exposição de dados sensíveis
            const safeFromUser = fromUser ? {
              id: fromUser.id,
              name: fromUser.name,
              username: fromUser.username,
              profilePicture: fromUser.profilePicture
            } : null;
            return { ...notification, fromUser: safeFromUser };
          }
          return { ...notification, fromUser: null };
        })
      );

      res.json(notificationsWithUsers);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Erro ao buscar notificações' });
    }
  });

  /**
   * GET /api/notifications/unread-count
   * Retorna a contagem de notificações não lidas para o usuário autenticado
   */
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado' });

  // Consulta direta ao banco para obter a contagem de não lidas
  const rows = await sql`SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = ${req.user.id} AND read = false;`;
  // rows pode ser array ou objeto dependendo do driver
  const count = Array.isArray(rows) ? (rows[0]?.count ?? 0) : (rows as any).count ?? 0;
  res.json({ unreadCount: Number(count) });
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      res.status(500).json({ message: 'Erro ao buscar contagem de notificações não lidas' });
    }
  });

  /**
   * POST /api/notifications/:id/read
   * Marca uma notificação específica como lida
   */
  app.post("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "ID da notificação inválido" });
      }

      const success = await appStorage.markAsRead(notificationId, req.user.id);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Notificação não encontrada' });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Erro ao marcar notificação como lida' });
    }
  });

  /**
   * POST /api/notifications/mark-all-read
   * Marca todas as notificações do usuário como lidas
   */
  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const markedCount = await appStorage.markAllAsRead(req.user.id);
      res.json({ success: true, markedCount });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Erro ao marcar todas as notificações como lidas' });
    }
  });

  /**
   * DELETE /api/notifications/:id
   * Remove uma notificação específica
   */
  app.delete("/api/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "ID da notificação inválido" });
      }

      const success = await appStorage.deleteNotification(notificationId, req.user.id);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Notificação não encontrada' });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Erro ao excluir notificação' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}