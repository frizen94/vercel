-- Migration: Add archiving functionality to cards table
-- Date: 2025-02-01  
-- Description: Adds archived column to cards table for archiving functionality

-- Add archived column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_archived ON cards(archived);
CREATE INDEX IF NOT EXISTS idx_cards_list_archived ON cards(list_id, archived);

-- Update all existing cards to have archived = false
UPDATE cards SET archived = FALSE WHERE archived IS NULL;

-- Add NOT NULL constraint after updating existing records
ALTER TABLE cards ALTER COLUMN archived SET NOT NULL;