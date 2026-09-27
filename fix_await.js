const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const importStatement = "import { AwaitOutreachApprovalsAction } from './workflows/actions/AwaitOutreachApprovalsAction';\nActionRegistry.register(new AwaitOutreachApprovalsAction());\n";

if (!code.includes('AwaitOutreachApprovalsAction')) {
  code = code.replace("ActionRegistry.register(new OutreachDraftingAction());", "ActionRegistry.register(new OutreachDraftingAction());\n" + importStatement);
  fs.writeFileSync('backend/src/index.ts', code);
}

let auth = fs.readFileSync('backend/src/services/AuthorizationRegistry.ts', 'utf8');
const replacement = `'OUTREACH_DRAFTING': {
      id: 'OUTREACH_DRAFTING',
      name: 'Outreach Drafting',
      owningExecutive: 'AI CMO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
    },
    'AWAIT_OUTREACH_APPROVALS': {
      id: 'AWAIT_OUTREACH_APPROVALS',
      name: 'Await Outreach Approvals',
      owningExecutive: 'AI CMO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
    }`;
auth = auth.replace(/'OUTREACH_DRAFTING':\s*\{[\s\S]*?modifiesExternal:\s*false,\s*\}/, replacement);
fs.writeFileSync('backend/src/services/AuthorizationRegistry.ts', auth);
