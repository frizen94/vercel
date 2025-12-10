
# Schema do Banco de Dados

Este documento descreve a estrutura completa do banco de dados PostgreSQL utilizado pelo NexusTasks.

## 📊 Visão Geral

O banco de dados é estruturado em 20 tabelas principais que implementam a funcionalidade completa de um sistema de gerenciamento de tarefas colaborativo:

- **Gestão de Usuários**: `users`
- **Gestão de Portfólios**: `portfolios`, `portfolio_members`
- **Gestão de Quadros**: `boards`, `board_members`
- **Gestão de Conteúdo**: `lists`, `cards`, `labels`, `card_labels`
- **Colaboração**: `comments`, `card_members`
- **Checklists**: `checklists`, `checklist_items`, `checklist_item_members`
- **Prioridades**: `priorities`, `card_priorities`
- **Anexos**: `attachments`
- **Notificações**: `notifications`
- **Auditoria**: `audit_logs`, `activities`
- **Sessão**: `session`

## 🗄️ Tabelas

### 1. users - Usuários do Sistema

Armazena informações de todos os usuários registrados.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    profile_picture TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Campos
- `id`: Identificador único do usuário (chave primária)
- `username`: Nome de usuário único para login
- `email`: Email único do usuário
- `password`: Hash da senha (bcrypt)
- `name`: Nome completo do usuário
- `profile_picture`: URL/caminho da foto de perfil
- `role`: Papel do usuário no sistema (`admin` | `user`)
- `created_at`: Data/hora de criação da conta

#### Índices
- `UNIQUE(username)`: Garante unicidade do nome de usuário
- `UNIQUE(email)`: Garante unicidade do email

---

### 2. boards - Quadros de Tarefas

Representa os quadros/projetos principais do sistema.

```sql
CREATE TABLE boards (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Campos
- `id`: Identificador único do quadro
- `title`: Nome/título do quadro
- `user_id`: ID do usuário criador (FK para `users.id`)
- `created_at`: Data/hora de criação

#### Relacionamentos
- `user_id` → `users.id` (criador do quadro)

---

### 3. board_members - Membros dos Quadros

Tabela de junção que gerencia permissões de usuários em quadros específicos.

```sql
CREATE TABLE board_members (
    board_id INTEGER NOT NULL REFERENCES boards(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (board_id, user_id)
);
```

#### Campos
- `board_id`: ID do quadro (FK para `boards.id`)
- `user_id`: ID do usuário (FK para `users.id`)
- `role`: Papel do usuário no quadro (`owner` | `editor` | `viewer`)
- `created_at`: Data/hora de inclusão no quadro

#### Chave Primária Composta
- `PRIMARY KEY (board_id, user_id)`: Evita duplicação de membros

#### Papéis de Quadro
- **owner**: Controle total (criador ou promovido)
- **editor**: Pode modificar cartões, listas e comentar
- **viewer**: Apenas visualização sem edição

---

### 4. lists - Listas/Colunas

Representa as colunas verticais dentro de cada quadro.

```sql
CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    board_id INTEGER NOT NULL REFERENCES boards(id),
    order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Campos
- `id`: Identificador único da lista
- `title`: Nome da lista (ex: "A Fazer", "Em Andamento", "Concluído")
- `board_id`: ID do quadro pai (FK para `boards.id`)
- `order`: Ordem de exibição da lista no quadro
- `created_at`: Data/hora de criação

#### Relacionamentos
- `board_id` → `boards.id` (quadro pai)

---

### 5. cards - Cartões/Tarefas

Representa tarefas individuais dentro das listas.

```sql
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    list_id INTEGER NOT NULL REFERENCES lists(id),
    order INTEGER NOT NULL DEFAULT 0,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Campos
- `id`: Identificador único do cartão
- `title`: Título da tarefa
- `description`: Descrição detalhada (opcional)
- `list_id`: ID da lista pai (FK para `lists.id`)
- `order`: Ordem do cartão dentro da lista
- `due_date`: Data/hora limite para conclusão (opcional)
- `created_at`: Data/hora de criação

#### Relacionamentos
- `list_id` → `lists.id` (lista pai)

---

### 6. labels - Etiquetas

Define etiquetas coloridas que podem ser aplicadas aos cartões.

```sql
CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    board_id INTEGER NOT NULL REFERENCES boards(id)
);
```

#### Campos
- `id`: Identificador único da etiqueta
- `name`: Nome/texto da etiqueta
- `color`: Cor da etiqueta (hex, CSS ou nome)
- `board_id`: ID do quadro (FK para `boards.id`)

#### Relacionamentos
- `board_id` → `boards.id` (quadro onde a etiqueta existe)

#### Cores Padrão
- `#ef4444` (vermelho) - Urgente
- `#f97316` (laranja) - Alta prioridade
- `#eab308` (amarelo) - Média prioridade
- `#22c55e` (verde) - Baixa prioridade
- `#3b82f6` (azul) - Informativo
- `#8b5cf6` (roxo) - Futuro

---

### 7. card_labels - Relacionamento Cartão-Etiqueta

Tabela de junção many-to-many entre cartões e etiquetas.

```sql
CREATE TABLE card_labels (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    label_id INTEGER NOT NULL REFERENCES labels(id)
);
```

#### Campos
- `id`: Identificador único da associação
- `card_id`: ID do cartão (FK para `cards.id`)
- `label_id`: ID da etiqueta (FK para `labels.id`)

#### Relacionamentos
- `card_id` → `cards.id`
- `label_id` → `labels.id`

---

### 8. comments - Comentários

Armazena comentários feitos pelos usuários nos cartões.

```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    user_id INTEGER REFERENCES users(id),
    user_name TEXT NOT NULL DEFAULT 'Anonymous',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Campos
- `id`: Identificador único do comentário
- `content`: Texto do comentário
- `card_id`: ID do cartão (FK para `cards.id`)
- `user_id`: ID do autor (FK para `users.id`)
- `user_name`: Nome do autor (para exibição rápida)
- `created_at`: Data/hora de criação

#### Relacionamentos
- `card_id` → `cards.id` (cartão comentado)
- `user_id` → `users.id` (autor do comentário)

---

### 9. card_members - Membros Atribuídos aos Cartões

Relaciona usuários atribuídos a cartões específicos.

```sql
CREATE TABLE card_members (
    card_id INTEGER NOT NULL REFERENCES cards(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    PRIMARY KEY (card_id, user_id)
);
```

#### Campos
- `card_id`: ID do cartão (FK para `cards.id`)
- `user_id`: ID do usuário atribuído (FK para `users.id`)

#### Chave Primária Composta
- `PRIMARY KEY (card_id, user_id)`: Evita atribuições duplicadas

#### Relacionamentos
- `card_id` → `cards.id`
- `user_id` → `users.id`

---

### 10. checklists - Listas de Verificação

Representa listas de verificação dentro dos cartões.

```sql
CREATE TABLE checklists (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    order INTEGER NOT NULL DEFAULT 0
);
```

#### Campos
- `id`: Identificador único da checklist
- `title`: Nome da checklist
- `card_id`: ID do cartão pai (FK para `cards.id`)
- `order`: Ordem da checklist dentro do cartão

#### Relacionamentos
- `card_id` → `cards.id` (cartão pai)

---

### 11. checklist_items - Itens de Checklist

Representa itens individuais dentro das checklists.

```sql
CREATE TABLE checklist_items (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    checklist_id INTEGER NOT NULL REFERENCES checklists(id),
    order INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to_user_id INTEGER REFERENCES users(id),
    due_date TIMESTAMP
);
```

#### Campos
- `id`: Identificador único do item
- `content`: Texto/descrição do item
- `checklist_id`: ID da checklist pai (FK para `checklists.id`)
- `order`: Ordem do item dentro da checklist
- `completed`: Status de conclusão (true/false)
- `assigned_to_user_id`: Usuário responsável pelo item (FK para `users.id`)
- `due_date`: Prazo específico do item (opcional)

#### Relacionamentos
- `checklist_id` → `checklists.id` (checklist pai)
- `assigned_to_user_id` → `users.id` (responsável)

---

## 🔗 Diagrama de Relacionamentos

```
users (1) ←→ (N) boards (criador)
users (N) ←→ (N) board_members ←→ boards (membros)
boards (1) ←→ (N) lists
boards (1) ←→ (N) labels
lists (1) ←→ (N) cards
cards (N) ←→ (N) card_labels ←→ labels
cards (1) ←→ (N) comments ←→ users (autor)
cards (N) ←→ (N) card_members ←→ users (atribuídos)
cards (1) ←→ (N) checklists
checklists (1) ←→ (N) checklist_items ←→ users (responsável)
```

## 📋 Constraints e Regras de Negócio

### Integridade Referencial
- Todos os FKs têm CASCADE apropriado
- Exclusão de quadro remove listas, cartões e dependências
- Exclusão de usuário mantém dados históricos com user_id NULL

### Validações Implementadas
- Emails e usernames únicos no sistema
- Senhas hasheadas com bcrypt (mínimo 6 caracteres)
- Roles válidos: `admin`, `user` (sistema) e `owner`, `editor`, `viewer` (quadros)
- Ordem dos itens sempre não-negativa

### Índices de Performance
```sql
-- Índices sugeridos para otimização
CREATE INDEX idx_boards_user_id ON boards(user_id);
CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_cards_list_id ON cards(list_id);
CREATE INDEX idx_cards_due_date ON cards(due_date);
CREATE INDEX idx_comments_card_id ON comments(card_id);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);
CREATE INDEX idx_card_members_user_id ON card_members(user_id);
CREATE INDEX idx_checklist_items_assigned_user ON checklist_items(assigned_to_user_id);
CREATE INDEX idx_checklist_items_due_date ON checklist_items(due_date);
```

## 🔒 Segurança e Permissões

### Controle de Acesso
1. **Nível de Sistema**: `admin` vs `user`
2. **Nível de Quadro**: `owner`, `editor`, `viewer`
3. **Nível de Cartão**: Membros atribuídos têm acesso especial

### Middleware de Autorização
- `isAuthenticated`: Verifica login
- `isAdmin`: Verifica papel de administrador
- `isBoardOwnerOrAdmin`: Verifica propriedade do quadro
- `hasCardAccess`: Verifica acesso ao cartão específico

## 📊 Consultas Comuns

### Dashboard do Usuário
```sql
-- Estatísticas do usuário
SELECT 
    COUNT(DISTINCT b.id) as total_boards,
    COUNT(DISTINCT c.id) as total_cards,
    COUNT(DISTINCT CASE WHEN c.due_date < NOW() THEN c.id END) as overdue_cards
FROM boards b
LEFT JOIN lists l ON b.id = l.board_id
LEFT JOIN cards c ON l.id = c.list_id
WHERE b.user_id = $1 OR EXISTS (
    SELECT 1 FROM board_members bm 
    WHERE bm.board_id = b.id AND bm.user_id = $1
);
```

### Cartões com Checklists
```sql
-- Cartões com progresso de checklist
SELECT 
    c.*,
    cl.title as checklist_title,
    COUNT(ci.id) as total_items,
    COUNT(CASE WHEN ci.completed THEN 1 END) as completed_items
FROM cards c
JOIN checklists cl ON c.id = cl.card_id
LEFT JOIN checklist_items ci ON cl.id = ci.checklist_id
GROUP BY c.id, cl.id, cl.title;
```

### Cartões Atrasados
```sql
-- Cartões com prazo vencido
SELECT 
    c.*,
    l.title as list_name,
    b.title as board_name
FROM cards c
JOIN lists l ON c.list_id = l.id
JOIN boards b ON l.board_id = b.id
WHERE c.due_date < NOW()
ORDER BY c.due_date ASC;
```

---

### 20. attachments - Anexos de Cards e Comentários

Armazena arquivos anexados a cards e comentários.

```sql
CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    thumbnail_path TEXT,
    url TEXT,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Campos
- `id`: Identificador único do anexo
- `filename`: Nome do arquivo no servidor
- `original_name`: Nome original do arquivo
- `mime_type`: Tipo MIME do arquivo (image/png, application/pdf, etc)
- `size`: Tamanho do arquivo em bytes
- `path`: Caminho do arquivo no servidor
- `thumbnail_path`: Caminho da miniatura (para imagens)
- `url`: URL pública do arquivo (opcional)
- `card_id`: Referência ao card (se anexado a um card)
- `comment_id`: Referência ao comentário (se anexado a um comentário)
- `uploaded_by`: Usuário que fez o upload
- `created_at`: Data/hora do upload

#### Índices
- `idx_attachments_card_id`: Otimiza busca por card
- `idx_attachments_comment_id`: Otimiza busca por comentário
- `idx_attachments_uploaded_by`: Otimiza busca por usuário
- `idx_attachments_mime_type`: Otimiza busca por tipo de arquivo

#### Relacionamentos
- Pertence a um `card` (opcional, ON DELETE CASCADE)
- Pertence a um `comment` (opcional, ON DELETE CASCADE)
- Criado por um `user` (SET NULL se usuário deletado)

---

## 🚀 Migrações e Evolução

### Versioning do Schema
O schema utiliza Drizzle ORM para migrações automáticas:

```bash
# Aplicar mudanças ao banco
npm run db:push

# Gerar migrações
npx drizzle-kit generate

# Aplicar migrações
npx drizzle-kit migrate
```

### Backup e Restauração
```bash
# Backup completo
pg_dump $DATABASE_URL > backup.sql

# Restauração
psql $DATABASE_URL < backup.sql
```

---

**Última atualização**: 10 de Dezembro de 2025  
**Versão do Schema**: 2.0.0  
**Compatibilidade**: PostgreSQL 12+  
**Tabelas**: 20 (incluindo sistema de anexos, notificações e auditoria)
