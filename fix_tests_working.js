const fs = require('fs');
let file = 'backend/src/tests/continuousImprovement.test.ts';
let content = fs.readFileSync(file, 'utf8');

// The test mocks supabase.from('improvement_proposals').insert(data). We can intercept this via a spy on createProposal.
// Actually, I can just modify mockSupabase to have rpc!

content = content.replace(/mockSupabase = \{/g, mockSupabase: any = {
      rpc: vi.fn((fnName, params) => {
        if (fnName === 'create_improvement_proposal_idempotent') {
          // Send it to the mocked insert
          if (typeof insertedProposals !== 'undefined') {
            insertedProposals.push({
              category: params.p_category,
              source_type: params.p_source_type,
              evidence: params.p_evidence,
              confidence: params.p_confidence,
              state: 'PROPOSED',
              fingerprint: params.p_fingerprint,
              risk_level: params.p_risk_level,
              routed_to_executive: params.p_routed_to_executive
            });
          }
          if (typeof inserted !== 'undefined') {
            inserted.push({
              category: params.p_category,
              source_type: params.p_source_type,
              evidence: params.p_evidence,
              confidence: params.p_confidence,
              state: 'PROPOSED',
              fingerprint: params.p_fingerprint,
              risk_level: params.p_risk_level,
              routed_to_executive: params.p_routed_to_executive
            });
          }
          return Promise.resolve({ data: 'p1', error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),);

content = content.replace(/\/\/ Result is null because of constraint violation — proposal not created\n\s*expect\(result\)\.toBeNull\(\);/g, "expect(result).not.toBeNull();");
content = content.replace(/expect\(result\)\.toBeNull\(\); \/\/ Silently skipped — not an error/g, "expect(result).not.toBeNull();");

content = content.replace(/const makeSupabase = \(count: number\) => \(\{/g, "const makeSupabase = (count: number) => ({ rpc: vi.fn((n, params) => { inserted.push({ category: params.p_category, source_type: params.p_source_type, evidence: params.p_evidence, confidence: params.p_confidence, state: 'PROPOSED', fingerprint: params.p_fingerprint, risk_level: params.p_risk_level, routed_to_executive: params.p_routed_to_executive }); return Promise.resolve({data: 'p1', error: null}); }),");

content = content.replace(/mockSupabase\.from = vi\.fn\(\(\) => \(\{/g, "mockSupabase.rpc = vi.fn(() => Promise.resolve({data: 'existing_id', error: null})); mockSupabase.from = vi.fn(() => ({");

fs.writeFileSync(file, content);
