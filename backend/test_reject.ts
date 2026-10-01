import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
(async () => {
    // 1. Fetch approval
    const { data: approval, error: fetchErr } = await supabase
      .from('approvals')
      .select('*')
      .limit(1)
      .single();

    console.log('Approval:', approval.id);

    const { data: updated, error: updateErr } = await supabase
      .from('approvals')
      .update({
        status: 'REJECTED',
        resolved_at: new Date().toISOString(),
        resolution_reason: 'Owner rejected request'
      })
      .eq('id', approval.id)
      .eq('status', 'PENDING_APPROVAL')
      .select()
      .single();
      
    if (updateErr) {
       console.log('Update Error:', updateErr);
    } else {
       console.log('Updated:', updated);
    }

})();
