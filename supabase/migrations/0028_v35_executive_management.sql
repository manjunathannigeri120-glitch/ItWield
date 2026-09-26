-- V3.5 Executive Management & Decision System

CREATE TABLE IF NOT EXISTS management_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- PROBLEM, OPPORTUNITY, GOAL_GAP, RELIABILITY, CUSTOMER_GROWTH, PRODUCT, COMPETITIVE, OPERATIONS
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
    priority_reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- QUEUED, ANALYZING, ACTION_READY, WAITING_APPROVAL, EXECUTING, REVIEW_REQUIRED, COMPLETED, BLOCKED, ESCALATED
    source VARCHAR(50) NOT NULL, -- SYSTEM, CEO, OWNER, MISSION, INCIDENT
    fingerprint VARCHAR(255) NOT NULL,
    evidence JSONB DEFAULT '{}'::jsonb,
    goal_id UUID,
    mission_id UUID REFERENCES business_missions(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    assigned_executive_id VARCHAR(50), -- e.g., 'CTO', 'CMO', 'CFO', or agent ID
    resolution TEXT,
    next_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_management_items_fingerprint 
ON management_items(workspace_id, fingerprint) 
WHERE status NOT IN ('COMPLETED', 'RESOLVED', 'SUPERSEDED', 'ESCALATED');

ALTER TABLE management_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace management items"
    ON management_items FOR ALL
    USING (workspace_id IN (SELECT id FROM workspaces));


CREATE TABLE IF NOT EXISTS ceo_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    management_item_id UUID REFERENCES management_items(id) ON DELETE SET NULL,
    mission_id UUID REFERENCES business_missions(id) ON DELETE SET NULL,
    decision TEXT NOT NULL,
    reason TEXT,
    evidence JSONB DEFAULT '{}'::jsonb,
    priority VARCHAR(20) NOT NULL,
    assigned_executive VARCHAR(50),
    proposed_action TEXT,
    authorization_state VARCHAR(50), -- SAFE, APPROVAL_REQUIRED, PROHIBITED
    owner_required BOOLEAN DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED', -- PROPOSED, APPROVAL_REQUIRED, APPROVED, REJECTED, EXECUTING, COMPLETED, FAILED, SUPERSEDED
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceo_decisions_workspace ON ceo_decisions(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ceo_decisions_item ON ceo_decisions(management_item_id);

ALTER TABLE ceo_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace ceo decisions"
    ON ceo_decisions FOR ALL
    USING (workspace_id IN (SELECT id FROM workspaces));
