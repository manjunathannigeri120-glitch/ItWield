-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL CHECK (status IN ('DETECTED', 'INVESTIGATING', 'RESOLVED', 'ESCALATED')),
  title text NOT NULL,
  description text,
  source text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at timestamp with time zone
);

-- RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incidents in their workspaces" ON public.incidents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w 
    WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can manage incidents in their workspaces" ON public.incidents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w 
    WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    ))
  )
);

-- Alter workspaces table for minimal memory layer
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS operational_context text;
