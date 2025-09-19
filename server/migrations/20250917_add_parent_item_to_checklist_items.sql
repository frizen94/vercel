-- Migration: add parent_item_id to checklist_items
BEGIN;

ALTER TABLE checklist_items
ADD COLUMN parent_item_id integer;

ALTER TABLE checklist_items
ADD CONSTRAINT fk_checklist_items_parent
FOREIGN KEY (parent_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_checklist_items_parent ON checklist_items(parent_item_id);

COMMIT;
