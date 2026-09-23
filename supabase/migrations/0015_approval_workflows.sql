CREATE TABLE IF NOT EXISTS public.approvals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  action text NOT NULL,
  title text NOT NULL,
  reason text NOT NULL,
  requested_by_executive text NOT NULL,
  risk_level text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING_APPROVAL',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_reason text,
  execution_started_at timestamp with time zone,
  execution_completed_at timestamp with time zone,
  execution_result jsonb,
  execution_error text
);

CREATE INDEX IF NOT EXISTS idx_approvals_workspace_id ON public.approvals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals in their workspaces" ON public.approvals
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update approvals in their workspaces" ON public.approvals
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role can manage all approvals" ON public.approvals
  USING (true)
  WITH CHECK (true);
