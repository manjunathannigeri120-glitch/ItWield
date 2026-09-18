CREATE TABLE IF NOT EXISTS workspace_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    collection_key TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workspace_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace_data in their workspaces"
    ON workspace_data FOR ALL
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    ));

CREATE INDEX idx_workspace_data_workspace_id ON workspace_data(workspace_id);
CREATE INDEX idx_workspace_data_collection_key ON workspace_data(collection_key);
