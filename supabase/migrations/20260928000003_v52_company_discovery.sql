CREATE TABLE IF NOT EXISTS public.company_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'VALIDATING', 'DISCOVERING', 'ANALYZING', 'STORING', 'COMPLETED', 'PARTIAL', 'FAILED')),
    pages_crawled INTEGER DEFAULT 0,
    result_summary JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_discoveries_workspace ON public.company_discoveries(workspace_id);

ALTER TABLE public.company_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage company discoveries" ON public.company_discoveries
    FOR ALL USING (
        workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
    );

CREATE POLICY "Service role can manage company discoveries" ON public.company_discoveries
    USING (true)
    WITH CHECK (true);

-- Update company_memory source_type to allow WEBSITE_DISCOVERY
ALTER TABLE public.company_memory DROP CONSTRAINT IF EXISTS company_memory_source_type_check;
ALTER TABLE public.company_memory ADD CONSTRAINT company_memory_source_type_check 
    CHECK (source_type IN ('OWNER', 'TASK', 'TASK_EVENT', 'INCIDENT', 'APPROVAL', 'COMPETITOR', 'SYSTEM', 'WEBSITE_DISCOVERY'));
