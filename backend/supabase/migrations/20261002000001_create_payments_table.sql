CREATE TABLE IF NOT EXISTS processed_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid NOT NULL,
    razorpay_payment_id text UNIQUE NOT NULL,
    razorpay_order_id text NOT NULL,
    amount integer NOT NULL,
    credits_added integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Policy so only service role can insert, or users can only read their own
ALTER TABLE processed_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON processed_payments FOR SELECT USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
