-- V1.3 Production Hardening: Performance indexes
-- Adding indexes identified during the database performance audit.

-- workflow_runs: missing index on status (used in retry checks)
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON workflow_runs(started_at DESC);

-- workflows: next_run_at is queried every 10s by the scheduler
CREATE INDEX IF NOT EXISTS idx_workflows_next_run_at ON workflows(next_run_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_id ON workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);

-- workspace_data: workspace_id + collection_key lookup
CREATE INDEX IF NOT EXISTS idx_workspace_data_workspace_collection ON workspace_data(workspace_id, collection_key);

-- oauth_states: already has indexes from 0008, this is a safety no-op
-- (idx_oauth_states_token and idx_oauth_states_expires already exist)

-- Cleanup expired oauth_states automatically (best-effort; real cleanup happens on callback)
-- We don't add a cron here; the backend already deletes states on use.
-- This index helps bulk cleanup queries if ever needed.
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON oauth_states(user_id);
