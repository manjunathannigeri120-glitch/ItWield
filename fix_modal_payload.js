const fs = require('fs');
let modal = fs.readFileSync('frontend/src/components/UpgradeModal.tsx', 'utf8');

// Remove credits from verify payload
modal = modal.replace(/workspaceId: wsId,\s*credits: credits/, 'workspaceId: wsId');
fs.writeFileSync('frontend/src/components/UpgradeModal.tsx', modal);
