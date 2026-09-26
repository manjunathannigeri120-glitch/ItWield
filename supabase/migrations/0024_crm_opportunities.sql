CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.business_missions(id) ON DELETE CASCADE,
    mission_result_id UUID REFERENCES public.mission_results(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    website TEXT,
    contact_email TEXT,
    title TEXT,
    description TEXT,
    evidence JSONB DEFAULT '{}'::jsonb,
    stage TEXT NOT NULL CHECK (stage IN ('RESEARCHED', 'QUALIFIED', 'OUTREACH_DRAFTED', 'AWAITING_APPROVAL', 'CONTACTED', 'CONVERTED', 'LOST', 'DISMISSED')) DEFAULT 'RESEARCHED',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    recommended_action TEXT,
    outreach_status TEXT,
    outreach_draft JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, mission_result_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunities_workspace_id ON public.opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_mission_id ON public.opportunities(mission_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities(stage);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view opportunities in their workspaces"
    ON public.opportunities FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert opportunities in their workspaces"
    ON public.opportunities FOR INSERT
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update opportunities in their workspaces"
    ON public.opportunities FOR UPDATE
    USING (workspace_id IN (
        SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete opportunities in their workspaces"
    ON public.opportunities FOR DELETE
    USING (workspace_id IN (
        SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    ));

-- Allow service_role to bypass RLS for system operations
CREATE POLICY "Service role has full access to opportunities"
    ON public.opportunities FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
