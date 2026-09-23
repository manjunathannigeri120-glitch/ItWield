-- Add tracking columns to improvement_proposals
ALTER TABLE public.improvement_proposals
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS implementation_summary text,
ADD COLUMN IF NOT EXISTS verification_result text,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;
