import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const workspaceId = '00000000-0000-0000-0000-000000000000';

async function run() {
  console.log('Testing Scheduler Endpoint...');
  try {
    // 1. Unauthenticated request
    try {
      await axios.post('http://127.0.0.1:3000/api/v1/scheduler/tick', {});
      console.error('FAIL: Unauthenticated request succeeded');
    } catch (e: any) {
      if (e.response?.status === 401) console.log('PASS: Unauthenticated rejected');
      else console.error('FAIL: Unexpected unauthenticated status', e.response?.status);
    }

    // 2. Authenticated request
    const headers = { Authorization: `Bearer ${process.env.SCHEDULER_SECRET || 'dev-secret'}` };
    const { data } = await axios.post('http://127.0.0.1:3000/api/v1/scheduler/tick', {}, { headers });
    console.log('Scheduler Tick Result:', data);

  } catch (e: any) {
    console.error(e.response?.data || e.message);
  }
}
run();
