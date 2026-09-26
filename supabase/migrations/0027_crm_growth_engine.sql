-- 0027_crm_growth_engine.sql
-- Relax stage constraints and add communication/follow-up tracking fields

ALTER TABLE public.opportunities 
DROP CONSTRAINT IF EXISTS opportunities_stage_check;

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_stage_check 
CHECK (stage IN (
    'RESEARCHED', 
    'QUALIFIED', 
    'PRIORITIZED', 
    'OUTREACH_DRAFTED', 
    'AWAITING_APPROVAL', 
    'CONTACTED', 
    'RESPONDED', 
    'SALES_QUALIFIED', 
    'PROPOSAL', 
    'WON', 
    'LOST', 
    'DISMISSED', 
    'CONVERTED'
));

-- Add response and follow-up tracking
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS response_status TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS follow_up_draft JSONB;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS ai_classification TEXT;
