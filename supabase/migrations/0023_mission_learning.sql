-- Drop the existing constraints to update them
ALTER TABLE public.company_memory DROP CONSTRAINT IF EXISTS company_memory_memory_type_check;
ALTER TABLE public.company_memory ADD CONSTRAINT company_memory_memory_type_check CHECK (memory_type IN ('FACT', 'GOAL', 'PREFERENCE', 'DECISION', 'LESSON', 'INCIDENT', 'OUTCOME', 'OBSERVATION', 'INSIGHT', 'HYPOTHESIS'));

ALTER TABLE public.company_memory DROP CONSTRAINT IF EXISTS company_memory_source_type_check;
ALTER TABLE public.company_memory ADD CONSTRAINT company_memory_source_type_check CHECK (source_type IN ('OWNER', 'TASK', 'TASK_EVENT', 'INCIDENT', 'APPROVAL', 'COMPETITOR', 'SYSTEM', 'MISSION'));

ALTER TABLE public.company_memory DROP CONSTRAINT IF EXISTS company_memory_status_check;
ALTER TABLE public.company_memory ADD CONSTRAINT company_memory_status_check CHECK (status IN ('active', 'archived', 'deprecated', 'CANDIDATE', 'VERIFIED', 'REJECTED', 'SUPERSEDED'));

ALTER TABLE public.company_memory 
  ADD COLUMN IF NOT EXISTS source_mission_id uuid REFERENCES public.business_missions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_result_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_summary text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_company_memory_mission_id ON public.company_memory(source_mission_id);
