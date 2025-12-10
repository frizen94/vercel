-- Migration: Criar tabela de anexos
-- Data: 2025-12-09
-- Descrição: Adiciona suporte a anexos em cards e comentários

CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  thumbnail_path TEXT,
  url TEXT,
  
  -- Relacionamentos (apenas um deve ser preenchido)
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_attachments_card_id ON attachments(card_id);
CREATE INDEX IF NOT EXISTS idx_attachments_comment_id ON attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_mime_type ON attachments(mime_type);
