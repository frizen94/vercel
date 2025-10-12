/**
 * schema.ts
 * 
 * Este arquivo define o esquema do banco de dados usando Drizzle ORM.
 * Contém todas as definições de tabelas, relacionamentos e tipos TypeScript
 * correspondentes para manter a consistência dos dados entre frontend e backend.
 */

import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Tabela de Usuários
 * 
 * Armazena todas as informações relacionadas às contas de usuário:
 * - Credenciais de autenticação (username/password)
 * - Informações pessoais (nome, email)
 * - Controle de acesso (role: admin ou user)
 * - Imagem de perfil
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  profilePicture: text("profile_picture"),
  role: text("role").notNull().default("user"), // "admin" ou "user"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Schema para inserção de usuários
 * Utiliza createInsertSchema para gerar um esquema Zod a partir da tabela
 * - Seleciona apenas os campos específicos para inserção
 * - Define alguns campos como opcionais (partial)
 */
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres").max(50, "Username não pode exceder 50 caracteres"),
  email: z.string().email("Email inválido").max(255, "Email não pode exceder 255 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(255, "Senha não pode exceder 255 caracteres"),
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode exceder 100 caracteres"),
})
  .pick({
    username: true,
    email: true,
    password: true,
    name: true,
    profilePicture: true,
    role: true,
  })
  .partial({
    email: true,
    profilePicture: true,
    role: true,
  });

/**
 * Tipos TypeScript para usuários
 * - InsertUser: tipo para inserção de dados
 * - User: tipo para seleção de dados
 */
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/**
 * Tipo estendido User que inclui função no quadro (board role)
 * Utilizado para mostrar qual papel um usuário tem em um quadro específico
 */
export interface UserWithBoardRole extends User {
  boardRole?: string;
}

/**
 * Tabela de Portfólios
 * 
 * Representa os portfólios que agrupam múltiplos projetos:
 * - Nome do portfólio
 * - Descrição opcional
 * - Cor de identificação
 * - Referência ao usuário criador (userId)
 * - Data de criação
 */
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: text("color").default('#3B82F6'),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tabela de Quadros (Boards)
 * 
 * Representa os quadros Kanban do sistema:
 * - Contém título do quadro
 * - Referência ao usuário criador (userId)
 * - Referência ao portfólio (portfolioId) - opcional
 * - Data de criação
 */
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color").default("#22C55E"),
  archived: boolean("archived").notNull().default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  portfolioId: integer("portfolio_id").references(() => portfolios.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Schema para inserção de portfólios
 * Define quais campos são necessários ao criar um novo portfólio
 */
export const insertPortfolioSchema = createInsertSchema(portfolios, {
  name: z.string().min(1, "Nome é obrigatório").max(200, "Nome não pode exceder 200 caracteres"),
  description: z.string().max(2000, "Descrição não pode exceder 2000 caracteres").optional(),
  color: z.string().min(1, "Cor é obrigatória").max(20, "Cor não pode exceder 20 caracteres").default("#3B82F6"),
}).pick({
  name: true,
  description: true,
  color: true,
  userId: true,
});

/**
 * Tipos para portfólios
 */
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

/**
 * Schema para inserção de quadros
 * Define quais campos são necessários ao criar um novo quadro
 */
export const insertBoardSchema = createInsertSchema(boards, {
  title: z.string().min(1, "Título é obrigatório").max(200, "Título não pode exceder 200 caracteres"),
  description: z.string().max(2000, "Descrição não pode exceder 2000 caracteres").optional(),
  color: z.string().max(20, "Cor não pode exceder 20 caracteres").optional(),
}).pick({
  title: true,
  description: true,
  color: true,
  userId: true,
  portfolioId: true,
});

/**
 * Tipos para quadros
 * - InsertBoard: tipo para inserção 
 * - Board: tipo para seleção
 */
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Board = typeof boards.$inferSelect;

/**
 * Tipo estendido do Board que inclui informações do usuário criador
 * Utilizado para exibir o nome do usuário que criou o quadro
 */
export interface BoardWithCreator extends Board {
  username?: string;
}

/**
 * Tabela de Listas
 * 
 * Representa as colunas verticais dentro de um quadro Kanban:
 * - Título da lista
 * - Referência ao quadro pai (boardId)
 * - Ordem de exibição (para arrastar e soltar)
 * - Data de criação
 */
export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Schema para inserção de listas
 * Define campos necessários para criar uma nova lista
 */
export const insertListSchema = createInsertSchema(lists, {
  title: z.string().min(1, "Título é obrigatório").max(200, "Título não pode exceder 200 caracteres"),
}).pick({
  title: true,
  boardId: true,
  order: true,
});

/**
 * Tipos para listas
 */
export type InsertList = z.infer<typeof insertListSchema>;
export type List = typeof lists.$inferSelect;

/**
 * Tabela de Cartões
 * 
 * Representa os cartões de tarefas dentro das listas:
 * - Título e descrição da tarefa
 * - Referência à lista pai (listId)
 * - Ordem de exibição dentro da lista
 * - Data de vencimento (deadline)
 * - Data de início (startDate) - para cálculo de duração
 * - Data de término (endDate) - para cálculo de duração
 * - Status de arquivamento (archived)
 * - Data de criação
 */
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  listId: integer("list_id").references(() => lists.id).notNull(),
  order: integer("order").notNull().default(0),
  dueDate: timestamp("due_date"),
  startDate: date("start_date"), // DATE column for card start date
  endDate: date("end_date"), // DATE column for card end date
  completed: boolean("completed").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tabela de Prioridades
 * Similar às etiquetas, mas cada prioridade é única por quadro e um cartão pode ter uma prioridade.
 */
export const priorities = pgTable("priorities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
});

export const insertPrioritySchema = createInsertSchema(priorities, {
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode exceder 100 caracteres"),
  color: z.string().min(1, "Cor é obrigatória").max(20, "Cor não pode exceder 20 caracteres"),
}).pick({
  name: true,
  color: true,
  boardId: true,
});

export type InsertPriority = z.infer<typeof insertPrioritySchema>;
export type Priority = typeof priorities.$inferSelect;

/**
 * Associação 1:1 entre cartão e prioridade
 * Usamos uma tabela separada para não alterar a definição de `cards` (menor risco)
 */
export const cardPriorities = pgTable("card_priorities", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  priorityId: integer("priority_id").references(() => priorities.id).notNull(),
});

export const insertCardPrioritySchema = createInsertSchema(cardPriorities).pick({
  cardId: true,
  priorityId: true,
});

export type InsertCardPriority = z.infer<typeof insertCardPrioritySchema>;
export type CardPriority = typeof cardPriorities.$inferSelect;

/**
 * Schema para inserção de cartões
 * Define os campos necessários e opcionais para criar um novo cartão
 */
export const insertCardSchema = createInsertSchema(cards, {
  title: z.string().min(1, "Título é obrigatório").max(300, "Título não pode exceder 300 caracteres"),
  description: z.string().max(5000, "Descrição não pode exceder 5000 caracteres").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
}).pick({
  title: true,
  description: true,
  listId: true,
  order: true,
  dueDate: true,
  startDate: true,
  endDate: true,
  completed: true,
}).partial({
  description: true,
  order: true,
  dueDate: true,
  startDate: true,
  endDate: true,
  completed: true,
})
.refine((data) => {
  // Validação: se ambas as datas estiverem definidas, startDate deve ser <= endDate
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Data de início deve ser anterior ou igual à data de término",
  path: ["endDate"], // Campo onde o erro será exibido
});

/**
 * Schema para atualizações de cartões
 * Todos os campos são opcionais para permitir atualizações parciais
 */
export const updateCardSchema = createInsertSchema(cards, {
  title: z.string().min(1, "Título é obrigatório").max(300, "Título não pode exceder 300 caracteres").optional(),
  description: z.string().max(5000, "Descrição não pode exceder 5000 caracteres").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").nullable().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").nullable().optional(),
}).pick({
  title: true,
  description: true,
  listId: true,
  order: true,
  dueDate: true,
  startDate: true,
  endDate: true,
  completed: true,
}).partial()
.refine((data) => {
  // Validação: se ambas as datas estiverem definidas, startDate deve ser <= endDate
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Data de início deve ser anterior ou igual à data de término",
  path: ["endDate"], // Campo onde o erro será exibido
});

/**
 * Tipos para cartões
 */
export type InsertCard = z.infer<typeof insertCardSchema>;
export type UpdateCard = z.infer<typeof updateCardSchema>;
export type Card = typeof cards.$inferSelect;

/**
 * Tabela de Etiquetas
 * 
 * Representa etiquetas coloridas que podem ser aplicadas aos cartões:
 * - Nome da etiqueta
 * - Cor (em formato hexadecimal ou nome CSS)
 * - Referência ao quadro pai (boardId) - etiquetas são específicas por quadro
 */
export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
});

/**
 * Schema para inserção de etiquetas
 */
export const insertLabelSchema = createInsertSchema(labels, {
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode exceder 100 caracteres"),
  color: z.string().min(1, "Cor é obrigatória").max(20, "Cor não pode exceder 20 caracteres"),
}).pick({
  name: true,
  color: true,
  boardId: true,
});

/**
 * Tipos para etiquetas
 */
export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Label = typeof labels.$inferSelect;

/**
 * Tabela de Relacionamento entre Cartões e Etiquetas
 * 
 * Tabela de junção que permite associar múltiplas etiquetas a múltiplos cartões:
 * - Referência ao cartão (cardId)
 * - Referência à etiqueta (labelId)
 * - Constraint de unicidade para evitar duplicatas
 */
export const cardLabels = pgTable("card_labels", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  labelId: integer("label_id").references(() => labels.id).notNull(),
});

/**
 * Schema para inserção de relacionamentos cartão-etiqueta
 */
export const insertCardLabelSchema = createInsertSchema(cardLabels).pick({
  cardId: true,
  labelId: true,
});

/**
 * Tipos para relacionamento cartão-etiqueta
 */
export type InsertCardLabel = z.infer<typeof insertCardLabelSchema>;
export type CardLabel = typeof cardLabels.$inferSelect;

/**
 * Tabela de Relacionamento entre Cartões e Membros
 * 
 * Tabela de junção que associa usuários a cartões (atribuição de tarefas):
 * - Referência ao cartão (cardId)
 * - Referência ao usuário (userId)
 * - Utiliza chave primária composta pelos dois campos
 */
export const cardMembers = pgTable("card_members", {
  cardId: integer("card_id").references(() => cards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.cardId, table.userId] }),
  };
});

/**
 * Schema para inserção de relacionamentos cartão-membro
 */
export const insertCardMemberSchema = createInsertSchema(cardMembers).pick({
  cardId: true,
  userId: true,
});

/**
 * Tipos para relacionamento cartão-membro
 */
export type InsertCardMember = z.infer<typeof insertCardMemberSchema>;
export type CardMember = typeof cardMembers.$inferSelect;

/**
 * Tabela de Checklists
 * 
 * Representa listas de verificação dentro dos cartões:
 * - Título da checklist
 * - Referência ao cartão pai (cardId) 
 * - Ordem de exibição dentro do cartão
 */
export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  order: integer("order").notNull().default(0),
});

/**
 * Schema para inserção de checklists
 */
export const insertChecklistSchema = createInsertSchema(checklists).pick({
  title: true,
  cardId: true,
  order: true,
});

/**
 * Tipos para checklists
 */
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Checklist = typeof checklists.$inferSelect;

/**
 * Tabela de Itens de Checklist
 * 
 * Representa os itens individuais dentro de uma checklist:
 * - Conteúdo do item
 * - Referência à checklist pai (checklistId)
 * - Ordem de exibição dentro da checklist
 * - Status de conclusão (completed)
 * - Usuário atribuído (assignedToUserId)
 * - Data de vencimento específica para o item (dueDate)
 */
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  description: text("description"),
  checklistId: integer("checklist_id").references(() => checklists.id).notNull(),
  order: integer("order").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  // Self-referential parent item id to support subtasks
  parentItemId: integer("parent_item_id"),
});

/**
 * Schema para inserção de itens de checklist
 */
export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  content: true,
  description: true,
  checklistId: true,
  order: true,
  completed: true,
  assignedToUserId: true,
  dueDate: true,
  parentItemId: true,
}).partial({
  description: true,
  order: true,
  completed: true,
  assignedToUserId: true,
  dueDate: true,
  parentItemId: true,
});

/**
 * Tipos para itens de checklist
 */
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;

/**
 * Tabela de membros de checklist_item (subtasks)
 * Permite associar múltiplos usuários a uma subtarefa
 */
export const checklistItemMembers = pgTable("checklist_item_members", {
  checklistItemId: integer("checklist_item_id").references(() => checklistItems.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.checklistItemId, table.userId] }),
  };
});

export const insertChecklistItemMemberSchema = createInsertSchema(checklistItemMembers).pick({
  checklistItemId: true,
  userId: true,
});

export type InsertChecklistItemMember = z.infer<typeof insertChecklistItemMemberSchema>;
export type ChecklistItemMember = typeof checklistItemMembers.$inferSelect;

/**
 * Tabela de Comentários
 * 
 * Armazena comentários feitos pelos usuários nos cartões:
 * - Conteúdo do comentário
 * - Referência ao cartão (cardId)
 * - Referência ao usuário (userId)
 * - Nome do usuário para exibição rápida (userName)
 */
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  // Optional reference to a checklist item (subtask). Nullable so comments can be either on a card or on a subtask.
  checklistItemId: integer("checklist_item_id").references(() => checklistItems.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
  userName: text("user_name").notNull().default("Anonymous"),
});

/**
 * Schema para inserção de comentários
 */
export const insertCommentSchema = createInsertSchema(comments, {
  content: z.string().min(1, "Conteúdo é obrigatório").max(2000, "Comentário não pode exceder 2000 caracteres"),
  userName: z.string().max(100, "Nome do usuário não pode exceder 100 caracteres").optional(),
}).pick({
  content: true,
  cardId: true,
  checklistItemId: true,
  userId: true,
  userName: true,
});

/**
 * Tipos para comentários
 */
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

/**
 * Tabela de Membros do Quadro
 * 
 * Representa o relacionamento entre usuários e quadros (convites/membros):
 * - Referência ao quadro (boardId)
 * - Referência ao usuário (userId)
 * - Função do usuário no quadro (role): "owner", "editor" ou "viewer"
 * - Data de criação do relacionamento
 * - Utiliza chave primária composta pelos campos boardId e userId
 */
export const boardMembers = pgTable("board_members", {
  boardId: integer("board_id").references(() => boards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("viewer"), // "owner", "editor" ou "viewer"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.boardId, table.userId] }),
  };
});

/**
 * Schema para inserção de membros de quadro
 */
export const insertBoardMemberSchema = createInsertSchema(boardMembers).pick({
  boardId: true,
  userId: true,
  role: true,
});

/**
 * Tipos para membros de quadro
 */
export type InsertBoardMember = z.infer<typeof insertBoardMemberSchema>;
export type BoardMember = typeof boardMembers.$inferSelect;

/**
 * Tabela de Notificações
 * 
 * Representa as notificações do sistema para usuários:
 * - Notificações de atribuição de tarefas
 * - Comentários e menções
 * - Convites para quadros
 * - Prazos vencidos
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "task_assigned", "comment", "mention", "invitation", "deadline"
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  actionUrl: text("action_url"), // URL para redirecionar ao clicar
  relatedCardId: integer("related_card_id").references(() => cards.id),
  relatedChecklistItemId: integer("related_checklist_item_id").references(() => checklistItems.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Schema para inserção de notificações
 */
export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  read: true,
  actionUrl: true,
  relatedCardId: true,
  relatedChecklistItemId: true,
  fromUserId: true,
}).partial({
  read: true,
  actionUrl: true,
  relatedCardId: true,
  relatedChecklistItemId: true,
  fromUserId: true
});

/**
 * Tipos para notificações
 */
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

/**
 * Tabela de Logs de Auditoria
 * 
 * Armazena todos os logs de auditoria do sistema:
 * - Todas as operações CRUD importantes
 * - Informações de segurança (IP, user agent, sessão)
 * - Estado anterior e posterior dos dados (JSON)
 * - Metadados contextuais
 */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  action: text("action").notNull(), // "CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT"
  entityType: text("entity_type").notNull(), // "user", "board", "card", "list", etc.
  entityId: text("entity_id"), // ID da entidade afetada (string para suportar diferentes tipos)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  oldData: text("old_data"), // JSON string dos dados antes da operação
  newData: text("new_data"), // JSON string dos dados após a operação
  metadata: text("metadata"), // JSON string com dados contextuais adicionais
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

/**
 * Schema para inserção de logs de auditoria
 */
export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  sessionId: true,
  action: true,
  entityType: true,
  entityId: true,
  ipAddress: true,
  userAgent: true,
  oldData: true,
  newData: true,
  metadata: true,
}).partial({
  userId: true,
  sessionId: true,
  entityId: true,
  ipAddress: true,
  userAgent: true,
  oldData: true,
  newData: true,
  metadata: true,
});

/**
 * Tabela de Atividades de Negócio
 * 
 * Registra atividades específicas de negócio para o dashboard administrativo:
 * - Criação e edição de projetos, cartões, tarefas
 * - Conclusão de checklists e subtasks
 * - Movimentações e atribuições
 * - Outras ações relevantes para métricas de produtividade
 */
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  boardId: integer("board_id").references(() => boards.id),
  activityType: text("activity_type").notNull(), // "board_created", "card_created", "task_completed", etc.
  entityType: text("entity_type").notNull(), // "board", "card", "checklist", "task", etc.
  entityId: integer("entity_id"), // ID da entidade relacionada
  description: text("description").notNull(), // Descrição legível da atividade
  metadata: text("metadata"), // JSON string com dados específicos da atividade
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

/**
 * Schema para inserção de atividades
 */
export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  boardId: true,
  activityType: true,
  entityType: true,
  entityId: true,
  description: true,
  metadata: true,
}).partial({
  boardId: true,
  entityId: true,
  metadata: true,
});

/**
 * Tipos para logs de auditoria
 */
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

/**
 * Tipos para atividades
 */
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;