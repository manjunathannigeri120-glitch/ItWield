CREATE TABLE IF NOT EXISTS public.business_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  objective text,
  success_criteria text,
  status text NOT NULL DEFAULT 'DRAFT',
  priority text NOT NULL DEFAULT 'NORMAL',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.mission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.business_missions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES public.business_missions(id) ON DELETE CASCADE;

ALTER TABLE public.business_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_missions_workspace_isolation" ON public.business_missions
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "mission_events_workspace_isolation" ON public.mission_events
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

