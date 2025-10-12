
-- Script de inicialização do banco de dados para Docker
-- Este arquivo será executado automaticamente quando o container PostgreSQL iniciar

-- Criar extensões se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mensagem de inicialização
SELECT 'Iniciando configuração do banco de dados...' as status;

-- ============================================================================
-- CRIAÇÃO DAS TABELAS PRINCIPAIS (na ordem de dependências)
-- ============================================================================

-- 1. Tabela de usuários (deve ser criada primeiro pois outras tabelas dependem dela)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Tabela de portfólios (depende de users)
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Tabela de quadros/boards (depende de users e portfolios)
CREATE TABLE IF NOT EXISTS boards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#22C55E',
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Tabela de listas (depende de boards)
CREATE TABLE IF NOT EXISTS lists (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. Tabela de cartões (depende de lists)
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    due_date TIMESTAMP,
    start_date DATE,
    end_date DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 6. Tabela de etiquetas (depende de boards)
CREATE TABLE IF NOT EXISTS labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 6b. Tabela de prioridades (depende de boards)
CREATE TABLE IF NOT EXISTS priorities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Relacionamento entre cartões e prioridades
CREATE TABLE IF NOT EXISTS card_priorities (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    priority_id INTEGER NOT NULL REFERENCES priorities(id) ON DELETE CASCADE
);

-- 7. Tabela de comentários (depende de cards)
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL DEFAULT 'Anonymous',
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    checklist_item_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 8. Tabela de checklists (depende de cards)
CREATE TABLE IF NOT EXISTS checklists (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    "order" INTEGER DEFAULT 0,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 9. Tabela de itens de checklist (depende de checklists)
CREATE TABLE IF NOT EXISTS checklist_items (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    due_date TIMESTAMP,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_item_id INTEGER REFERENCES checklist_items(id) ON DELETE CASCADE,
    checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- TABELAS DE RELACIONAMENTO (JUNCTION TABLES)
-- ============================================================================

-- Relacionamento entre cartões e etiquetas
CREATE TABLE IF NOT EXISTS card_labels (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    UNIQUE(card_id, label_id)
);

-- Relacionamento entre cartões e membros
CREATE TABLE IF NOT EXISTS card_members (
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, user_id)
);

-- Relacionamento entre quadros e membros
CREATE TABLE IF NOT EXISTS board_members (
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

-- Relacionamento entre itens de checklist e membros
CREATE TABLE IF NOT EXISTS checklist_item_members (
    checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (checklist_item_id, user_id)
);

-- ============================================================================
-- TABELAS DO SISTEMA (SESSÕES)
-- ============================================================================

-- Tabela de sessões para autenticação
CREATE TABLE IF NOT EXISTS "session" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL
);

-- Constraint da chave primária para sessões se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'session_pkey'
    ) THEN
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
END$$;

-- ============================================================================
-- ADIÇÃO DE FOREIGN KEYS FALTANTES
-- ============================================================================

-- Adicionar FK para checklist_item_id em comentários (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_checklist_item_id_fkey'
    ) THEN
        ALTER TABLE comments 
        ADD CONSTRAINT comments_checklist_item_id_fkey 
        FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE;
    END IF;
END$$;

-- ============================================================================
-- CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para portfólios
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at);

-- Índices para quadros
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_portfolio_id ON boards(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_boards_archived ON boards(archived);
CREATE INDEX IF NOT EXISTS idx_boards_user_archived ON boards(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards(created_at);

-- Índices para listas
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_lists_order ON lists("order");

-- Índices para cartões
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_order ON cards("order");
CREATE INDEX IF NOT EXISTS idx_cards_due_date ON cards(due_date);
CREATE INDEX IF NOT EXISTS idx_cards_start_date ON cards(start_date);
CREATE INDEX IF NOT EXISTS idx_cards_end_date ON cards(end_date);
CREATE INDEX IF NOT EXISTS idx_cards_completed ON cards(completed);
-- Índices para arquivamento de cartões (performance em consultas de arquivados)
CREATE INDEX IF NOT EXISTS idx_cards_archived ON cards(archived);
CREATE INDEX IF NOT EXISTS idx_cards_list_archived ON cards(list_id, archived);

-- Índices para etiquetas
CREATE INDEX IF NOT EXISTS idx_labels_board_id ON labels(board_id);

-- Índices para comentários
CREATE INDEX IF NOT EXISTS idx_comments_card_id ON comments(card_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_checklist_item_id ON comments(checklist_item_id);

-- Índices para checklists
CREATE INDEX IF NOT EXISTS idx_checklists_card_id ON checklists(card_id);

-- Índices para itens de checklist
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_parent_id ON checklist_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_assigned_user ON checklist_items(assigned_to_user_id);

-- Índices para relacionamentos
CREATE INDEX IF NOT EXISTS idx_card_labels_card_id ON card_labels(card_id);
CREATE INDEX IF NOT EXISTS idx_card_labels_label_id ON card_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_card_members_card_id ON card_members(card_id);
CREATE INDEX IF NOT EXISTS idx_card_members_user_id ON card_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_members_item_id ON checklist_item_members(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_members_user_id ON checklist_item_members(user_id);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE portfolios IS 'Tabela para armazenar portfólios que agrupam múltiplos projetos';
COMMENT ON COLUMN portfolios.name IS 'Nome do portfólio';
COMMENT ON COLUMN portfolios.description IS 'Descrição opcional do portfólio';
COMMENT ON COLUMN portfolios.color IS 'Cor de identificação do portfólio em hexadecimal';
COMMENT ON COLUMN portfolios.user_id IS 'Referência ao usuário criador do portfólio';

COMMENT ON TABLE boards IS 'Tabela para armazenar quadros/projetos Kanban';
COMMENT ON COLUMN boards.portfolio_id IS 'Referência opcional ao portfólio que contém este quadro';
COMMENT ON COLUMN boards.color IS 'Cor de identificação do quadro em hexadecimal';

COMMENT ON TABLE cards IS 'Tabela para armazenar cartões/tarefas nos quadros Kanban';
COMMENT ON COLUMN cards.completed IS 'Indica se o cartão foi marcado como concluído (funcionalidade similar ao Asana)';
COMMENT ON COLUMN cards.start_date IS 'Data de início do cartão (opcional)';
COMMENT ON COLUMN cards.end_date IS 'Data de término do cartão (opcional)';

COMMENT ON TABLE checklist_items IS 'Itens de checklist que podem ter subitens (hierarquia através de parent_item_id)';
COMMENT ON COLUMN checklist_items.parent_item_id IS 'Referência ao item pai para criar hierarquia de subitens';

-- ============================================================================
-- LIMPEZA DE DADOS (se necessário)
-- ============================================================================

-- Corrigir cores nulas em quadros existentes
UPDATE boards SET color = '#22C55E' WHERE color IS NULL;

-- Corrigir cores nulas em portfólios existentes
UPDATE portfolios SET color = '#3B82F6' WHERE color IS NULL;

-- ============================================================================
-- TABELAS DO SISTEMA DE NOTIFICAÇÕES
-- ============================================================================

-- Tabela de notificações para o sistema
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    related_card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    related_checklist_item_id INTEGER REFERENCES checklist_items(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para performance das notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_deleted ON notifications(deleted);
CREATE INDEX IF NOT EXISTS idx_notifications_user_deleted ON notifications(user_id, deleted);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_related_card ON notifications(related_card_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_checklist_item ON notifications(related_checklist_item_id);

COMMENT ON TABLE notifications IS 'Tabela para armazenar notificações do sistema para usuários';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação (task_assigned, comment, mention, invitation, deadline)';
COMMENT ON COLUMN notifications.action_url IS 'URL para redirecionar ao clicar na notificação';
COMMENT ON COLUMN notifications.related_card_id IS 'Referência ao cartão relacionado à notificação';
COMMENT ON COLUMN notifications.related_checklist_item_id IS 'Referência ao item de checklist relacionado à notificação';
COMMENT ON COLUMN notifications.from_user_id IS 'Referência ao usuário que gerou a notificação';

-- ============================================================================
-- SISTEMA DE AUDITORIA E ATIVIDADES
-- ============================================================================

-- Tabela de Logs de Auditoria
-- Captura todas as operações importantes do sistema para compliance e debugging
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id TEXT,
    action TEXT NOT NULL, -- "CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT"
    entity_type TEXT NOT NULL, -- "user", "board", "card", "list", etc.
    entity_id TEXT, -- ID da entidade afetada (string para suportar diferentes tipos)
    ip_address TEXT,
    user_agent TEXT,
    old_data TEXT, -- JSON string dos dados antes da operação
    new_data TEXT, -- JSON string dos dados após a operação
    metadata TEXT, -- JSON string com dados contextuais adicionais
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para otimizar consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);

-- Tabela de Atividades de Negócio
-- Registra atividades específicas para dashboard administrativo e métricas
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- "board_created", "card_created", "task_completed", etc.
    entity_type TEXT NOT NULL, -- "board", "card", "checklist", "task", etc.
    entity_id INTEGER, -- ID da entidade relacionada
    description TEXT NOT NULL, -- Descrição legível da atividade
    metadata TEXT, -- JSON string com dados específicos da atividade
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para otimizar consultas de atividades (filtros do dashboard)
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_board_id ON activities(board_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);

-- Índice composto para consultas de dashboard (mais eficiente)
CREATE INDEX IF NOT EXISTS idx_activities_dashboard ON activities(user_id, board_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_board_timeline ON activities(board_id, timestamp DESC);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'portfolios', 'boards', 'lists', 'cards', 'labels', 
        'comments', 'checklists', 'checklist_items', 'card_labels', 
        'card_members', 'board_members', 'checklist_item_members', 'session', 'notifications',
        'audit_logs', 'activities', 'priorities', 'card_priorities'
    );
    
    IF table_count = 19 THEN
        RAISE NOTICE 'Todas as 19 tabelas foram criadas com sucesso!';
    ELSE
        RAISE WARNING 'Apenas % de 19 tabelas foram criadas. Verifique os erros acima.', table_count;
    END IF;
END$$;

-- Mensagem final
SELECT 'Banco de dados inicializado com sucesso para desenvolvimento local! Todas as tabelas configuradas, incluindo sistema de notificações.' as status;
