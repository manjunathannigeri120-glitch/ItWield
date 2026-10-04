import { CreditService } from '../services/CreditService';
import express from 'express';
import { requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiters';
import { BusinessGoalInterpreter } from '../services/BusinessGoalInterpreter';

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(aiLimiter);

router.post('/', async (req: any, res) => {
    const { workspaceId } = req.params;
    const { message } = req.body;
    const db = req.supabase;
    
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
        // Use BusinessGoalInterpreter to understand the user's chat message
        
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

        const interpretation = await BusinessGoalInterpreter.interpretGoal(db, workspaceId, message, {});
        
        let reply = '';
        
        if (interpretation.intent_type === 'OUTCOME') {
            await BusinessGoalInterpreter.createGoal(db, workspaceId, message, interpretation);
            reply = `Understood. I have created a new business outcome: "${interpretation.objective}". The executive team is planning the execution.`;
        } else if (interpretation.intent_type === 'CONTROL') {
            // Check if it's pause/resume
            const state = interpretation.control_action === 'PAUSE' ? 'PAUSED' : 
                          interpretation.control_action === 'STOP' ? 'STOPPED' : 'OPERATING';
            await db.from('workspaces').update({ status: state }).eq('id', workspaceId);
            reply = `I have updated the company's operating state to ${state}.`;
        } else if (interpretation.intent_type === 'GENERAL' || interpretation.intent_type === 'STATUS_QUERY') {
            // General query - we would ideally ask the CEO agent, but for now we reply based on the interpreter
            reply = `(CEO): Based on my interpretation, you are asking about ${interpretation.scope}. Our objective is: ${interpretation.objective}. We are monitoring this closely.`;
        } else {
            // Catch all for research/analysis
            await BusinessGoalInterpreter.createGoal(db, workspaceId, message, interpretation);
            reply = `I have logged your request for ${interpretation.intent_type}: "${interpretation.objective}". The team will look into it.`;
        }
        
        // Save the chat to some log if necessary (or just return the reply so the frontend can display it)
        res.json({ reply, interpretation, credits: creditCheck.remaining });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
