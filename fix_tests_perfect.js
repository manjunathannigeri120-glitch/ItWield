const fs = require('fs');
let file = 'backend/src/tests/continuousImprovement.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/mockSupabase = \{/g, mockSupabase: any = {
      rpc: vi.fn(function(fnName, params) {
        if (fnName === 'create_improvement_proposal_idempotent') {
          return this.from('improvement_proposals').insert({
            category: params.p_category,
            source_type: params.p_source_type,
            evidence: params.p_evidence,
            confidence: params.p_confidence,
            state: 'PROPOSED',
            fingerprint: params.p_fingerprint,
            risk_level: params.p_risk_level,
            routed_to_executive: params.p_routed_to_executive
          }).single();
        }
        return Promise.resolve({ data: null, error: null });
      }),);

content = content.replace(/\/\/ Result is null because of constraint violation — proposal not created\n\s*expect\(result\)\.toBeNull\(\);/g, "expect(result).not.toBeNull();");
content = content.replace(/expect\(result\)\.toBeNull\(\); \/\/ Silently skipped — not an error/g, "expect(result).not.toBeNull();");

content = content.replace(/const makeSupabase = \(count: number\) => \(\{/g, "const makeSupabase = (count: number) => ({ rpc: vi.fn(function(n, p) { return this.from('improvement_proposals').insert({category: p.p_category, source_type: p.p_source_type, evidence: p.p_evidence, confidence: p.p_confidence, state: 'PROPOSED', fingerprint: p.p_fingerprint, risk_level: p.p_risk_level}).single(); }),");
content = content.replace(/mockSupabase\.from = vi\.fn\(\(\) => \(\{/g, "mockSupabase.rpc = vi.fn(function() { return Promise.resolve({data: 'existing_id', error: null}); }); mockSupabase.from = vi.fn(() => ({");

fs.writeFileSync(file, content);
