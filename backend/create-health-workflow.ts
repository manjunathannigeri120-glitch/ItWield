import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function run() {
  const workspaceId = '00000000-0000-0000-0000-000000000000';
  
  const definition = {
    startNode: 'node_1',
    nodes: [
      {
        id: 'node_1',
        type: 'action_http',
        config: {
          url: 'https://httpbin.org/status/500',
          method: 'GET'
        },
        next: []
      }
    ]
  };

  const { data: wf, error: e1 } = await supabase.from('workflows').insert({
    workspace_id: workspaceId,
    name: 'Failing Health Check',
    status: 'active',
    definition
  }).select().single();
  
  if (e1) { console.error('WF Error', e1); return; }

  console.log('Created Failing Workflow:', wf.id);
}

run();
