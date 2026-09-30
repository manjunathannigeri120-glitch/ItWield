-- Drop existing constraint
ALTER TABLE public.incidents DROP CONSTRAINT IF EXISTS incidents_status_check;

-- Add new columns
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS evidence jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS detected_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS suspected_cause text,
ADD COLUMN IF NOT EXISTS confirmed_cause text,
ADD COLUMN IF NOT EXISTS impact text,
ADD COLUMN IF NOT EXISTS affected_system text,
ADD COLUMN IF NOT EXISTS affected_resource text,
ADD COLUMN IF NOT EXISTS objective_id uuid REFERENCES public.objectives(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_worker_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolution text,
ADD COLUMN IF NOT EXISTS verification jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS authority text,
ADD COLUMN IF NOT EXISTS audit_references jsonb DEFAULT '[]'::jsonb;

-- Add new constraint
ALTER TABLE public.incidents ADD CONSTRAINT incidents_status_check CHECK (status IN (
  'DETECTED', 'INVESTIGATING', 'DIAGNOSED', 'PLANNED', 'FIXING', 'VERIFYING', 'RESOLVED', 'ESCALATED', 'BLOCKED'
));

-- Add CTO lock to workspaces
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS cto_status text DEFAULT 'IDLE',
ADD COLUMN IF NOT EXISTS cto_locked_until timestamp with time zone;
