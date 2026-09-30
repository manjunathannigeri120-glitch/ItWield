-- Migration: Create idempotent improvement proposal insertion function
-- This provides an atomic, race-safe way to insert improvement proposals 
-- without raising 23505 (duplicate key) errors in concurrent environments.

CREATE OR REPLACE FUNCTION public.create_improvement_proposal_idempotent(
    p_workspace_id UUID,
    p_title TEXT,
    p_problem TEXT,
    p_proposed_solution TEXT,
    p_risk_level TEXT,
    p_category TEXT,
    p_pattern TEXT,
    p_evidence JSONB,
    p_confidence TEXT,
    p_source_type TEXT,
    p_source_ids TEXT[],
    p_fingerprint TEXT,
    p_routed_to_executive TEXT
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Fast path: attempt to return existing active proposal
    SELECT id INTO v_id 
    FROM public.improvement_proposals 
    WHERE workspace_id = p_workspace_id
      AND fingerprint = p_fingerprint
      AND state NOT IN ('COMPLETED', 'REJECTED', 'DISMISSED', 'FAILED', 'ROLLED_BACK')
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        RETURN v_id;
    END IF;

    -- Attempt to insert
    BEGIN
        INSERT INTO public.improvement_proposals (
            workspace_id, title, problem, proposed_solution, state, 
            risk_level, category, pattern, evidence, confidence, 
            source_type, source_ids, fingerprint, routed_to_executive
        ) VALUES (
            p_workspace_id, p_title, p_problem, p_proposed_solution, 'PROPOSED', 
            p_risk_level, p_category, p_pattern, p_evidence, p_confidence, 
            p_source_type, p_source_ids, p_fingerprint, p_routed_to_executive
        )
        RETURNING id INTO v_id;
        
        RETURN v_id;
    EXCEPTION WHEN unique_violation THEN
        -- Race condition occurred: another process inserted it between our SELECT and INSERT.
        -- Fetch and return the newly created ID.
        SELECT id INTO v_id 
        FROM public.improvement_proposals 
        WHERE workspace_id = p_workspace_id
          AND fingerprint = p_fingerprint
          AND state NOT IN ('COMPLETED', 'REJECTED', 'DISMISSED', 'FAILED', 'ROLLED_BACK')
        LIMIT 1;
        
        RETURN v_id;
    END;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
