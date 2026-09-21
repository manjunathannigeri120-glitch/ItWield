import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function runTests() {
  let passed = true;
  console.log('--- STARTING VERIFICATION ---');
  
  try {
    const { data: user, error: uErr } = await supabase.auth.admin.createUser({
      email: 'test_user_' + Date.now() + '@example.com',
      password: 'password123',
      email_confirm: true
    });
    if (uErr) throw uErr;
    const userId = user.user.id;

    const { data: ws1, error: w1Err } = await supabase.from('workspaces').insert({ name: 'WS1', owner_id: userId }).select().single();
    const { data: ws2, error: w2Err } = await supabase.from('workspaces').insert({ name: 'WS2', owner_id: userId }).select().single();

    const { data: agent1, error: a1Err } = await supabase.from('agents').insert({ workspace_id: ws1.id, name: 'A1' }).select().single();
    if (a1Err) console.error('a1Err', a1Err);

    const { data: agent2, error: a2Err } = await supabase.from('agents').insert({ workspace_id: ws2.id, name: 'A2' }).select().single();
    if (a2Err) console.error('a2Err', a2Err);

    console.log('8. Testing cross-workspace manager trigger...');
    const { error: crossMgrErr } = await supabase.from('agents').update({ manager_id: agent2.id }).eq('id', agent1.id);
    if (!crossMgrErr || !crossMgrErr.message.includes('same workspace')) {
       console.error('FAIL: Allowed cross-workspace manager or got wrong error:', crossMgrErr);
       passed = false;
    } else {
       console.log('PASS crossMgrErr', crossMgrErr.message);
    }

    console.log('9. Testing task status CHECK constraint...');
    const { error: checkErr } = await supabase.from('tasks').insert({ workspace_id: ws1.id, title: 'T1', status: 'INVALID_STATUS' });
    if (!checkErr || !checkErr.message.includes('violates check constraint')) {
       console.error('FAIL: Allowed invalid status or got wrong error:', checkErr);
       passed = false;
    } else {
       console.log('PASS checkErr', checkErr.message);
    }

    console.log('7. Testing cross-workspace agent assignment...');
    const { error: crossAgentErr } = await supabase.from('tasks').insert({ workspace_id: ws1.id, title: 'T1', assigned_agent_id: agent2.id });
    if (!crossAgentErr || !crossAgentErr.message.includes('same workspace')) {
       console.error('FAIL: Allowed cross-workspace agent or got wrong error:', crossAgentErr);
       passed = false;
    } else {
       console.log('PASS crossAgentErr', crossAgentErr.message);
    }

    console.log('11. Testing valid task creation...');
    const { data: task, error: tErr } = await supabase.from('tasks').insert({ workspace_id: ws1.id, title: 'Valid Task', assigned_agent_id: agent1.id }).select().single();
    if (tErr) console.error('tErr', tErr);
    
    const { data: evt, error: eErr } = await supabase.from('task_events').insert({ task_id: task.id, workspace_id: ws1.id, event_type: 'TASK_CREATED' }).select().single();
    if (eErr) console.error('eErr', eErr);
    
    console.log('10. Testing task_events immutability...');
    const { error: updEvtErr } = await supabase.from('task_events').update({ event_type: 'HACKED' }).eq('id', evt.id);
    if (!updEvtErr || !updEvtErr.message.includes('cannot be modified')) {
       console.error('FAIL: Allowed event update or got wrong error:', updEvtErr);
       passed = false;
    } else {
       console.log('PASS updEvtErr', updEvtErr.message);
    }

    const { error: delEvtErr } = await supabase.from('task_events').delete().eq('id', evt.id);
    if (!delEvtErr || !delEvtErr.message.includes('cannot be modified')) {
       console.error('FAIL: Allowed event deletion or got wrong error:', delEvtErr);
       passed = false;
    } else {
       console.log('PASS delEvtErr', delEvtErr.message);
    }

    // Clean up
    await supabase.from('workspaces').delete().in('id', [ws1.id, ws2.id]);
    await supabase.auth.admin.deleteUser(userId);

    if (passed) console.log('ALL DB TESTS PASSED');
    else console.error('SOME DB TESTS FAILED');
    
  } catch(e) {
    console.error('ERROR RUNNING TESTS', e);
  }
}
runTests();
