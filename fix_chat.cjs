const fs = require('fs');
let file = 'backend/src/api/chat.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('CreditService')) {
  content = `import { CreditService } from '../services/CreditService';\n` + content;
  
  const target = `const { data: userAccess, error: userError } = await req.supabase
        .from('workspaces')`;
        
  const fix = `
      // 1. Deduct 1 AI Credit for this message
      const creditCheck = await CreditService.deductCredits(req.supabase, workspaceId, 1);
      if (!creditCheck.allowed) {
        return res.status(402).json({ error: 'You have run out of AI credits. Please upgrade your plan to continue operating your company.' });
      }
      
      const { data: userAccess, error: userError } = await req.supabase
        .from('workspaces')`;

  content = content.replace(target, fix);
  fs.writeFileSync(file, content);
  console.log('Injected CreditService into chat.ts');
} else {
  console.log('CreditService already injected');
}
