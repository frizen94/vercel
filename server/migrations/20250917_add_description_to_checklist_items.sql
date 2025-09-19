
-- Migration: add description to checklist_items
-- Date: 2025-09-17
-- Adds a description field to checklist items for subtask descriptions

BEGIN;

ALTER TABLE checklist_items
  ADD COLUMN description text;

COMMIT;
