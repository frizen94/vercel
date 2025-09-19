
-- Criar tabela de portfólios
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Adicionar coluna portfolio_id à tabela boards
ALTER TABLE boards 
ADD COLUMN IF NOT EXISTS portfolio_id INTEGER REFERENCES portfolios(id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_portfolio_id ON boards(portfolio_id);

-- Comentários para documentação
COMMENT ON TABLE portfolios IS 'Tabela para armazenar portfólios que agrupam múltiplos projetos';
COMMENT ON COLUMN portfolios.name IS 'Nome do portfólio';
COMMENT ON COLUMN portfolios.description IS 'Descrição opcional do portfólio';
COMMENT ON COLUMN portfolios.color IS 'Cor de identificação do portfólio em hexadecimal';
COMMENT ON COLUMN portfolios.user_id IS 'Referência ao usuário criador do portfólio';
COMMENT ON COLUMN boards.portfolio_id IS 'Referência opcional ao portfólio que contém este quadro';
