-- Add priorities and card_priorities tables
BEGIN;

CREATE TABLE IF NOT EXISTS priorities (
  id serial PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL,
  board_id integer REFERENCES boards(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS card_priorities (
  id serial PRIMARY KEY,
  card_id integer REFERENCES cards(id) NOT NULL,
  priority_id integer REFERENCES priorities(id) NOT NULL
);

COMMIT;
