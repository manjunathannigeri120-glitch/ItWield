-- 1. Track the source observation workflow explicitly on tasks
ALTER TABLE public.tasks 
ADD COLUMN source_workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL;

-- 2. Create an atomic uniqueness guarantee for active observation tasks
-- This guarantees at most ONE task per observation workflow can be active (PENDING/ASSIGNED/RUNNING) at a time
CREATE UNIQUE INDEX idx_unique_active_observation_task 
ON public.tasks (workspace_id, source_workflow_id) 
WHERE status IN ('PENDING', 'ASSIGNED', 'RUNNING') AND source_workflow_id IS NOT NULL;
