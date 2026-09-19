-- Workflows
CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Workflow Runs (Executions)
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  trigger_data jsonb,
  execution_log jsonb DEFAULT '[]'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  error text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Setup
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- Workflows Policies
DO $ $ BEGIN
  CREATE POLICY "Users can view workflows in their workspaces" ON public.workflows FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
  );
EXCEPTION WHEN duplicate_object THEN null; END $ $;

DO $ $ BEGIN
  CREATE POLICY "Users can manage workflows in their workspaces" ON public.workflows FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
  );
EXCEPTION WHEN duplicate_object THEN null; END $ $;

-- Workflow Runs Policies
DO $ $ BEGIN
  CREATE POLICY "Users can view runs of workflows in their workspaces" ON public.workflow_runs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workflows wf WHERE wf.id = workflow_id AND EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = wf.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()))))
  );
EXCEPTION WHEN duplicate_object THEN null; END $ $;

DO $ $ BEGIN
  CREATE POLICY "Users can insert runs of workflows in their workspaces" ON public.workflow_runs FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.workflows wf WHERE wf.id = workflow_id AND EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = wf.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()))))
  );
EXCEPTION WHEN duplicate_object THEN null; END $ $;

DO $ $ BEGIN
  CREATE POLICY "Users can update their runs" ON public.workflow_runs FOR UPDATE USING (
    user_id = auth.uid()
  );
EXCEPTION WHEN duplicate_object THEN null; END $ $;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_id ON public.workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON public.workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON public.workflow_runs(user_id);
