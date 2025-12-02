-- Adiciona campos relatedType e relatedId à tabela notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_type TEXT,
ADD COLUMN IF NOT EXISTS related_id INTEGER;

-- Adiciona índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_type, related_id);
