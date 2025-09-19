# Sistema de Notificações - Implementação Completa

## Visão Geral

Este documento descreve como implementar um sistema completo de notificações para o projeto Kanban, permitindo que usuários sejam notificados quando cards ou checklists são atribuídos a eles.

## Status Atual

❌ **Sistema NÃO implementado**
- Página `/inbox` existe mas endpoint `/api/notifications` não existe
- Nenhuma tabela `notifications` no banco
- Atribuições de cards/checklists não geram notificações

## Arquitetura Proposta

### 1. Schema do Banco de Dados

Adicionar ao `shared/schema.ts`:

```typescript
// Tabela de Notificações
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "task_assigned", "comment", "mention", "invitation", "deadline"
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  actionUrl: text("action_url"), // URL para redirecionar ao clicar
  relatedCardId: integer("related_card_id").references(() => cards.id),
  relatedChecklistItemId: integer("related_checklist_item_id").references(() => checklistItems.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema para inserção
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
});

// Tipos
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
```

### 2. Endpoints da API

#### GET `/api/notifications`
**Descrição:** Lista todas as notificações do usuário logado

**Parâmetros de Query:**
- `limit` (opcional): Número máximo de notificações (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)
- `unreadOnly` (opcional): Retornar apenas não lidas (padrão: false)

**Resposta:**
```json
[
  {
    "id": 1,
    "userId": 2,
    "type": "task_assigned",
    "title": "Nova tarefa atribuída",
    "message": "João atribuiu a tarefa 'Implementar login' para você",
    "read": false,
    "actionUrl": "/board/1/card/5",
    "relatedCardId": 5,
    "fromUserId": 1,
    "createdAt": "2025-09-18T10:30:00Z",
    "fromUser": {
      "id": 1,
      "name": "João Silva",
      "username": "joao",
      "profilePicture": null
    }
  }
]
```

#### POST `/api/notifications/:id/read`
**Descrição:** Marca uma notificação como lida

**Resposta:**
```json
{
  "success": true,
  "notification": { ... }
}
```

#### POST `/api/notifications/mark-all-read`
**Descrição:** Marca todas as notificações do usuário como lidas

**Resposta:**
```json
{
  "success": true,
  "markedCount": 5
}
```

#### DELETE `/api/notifications/:id`
**Descrição:** Remove uma notificação

**Resposta:**
```json
{
  "success": true
}
```

### 3. Implementação no Backend

#### Adicionar aos tipos em `server/storage.ts`:
```typescript
// Métodos para notificações
getNotifications(userId: number, options?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<Notification[]>;
createNotification(notification: InsertNotification): Promise<Notification>;
markAsRead(id: number, userId: number): Promise<boolean>;
markAllAsRead(userId: number): Promise<number>;
deleteNotification(id: number, userId: number): Promise<boolean>;
```

#### Implementar em `server/db-storage.ts`:
```typescript
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
```

#### Adicionar rotas em `server/routes.ts`:
```typescript
// Notificações
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit, offset, unreadOnly } = req.query;

    const notifications = await appStorage.getNotifications(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      unreadOnly: unreadOnly === 'true'
    });

    // Buscar informações dos usuários que enviaram as notificações
    const notificationsWithUsers = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.fromUserId) {
          const fromUser = await appStorage.getUser(notification.fromUserId);
          return { ...notification, fromUser };
        }
        return { ...notification, fromUser: null };
      })
    );

    res.json(notificationsWithUsers);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    const success = await appStorage.markAsRead(notificationId, userId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

app.post('/api/notifications/mark-all-read', async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const markedCount = await appStorage.markAllAsRead(userId);
    res.json({ success: true, markedCount });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    const success = await appStorage.deleteNotification(notificationId, userId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});
```

### 4. Integração com Atribuições

#### Modificar `addMemberToCard` em `server/db-storage.ts`:
```typescript
async addMemberToCard(cardMemberData: InsertCardMember): Promise<CardMember> {
  const inserted = await db.insert(schema.cardMembers).values(cardMemberData).returning();
  const cardMember = inserted[0];

  // Buscar informações do card e usuário atribuído
  const card = await db.select().from(schema.cards).where(eq(schema.cards.id, cardMember.cardId)).limit(1);
  const assignedUser = await db.select().from(schema.users).where(eq(schema.users.id, cardMember.userId)).limit(1);

  if (card.length > 0 && assignedUser.length > 0) {
    // Criar notificação para o usuário atribuído
    await this.createNotification({
      userId: cardMember.userId,
      type: 'task_assigned',
      title: 'Nova tarefa atribuída',
      message: `Você foi atribuído à tarefa "${card[0].title}"`,
      actionUrl: `/board/${card[0].listId}/card/${card[0].id}`, // Ajustar URL conforme necessário
      relatedCardId: card[0].id,
      fromUserId: null // Quem atribuiu (se disponível)
    });
  }

  return cardMember;
}
```

#### Modificar `updateChecklistItem` para atribuições:
```typescript
async updateChecklistItem(id: number, itemData: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
  // Se está atribuindo um usuário, criar notificação
  if (itemData.assignedToUserId) {
    const item = await db.select().from(schema.checklistItems).where(eq(schema.checklistItems.id, id)).limit(1);

    if (item.length > 0) {
      const checklist = await db.select().from(schema.checklists).where(eq(schema.checklists.id, item[0].checklistId)).limit(1);
      const card = await db.select().from(schema.cards).where(eq(schema.cards.id, checklist[0]?.cardId)).limit(1);

      if (card.length > 0) {
        await this.createNotification({
          userId: itemData.assignedToUserId,
          type: 'task_assigned',
          title: 'Nova subtarefa atribuída',
          message: `Você foi atribuído à subtarefa "${item[0].content}" no card "${card[0].title}"`,
          actionUrl: `/board/${card[0].listId}/card/${card[0].id}`,
          relatedChecklistItemId: id,
          fromUserId: null
        });
      }
    }
  }

  const updated = await db
    .update(schema.checklistItems)
    .set(itemData)
    .where(eq(schema.checklistItems.id, id))
    .returning();
  return updated[0];
}
```

### 5. Migração do Banco

Criar arquivo `server/migrations/add-notifications-table.sql`:

```sql
-- Criar tabela de notificações
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  related_card_id INTEGER REFERENCES cards(id),
  related_checklist_item_id INTEGER REFERENCES checklist_items(id),
  from_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 6. Melhorias Opcionais

#### WebSockets para Tempo Real
Adicionar ao `server/index.ts`:
```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ server });

// Mapa de conexões WebSocket por userId
const clients = new Map<number, WebSocket>();

wss.on('connection', (ws, req) => {
  // Autenticação e registro do cliente
  const userId = getUserIdFromRequest(req); // Implementar
  clients.set(userId, ws);

  ws.on('close', () => {
    clients.delete(userId);
  });
});

// Função para enviar notificação em tempo real
export function sendNotificationToUser(userId: number, notification: Notification) {
  const client = clients.get(userId);
  if (client) {
    client.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
  }
}
```

#### Notificações por Email
Adicionar serviço de email:
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  // Configuração SMTP
});

export async function sendEmailNotification(user: User, notification: Notification) {
  await transporter.sendMail({
    to: user.email,
    subject: notification.title,
    text: notification.message,
    html: `<p>${notification.message}</p>`
  });
}
```

### 7. Testes

#### Teste básico:
1. Atribuir um card para um usuário
2. Verificar se notificação foi criada na tabela
3. Acessar `/inbox` e verificar se aparece
4. Marcar como lida e verificar atualização

#### Teste de carga:
- Criar múltiplas notificações
- Testar paginação
- Verificar performance com muitos usuários

### 8. Próximos Passos

1. **Implementar schema** - Adicionar tabela notifications
2. **Criar endpoints** - Implementar rotas da API
3. **Integrar atribuições** - Modificar funções de atribuição
4. **Executar migração** - Aplicar mudanças no banco
5. **Testar funcionalidade** - Verificar se notificações são criadas e exibidas
6. **Opcional: tempo real** - Adicionar WebSockets se necessário

## Conclusão

Este sistema fornecerá notificações básicas quando cards e checklists são atribuídos, permitindo que usuários sejam informados sobre novas responsabilidades. A implementação é modular e pode ser expandida com recursos avançados como notificações por email ou em tempo real.