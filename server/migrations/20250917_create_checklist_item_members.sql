-- Migration: create checklist_item_members
-- Date: 2025-09-17

BEGIN;

CREATE TABLE IF NOT EXISTS checklist_item_members (
  checklist_item_id integer NOT NULL REFERENCES checklist_items(id),
  user_id integer NOT NULL REFERENCES users(id),
  PRIMARY KEY (checklist_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_item_members_checklist_item_id ON checklist_item_members(checklist_item_id);

COMMIT;
