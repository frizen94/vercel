-- Migration: Add ON DELETE CASCADE to FKs referencing boards
-- Safe: checks for constraint existence before dropping/creating

BEGIN;

-- lists.board_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lists_board_id_fkey') THEN
        ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_board_id_fkey;
    END IF;
    ALTER TABLE lists ADD CONSTRAINT lists_board_id_fkey FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;
END$$;

-- labels.board_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'labels_board_id_fkey') THEN
        ALTER TABLE labels DROP CONSTRAINT IF EXISTS labels_board_id_fkey;
    END IF;
    ALTER TABLE labels ADD CONSTRAINT labels_board_id_fkey FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;
END$$;

-- board_members.board_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_members_board_id_fkey') THEN
        ALTER TABLE board_members DROP CONSTRAINT IF EXISTS board_members_board_id_fkey;
    END IF;
    ALTER TABLE board_members ADD CONSTRAINT board_members_board_id_fkey FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;
END$$;

-- activities.board_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_board_id_fkey') THEN
        ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_board_id_fkey;
    END IF;
    ALTER TABLE activities ADD CONSTRAINT activities_board_id_fkey FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;
END$$;

COMMIT;

-- NOTE: This migration will cascade-delete lists, labels, board_members and activities when a board is deleted.
-- Be careful with audit/audit_logs or other references which you may not want to cascade.
-- Migration: 2025-10-11
-- Make FK relationships cascade deletes so deleting a board/list/card removes dependents automatically
BEGIN;

-- Lists -> Boards
ALTER TABLE IF EXISTS lists DROP CONSTRAINT IF EXISTS lists_board_id_fkey;
ALTER TABLE IF EXISTS lists
  ADD CONSTRAINT lists_board_id_fkey FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

-- Cards -> Lists
ALTER TABLE IF EXISTS cards DROP CONSTRAINT IF EXISTS cards_list_id_fkey;
ALTER TABLE IF EXISTS cards
  ADD CONSTRAINT cards_list_id_fkey FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE;

-- Card Labels -> Cards
ALTER TABLE IF EXISTS card_labels DROP CONSTRAINT IF EXISTS card_labels_card_id_fkey;
ALTER TABLE IF EXISTS card_labels
  ADD CONSTRAINT card_labels_card_id_fkey FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;

-- Card Members -> Cards
ALTER TABLE IF EXISTS card_members DROP CONSTRAINT IF EXISTS card_members_card_id_fkey;
ALTER TABLE IF EXISTS card_members
  ADD CONSTRAINT card_members_card_id_fkey FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;

-- Comments -> Cards
ALTER TABLE IF EXISTS comments DROP CONSTRAINT IF EXISTS comments_card_id_fkey;
ALTER TABLE IF EXISTS comments
  ADD CONSTRAINT comments_card_id_fkey FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;

-- Checklists -> Cards
ALTER TABLE IF EXISTS checklists DROP CONSTRAINT IF EXISTS checklists_card_id_fkey;
ALTER TABLE IF EXISTS checklists
  ADD CONSTRAINT checklists_card_id_fkey FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;

-- Checklist Items -> Checklists
ALTER TABLE IF EXISTS checklist_items DROP CONSTRAINT IF EXISTS checklist_items_checklist_id_fkey;
ALTER TABLE IF EXISTS checklist_items
  ADD CONSTRAINT checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE;

-- Labels -> Boards
ALTER TABLE IF EXISTS labels DROP CONSTRAINT IF EXISTS labels_board_id_fkey;
ALTER TABLE IF EXISTS labels
  ADD CONSTRAINT labels_board_id_fkey FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

-- Board Members -> Boards
ALTER TABLE IF EXISTS board_members DROP CONSTRAINT IF EXISTS board_members_board_id_fkey;
ALTER TABLE IF EXISTS board_members
  ADD CONSTRAINT board_members_board_id_fkey FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

-- Activities -> Boards
ALTER TABLE IF EXISTS activities DROP CONSTRAINT IF EXISTS activities_board_id_fkey;
ALTER TABLE IF EXISTS activities
  ADD CONSTRAINT activities_board_id_fkey FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

COMMIT;
