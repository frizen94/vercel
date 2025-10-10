-- Migration: Add archiving functionality and updated_at to boards table
-- Date: 2025-10-10
-- Description: Adds archived column and updated_at timestamp to boards table for archiving functionality

-- Add archived column to boards table
ALTER TABLE boards ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add updated_at column to boards table
ALTER TABLE boards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_boards_archived ON boards(archived);
CREATE INDEX IF NOT EXISTS idx_boards_user_archived ON boards(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_boards_portfolio_id ON boards(portfolio_id);

-- Update all existing boards to have archived = false and proper updated_at
UPDATE boards SET archived = FALSE WHERE archived IS NULL;
UPDATE boards SET updated_at = NOW() WHERE updated_at IS NULL;

-- Add NOT NULL constraint after updating existing records
ALTER TABLE boards ALTER COLUMN archived SET NOT NULL;