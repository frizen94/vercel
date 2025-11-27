-- Criar tabela de membros de portfólios
CREATE TABLE IF NOT EXISTS portfolio_members (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(portfolio_id, user_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_portfolio_members_portfolio_id ON portfolio_members(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_members_user_id ON portfolio_members(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_members_portfolio_user ON portfolio_members(portfolio_id, user_id);

-- Comentários para documentação
COMMENT ON TABLE portfolio_members IS 'Tabela para armazenar membros de portfólios';
COMMENT ON COLUMN portfolio_members.portfolio_id IS 'Referência ao portfólio';
COMMENT ON COLUMN portfolio_members.user_id IS 'Referência ao usuário membro';
COMMENT ON COLUMN portfolio_members.role IS 'Papel do membro no portfólio (owner, admin, member)';
COMMENT ON COLUMN portfolio_members.created_at IS 'Data de adição do membro ao portfólio';
