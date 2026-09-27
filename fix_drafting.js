const fs = require('fs');
let code = fs.readFileSync('backend/src/workflows/actions/OutreachDraftingAction.ts', 'utf8');

const replacement = `        await supabase.from('opportunities').update({
           stage: 'OUTREACH_DRAFTED',
           outreach_draft: {
             ...draft,
             generated_at: new Date().toISOString()
           },
           contact_email: opp.contact_email || draft.recipient
        }).eq('id', opp.id);

        await supabase.from('approvals').insert({
           workspace_id: workspaceId,
           action: 'EXTERNAL_COMMUNICATION',
           title: 'Send Outreach: ' + opp.company_name,
           reason: draft.reason_for_contact || 'Drafted personalized outreach',
           requested_by_executive: 'AI CMO',
           risk_level: 'high',
           status: 'PENDING_APPROVAL',
           expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
           payload: { opportunity_id: opp.id, draft }
        });

        draftedCount++;`;

code = code.replace(/        await supabase\.from\('opportunities'\)\.update\(\{[\s\S]*?\}\)\.eq\('id', opp\.id\);\s*draftedCount\+\+;/, replacement);
fs.writeFileSync('backend/src/workflows/actions/OutreachDraftingAction.ts', code);
