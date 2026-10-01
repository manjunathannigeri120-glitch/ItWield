const fs = require('fs');
let file = 'backend/src/api/chat.ts';
let content = fs.readFileSync(file, 'utf8');

// Add import
content = content.replace(
  "import { CompanyBrainService } from '../services/CompanyBrainService';",
  "import { CompanyBrainService } from '../services/CompanyBrainService';\nimport { CreditService } from '../services/CreditService';"
);

// Add credit check
const creditCheck = `
    const creditCheck = await CreditService.deductCredits(supabase, workspaceId, 1);
    if (!creditCheck.allowed) {
       return res.status(402).json({ error: 'You have run out of AI credits. Please upgrade your plan to continue operating your company.' });
    }
`;

content = content.replace(
  "const { data: userAccess, error: userError } = await supabase",
  creditCheck + "\n    const { data: userAccess, error: userError } = await supabase"
);

fs.writeFileSync(file, content);
console.log('Integrated credit check into chat');
