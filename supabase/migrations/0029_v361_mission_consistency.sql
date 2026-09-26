-- V3.6.1 Mission State Consistency & Reliability

-- 1. Ensure orphaned RUNNING steps from non-active plans are cancelled so they don't block.
UPDATE public.mission_plan_steps
SET status = 'CANCELLED'
FROM public.mission_plans
WHERE public.mission_plan_steps.plan_id = public.mission_plans.id
  AND public.mission_plans.status != 'ACTIVE'
  AND public.mission_plan_steps.status = 'RUNNING';

-- 2. "One active execution per mission step"
-- Since tasks map to missions (not steps directly), we enforce one RUNNING task per mission to prevent duplicated concurrent executions of the same step.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_one_running_per_mission
ON public.tasks (mission_id)
WHERE status = 'RUNNING' AND mission_id IS NOT NULL;

-- 3. Fix COMPETITIVE_ANALYSIS capability mismatch for existing Competitor Analysts
UPDATE public.agents
SET capabilities = array_replace(capabilities, 'COMPETITOR_RESEARCH', 'COMPETITIVE_ANALYSIS')
WHERE 'COMPETITOR_RESEARCH' = ANY(capabilities);

