const fs = require('fs');
let code = fs.readFileSync('backend/src/services/AuthorizationRegistry.ts', 'utf8');
const replacement = `'DATA_TRANSFORMATION': {
      id: 'DATA_TRANSFORMATION',
      name: 'Data Transformation',
      owningExecutive: 'AI CTO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
    },
    'OUTREACH_DRAFTING': {
      id: 'OUTREACH_DRAFTING',
      name: 'Outreach Drafting',
      owningExecutive: 'AI CMO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
    }`;
code = code.replace(/'DATA_TRANSFORMATION':\s*\{[\s\S]*?modifiesExternal:\s*false,\s*\}/, replacement);
fs.writeFileSync('backend/src/services/AuthorizationRegistry.ts', code);
