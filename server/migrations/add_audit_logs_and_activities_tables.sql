-- Migration: Adicionar tabelas de auditoria e atividades
-- Criado em: 2025-10-09
-- Descrição: Adiciona sistema de logs de auditoria e atividades de negócio

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
    board_id INTEGER REFERENCES boards(id),
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

-- Comentários nas tabelas
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para compliance e investigação de problemas';
COMMENT ON TABLE activities IS 'Atividades de negócio para dashboard administrativo e métricas de produtividade';

-- Comentários nas colunas principais
COMMENT ON COLUMN audit_logs.action IS 'Tipo de operação: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT';
COMMENT ON COLUMN audit_logs.entity_type IS 'Tipo da entidade afetada: user, board, card, list, etc.';
COMMENT ON COLUMN audit_logs.old_data IS 'Estado dos dados antes da operação (formato JSON)';
COMMENT ON COLUMN audit_logs.new_data IS 'Estado dos dados após a operação (formato JSON)';

COMMENT ON COLUMN activities.activity_type IS 'Tipo específico da atividade: board_created, card_created, task_completed, etc.';
COMMENT ON COLUMN activities.description IS 'Descrição legível para exibição no dashboard';
COMMENT ON COLUMN activities.metadata IS 'Dados específicos da atividade (formato JSON)';