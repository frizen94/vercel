-- Migration: add checklist_item_id to comments
-- Date: 2025-09-17
-- Adds an optional foreign key column to associate comments with checklist items (subtasks)

BEGIN;

ALTER TABLE comments
  ADD COLUMN checklist_item_id integer REFERENCES checklist_items(id);

-- Optional: create an index for queries filtered by checklist_item_id
CREATE INDEX IF NOT EXISTS idx_comments_checklist_item_id ON comments(checklist_item_id);

COMMIT;
