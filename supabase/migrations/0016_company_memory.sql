CREATE TABLE IF NOT EXISTS public.company_memory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  memory_type text NOT NULL CHECK (memory_type IN ('FACT', 'GOAL', 'PREFERENCE', 'DECISION', 'LESSON', 'INCIDENT', 'OUTCOME')),
  title text NOT NULL,
  content text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('OWNER', 'TASK', 'TASK_EVENT', 'INCIDENT', 'APPROVAL', 'COMPETITOR', 'SYSTEM')),
  source_id text,
  importance text NOT NULL DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  confidence text NOT NULL DEFAULT 'high' CHECK (confidence IN ('low', 'medium', 'high', 'verified')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deprecated')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  last_used_at timestamp with time zone,
  created_by text NOT NULL,
  expires_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_company_memory_workspace_id ON public.company_memory(workspace_id);
CREATE INDEX IF NOT EXISTS idx_company_memory_type ON public.company_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_company_memory_status ON public.company_memory(status);

-- Prevent duplicate memories from the same exact source
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_memory_unique_source 
ON public.company_memory(workspace_id, source_type, source_id) 
WHERE source_id IS NOT NULL;

ALTER TABLE public.company_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memory in their workspaces" ON public.company_memory
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update memory in their workspaces" ON public.company_memory
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role can manage all company memory" ON public.company_memory
  USING (true)
  WITH CHECK (true);
