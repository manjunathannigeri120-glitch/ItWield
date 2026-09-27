const fs = require('fs');

// Fix ceoRouting
let f = 'backend/src/tests/ceoRouting.test.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/const base: any = \{[\s\S]*?update: vi\.fn/m, \const base: any = {
          select: vi.fn(() => base),
          eq: vi.fn(() => base),
          neq: vi.fn(() => base),
          in: vi.fn(() => base),
          single: vi.fn().mockResolvedValue({ data: { id: 'cmo', capabilities: ['LEAD_RESEARCH'] } }),
          order: vi.fn(() => base),
          limit: vi.fn(() => base),
          update: vi.fn\);
fs.writeFileSync(f, c);

// Fix ceoGoalAction
f = 'backend/src/tests/ceoGoalAction.test.ts';
c = fs.readFileSync(f, 'utf8');
c = c.replace(/\{ id: 'cmo-1', name: 'AI CMO', workspace_id: 'ws-1' \}/g, "{ id: 'cmo-1', name: 'AI CMO', workspace_id: 'ws-1', capabilities: ['COMPETITIVE_ANALYSIS'] }");
fs.writeFileSync(f, c);

// Fix commandCenter
f = 'backend/src/tests/commandCenter.test.ts';
c = fs.readFileSync(f, 'utf8');
c = c.replace(/return createChain\(\\\[\\\]\);/g, "return createChain([]);");
fs.writeFileSync(f, c);

console.log('patched');
