-- Script para corrigir duplicatas de etiquetas e adicionar constraint de unicidade
-- Execute este script no banco de dados para resolver o problema de duplicação

-- 1. Remover duplicatas existentes na tabela card_labels
-- Manter apenas o registro com menor ID para cada combinação (cardId, labelId)
DELETE FROM card_labels 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM card_labels 
    GROUP BY card_id, label_id
);

-- 2. Adicionar constraint de unicidade para prevenir futuras duplicatas
-- Nota: Se já existir uma constraint similar, este comando falhará (ok, apenas continue)
ALTER TABLE card_labels 
ADD CONSTRAINT unique_card_label 
UNIQUE (card_id, label_id);

-- 3. Verificar se as duplicatas foram removidas (opcional - apenas para debug)
-- SELECT card_id, label_id, COUNT(*) as count 
-- FROM card_labels 
-- GROUP BY card_id, label_id 
-- HAVING COUNT(*) > 1;

-- 4. Mostrar estatísticas após limpeza
SELECT 
    COUNT(*) as total_associations,
    COUNT(DISTINCT card_id) as cards_with_labels,
    COUNT(DISTINCT label_id) as labels_in_use
FROM card_labels;