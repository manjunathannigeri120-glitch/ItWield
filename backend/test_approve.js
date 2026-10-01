const { createClient } = require('@supabase/supabase-js');
const AuthorizationRegistry = require('./src/services/AuthorizationRegistry').AuthorizationRegistry;
const CompanyMemoryService = require('./src/services/CompanyMemoryService').CompanyMemoryService;
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testApprove() {
    try {
        const workspaceId = '6b154cfb-d1ed-4880-ad44-2162c59167cd'; // user's workspace
        const approvalId = '241412a0-dc3d-41a9-aaf9-e1d1ccb248a1'; // random from my test
        const userId = '2818b020-0ae5-4be9-966e-906ec3bf0852'; // mock user

        console.log("Mocking the approve route...");
        const { data: approval, error: fetchErr } = await supabase
            .from('approvals')
            .select('*')
            .eq('id', approvalId)
            .single();

        if (fetchErr) throw fetchErr;

        console.log("Fetched approval:", approval.id);
        
        // Simulating the update
        approval.status = 'APPROVED';
        const updated = approval;

        console.log("Calling CompanyMemoryService.recordDecision...");
        await CompanyMemoryService.recordDecision(workspaceId, `Owner approved ${updated.action}`, `Owner approved ${updated.action} for ${updated.title}.`, String(approvalId), 'OWNER', undefined, supabase);

        console.log("Calling AuthorizationRegistry.authorize...");
        const authResult = AuthorizationRegistry.authorize(updated.action, {});
        
        let canExecute = false;
        let blockReason = '';

        if (authResult.authorized) {
           canExecute = true; // safe action? 
        } else if (authResult.requiresApproval) {
           canExecute = true; // it requires approval, and we just approved it
        } else {
           canExecute = false;
           blockReason = authResult.reason;
        }

        console.log("Can execute?", canExecute, blockReason);
        
        if (!canExecute) {
            console.log("Blocked.");
            return;
        }

        console.log("Updating to EXECUTING...");
        
        console.log("Done.");
    } catch (e) {
        console.error("Caught error:", e);
    }
}

testApprove();
