require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.OPENROUTER_API_KEY = ''; 

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { ActionRegistry } = require('./dist/workflows/actions/ActionRegistry');
const { TransformDataAction } = require('./dist/workflows/actions/TransformDataAction');
ActionRegistry.register(new TransformDataAction());

const { CEOService } = require('./dist/services/CEOService');

async function fixAndTick() {
  const wsId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
  const missionId = 'e6162ef5-6253-480c-b7f5-b45f582e474f';
  
  // 1. Delete the failed/blocked tasks
  console.log("Deleting old tasks...");
  await supabase.from('tasks').delete().eq('mission_id', missionId);
  
  // 2. Set step back to READY
  console.log("Resetting mission step to READY...");
  const { data: plans } = await supabase.from('mission_plans').select('id').eq('mission_id', missionId).eq('status', 'ACTIVE');
  if (plans && plans.length > 0) {
    await supabase.from('mission_plan_steps').update({ status: 'READY' }).eq('plan_id', plans[0].id).in('status', ['RUNNING', 'FAILED']);
  }
  
  // 3. Clear incidents
  await supabase.from('incidents').delete().eq('workspace_id', wsId).eq('type', 'PROVIDER_RATE_LIMIT');
  
  // 4. Tick
  console.log("Triggering CEOService.observeWorkspace...");
  await CEOService.observeWorkspace(supabase, wsId);
  console.log("observeWorkspace completed.");
}

fixAndTick().catch(console.error);
