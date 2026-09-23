-- 0022_mission_planning.sql

CREATE TABLE IF NOT EXISTS public.mission_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id uuid NOT NULL REFERENCES public.business_missions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  objective text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.mission_plan_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.mission_plans(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.business_missions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  title text NOT NULL,
  description text,
  step_type text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'READY', 'RUNNING', 'COMPLETED', 'BLOCKED', 'FAILED', 'SKIPPED')),
  worker_role text NOT NULL,
  authorization_class text NOT NULL,
  success_criteria text,
  depends_on_step_id uuid REFERENCES public.mission_plan_steps(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- RLS

ALTER TABLE public.mission_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_plan_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY mission_plans_isolation ON public.mission_plans
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE id = mission_plans.workspace_id AND created_by = auth.uid()
      UNION
      SELECT workspace_id FROM public.workspace_members WHERE workspace_id = mission_plans.workspace_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE id = mission_plans.workspace_id AND created_by = auth.uid()
      UNION
      SELECT workspace_id FROM public.workspace_members WHERE workspace_id = mission_plans.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY mission_plan_steps_isolation ON public.mission_plan_steps
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE id = mission_plan_steps.workspace_id AND created_by = auth.uid()
      UNION
      SELECT workspace_id FROM public.workspace_members WHERE workspace_id = mission_plan_steps.workspace_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE id = mission_plan_steps.workspace_id AND created_by = auth.uid()
      UNION
      SELECT workspace_id FROM public.workspace_members WHERE workspace_id = mission_plan_steps.workspace_id AND user_id = auth.uid()
    )
  );
