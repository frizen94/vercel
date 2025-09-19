import { db } from './database';
import { IStorage } from './storage';
import type { 
  User, Portfolio, Board, List, Card, Label, CardLabel, Comment, CardMember, 
  Checklist, ChecklistItem, BoardMember, BoardWithCreator,
  UserWithBoardRole, InsertUser, InsertPortfolio, InsertBoard, InsertList, InsertCard, InsertLabel, InsertCardLabel, 
  InsertComment, InsertCardMember, InsertChecklist, InsertChecklistItem, InsertBoardMember,
  Notification, InsertNotification,
} from '@shared/schema';
import { eq, and, asc, inArray, sql, desc, isNull, lt, gte, or, not } from 'drizzle-orm';
import * as schema from '@shared/schema';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
// Importação correta do módulo pg
import pg from 'pg';

// Configurar a store de sessão PostgreSQL
const PostgresSessionStore = connectPg(session);
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL não está definido no ambiente');
}

// Decidir quando habilitar SSL (apenas em produção ou quando explicitamente solicitado)
const forceSsl = process.env.FORCE_DB_SSL === 'true' || process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require');

const pool = new pg.Pool({
  connectionString,
  ssl: forceSsl ? { rejectUnauthorized: false } : undefined,
});

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Tipo para a session store

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }

  async getUserCount(): Promise<number> {
    const users = await db.select().from(schema.users);
    return users.length;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Precisamos criar um objeto que corresponda ao schema de inserção
    const dataToInsert = {
      username: userData.username,
      email: userData.email || `${userData.username}@example.com`,
      password: userData.password,
      name: userData.name || userData.username,
      role: userData.role || 'user',
      profilePicture: userData.profilePicture || null,
      createdAt: new Date()
    };

    // Usamos o spread operator para converter para o tipo esperado pelo drizzle
    const inserted = await db.insert(schema.users).values({...dataToInsert}).returning();
    return inserted[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const updated = await db
      .update(schema.users)
      .set(userData)
      .where(eq(schema.users.id, id))
      .returning();
    return updated[0];
  }

  // Notificações
  async getNotifications(userId: number, options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}): Promise<Notification[]> {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    let query = db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId));

    if (unreadOnly) {
      query = query.where(eq(schema.notifications.read, false));
    }

    return query
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const inserted = await db.insert(schema.notifications).values(notificationData).returning();
    return inserted[0];
  }

  async markAsRead(id: number, userId: number): Promise<boolean> {
    const updated = await db
      .update(schema.notifications)
      .set({ read: true })
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)))
      .returning();
    return updated.length > 0;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const result = await db
      .update(schema.notifications)
      .set({ read: true })
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.read, false)))
      .returning();
    return result.length;
  }

  async deleteNotification(id: number, userId: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.notifications)
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)))
      .returning();
    return deleted.length > 0;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Verifica se o usuário existe
      const user = await this.getUser(id);
      if (!user) {
        return false;
      }

      // Remover usuário de todos os quadros onde é membro
      await db.delete(schema.boardMembers).where(eq(schema.boardMembers.userId, id));

      // Remover usuário de todos os cartões onde é membro
      await db.delete(schema.cardMembers).where(eq(schema.cardMembers.userId, id));

      // Remover comentários feitos pelo usuário
      await db.delete(schema.comments).where(eq(schema.comments.userId, id));

      // Remover o usuário
      const result = await db.delete(schema.users).where(eq(schema.users.id, id));

      return result.count > 0;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return false;
    }
  }

  // Portfolio methods
  async getPortfolios(): Promise<Portfolio[]> {
    try {
      const portfolios = await db
        .select({
          id: schema.portfolios.id,
          name: schema.portfolios.name,
          description: schema.portfolios.description,
          color: schema.portfolios.color,
          userId: schema.portfolios.userId,
          createdAt: schema.portfolios.createdAt,
          username: schema.users.username
        })
        .from(schema.portfolios)
        .leftJoin(schema.users, eq(schema.portfolios.userId, schema.users.id))
        .orderBy(desc(schema.portfolios.createdAt));

      return portfolios as Portfolio[];
    } catch (error) {
      console.error("Erro ao buscar portfólios:", error);
      return [];
    }
  }

  async getPortfolio(id: number): Promise<Portfolio | null> {
    try {
      const portfolios = await db
        .select({
          id: schema.portfolios.id,
          name: schema.portfolios.name,
          description: schema.portfolios.description,
          color: schema.portfolios.color,
          userId: schema.portfolios.userId,
          createdAt: schema.portfolios.createdAt,
          username: schema.users.username
        })
        .from(schema.portfolios)
        .leftJoin(schema.users, eq(schema.portfolios.userId, schema.users.id))
        .where(eq(schema.portfolios.id, id))
        .limit(1);

      return portfolios[0] as Portfolio || null;
    } catch (error) {
      console.error("Erro ao buscar portfólio:", error);
      return null;
    }
  }

  async getPortfoliosUserCanAccess(userId: number): Promise<Portfolio[]> {
    try {
      const portfolios = await db
        .select({
          id: schema.portfolios.id,
          name: schema.portfolios.name,
          description: schema.portfolios.description,
          color: schema.portfolios.color,
          userId: schema.portfolios.userId,
          createdAt: schema.portfolios.createdAt,
          username: schema.users.username
        })
        .from(schema.portfolios)
        .leftJoin(schema.users, eq(schema.portfolios.userId, schema.users.id))
        .where(eq(schema.portfolios.userId, userId))
        .orderBy(desc(schema.portfolios.createdAt));

      return portfolios as Portfolio[];
    } catch (error) {
      console.error("Erro ao buscar portfólios do usuário:", error);
      return [];
    }
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    try {
      const color = portfolio.color && portfolio.color.trim() !== '' ? portfolio.color : '#3B82F6';

      const inserted = await db
        .insert(schema.portfolios)
        .values({
          name: portfolio.name,
          description: portfolio.description || null,
          color: color,
          userId: portfolio.userId,
          createdAt: new Date()
        })
        .returning();

      return inserted[0] as Portfolio;
    } catch (error) {
      console.error("Erro ao criar portfólio:", error);
      throw error;
    }
  }

  async updatePortfolio(id: number, updates: Partial<InsertPortfolio>): Promise<Portfolio | null> {
    try {
      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.color !== undefined) updateData.color = updates.color;

      if (Object.keys(updateData).length === 0) {
        return this.getPortfolio(id);
      }

      const updated = await db
        .update(schema.portfolios)
        .set(updateData)
        .where(eq(schema.portfolios.id, id))
        .returning();

      return updated[0] as Portfolio || null;
    } catch (error) {
      console.error("Erro ao atualizar portfólio:", error);
      return null;
    }
  }

  async deletePortfolio(id: number): Promise<boolean> {
    try {
      // Primeiro, remover a referência do portfolio_id nos quadros
      await db
        .update(schema.boards)
        .set({ portfolioId: null })
        .where(eq(schema.boards.portfolioId, id));

      // Depois excluir o portfólio
      const deleted = await db
        .delete(schema.portfolios)
        .where(eq(schema.portfolios.id, id))
        .returning();

      return deleted.length > 0;
    } catch (error) {
      console.error("Erro ao excluir portfólio:", error);
      return false;
    }
  }

  async getBoardsByPortfolio(portfolioId: number): Promise<Board[]> {
    try {
      const boards = await db
        .select({
          id: schema.boards.id,
          title: schema.boards.title,
          description: schema.boards.description,
          userId: schema.boards.userId,
          portfolioId: schema.boards.portfolioId,
          createdAt: schema.boards.createdAt,
          username: schema.users.username
        })
        .from(schema.boards)
        .leftJoin(schema.users, eq(schema.boards.userId, schema.users.id))
        .where(eq(schema.boards.portfolioId, portfolioId))
        .orderBy(desc(schema.boards.createdAt));

      return boards as Board[];
    } catch (error) {
      console.error("Erro ao buscar quadros do portfólio:", error);
      return [];
    }
  }

  // Board methods
  async getBoards(): Promise<Board[]> {
    try {
      const boards = await db
        .select({
          id: schema.boards.id,
          title: schema.boards.title,
          description: schema.boards.description,
          userId: schema.boards.userId,
          portfolioId: schema.boards.portfolioId,
          createdAt: schema.boards.createdAt,
          username: schema.users.username
        })
        .from(schema.boards)
        .leftJoin(schema.users, eq(schema.boards.userId, schema.users.id))
        .orderBy(desc(schema.boards.createdAt));

      return boards as Board[];
    } catch (error) {
      console.error("Erro ao buscar quadros:", error);
      return [];
    }
  }

  async getBoard(id: number): Promise<BoardWithCreator | undefined> {
    // Primeiro obtém o quadro sem as junções
    const boards = await db
      .select()
      .from(schema.boards)
      .where(eq(schema.boards.id, id));

    if (boards.length === 0) {
      return undefined;
    }

    // Se o quadro tem um usuário como criador, busca o nome de usuário
    const board = boards[0] as BoardWithCreator;
    if (board.userId) {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, board.userId));

      if (users.length > 0) {
        // Adiciona o nome de usuário ao objeto do quadro
        board.username = users[0].username;
      }
    }

    return board;
  }

  async createBoard(boardData: InsertBoard): Promise<Board> {
    const dataToInsert = {
      ...boardData,
      createdAt: new Date()
    };
    const inserted = await db.insert(schema.boards).values({...dataToInsert}).returning();
    return inserted[0];
  }

  async updateBoard(id: number, boardData: Partial<InsertBoard>): Promise<Board | undefined> {
    const updated = await db
      .update(schema.boards)
      .set(boardData)
      .where(eq(schema.boards.id, id))
      .returning();
    return updated[0];
  }

  async deleteBoard(id: number): Promise<boolean> {
    try {
      // 1. Buscar todas as listas do quadro
      const boardLists = await db.select().from(schema.lists).where(eq(schema.lists.boardId, id));

      // 2. Para cada lista, excluir os cartões associados
      for (const list of boardLists) {
        // 2.1 Buscar todos os cartões da lista
        const listCards = await db.select().from(schema.cards).where(eq(schema.cards.listId, list.id));

        // 2.2 Para cada cartão, excluir registros dependentes em ordem
        for (const card of listCards) {
          // Excluir rótulos dos cartões
          await db.delete(schema.cardLabels).where(eq(schema.cardLabels.cardId, card.id));

          // Excluir membros dos cartões
          await db.delete(schema.cardMembers).where(eq(schema.cardMembers.cardId, card.id));

          // Excluir comentários
          await db.delete(schema.comments).where(eq(schema.comments.cardId, card.id));

          // Excluir itens das checklists
          const cardChecklists = await db.select().from(schema.checklists).where(eq(schema.checklists.cardId, card.id));
          for (const checklist of cardChecklists) {
            await db.delete(schema.checklistItems).where(eq(schema.checklistItems.checklistId, checklist.id));
          }

          // Excluir checklists
          await db.delete(schema.checklists).where(eq(schema.checklists.cardId, card.id));
        }

        // 2.3 Excluir os cartões da lista
        await db.delete(schema.cards).where(eq(schema.cards.listId, list.id));
      }

      // 3. Excluir todas as listas do quadro
      await db.delete(schema.lists).where(eq(schema.lists.boardId, id));

      // 4. Excluir rótulos do quadro
      await db.delete(schema.labels).where(eq(schema.labels.boardId, id));

      // 5. Excluir membros do quadro
      await db.delete(schema.boardMembers).where(eq(schema.boardMembers.boardId, id));

      // 6. Finalmente, excluir o quadro
      const deleted = await db
        .delete(schema.boards)
        .where(eq(schema.boards.id, id))
        .returning();

      return deleted.length > 0;
    } catch (error) {
      console.error('Erro ao excluir quadro:', error);
      return false;
    }
  }

  async getBoardsForUser(userId: number): Promise<Board[]> {
    return db
      .select()
      .from(schema.boards)
      .where(eq(schema.boards.userId, userId))
      .orderBy(asc(schema.boards.createdAt));
  }

  async getBoardsUserCanAccess(userId: number): Promise<Board[]> {
    // Obtém quadros próprios
    const ownedBoards = await this.getBoardsForUser(userId);

    // Obtém quadros em que o usuário é membro
    const memberBoards = await db
      .select()
      .from(schema.boards)
      .innerJoin(
        schema.boardMembers,
        and(
          eq(schema.boards.id, schema.boardMembers.boardId),
          eq(schema.boardMembers.userId, userId)
        )
      );

    // Combina os dois conjuntos e remove duplicatas
    const allBoardsMap = new Map<number, Board>();

    // Adiciona quadros de propriedade do usuário
    ownedBoards.forEach(board => {
      allBoardsMap.set(board.id, board);
    });

    // Adiciona quadros em que o usuário é membro
    memberBoards.forEach(({ boards }) => {
      if (!allBoardsMap.has(boards.id)) {
        allBoardsMap.set(boards.id, boards);
      }
    });

    return Array.from(allBoardsMap.values());
  }

  // List methods
  async getLists(boardId: number): Promise<List[]> {
    return db
      .select()
      .from(schema.lists)
      .where(eq(schema.lists.boardId, boardId))
      .orderBy(asc(schema.lists.order));
  }

  async getList(id: number): Promise<List | undefined> {
    const lists = await db.select().from(schema.lists).where(eq(schema.lists.id, id));
    return lists[0];
  }

  async createList(listData: InsertList): Promise<List> {
    const dataToInsert = {
      ...listData,
      createdAt: new Date()
    };
    const inserted = await db.insert(schema.lists).values({...dataToInsert}).returning();
    return inserted[0];
  }

  async updateList(id: number, listData: Partial<InsertList>): Promise<List | undefined> {
    const updated = await db
      .update(schema.lists)
      .set(listData)
      .where(eq(schema.lists.id, id))
      .returning();
    return updated[0];
  }

  async deleteList(id: number): Promise<boolean> {
    try {
      // 1. Buscar todos os cartões desta lista
      const listCards = await db.select().from(schema.cards).where(eq(schema.cards.listId, id));

      // 2. Para cada cartão, excluir registros dependentes em ordem
      for (const card of listCards) {
        // Excluir rótulos dos cartões
        await db.delete(schema.cardLabels).where(eq(schema.cardLabels.cardId, card.id));

        // Excluir membros dos cartões
        await db.delete(schema.cardMembers).where(eq(schema.cardMembers.cardId, card.id));

        // Excluir comentários
        await db.delete(schema.comments).where(eq(schema.comments.cardId, card.id));

        // Excluir itens das checklists
        const cardChecklists = await db.select().from(schema.checklists).where(eq(schema.checklists.cardId, card.id));
        for (const checklist of cardChecklists) {
          await db.delete(schema.checklistItems).where(eq(schema.checklistItems.checklistId, checklist.id));
        }

        // Excluir checklists
        await db.delete(schema.checklists).where(eq(schema.checklists.cardId, card.id));
      }

      // 3. Excluir os cartões da lista
      await db.delete(schema.cards).where(eq(schema.cards.listId, id));

      // 4. Finalmente, excluir a lista
      const deleted = await db
        .delete(schema.lists)
        .where(eq(schema.lists.id, id))
        .returning();

      return deleted.length > 0;
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      return false;
    }
  }

  // Card methods
  async getCards(listId: number): Promise<Card[]> {
    return db
      .select()
      .from(schema.cards)
      .where(eq(schema.cards.listId, listId))
      .orderBy(asc(schema.cards.order));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const cards = await db.select().from(schema.cards).where(eq(schema.cards.id, id));
    return cards[0];
  }

  async createCard(cardData: InsertCard): Promise<Card> {
    const dataToInsert = {
      ...cardData,
      createdAt: new Date()
    };
    const inserted = await db.insert(schema.cards).values({...dataToInsert}).returning();
    return inserted[0];
  }

  async updateCard(id: number, cardData: Partial<InsertCard>): Promise<Card | undefined> {
    const updated = await db
      .update(schema.cards)
      .set(cardData)
      .where(eq(schema.cards.id, id))
      .returning();
    return updated[0];
  }

  async deleteCard(id: number): Promise<boolean> {
    try {
      // 1. Excluir rótulos dos cartões
      await db.delete(schema.cardLabels).where(eq(schema.cardLabels.cardId, id));

      // 2. Excluir membros dos cartões
      await db.delete(schema.cardMembers).where(eq(schema.cardMembers.cardId, id));

      // 3. Excluir comentários
      await db.delete(schema.comments).where(eq(schema.comments.cardId, id));

      // 4. Excluir itens das checklists
      const cardChecklists = await db.select().from(schema.checklists).where(eq(schema.checklists.cardId, id));
      for (const checklist of cardChecklists) {
        await db.delete(schema.checklistItems).where(eq(schema.checklistItems.checklistId, checklist.id));
      }

      // 5. Excluir checklists
      await db.delete(schema.checklists).where(eq(schema.checklists.cardId, id));

      // 6. Finalmente, excluir o cartão
      const deleted = await db
        .delete(schema.cards)
        .where(eq(schema.cards.id, id))
        .returning();

      return deleted.length > 0;
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      return false;
    }
  }

  // Label methods
  async getLabels(boardId: number): Promise<Label[]> {
    return db
      .select()
      .from(schema.labels)
      .where(eq(schema.labels.boardId, boardId));
  }

  async getLabel(id: number): Promise<Label | undefined> {
    const labels = await db.select().from(schema.labels).where(eq(schema.labels.id, id));
    return labels[0];
  }

  async createLabel(labelData: InsertLabel): Promise<Label> {
    const inserted = await db.insert(schema.labels).values(labelData).returning();
    return inserted[0];
  }

  // Card Label methods
  async getCardLabels(cardId: number): Promise<CardLabel[]> {
    return db
      .select()
      .from(schema.cardLabels)
      .where(eq(schema.cardLabels.cardId, cardId));
  }

  async getBoardCardsLabels(boardId: number): Promise<CardLabel[]> {
    // Return card_labels for all cards that belong to the board
    // First, find list ids for the board
    const lists = await db.select().from(schema.lists).where(eq(schema.lists.boardId, boardId));
    if (lists.length === 0) return [];
    const listIds = lists.map(l => l.id);

    // Then find card ids under those lists
    const cards = await db.select().from(schema.cards).where(inArray(schema.cards.listId, listIds));
    if (cards.length === 0) return [];
    const cardIds = cards.map(c => c.id);

    // Finally, return card_labels for those cards
    return db.select().from(schema.cardLabels).where(inArray(schema.cardLabels.cardId, cardIds));
  }

  async addLabelToCard(cardLabelData: InsertCardLabel): Promise<CardLabel> {
    // Verificar se a associação já existe para evitar duplicatas
    const existing = await db
      .select()
      .from(schema.cardLabels)
      .where(
        and(
          eq(schema.cardLabels.cardId, cardLabelData.cardId),
          eq(schema.cardLabels.labelId, cardLabelData.labelId)
        )
      )
      .limit(1);

    // Se já existe, retorna a associação existente
    if (existing.length > 0) {
      console.log(`Etiqueta ${cardLabelData.labelId} já está associada ao cartão ${cardLabelData.cardId}`);
      return existing[0];
    }

    // Se não existe, cria nova associação
    const inserted = await db.insert(schema.cardLabels).values(cardLabelData).returning();
    return inserted[0];
  }

  async removeLabelFromCard(cardId: number, labelId: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.cardLabels)
      .where(
        and(
          eq(schema.cardLabels.cardId, cardId),
          eq(schema.cardLabels.labelId, labelId)
        )
      )
      .returning();
    return deleted.length > 0;
  }

  // Comment methods
  async getComments(cardId: number, checklistItemId?: number): Promise<Comment[]> {
    const query = db.select().from(schema.comments).where(eq(schema.comments.cardId, cardId));
    if (typeof checklistItemId === 'number') {
      return query.where(eq(schema.comments.checklistItemId, checklistItemId)).orderBy(asc(schema.comments.createdAt));
    }
    // default: return only comments not tied to a checklist item (card-level comments)
    return query.where(isNull(schema.comments.checklistItemId)).orderBy(asc(schema.comments.createdAt));
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const inserted = await db.insert(schema.comments).values(commentData).returning();
    return inserted[0];
  }

  async deleteComment(id: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.comments)
      .where(eq(schema.comments.id, id))
      .returning();
    return deleted.length > 0;
  }

  /**
   * Obtém cartões com checklists para o dashboard
   * 
   * Retorna cartões que:
   * 1. São atribuídos ao usuário especificado (cardMembers)
   * 2. Têm pelo menos um checklist
   * 3. Têm data de vencimento próxima (próximos 7 dias) ou já vencida
   * 
   * Os cartões são ordenados por data de vencimento (os mais próximos primeiro)
   */
  async getCardsWithChecklistsForUser(userId: number): Promise<any[]> {
    try {
      console.log(`[DB-STORAGE] Retornando array vazio para getCardsWithChecklistsForUser (userId=${userId})`);
      return [];
    } catch (error) {
      console.error("Erro ao buscar cartões com checklists:", error);
      return [];
    }
  }

  /**
   * Obtém cartões atrasados para o dashboard
   * 
   * Retorna cartões que:
   * 1. São atribuídos ao usuário especificado (cardMembers) OU pertencem a quadros acessíveis pelo usuário
   * 2. Têm data de vencimento que já passou
   * 
   * Os cartões são ordenados por data de vencimento (os mais atrasados primeiro)
   */
  async getOverdueCardsForUser(userId: number): Promise<any[]> {
    try {
      console.log(`[DB-STORAGE] Retornando array vazio para getOverdueCardsForUser (userId=${userId})`);
      return [];
    } catch (error) {
      console.error("Erro ao buscar cartões atrasados:", error);
      return [];
    }
  }

  /**
   * Obtém cartões que vencem em breve para o dashboard
   * 
   * Retorna cartões que:
   * 1. São atribuídos ao usuário especificado (cardMembers) OU pertencem a quadros acessíveis pelo usuário
   * 2. Têm data de vencimento nos próximos 3 dias
   * 
   * Os cartões são ordenados por data de vencimento (os mais próximos primeiro)
   */
  async getUpcomingCardsForUser(userId: number): Promise<any[]> {
    try {
      console.log(`Buscando cartões próximos para usuário id=${userId}`);

      // Passo 1: Obter todos os quadros acessíveis pelo usuário
      const accessibleBoards = await this.getBoardsUserCanAccess(userId);
      const boardIds = accessibleBoards.map(board => board.id);

      console.log(`Quadros acessíveis: ${boardIds.join(', ') || 'nenhum'}`);

      if (boardIds.length === 0) {
        return [];
      }

      // Passo 2: Obter todas as listas desses quadros
      const lists = await db
        .select()
        .from(schema.lists)
        .where(inArray(schema.lists.boardId, boardIds));

      const listIds = lists.map(list => list.id);

      console.log(`Listas encontradas: ${listIds.join(', ') || 'nenhuma'}`);

      if (listIds.length === 0) {
        return [];
      }

      try {
        // Passo 3: Obter cartões que vencem em breve
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        // Consulta para obter cartões que vencem em breve
        const cards = await db
          .select()
          .from(schema.cards)
          .where(
            and(
              inArray(schema.cards.listId, listIds),
              not(isNull(schema.cards.dueDate)),
              gte(schema.cards.dueDate, today),
              lt(schema.cards.dueDate, threeDaysLater)
            )
          )
          .orderBy(asc(schema.cards.dueDate));

        console.log(`Cartões próximos encontrados: ${cards.length}`);

        if (cards.length === 0) {
          return [];
        }

        // Resultado final com informações completas
        const result = [];

        // Para cada cartão, buscar informações adicionais
        for (const card of cards) {
          try {
            console.log(`Processando cartão próximo id=${card.id}`);

            // Obter a lista e o quadro ao qual o cartão pertence
            const list = lists.find(l => l.id === card.listId);
            if (!list) {
              console.log(`Lista id=${card.listId} não encontrada para cartão id=${card.id}`);
              continue;
            }

            const board = accessibleBoards.find(b => b.id === list.boardId);
            if (!board) {
              console.log(`Quadro id=${list.boardId} não encontrado para lista id=${list.id}`);
              continue;
            }

            try {
              // Obter membros do cartão
              const cardMembers = await this.getCardMembers(card.id);

              // Verificar se o cartão está atribuído ao usuário
              const isAssignedToUser = cardMembers.some(member => member.id === userId);

              // Obter etiquetas do cartão
              const cardLabels = await this.getCardLabels(card.id);

              // Se houver etiquetas, obter detalhes completos
              let labels: any[] = [];
              if (cardLabels && cardLabels.length > 0) {
                try {
                  const labelIds = cardLabels.map(cl => cl.labelId);
                  labels = await db
                    .select()
                    .from(schema.labels)
                    .where(inArray(schema.labels.id, labelIds));
                } catch (labelsError) {
                  console.error(`Erro ao buscar detalhes das etiquetas do cartão id=${card.id}:`, labelsError);
                }
              }

              // Adicionar ao resultado
              result.push({
                card,
                list,
                board,
                members: cardMembers || [],
                labels: labels,
                isAssignedToUser
              });
            } catch (cardDetailsError) {
              console.error(`Erro ao buscar detalhes adicionais do cartão id=${card.id}:`, cardDetailsError);
            }
          } catch (cardError) {
            console.error(`Erro ao processar cartão id=${card.id}:`, cardError);
          }
        }

        console.log(`Total de cartões próximos retornados: ${result.length}`);
        return result;
      } catch (cardsQueryError) {
        console.error("Erro na consulta de cartões próximos:", cardsQueryError);
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar cartões próximos:", error);
      return [];
    }
  }

  // Board Member methods
  async getBoardMembers(boardId: number): Promise<UserWithBoardRole[]> {
    // Primeiro obtemos os membros do quadro
    const boardMembers = await db
      .select()
      .from(schema.boardMembers)
      .where(eq(schema.boardMembers.boardId, boardId));

    if (boardMembers.length === 0) {
      return [];
    }

    // Depois buscamos os dados completos dos usuários
    const userIds = boardMembers.map(bm => bm.userId);
    const users = await db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.id, userIds));

    // Agora adicionamos a função (role) de cada usuário
    return users.map(user => {
      // Encontrar o board member correspondente ao usuário
      const boardMember = boardMembers.find(bm => bm.userId === user.id);
      const userWithRole = user as UserWithBoardRole;
      // Adicionar a função do boardMember ao objeto do usuário
      userWithRole.boardRole = boardMember ? boardMember.role : "viewer";
      return userWithRole;
    });
  }

  async getBoardMember(boardId: number, userId: number): Promise<BoardMember | undefined> {
    const boardMembers = await db
      .select()
      .from(schema.boardMembers)
      .where(
        and(
          eq(schema.boardMembers.boardId, boardId),
          eq(schema.boardMembers.userId, userId)
        )
      );
    return boardMembers[0];
  }

  async addMemberToBoard(boardMemberData: InsertBoardMember): Promise<BoardMember> {
    const dataToInsert = {
      ...boardMemberData,
      createdAt: new Date()
    };
    const inserted = await db.insert(schema.boardMembers).values(dataToInsert).returning();
    return inserted[0];
  }

  async updateBoardMember(boardId: number, userId: number, role: string): Promise<BoardMember | undefined> {
    const updated = await db
      .update(schema.boardMembers)
      .set({ role })
      .where(
        and(
          eq(schema.boardMembers.boardId, boardId),
          eq(schema.boardMembers.userId, userId)
        )
      )
      .returning();
    return updated[0];
  }

  async removeMemberFromBoard(boardId: number, userId: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.boardMembers)
      .where(
        and(
          eq(schema.boardMembers.boardId, boardId),
          eq(schema.boardMembers.userId, userId)
        )
      )
      .returning();
    return deleted.length > 0;
  }

  // Card Member methods
  async getCardMembers(cardId: number): Promise<User[]> {
    const cardMembers = await db
      .select()
      .from(schema.cardMembers)
      .where(eq(schema.cardMembers.cardId, cardId));

    if (cardMembers.length === 0) {
      return [];
    }

    const userIds = cardMembers.map(cm => cm.userId);
    return db.select().from(schema.users).where(inArray(schema.users.id, userIds));
  }

  async addMemberToCard(cardMemberData: InsertCardMember): Promise<CardMember> {
    const inserted = await db.insert(schema.cardMembers).values(cardMemberData).returning();
    const cardMember = inserted[0];

    // Buscar informações do card para criar notificação
    const card = await db.select().from(schema.cards).where(eq(schema.cards.id, cardMember.cardId)).limit(1);

    if (card.length > 0) {
      // Criar notificação para o usuário atribuído
      await this.createNotification({
        userId: cardMember.userId,
        type: 'task_assigned',
        title: 'Nova tarefa atribuída',
        message: `Você foi atribuído à tarefa "${card[0].title}"`,
        actionUrl: `/board/${card[0].listId}/card/${card[0].id}`,
        relatedCardId: card[0].id
      });
    }

    return cardMember;
  }

  async removeMemberFromCard(cardId: number, userId: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.cardMembers)
      .where(
        and(
          eq(schema.cardMembers.cardId, cardId),
          eq(schema.cardMembers.userId, userId)
        )
      )
      .returning();
    return deleted.length > 0;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(schema.users);
  }

  // Checklist item members (subtask collaborators)
  async getChecklistItemMembers(checklistItemId: number): Promise<User[]> {
    try {
      console.log(`DB: getChecklistItemMembers for checklistItemId=${checklistItemId}`);
      const members = await db.select().from(schema.checklistItemMembers).where(eq(schema.checklistItemMembers.checklistItemId, checklistItemId));
      if (members.length === 0) return [];
      const userIds = members.map(m => m.userId);
      console.log(`DB: found member userIds=${JSON.stringify(userIds)}`);
      return db.select().from(schema.users).where(inArray(schema.users.id, userIds));
    } catch (error) {
      console.error(`DB: Error fetching checklist item members for ${checklistItemId}:`, error);
      throw error;
    }
  }

  async addMemberToChecklistItem(checklistItemId: number, userId: number): Promise<void> {
    try {
      console.log(`DB: addMemberToChecklistItem checklistItemId=${checklistItemId} userId=${userId}`);
      await db.insert(schema.checklistItemMembers).values({ checklistItemId, userId }).returning();
      console.log(`DB: Successfully added member ${userId} to checklist item ${checklistItemId}`);
    } catch (error) {
      console.error(`DB: Failed to add member ${userId} to checklist item ${checklistItemId}:`, error);
      throw error;
    }
  }

  async removeMemberFromChecklistItem(checklistItemId: number, userId: number): Promise<void> {
    try {
      console.log(`DB: removeMemberFromChecklistItem checklistItemId=${checklistItemId} userId=${userId}`);
      await db.delete(schema.checklistItemMembers).where(and(eq(schema.checklistItemMembers.checklistItemId, checklistItemId), eq(schema.checklistItemMembers.userId, userId)));
      console.log(`DB: Successfully removed member ${userId} from checklist item ${checklistItemId}`);
    } catch (error) {
      console.error(`DB: Failed to remove member ${userId} from checklist item ${checklistItemId}:`, error);
      throw error;
    }
  }

  // Checklist methods
  async getChecklists(cardId: number): Promise<Checklist[]> {
    return db
      .select()
      .from(schema.checklists)
      .where(eq(schema.checklists.cardId, cardId))
      .orderBy(asc(schema.checklists.order));
  }

  async getChecklist(id: number): Promise<Checklist | undefined> {
    const checklists = await db.select().from(schema.checklists).where(eq(schema.checklists.id, id));
    return checklists[0];
  }

  async createChecklist(checklistData: InsertChecklist): Promise<Checklist> {
    const inserted = await db.insert(schema.checklists).values(checklistData).returning();
    return inserted[0];
  }

  async updateChecklist(id: number, checklistData: Partial<InsertChecklist>): Promise<Checklist | undefined> {
    const updated = await db
      .update(schema.checklists)
      .set(checklistData)
      .where(eq(schema.checklists.id, id))
      .returning();
    return updated[0];
  }

  async deleteChecklist(id: number): Promise<boolean> {
    try {
      // 1. Excluir itens da checklist
      await db.delete(schema.checklistItems).where(eq(schema.checklistItems.checklistId, id));

      // 2. Excluir a checklist
      const deleted = await db
        .delete(schema.checklists)
        .where(eq(schema.checklists.id, id))
        .returning();

      return deleted.length > 0;
    } catch (error) {
      console.error('Erro ao excluir checklist:', error);
      return false;
    }
  }

  // Checklist Item methods
  async getChecklistItems(checklistId: number): Promise<ChecklistItem[]> {
    try {
      return await db
        .select()
        .from(schema.checklistItems)
        .where(eq(schema.checklistItems.checklistId, checklistId))
        .orderBy(asc(schema.checklistItems.order));
    } catch (error) {
      console.error('Erro ao buscar itens da checklist:', error);
      throw error;
    }
  }

  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    const items = await db.select().from(schema.checklistItems).where(eq(schema.checklistItems.id, id));
    return items[0];
  }

  async createChecklistItem(itemData: InsertChecklistItem): Promise<ChecklistItem> {
    try {
      console.log('DB: Creating checklist item with data:', itemData);
      const dataToInsert = {
        content: itemData.content,
        description: itemData.description || null,
        checklistId: itemData.checklistId,
        order: itemData.order || 0,
        completed: itemData.completed || false,
        assignedToUserId: itemData.assignedToUserId || null,
        dueDate: itemData.dueDate || null,
        parentItemId: itemData.parentItemId || null,
      };
      
      const inserted = await db.insert(schema.checklistItems).values(dataToInsert).returning();
      console.log('DB: Successfully created checklist item:', inserted[0]);
      return inserted[0];
    } catch (error) {
      console.error('Erro ao criar item da checklist:', error);
      throw error;
    }
  }

  async updateChecklistItem(id: number, itemData: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    try {
      const updated = await db
        .update(schema.checklistItems)
        .set(itemData)
        .where(eq(schema.checklistItems.id, id))
        .returning();
      return updated[0];
    } catch (error) {
      console.error('Erro ao atualizar item da checklist:', error);
      throw error;
    }
  }

  async deleteChecklistItem(id: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.checklistItems)
      .where(eq(schema.checklistItems.id, id))
      .returning();
    return deleted.length > 0;
  }

  // Dashboard methods
  async getRecentTasks(userId: number): Promise<any[]> {
    // Buscar cards recentes dos boards que o usuário tem acesso
    const recentTasks = await db
      .select({
        id: schema.cards.id,
        title: schema.cards.title,
        description: schema.cards.description,
        dueDate: schema.cards.dueDate,
        createdAt: schema.cards.createdAt,
        boardTitle: schema.boards.title,
        listTitle: schema.lists.title
      })
      .from(schema.cards)
      .innerJoin(schema.lists, eq(schema.cards.listId, schema.lists.id))
      .innerJoin(schema.boards, eq(schema.lists.boardId, schema.boards.id))
      .leftJoin(schema.boardMembers, eq(schema.boards.id, schema.boardMembers.boardId))
      .where(
        or(
          eq(schema.boards.userId, userId), // Boards que o usuário possui
          eq(schema.boardMembers.userId, userId) // Boards onde o usuário é membro
        )
      )
      .orderBy(desc(schema.cards.createdAt))
      .limit(10);

    return recentTasks;
  }

  async getCollaborators(userId: number): Promise<any[]> {
    // Buscar usuários que colaboram nos mesmos boards que o usuário atual
    const collaborators = await db
      .selectDistinct({
        id: schema.users.id,
        name: schema.users.name,
        username: schema.users.username,
        profilePicture: schema.users.profilePicture,
        role: schema.users.role
      })
      .from(schema.users)
      .innerJoin(schema.boardMembers, eq(schema.users.id, schema.boardMembers.userId))
      .innerJoin(schema.boards, eq(schema.boardMembers.boardId, schema.boards.id))
      .where(
        and(
          not(eq(schema.users.id, userId)), // Não incluir o próprio usuário
          or(
            eq(schema.boards.userId, userId), // Boards que o usuário possui
            inArray(schema.boards.id, // Boards onde o usuário é membro
              db.select({ id: schema.boards.id })
                .from(schema.boards)
                .innerJoin(schema.boardMembers, eq(schema.boards.id, schema.boardMembers.boardId))
                .where(eq(schema.boardMembers.userId, userId))
            )
          )
        )
      )
      .limit(20);

    return collaborators;
  }

  // Notification methods
  async getNotifications(userId: number, options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}): Promise<Notification[]> {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    // Build conditions array to combine properly with and()
    const conditions = [eq(schema.notifications.userId, userId)];
    
    if (unreadOnly) {
      conditions.push(eq(schema.notifications.read, false));
    }

    return db.select()
      .from(schema.notifications)
      .where(and(...conditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const inserted = await db.insert(schema.notifications).values(notificationData).returning();
    return inserted[0];
  }

  async markAsRead(id: number, userId: number): Promise<boolean> {
    const updated = await db
      .update(schema.notifications)
      .set({ read: true })
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)))
      .returning();
    return updated.length > 0;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const result = await db
      .update(schema.notifications)
      .set({ read: true })
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.read, false)))
      .returning();
    return result.length;
  }

  async deleteNotification(id: number, userId: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.notifications)
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)))
      .returning();
    return deleted.length > 0;
  }
}

// Exportar uma instância do DatabaseStorage
export const storage = new DatabaseStorage();