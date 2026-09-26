CREATE TABLE IF NOT EXISTS public.business_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    raw_input TEXT NOT NULL,
    objective TEXT NOT NULL,
    target NUMERIC,
    target_metric TEXT,
    current_metric NUMERIC DEFAULT 0,
    timeframe TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, COMPLETED, STALLED, FAILED
    success_definition TEXT,
    required_data JSONB,
    missing_data JSONB,
    constraints JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_bottlenecks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    related_goal_id UUID REFERENCES public.business_goals(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    evidence TEXT NOT NULL,
    affected_metric TEXT,
    confidence NUMERIC,
    explanation TEXT,
    recommended_actions JSONB,
    status TEXT NOT NULL DEFAULT 'DETECTED', -- DETECTED, RESOLVING, RESOLVED, IGNORED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_data_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    domain TEXT NOT NULL, -- CUSTOMERS, REVENUE, OPPORTUNITIES, etc.
    source TEXT NOT NULL,
    source_type TEXT NOT NULL,
    availability TEXT DEFAULT 'AVAILABLE',
    data_quality TEXT DEFAULT 'UNKNOWN',
    schema_info JSONB,
    last_synced TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.decision_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    context_data JSONB,
    conclusion TEXT,
    proposed_action TEXT,
    authorization_state TEXT,
    result TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.business_missions 
    ADD COLUMN IF NOT EXISTS parent_goal_id UUID REFERENCES public.business_goals(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS contribution_metric TEXT,
    ADD COLUMN IF NOT EXISTS target_value NUMERIC,
    ADD COLUMN IF NOT EXISTS current_value NUMERIC,
    ADD COLUMN IF NOT EXISTS expected_contribution TEXT,
    ADD COLUMN IF NOT EXISTS measured_contribution TEXT,
    ADD COLUMN IF NOT EXISTS outcome_status TEXT DEFAULT 'PENDING';

-- Enable RLS
ALTER TABLE public.business_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_data_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_traces ENABLE ROW LEVEL SECURITY;

-- Standard Policies
CREATE POLICY "View goals" ON public.business_goals FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "View bottlenecks" ON public.business_bottlenecks FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "View registry" ON public.business_data_registry FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "View traces" ON public.decision_traces FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

