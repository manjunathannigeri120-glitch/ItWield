CREATE TABLE company_coordinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    objective_id UUID REFERENCES business_goals(id) ON DELETE CASCADE,
    mission_id UUID,
    founder_directive TEXT,
    strategic_intent TEXT,
    primary_executive TEXT,
    supporting_executives TEXT[],
    current_state JSONB DEFAULT '{}'::jsonb,
    current_target JSONB,
    current_gap JSONB,
    objective_status TEXT DEFAULT 'NOT_STARTED',
    strategic_priority TEXT DEFAULT 'MEDIUM',
    constraints JSONB DEFAULT '[]'::jsonb,
    known_facts JSONB DEFAULT '[]'::jsonb,
    inferences JSONB DEFAULT '[]'::jsonb,
    missing_data JSONB DEFAULT '[]'::jsonb,
    bottlenecks JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    conflicts JSONB DEFAULT '[]'::jsonb,
    active_executive_actions JSONB DEFAULT '[]'::jsonb,
    completed_executive_actions JSONB DEFAULT '[]'::jsonb,
    blocked_executive_actions JSONB DEFAULT '[]'::jsonb,
    failed_executive_actions JSONB DEFAULT '[]'::jsonb,
    approval_state TEXT DEFAULT 'NONE',
    verification_state TEXT DEFAULT 'PENDING',
    expected_effect TEXT,
    actual_effect TEXT,
    next_reassessment_at TIMESTAMPTZ,
    coordination_depth INTEGER DEFAULT 0,
    visited_executives TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

ALTER TABLE company_coordinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users based on workspace" ON company_coordinations FOR SELECT USING (auth.uid() IN (SELECT owner_id FROM workspaces WHERE id = workspace_id));
CREATE POLICY "Enable write for authenticated users based on workspace" ON company_coordinations FOR ALL USING (auth.uid() IN (SELECT owner_id FROM workspaces WHERE id = workspace_id));

CREATE UNIQUE INDEX idx_company_coordinations_objective ON company_coordinations(workspace_id, objective_id);
