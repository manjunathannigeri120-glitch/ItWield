-- Add idempotency_key to mission_results to prevent duplicate result extraction from retried/resumed tasks
ALTER TABLE public.mission_results ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Create unique constraint ensuring a specific business result is only recorded once per mission
CREATE UNIQUE INDEX IF NOT EXISTS idx_mission_results_unique_idempotency 
ON public.mission_results(mission_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;
