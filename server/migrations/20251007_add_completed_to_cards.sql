-- Adicionar campo completed na tabela cards para marcar tarefas como concluídas
-- Isso permitirá implementar a funcionalidade similar ao Asana

ALTER TABLE cards ADD COLUMN completed boolean NOT NULL DEFAULT false;

-- Adicionar índice para melhorar performance em consultas por status de conclusão
CREATE INDEX idx_cards_completed ON cards(completed);

-- Adicionar comentário na tabela para documentação
COMMENT ON COLUMN cards.completed IS 'Indica se o cartão/tarefa foi marcado como concluído';