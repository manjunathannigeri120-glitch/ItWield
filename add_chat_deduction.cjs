const fs = require('fs');
let file = 'backend/src/api/chat.ts';
let content = fs.readFileSync(file, 'utf8');

const target = "const interpretation = await BusinessGoalInterpreter.interpretGoal(db, workspaceId, message, {});";
const fix = `
        // --- CREDIT ENFORCEMENT BOUNDARY ---
        // Atomically deduct 1 AI credit before calling any external LLM provider
        const creditCheck = await CreditService.deductCredits(db, workspaceId, 1);
        
        if (!creditCheck.allowed) {
            return res.status(402).json({
                error: 'INSUFFICIENT_CREDITS',
                message: 'Insufficient AI credits. Please upgrade your plan to continue.'
            });
        }
        // -----------------------------------

        ` + target;

if (!content.includes('INSUFFICIENT_CREDITS')) {
    content = content.replace(target, fix);
    fs.writeFileSync(file, content);
    console.log('Added AI deduction boundary');
} else {
    console.log('Boundary already exists');
}
