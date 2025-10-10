-- Add deleted column to notifications table for soft delete functionality
ALTER TABLE notifications ADD COLUMN deleted BOOLEAN DEFAULT FALSE;

-- Create index for better query performance when filtering deleted notifications
CREATE INDEX IF NOT EXISTS idx_notifications_deleted ON notifications(deleted);

-- Create composite index for user notifications filtering
CREATE INDEX IF NOT EXISTS idx_notifications_user_deleted ON notifications(user_id, deleted);