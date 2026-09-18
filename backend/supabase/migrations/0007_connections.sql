CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected',
    credentials TEXT NOT NULL, -- Encrypted credentials
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access connections in their workspaces"
    ON connections FOR ALL
    USING (
        workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()) OR
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

CREATE INDEX idx_connections_workspace_id ON connections(workspace_id);
CREATE INDEX idx_connections_provider ON connections(provider);
