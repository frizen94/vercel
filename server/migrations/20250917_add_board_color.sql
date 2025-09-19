-- Add color column to boards
ALTER TABLE boards
ADD COLUMN IF NOT EXISTS color text DEFAULT '#22C55E';

-- Optional: update existing rows to a default color if NULL
UPDATE boards SET color = '#22C55E' WHERE color IS NULL;
