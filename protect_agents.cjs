const fs = require('fs');
let file = 'backend/src/api/agents.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { CreditService }")) {
    content = `import { CreditService } from '../services/CreditService';\n` + content;
}

const target = "// Save user message";
const fix = `// --- CREDIT ENFORCEMENT BOUNDARY ---
    if (req.supabase) {
        const creditCheck = await CreditService.deductCredits(req.supabase, agent.workspace_id, 1);
        if (!creditCheck.allowed) {
            return res.status(402).json({
                error: 'INSUFFICIENT_CREDITS',
                message: 'Insufficient AI credits. Please upgrade your plan to continue.'
            });
        }
    }
    // -----------------------------------
    
    // Save user message`;

if (!content.includes('INSUFFICIENT_CREDITS')) {
    content = content.replace(target, fix);
    // Add credits to response
    content = content.replace(
      "res.json({\n      conversationId: currentConversationId,\n      response: responseText\n    });",
      "res.json({\n      conversationId: currentConversationId,\n      response: responseText,\n      credits: req.supabase ? (await CreditService.getCredits(req.supabase, agent.workspace_id)) : 200\n    });"
    );
    fs.writeFileSync(file, content);
    console.log('Protected agents.ts chat');
} else {
    console.log('agents.ts already protected');
}
