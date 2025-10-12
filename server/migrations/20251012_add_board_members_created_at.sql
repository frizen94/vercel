-- Migration: Add created_at to board_members
-- Safe migration: adds created_at column if missing and backfills existing rows

ALTER TABLE IF EXISTS board_members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Backfill any NULL created_at just in case
UPDATE board_members
SET created_at = NOW()
WHERE created_at IS NULL;

-- Create index for queries filtering by created_at (if needed)
CREATE INDEX IF NOT EXISTS idx_board_members_created_at ON board_members(created_at);
