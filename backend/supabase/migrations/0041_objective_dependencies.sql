CREATE TABLE objective_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    source_objective_id UUID,
    blocking_objective_id UUID,
    source_executive TEXT,
    blocking_executive TEXT,
    relationship_type TEXT,
    reason TEXT,
    evidence TEXT,
    status TEXT,
    authority TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_evidence TEXT,
    metadata JSONB
);
ALTER TABLE objective_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users based on workspace" ON objective_dependencies FOR SELECT USING (auth.uid() IN (SELECT owner_id FROM workspaces WHERE id = workspace_id));
CREATE POLICY "Enable write for authenticated users based on workspace" ON objective_dependencies FOR ALL USING (auth.uid() IN (SELECT owner_id FROM workspaces WHERE id = workspace_id));
