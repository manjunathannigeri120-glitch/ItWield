-- Migration 0017: Continuous Improvement & Decision Learning
-- Extends the existing improvement_proposals table with pattern detection,
-- evidence tracking, deduplication fingerprints, and lifecycle columns.
-- Does NOT recreate existing tables. Does NOT touch company_memory, approvals,
-- incidents, or authorization boundaries.

-- Step 1: Extend state CHECK to include new lifecycle states
-- We drop the old check and replace it with an extended one.
ALTER TABLE public.improvement_proposals
  DROP CONSTRAINT IF EXISTS improvement_proposals_state_check;

ALTER TABLE public.improvement_proposals
  ADD CONSTRAINT improvement_proposals_state_check
  CHECK (state IN (
    -- Legacy states (preserve backward compat)
    'DISCOVERED', 'ANALYZING', 'PROPOSED', 'APPROVAL_REQUIRED', 'APPROVED',
    'IN_PROGRESS', 'TESTING', 'DEPLOYED', 'MONITORING', 'COMPLETED',
    'REJECTED', 'ROLLED_BACK',
    -- New states
    'VALIDATING', 'IMPLEMENTING', 'FAILED', 'DISMISSED'
  ));

-- Step 2: Add new columns (all IF NOT EXISTS for idempotency)
ALTER TABLE public.improvement_proposals
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'OPERATIONS'
    CHECK (category IN (
      'OPERATIONS', 'RELIABILITY', 'PRODUCT', 'CUSTOMER',
      'MARKETING', 'COMPETITIVE', 'GOAL_ALIGNMENT', 'WORKFORCE'
    )),
  ADD COLUMN IF NOT EXISTS pattern text,
  ADD COLUMN IF NOT EXISTS evidence jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS confidence text DEFAULT 'low'
    CHECK (confidence IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'SYSTEM'
    CHECK (source_type IN (
      'INCIDENT_PATTERN', 'FAILURE_PATTERN', 'SUCCESS_PATTERN',
      'OWNER_PATTERN', 'GOAL_GAP', 'COMPETITOR_PATTERN', 'SYSTEM'
    )),
  ADD COLUMN IF NOT EXISTS source_ids text[] DEFAULT '{}',
  -- fingerprint is the deduplication key: hash of workspace+category+pattern+target
  ADD COLUMN IF NOT EXISTS fingerprint text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS implemented_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS dismissed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS routed_to_executive text;

-- Step 3: Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_improvement_proposals_workspace_id
  ON public.improvement_proposals(workspace_id);

CREATE INDEX IF NOT EXISTS idx_improvement_proposals_state
  ON public.improvement_proposals(state);

CREATE INDEX IF NOT EXISTS idx_improvement_proposals_category
  ON public.improvement_proposals(category);

-- Step 4: Deduplication index — only ONE active proposal per fingerprint per workspace
-- Completed/rejected/dismissed proposals are kept for history.
CREATE UNIQUE INDEX IF NOT EXISTS idx_improvement_proposals_fingerprint
  ON public.improvement_proposals(workspace_id, fingerprint)
  WHERE state NOT IN ('COMPLETED', 'REJECTED', 'DISMISSED', 'FAILED', 'ROLLED_BACK')
    AND fingerprint IS NOT NULL;
