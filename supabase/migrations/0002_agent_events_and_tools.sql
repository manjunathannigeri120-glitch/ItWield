-- V0.2 Schema Updates for Tools and Events

-- 1. Agent Tools
CREATE TABLE public.agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(agent_id, tool_name)
);

-- 2. Agent Run Events
CREATE TABLE public.agent_run_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- e.g., 'agent_started', 'tool_requested', 'tool_completed'
  tool_name text,
  duration_ms integer,
  details jsonb, -- safe operational metadata
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Setup
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run_events ENABLE ROW LEVEL SECURITY;

-- Agent Tools Policies
CREATE POLICY "Users can view tools of agents in their workspaces" ON public.agent_tools FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agents a JOIN public.workspaces w ON a.workspace_id = w.id WHERE a.id = agent_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid())))
);
CREATE POLICY "Users can manage tools of agents in their workspaces" ON public.agent_tools FOR ALL USING (
  EXISTS (SELECT 1 FROM public.agents a JOIN public.workspaces w ON a.workspace_id = w.id WHERE a.id = agent_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid())))
);

-- Agent Run Events Policies
CREATE POLICY "Users can view events of their runs" ON public.agent_run_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agent_runs r JOIN public.conversations c ON r.conversation_id = c.id WHERE r.id = run_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can insert events for their runs" ON public.agent_run_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.agent_runs r JOIN public.conversations c ON r.conversation_id = c.id WHERE r.id = run_id AND c.user_id = auth.uid())
);
