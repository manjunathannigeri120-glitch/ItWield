const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

let updateBlock = `      const updateData: any = {
        status: 'APPROVED',
        resolved_at: new Date().toISOString(),
        resolved_by: userId
      };

      if (req.body && req.body.editedContext) {
        updateData.context = { ...(approval.context || {}), ...req.body.editedContext };
      }

      // 2. Concurrency-safe atomic transition to APPROVED
      const { data: updated, error: updateErr } = await req.supabase
        .from('approvals')
        .update(updateData)
        .eq('id', approvalId)
        .eq('status', 'PENDING_APPROVAL')
        .select()
        .single();`;

content = content.replace(/\/\/ 2\. Concurrency-safe atomic transition to APPROVED[\s\S]*?\.single\(\);/, updateBlock);

fs.writeFileSync(file, content);
