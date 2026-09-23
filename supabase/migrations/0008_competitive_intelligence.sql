-- Competitors
CREATE TABLE IF NOT EXISTS public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  monitoring_enabled boolean DEFAULT true,
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage competitors in their workspaces" ON public.competitors FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w 
    WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    ))
  )
);

-- Competitor Observations
CREATE TABLE IF NOT EXISTS public.competitor_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  competitor_id uuid NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('FEATURE', 'PRICING', 'UX', 'PERFORMANCE', 'MARKET')),
  title text NOT NULL,
  description text,
  significance text NOT NULL CHECK (significance IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.competitor_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage competitor_observations in their workspaces" ON public.competitor_observations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w 
    WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    ))
  )
);

-- Improvement Proposals
CREATE TABLE IF NOT EXISTS public.improvement_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_observation_id uuid REFERENCES public.competitor_observations(id) ON DELETE SET NULL,
  title text NOT NULL,
  problem text,
  proposed_solution text,
  state text NOT NULL CHECK (state IN ('DISCOVERED', 'ANALYZING', 'PROPOSED', 'APPROVAL_REQUIRED', 'APPROVED', 'IN_PROGRESS', 'TESTING', 'DEPLOYED', 'MONITORING', 'COMPLETED', 'REJECTED', 'ROLLED_BACK')),
  risk_level text NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.improvement_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage improvement_proposals in their workspaces" ON public.improvement_proposals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w 
    WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    ))
  )
);
