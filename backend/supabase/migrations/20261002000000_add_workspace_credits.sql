CREATE OR REPLACE FUNCTION add_workspace_credits(ws_id uuid, amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits integer;
BEGIN
  SELECT credits INTO current_credits FROM workspaces WHERE id = ws_id FOR UPDATE;
  UPDATE workspaces SET credits = credits + amount WHERE id = ws_id;
  RETURN current_credits + amount;
END;
$$;
