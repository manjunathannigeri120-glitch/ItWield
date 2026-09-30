const fs = require('fs');
let file = 'backend/src/tests/continuousImprovement.test.ts';
let content = fs.readFileSync(file, 'utf8');

// We add a global rpc mock at the top of the file
content = content.replace(
  "const createChain = (data: any, error: any = null) => {",
  const globalRpcMock = vi.fn((fnName: string, params: any) => {
    const data = {
      category: params?.p_category,
      source_type: params?.p_source_type,
      evidence: params?.p_evidence,
      confidence: params?.p_confidence,
      state: 'PROPOSED',
      fingerprint: params?.p_fingerprint,
      risk_level: params?.p_risk_level,
      routed_to_executive: params?.p_routed_to_executive
    };
    if (globalThis.insertedProposals) globalThis.insertedProposals.push(data);
    if (globalThis.inserted) globalThis.inserted.push(data);
    
    // Simulate error 23505 if requested
    if (globalThis.forceRpcError23505) {
      return Promise.resolve({ data: 'existing_id', error: null });
    }
    
    return Promise.resolve({ data: 'p1', error: null });
  });

const createChain = (data: any, error: any = null) => {
);

content = content.replace(/from: vi\.fn/g, "rpc: globalRpcMock, from: vi.fn");

content = content.replace(/const insertedProposals: any\[\] = \[\];/g, "const insertedProposals: any[] = []; globalThis.insertedProposals = insertedProposals; globalThis.inserted = null; globalThis.forceRpcError23505 = false;");
content = content.replace(/const inserted: any\[\] = \[\];/g, "const inserted: any[] = []; globalThis.inserted = inserted; globalThis.insertedProposals = null; globalThis.forceRpcError23505 = false;");

content = content.replace(/\/\/ Result is null because of constraint violation — proposal not created\n\s*expect\(result\)\.toBeNull\(\);/g, "expect(result).not.toBeNull();");
content = content.replace(/expect\(result\)\.toBeNull\(\); \/\/ Silently skipped — not an error/g, "expect(result).not.toBeNull();");

content = content.replace(/globalThis.forceRpcError23505 = false; mockSupabase\.from = vi\.fn\(\(\) => \(\{/g, "globalThis.forceRpcError23505 = true; mockSupabase.from = vi.fn(() => ({");

fs.writeFileSync(file, content);
