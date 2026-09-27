const fs = require('fs');
const file = 'backend/src/services/ManagementIntelligenceService.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  "import { CompanyState } from './CompanyStateService';",
  "import { CompanyState } from './CompanyStateService';\nimport { WorkforceIntegrityService } from './WorkforceIntegrityService';"
);

c = c.replace(
  /\/\/ Persist and Deduplicate/,
  `// 5. Detect Workforce Misconfigurations
        const workforceState = await WorkforceIntegrityService.evaluateWorkforceReadiness(supabase, workspaceId);
        for (const worker of workforceState) {
            if (worker.state === 'MISCONFIGURED' || worker.state === 'BLOCKED') {
               detectedItems.push({
                  type: 'OPERATIONS',
                  title: \`Workforce Capability Gap: \${worker.name}\`,
                  description: worker.reason,
                  priority: 'HIGH',
                  priority_reason: 'A worker is misconfigured or lacks valid capabilities to accept delegated work.',
                  source: 'SYSTEM',
                  fingerprint: \`OPERATIONS:WORKFORCE_MISCONFIG:\${worker.id}\`,
                  evidence: { worker_id: worker.id, reason: worker.reason }
               });
            }
        }

        // Persist and Deduplicate`
);

fs.writeFileSync(file, c);
console.log('patched ManagementIntelligenceService');
