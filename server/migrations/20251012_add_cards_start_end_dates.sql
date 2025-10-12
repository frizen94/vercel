-- Migration: Add start_date and end_date to cards table
-- Data: 2025-10-12
-- Descrição: Adiciona colunas para data de início e fim dos cartões, permitindo cálculo de duração

-- Adicionar colunas start_date e end_date (podem ser null)
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Criar índices para melhorar performance de consultas por data
CREATE INDEX IF NOT EXISTS idx_cards_start_date ON cards(start_date);
CREATE INDEX IF NOT EXISTS idx_cards_end_date ON cards(end_date);

-- Validação: garantir que start_date <= end_date quando ambas estiverem definidas
-- (Constraint será aplicada via código, não a nível de banco para flexibilidade)

-- Comentários para documentação
COMMENT ON COLUMN cards.start_date IS 'Data de início do cartão (opcional)';
COMMENT ON COLUMN cards.end_date IS 'Data de término do cartão (opcional)';