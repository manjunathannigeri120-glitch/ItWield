CREATE TABLE IF NOT EXISTS public.company_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    system_type TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    connection_id TEXT,
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.action_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    actor TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    executive_role TEXT,
    worker_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    objective_id UUID REFERENCES public.business_goals(id) ON DELETE SET NULL,
    mission_id UUID REFERENCES public.business_missions(id) ON DELETE SET NULL,
    system TEXT,
    capability TEXT,
    action TEXT NOT NULL,
    authority TEXT NOT NULL,
    policy_decision TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    input_summary TEXT,
    result_summary TEXT,
    evidence TEXT,
    verification_state TEXT DEFAULT 'UNVERIFIED',
    failure_information TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.approvals
    ADD COLUMN IF NOT EXISTS objective_id UUID REFERENCES public.business_goals(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES public.business_missions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS actor TEXT,
    ADD COLUMN IF NOT EXISTS actor_type TEXT,
    ADD COLUMN IF NOT EXISTS requested_action TEXT,
    ADD COLUMN IF NOT EXISTS system TEXT,
    ADD COLUMN IF NOT EXISTS capability TEXT,
    ADD COLUMN IF NOT EXISTS expected_effect TEXT;

ALTER TABLE public.workspaces
    ADD COLUMN IF NOT EXISTS operating_state TEXT NOT NULL DEFAULT 'OPERATING';

ALTER TABLE public.company_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View systems" ON public.company_systems FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "View audit logs" ON public.action_audit_logs FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
