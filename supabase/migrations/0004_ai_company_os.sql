-- Modify workspaces to act as the Company entity
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS business_model text,
  ADD COLUMN IF NOT EXISTS company_goals text,
  ADD COLUMN IF NOT EXISTS policies text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'operating';

-- Modify agents for workforce capabilities
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS capabilities jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'idle';

-- Agent Hierarchy cross-workspace prevention (Trigger)
CREATE OR REPLACE FUNCTION check_agent_manager_workspace()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.manager_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.agents WHERE id = NEW.manager_id AND workspace_id = NEW.workspace_id) THEN
      RAISE EXCEPTION 'Manager must belong to the same workspace as the agent.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_agent_manager ON public.agents;
CREATE TRIGGER trg_check_agent_manager
BEFORE INSERT OR UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION check_agent_manager_workspace();

-- Create Tasks (Jobs) table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assigned_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  workflow_run_id uuid REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'RUNNING', 'BLOCKED', 'COMPLETED', 'FAILED', 'ESCALATED', 'CANCELLED')),
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb,
  error text,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  approval_required boolean NOT NULL DEFAULT false,
  approval_status text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Task agent assignment cross-workspace prevention (Trigger)
CREATE OR REPLACE FUNCTION check_task_agent_workspace()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_agent_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.agents WHERE id = NEW.assigned_agent_id AND workspace_id = NEW.workspace_id) THEN
      RAISE EXCEPTION 'Assigned agent must belong to the same workspace as the task.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_task_agent ON public.tasks;
CREATE TRIGGER trg_check_task_agent
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION check_task_agent_workspace();

-- Create Task Events (Audit Log)
CREATE TABLE IF NOT EXISTS public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Append-only constraint on task_events via Triggers
CREATE OR REPLACE FUNCTION prevent_task_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit events cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_task_events_update ON public.task_events;
CREATE TRIGGER trg_prevent_task_events_update
BEFORE UPDATE OR DELETE ON public.task_events
FOR EACH ROW EXECUTE FUNCTION prevent_task_events_mutation();


-- RLS Policies Setup
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Tasks policies (Full CRUD for authorized users)
  CREATE POLICY "Users can view tasks in their workspaces" ON public.tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
  );
  CREATE POLICY "Users can insert tasks in their workspaces" ON public.tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
  );
  CREATE POLICY "Users can update tasks in their workspaces" ON public.tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
  );
  CREATE POLICY "Users can delete tasks in their workspaces" ON public.tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
  );

  -- Task Events policies (Append Only!)
  CREATE POLICY "Users can view task events in their workspaces" ON public.task_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
  );
  CREATE POLICY "Users can insert task events in their workspaces" ON public.task_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
