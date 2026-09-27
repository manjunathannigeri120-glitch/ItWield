import { SupabaseClient } from '@supabase/supabase-js';
import { AICOOService } from './AICOOService';

export class COOService {
  static async executeOperationalReview(supabase: SupabaseClient, workspaceId: string): Promise<any> {
    return AICOOService.operateCompany(supabase, workspaceId);
  }
}
