-- AI Workforce Extensions

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS tools jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS memory jsonb DEFAULT '{}'::jsonb;
