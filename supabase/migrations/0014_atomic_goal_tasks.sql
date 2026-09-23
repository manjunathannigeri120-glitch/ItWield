-- Ensure at most ONE active competitive analysis task can exist per workspace concurrently
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_competitive_analysis_task 
ON public.tasks (workspace_id) 
WHERE status IN ('PENDING', 'ASSIGNED', 'RUNNING') 
AND (input->>'task_type') = 'COMPETITIVE_ANALYSIS';
