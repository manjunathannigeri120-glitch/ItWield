const fs = require('fs');
let code = fs.readFileSync('backend/src/api/workspaces.ts', 'utf8');

const replacement = `    const supabase = req.supabase!;
    // Custom execution for EXTERNAL_COMMUNICATION (CRM Outreach)
    if (updated.action === 'EXTERNAL_COMMUNICATION' && updated.payload && updated.payload.opportunity_id) {
       const oppId = updated.payload.opportunity_id;
       const { data: opp } = await supabase.from('opportunities').select('*').eq('id', oppId).single();
       if (opp && opp.outreach_draft) {
          const { SendEmailAction } = require('../workflows/actions/SendEmailAction');
          const emailAction = new SendEmailAction();
          
          try {
             const result = await emailAction.execute({
                to: opp.outreach_draft.recipient,
                subject: opp.outreach_draft.subject,
                text: opp.outreach_draft.body
             }, { supabase, runId: '', userId, workspaceId, attempt: 1 });

             if (result.success) {
                await supabase.from('opportunities').update({ stage: 'CONTACTED', outreach_status: 'SENT' }).eq('id', oppId);
                await supabase.from('approvals').update({
                  status: 'COMPLETED',
                  execution_completed_at: new Date().toISOString(),
                  execution_result: result
                }).eq('id', approvalId);
                await require('../services/CompanyMemoryService').CompanyMemoryService.recordOutcome(workspaceId, 'Outreach Sent', \`Successfully sent outreach to \${opp.company_name}\`, oppId, 'SYSTEM', supabase);
             } else {
                throw new Error(result.error?.message || 'Send failed');
             }
          } catch (e: any) {
             await supabase.from('opportunities').update({ outreach_status: 'FAILED' }).eq('id', oppId);
             await supabase.from('approvals').update({
                status: 'FAILED',
                execution_completed_at: new Date().toISOString(),
                execution_error: e.message
             }).eq('id', approvalId);
             await require('../services/CompanyMemoryService').CompanyMemoryService.recordOutcome(workspaceId, 'Outreach Failed', \`Failed to send outreach to \${opp.company_name}\`, oppId, 'SYSTEM', supabase);
          }
       }
    } else {
      // Mock execution completion since there's no real backend execution queue for these tasks yet
      setTimeout(async () => {
        await supabase.from('approvals').update({
          status: 'COMPLETED',
          execution_completed_at: new Date().toISOString(),
          execution_result: { message: 'Execution simulated successfully' }
        }).eq('id', approvalId);

        await supabase.from('task_events').insert({
          workspace_id: workspaceId,
          event_type: 'APPROVAL_EXECUTION_COMPLETED',
          details: { action: updated.action, actor: userId }
        });
      }, 100);
    }`;

code = code.replace(/    const supabase = req\.supabase!;[\s\S]*?\}, 100\);/, replacement);
fs.writeFileSync('backend/src/api/workspaces.ts', code);
