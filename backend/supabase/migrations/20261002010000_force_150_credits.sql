UPDATE workspaces SET credits = 150 WHERE credits = 200;
ALTER TABLE workspaces ALTER COLUMN credits SET DEFAULT 150;
