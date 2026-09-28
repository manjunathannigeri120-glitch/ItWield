-- V5.3 Company Brain 2.0

-- Drop restrictive constraints to allow expansive memory architecture
ALTER TABLE public.company_memory DROP CONSTRAINT IF EXISTS company_memory_memory_type_check;
ALTER TABLE public.company_memory DROP CONSTRAINT IF EXISTS company_memory_source_type_check;
ALTER TABLE public.company_memory DROP CONSTRAINT IF EXISTS company_memory_status_check;

-- Add new freshness and tracking columns
ALTER TABLE public.company_memory 
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_observed_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS freshness_status TEXT DEFAULT 'CURRENT' CHECK (freshness_status IN ('CURRENT', 'AGING', 'STALE', 'SUPERSEDED'));

-- Update any existing superseded memories
UPDATE public.company_memory SET freshness_status = 'SUPERSEDED' WHERE superseded_by IS NOT NULL;

-- Create memory_relationships table
CREATE TABLE IF NOT EXISTS public.memory_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    source_memory_id UUID NOT NULL REFERENCES public.company_memory(id) ON DELETE CASCADE,
    target_memory_id UUID NOT NULL REFERENCES public.company_memory(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('SUPPORTS', 'CONTRADICTS', 'SUPERSEDES', 'DERIVED_FROM', 'CAUSED_BY', 'RESULTED_IN', 'DEPENDS_ON', 'RELATES_TO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_rels_workspace ON public.memory_relationships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memory_rels_source ON public.memory_relationships(source_memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_rels_target ON public.memory_relationships(target_memory_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_rels_unique ON public.memory_relationships(source_memory_id, target_memory_id, relationship_type);

ALTER TABLE public.memory_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage memory relationships" ON public.memory_relationships
    FOR ALL USING (
        workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
    );

CREATE POLICY "Service role can manage memory relationships" ON public.memory_relationships
    USING (true)
    WITH CHECK (true);
