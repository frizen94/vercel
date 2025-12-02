-- Adiciona coluna para forçar reset de senha no primeiro login
-- Data: 2025-12-02

-- Adicionar coluna require_password_reset
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS require_password_reset BOOLEAN NOT NULL DEFAULT false;

-- Comentário na coluna
COMMENT ON COLUMN users.require_password_reset IS 'Indica se o usuário deve trocar a senha no próximo login';
