import { SupabaseClient } from '@supabase/supabase-js';

export interface ActionContext {
  supabase: SupabaseClient | null;
  runId: string;
  userId: string;
  workspaceId: string;
  attempt: number;
}

export interface Action {
  id: string;
  execute(config: any, context: ActionContext): Promise<any>;
}
