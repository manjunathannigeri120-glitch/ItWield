-- 0038_continuous_operating_loop.sql

ALTER TABLE public.business_goals 
  ADD COLUMN IF NOT EXISTS operating_status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, BLOCKED, OPERATING
  ADD COLUMN IF NOT EXISTS next_evaluation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_operated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ;
