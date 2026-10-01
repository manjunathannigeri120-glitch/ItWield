import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
(async () => {
   const userRes = await s.from('workspaces').select('owner_id').limit(1);
   const owner_id = userRes.data[0].owner_id;
   const { data, error } = await s.from('workspaces').insert({ owner_id, name: 'TestActivate' }).select().single();
   console.log('Workspace Create:', error || data.id);
   if (data) {
     const workspaceId = data.id;
     
     // Mock the activate logic verbatim
     const { data: ws, error: fetchErr } = await s.from('workspaces').select('status, id, name').eq('id', workspaceId).single();
     if (fetchErr) console.error('fetchErr', fetchErr);
     
     const { error: wsUpdateErr } = await s.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
     if (wsUpdateErr) console.error('wsUpdateErr', wsUpdateErr);
     
     const { data: existingAgents } = await s.from('agents').select('name').eq('workspace_id', workspaceId as string);
     const existingNames = new Set((existingAgents || []).map((a: any) => a.name));
     
     const insertAgent = async (name: string, system_prompt: string, capabilities: any[] = [], managerId: string | null = null) => {
        if (existingNames.has(name)) {
          const { data } = await s.from('agents').select('id').eq('workspace_id', workspaceId as string).eq('name', name).single();
          return data?.id;
        }
        const { data, error } = await s.from('agents').insert({ workspace_id: workspaceId, name, system_prompt, capabilities, status: 'idle', manager_id: managerId }).select('id').single();
        if (error) { console.error('Agent Error', name, error); return null; }
        return data?.id;
      };
      
      const ceoId = await insertAgent('AI CEO', 'Company-wide orchestration', ['delegate', 'report', 'orchestrate']);
      const cooId = await insertAgent('AI COO', 'Company operations and coordination', ['orchestrate_execution', 'manage_dependencies'], ceoId);
      const ctoId = await insertAgent('AI CTO', 'Technical operations', ['monitor_health', 'engineering'], ceoId);
      const cmoId = await insertAgent('AI CMO', 'Competitive intelligence', ['market_signals'], ceoId);
      const cfoId = await insertAgent('AI CFO', 'Financial monitoring', ['financial_alerts'], ceoId);

      const insertWorker = async (name: string, system_prompt: string, managerId: string, capabilities: string[] = []) => {
        if (existingNames.has(name)) return;
        const { error } = await s.from('agents').insert({ workspace_id: workspaceId, name, system_prompt, manager_id: managerId, capabilities, status: 'idle' });
        if (error) console.error('Worker Error', name, error);
      };

      await insertWorker('Application Monitor', 'You monitor the health of the application.', ctoId, ['APPLICATION_MONITORING']);
      await insertWorker('Builder Analyst', 'You research and build new features.', ctoId, ['GITHUB_LIST_REPOSITORIES', 'GITHUB_LIST_ISSUES', 'GITHUB_LIST_PULL_REQUESTS', 'GITHUB_GET_REPOSITORY_ACTIVITY', 'GITHUB_GET_ISSUE', 'GITHUB_GET_PULL_REQUEST', 'DATA_TRANSFORMATION']);
      await insertWorker('Competitor Analyst', 'You analyze competitor movements.', cmoId, ['COMPETITIVE_ANALYSIS', 'WEB_RESEARCH', 'SLACK_LIST_CHANNELS', 'SLACK_READ_CHANNEL', 'SLACK_SEARCH_MESSAGES', 'SLACK_GET_RECENT_ACTIVITY', 'GOOGLE_SHEETS_LIST', 'GOOGLE_SHEETS_READ']);
      await insertWorker('Lead Researcher', 'You research new leads.', cmoId, ['LEAD_RESEARCH', 'WEB_RESEARCH', 'GOOGLE_SHEETS_READ']);

      console.log('Activate Finished');
   }
})();
