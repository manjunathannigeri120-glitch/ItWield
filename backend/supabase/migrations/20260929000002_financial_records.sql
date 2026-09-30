CREATE TABLE IF NOT EXISTS financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    record_type TEXT NOT NULL, -- 'REVENUE', 'EXPENSE', 'BUDGET'
    category TEXT NOT NULL,    -- 'MARKETING', 'INFRASTRUCTURE', 'PAYROLL', etc.
    amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'VERIFIED', -- 'VERIFIED', 'PENDING'
    description TEXT,
    reference_id TEXT, -- external ID
    recorded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_records_workspace_isolation" ON financial_records
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

CREATE INDEX idx_financial_records_workspace ON financial_records(workspace_id);
CREATE INDEX idx_financial_records_type ON financial_records(record_type);
