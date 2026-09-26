
-- Update memory_type check to include 'RULE'
ALTER TABLE public.company_memory DROP CONSTRAINT IF EXISTS company_memory_memory_type_check;

ALTER TABLE public.company_memory ADD CONSTRAINT company_memory_memory_type_check 
CHECK (memory_type IN ('FACT', 'GOAL', 'PREFERENCE', 'DECISION', 'LESSON', 'INCIDENT', 'OUTCOME', 'OBSERVATION', 'INSIGHT', 'HYPOTHESIS', 'RULE'));
