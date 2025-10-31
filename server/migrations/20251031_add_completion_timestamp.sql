-- Migration: 20251031_add_completion_timestamp.sql
-- Adiciona campo completion_timestamp para rastreamento automático de conclusão de tarefas

-- Adicionar coluna completion_timestamp à tabela cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS completion_timestamp TIMESTAMP;

-- Criar índice para melhorar performance em consultas de tempo de resolução
CREATE INDEX IF NOT EXISTS idx_cards_completion_timestamp ON cards(completion_timestamp) WHERE completion_timestamp IS NOT NULL;

-- Criar índice composto para queries de portfólio (via boards)
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_boards_portfolio_id ON boards(portfolio_id) WHERE portfolio_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN cards.completion_timestamp IS 'Timestamp de quando a tarefa foi marcada como concluída (automaticamente ou manualmente)';
