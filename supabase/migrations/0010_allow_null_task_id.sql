-- Drop NOT NULL constraint on task_events.task_id to allow workspace-level CEO evaluations
ALTER TABLE public.task_events ALTER COLUMN task_id DROP NOT NULL;
