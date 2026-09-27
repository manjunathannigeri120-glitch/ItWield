import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'D:/ItWield/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  const { data: missions, error } = await supabase.from('business_missions').select('id, title, status, objective').eq('type', 'GET_CUSTOMERS');
  console.log("Missions:", missions, error);

  if (missions && missions.length > 0) {
    const missionId = missions[0].id;
    console.log("Mission ID:", missionId);

    const { data: plans } = await supabase.from('mission_plans').select('*').eq('mission_id', missionId).eq('status', 'ACTIVE');
    console.log("Active Plan:", plans);

    if (plans && plans.length > 0) {
      const planId = plans[0].id;
      const { data: steps } = await supabase.from('mission_plan_steps').select('*').eq('plan_id', planId).order('step_order');
      console.log("Plan Steps:", steps);
    }

    const { data: tasks } = await supabase.from('tasks').select('*').eq('mission_id', missionId);
    console.log("Tasks:", tasks);
  }
}
inspect();
