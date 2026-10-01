ALTER TABLE workspaces ALTER COLUMN credits SET DEFAULT 150;
UPDATE workspaces SET credits = 150 WHERE credits = 200;
