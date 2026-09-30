const fs = require('fs');
let file = 'backend/src/tests/continuousImprovement.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/mockSupabase\s*=\s*\{/g, `mockSupabase: any = {
        rpc: vi.fn((fnName: string, params: any) => {
          if (fnName === 'create_improvement_proposal_idempotent') {
            const data = {
              category: params.p_category,
              source_type: params.p_source_type,
              evidence: params.p_evidence,
              confidence: params.p_confidence,
              state: 'PROPOSED',
              fingerprint: params.p_fingerprint,
              risk_level: params.p_risk_level
            };
            try { if (typeof insertedProposals !== 'undefined') insertedProposals.push(data); } catch(e){}
            try { if (typeof inserted !== 'undefined') inserted.push(data); } catch(e){}
            return Promise.resolve({ data: 'p1', error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }),`);

fs.writeFileSync(file, content);
console.log("Fixed!");
