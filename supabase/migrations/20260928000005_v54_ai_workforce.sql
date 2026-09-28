-- V5.4 AI Workforce Extensions

-- Extend agents table to be the REAL AI WORKFORCE model
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'AVAILABLE',
  ADD COLUMN IF NOT EXISTS max_concurrent_tasks INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_workload INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS authority_level VARCHAR(50) DEFAULT 'LOW',
  ADD COLUMN IF NOT EXISTS risk_ceiling VARCHAR(50) DEFAULT 'LOW',
  ADD COLUMN IF NOT EXISTS budget_limit NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS cost_policy VARCHAR(50) DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS tool_capabilities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Ensure default status makes sense
ALTER TABLE public.agents ALTER COLUMN status SET DEFAULT 'AVAILABLE';

-- Extend tasks table
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS objective_id UUID,
  ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES public.business_missions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS required_capabilities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS required_tools JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS authority_required VARCHAR(50) DEFAULT 'LOW',
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50) DEFAULT 'LOW',
  ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Upgrade check constraint for tasks status
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (
  status IN (
    'PENDING', 'QUEUED', 'ASSIGNED', 'READY', 'RUNNING', 'WAITING', 'WAITING_FOR_APPROVAL', 
    'BLOCKED', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'ESCALATED', 'CANCELLED'
  )
);
