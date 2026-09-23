-- Ensure at most ONE active application monitoring task can exist per workspace concurrently
-- This provides a database-enforced invariant against scheduler race conditions where two simultaneous ticks attempt to schedule the deterministic application monitoring check.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_monitoring_task 
ON public.tasks (workspace_id) 
WHERE status IN ('PENDING', 'ASSIGNED', 'RUNNING') 
AND (input->>'task_type') = 'APPLICATION_MONITORING';
