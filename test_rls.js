const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'backend/.env' });

const { createClient } = require('@supabase/supabase-js');
const token = jwt.sign({ sub: '2818b020-0ae5-4be9-966e-906ec3bf0852', role: 'authenticated' }, process.env.SUPABASE_ANON_KEY || 'mock', { noTimestamp: true });

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
});

s.from('business_goals').insert({
    workspace_id: '6b154cfb-d1ed-4880-ad44-2162c59167cd',
    raw_input: 'test',
    objective: 'test',
    status: 'ACTIVE'
}).then(r => console.log('Goals:', r.status, r.error)).catch(e => console.error(e));

s.from('decision_traces').insert({
    workspace_id: '6b154cfb-d1ed-4880-ad44-2162c59167cd',
    event_name: 'test'
}).then(r => console.log('Traces:', r.status, r.error)).catch(e => console.error(e));

s.from('approvals').update({
    status: 'APPROVED'
}).eq('id', '241412a0-dc3d-41a9-aaf9-e1d1ccb248a1').then(r => console.log('Approvals:', r.status, r.error)).catch(e => console.error(e));

