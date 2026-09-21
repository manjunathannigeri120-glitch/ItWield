import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function testCEO() {
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'admin@itwield.com',
    password: 'Password123!'
  });
  
  if (error) throw error;
  
  try {
    console.log('Creating worker...');
    const agentRes = await axios.post('http://127.0.0.1:3000/api/v1/agents/workspace/00000000-0000-0000-0000-000000000000', {
      name: 'Application Monitor',
      description: 'Monitor application health and identify issues that require attention.',
      system_prompt: 'Investigate application health and report abnormal conditions.',
      capabilities: {
        role: 'Monitoring Specialist',
        features: ['monitoring', 'health_checks', 'error_detection', 'incident_reporting'],
        permissions: [],
        tools: [],
        memory: {}
      }
    }, {
      headers: { Authorization: 'Bearer ' + session!.access_token }
    });
    console.log('AGENT CREATED:', agentRes.data.id);

    console.log('Running CEO...');
    const res = await axios.post('http://127.0.0.1:3000/api/v1/ceo/run', {
      workspace_id: '00000000-0000-0000-0000-000000000000',
      objective: 'Keep my application healthy'
    }, {
      headers: { Authorization: 'Bearer ' + session!.access_token }
    });
    console.log('CEO RUN SUCCESS!');
    console.log(JSON.stringify(res.data, null, 2));

    console.log('Checking agents status...');
    const checkAgent = await axios.get('http://127.0.0.1:3000/api/v1/agents/workspace/00000000-0000-0000-0000-000000000000', {
      headers: { Authorization: 'Bearer ' + session!.access_token }
    });
    console.log('AGENT:', JSON.stringify(checkAgent.data[0], null, 2));
    
  } catch (e: any) {
    console.error('ERROR:', e.response?.data || e.message);
  }
}

testCEO();
