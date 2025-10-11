-- Migration: Ensure FK constraints referencing checklist_items have ON DELETE CASCADE

BEGIN;

-- checklist_item_members.checklist_item_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checklist_item_members_checklist_item_id_fkey') THEN
        ALTER TABLE checklist_item_members DROP CONSTRAINT IF EXISTS checklist_item_members_checklist_item_id_fkey;
    END IF;
    ALTER TABLE checklist_item_members ADD CONSTRAINT checklist_item_members_checklist_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE;
END$$;

-- comments.checklist_item_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_checklist_item_id_fkey') THEN
        ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_checklist_item_id_fkey;
    END IF;
    ALTER TABLE comments ADD CONSTRAINT comments_checklist_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE;
END$$;

-- notifications.related_checklist_item_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_related_checklist_item_id_fkey') THEN
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_related_checklist_item_id_fkey;
    END IF;
    ALTER TABLE notifications ADD CONSTRAINT notifications_related_checklist_item_id_fkey FOREIGN KEY (related_checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE;
END$$;

COMMIT;

-- Note: This migration will cascade-delete checklist item members, comments, and related notifications when a checklist item is removed (e.g. via cascading from a board deletion).
