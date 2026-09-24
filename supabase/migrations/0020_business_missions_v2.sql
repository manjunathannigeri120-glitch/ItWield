-- Add target_count to business_missions (derived progress fields like verified_count, next_action, blocker intentionally omitted)
ALTER TABLE public.business_missions ADD COLUMN IF NOT EXISTS target_count integer;

-- Add mission_results table for normalized, safe, and verifiable evidence storage
CREATE TABLE IF NOT EXISTS public.mission_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.business_missions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  result_type text NOT NULL,
  summary text,
  evidence jsonb DEFAULT '{}'::jsonb,
  verification_status text NOT NULL DEFAULT 'UNVERIFIED',
  verification_checks jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

-- Indexes for efficient querying of results by mission or workspace
CREATE INDEX IF NOT EXISTS idx_mission_results_mission_id ON public.mission_results(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_results_workspace_id ON public.mission_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mission_results_verification_status ON public.mission_results(verification_status);

-- Enable RLS for mission_results
ALTER TABLE public.mission_results ENABLE ROW LEVEL SECURITY;

-- Apply existing workspace isolation RLS pattern
CREATE POLICY "mission_results_workspace_isolation" ON public.mission_results
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = mission_results.workspace_id AND (
        w.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.workspace_members wm 
          WHERE wm.workspace_id = mission_results.workspace_id AND wm.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = mission_results.workspace_id AND (
        w.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.workspace_members wm 
          WHERE wm.workspace_id = mission_results.workspace_id AND wm.user_id = auth.uid()
        )
      )
    )
  );

-- Update company_memory constraints to natively support 'MISSION' as a source_type
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.company_memory'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%source_type%';
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.company_memory DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.company_memory ADD CONSTRAINT company_memory_source_type_check CHECK (source_type IN ('OWNER', 'TASK', 'TASK_EVENT', 'INCIDENT', 'APPROVAL', 'COMPETITOR', 'SYSTEM', 'MISSION'));

