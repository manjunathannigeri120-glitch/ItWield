-- V3.9.3 Company Brain & Executive Action Loop

-- Add fields to company_memory
ALTER TABLE public.company_memory 
    ADD COLUMN IF NOT EXISTS category TEXT, -- STRATEGIC_CONTEXT, DECISION, LESSON, INCIDENT, OUTCOME
    ADD COLUMN IF NOT EXISTS evidence JSONB,
    ADD COLUMN IF NOT EXISTS confidence NUMERIC,
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'UNVERIFIED',
    ADD COLUMN IF NOT EXISTS related_mission_id UUID REFERENCES public.business_missions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS related_incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS related_decision_id UUID, -- References ceo_decisions(id), avoiding circular foreign key issues during creation
    ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.company_memory(id) ON DELETE SET NULL;

-- Ensure approvals have necessary fields
ALTER TABLE public.approvals
    ADD COLUMN IF NOT EXISTS context JSONB;

-- Backwards compatibility: Populate category from memory_type if category is null
UPDATE public.company_memory SET category = memory_type WHERE category IS NULL;
