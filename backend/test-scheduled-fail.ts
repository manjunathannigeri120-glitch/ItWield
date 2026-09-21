import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const workspaceId = '00000000-0000-0000-0000-000000000000';

async function run() {
  console.log('Testing Scheduled Failing Execution...');
  
  const definition = {
    startNode: 'node_trigger',
    nodes: [
      {
        id: 'node_trigger',
        type: 'trigger_schedule',
        config: { cron: '* * * * *' },
        next: ['node_1']
      },
      {
        id: 'node_1',
        type: 'action_http',
        config: { url: 'https://httpbin.org/status/500', method: 'GET' },
        next: []
      }
    ]
  };

  const { data: wf, error: e1 } = await supabase.from('workflows').insert({
    workspace_id: workspaceId,
    name: 'Scheduled Failure Check',
    status: 'active',
    definition,
    next_run_at: new Date(Date.now() - 10000).toISOString()
  }).select().single();
  
  if (e1) { console.error('WF Error', e1); return; }
  console.log('Created Scheduled Workflow:', wf.id);

  // Trigger scheduler tick
  const headers = { Authorization: \Bearer \\ };
  const { data } = await axios.post('http://127.0.0.1:3000/api/v1/scheduler/tick', {}, { headers });
  console.log('Scheduler Tick Result:', data);
}
run();
