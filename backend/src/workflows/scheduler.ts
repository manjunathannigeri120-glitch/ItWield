import { getServiceSupabase } from '../db/supabaseClient';
import { WorkflowEngine } from './engine';
import { CEOService } from '../services/CEOService';

let schedulerInterval: NodeJS.Timeout | null = null;

export function calculateNextRunAt(definition: any, status: string): string | null {
  if (status !== 'active') return null;
  const trigger = definition.nodes?.find((n: any) => n.type === 'trigger_schedule');
  if (!trigger || !trigger.config?.cron) return null;
  
  try {
    // Basic schedule simulation for demo: always add 1 minute
    return new Date(Date.now() + 60000).toISOString();
  } catch (err) {
    console.error('calculateNextRunAt error:', err);
    return null;
  }
}

export function startScheduler() {
  console.log('[Scheduler] Internal polling disabled. Please configure an external cron job to hit POST /api/v1/scheduler/tick');
}

export function stopScheduler() {
  console.log('[Scheduler] Stopped');
}
