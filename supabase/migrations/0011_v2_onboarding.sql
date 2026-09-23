-- Add last_login to profiles for "While you were away" feature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login timestamp with time zone DEFAULT now();

-- Ensure workspace status can be pending_activation
ALTER TABLE public.workspaces DROP CONSTRAINT IF EXISTS workspaces_status_check;
ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_status_check CHECK (status IN ('pending_activation', 'active', 'evaluating', 'operating'));

-- Set default status for new workspaces to pending_activation
ALTER TABLE public.workspaces ALTER COLUMN status SET DEFAULT 'pending_activation';
