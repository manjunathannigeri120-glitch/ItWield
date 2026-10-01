ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 200;

CREATE OR REPLACE FUNCTION deduct_workspace_credits(ws_id uuid, amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits integer;
  v_owner_id uuid;
BEGIN
  -- Fetch owner to enforce RLS manually since it's SECURITY DEFINER
  SELECT owner_id INTO v_owner_id FROM workspaces WHERE id = ws_id;
  
  IF v_owner_id != auth.uid() AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Lock the row for update to prevent race conditions
  SELECT credits INTO current_credits FROM workspaces WHERE id = ws_id FOR UPDATE;
  
  IF current_credits >= amount THEN
    UPDATE workspaces SET credits = credits - amount WHERE id = ws_id;
    RETURN current_credits - amount;
  END IF;
  
  RETURN -1;
END;
$$;
