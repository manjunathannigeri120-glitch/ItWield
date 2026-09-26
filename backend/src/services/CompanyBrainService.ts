import { SupabaseClient } from '@supabase/supabase-js';

export interface BrainDataNode<T> {
  value: T | null;
  state: 'VERIFIED' | 'INFERRED' | 'MISSING' | 'STALE' | 'UNAVAILABLE';
  lastVerified?: string;
  source?: string;
}

export interface CompanyBrain {
  workspaceId: string;
  identity: {
    name: string;
  };
  strategicGoals: any[];
  activeMissions: any[];
  metrics: Record<string, BrainDataNode<number>>;
  dataSources: any[];
  bottlenecks: any[];
  incidents: any[];
  blockers: any[];
  executiveResponsibilities: any[];
  workerCapabilities: any[];
  recentDecisions: any[];
  recentLessons: any[];
  recentOutcomes: any[];
}

export class CompanyBrainService {
  static async getCanonicalBrain(supabase: SupabaseClient, workspaceId: string): Promise<CompanyBrain> {
    const { data: company } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single();
    
    // Fetch parallel required states
    const [
      goalsRes, missionsRes, registryRes, bottlenecksRes, 
      incidentsRes, agentsRes, memoryRes
    ] = await Promise.all([
      supabase.from('business_goals').select('*').eq('workspace_id', workspaceId).in('status', ['ACTIVE', 'STALLED']),
      supabase.from('business_missions').select('*, mission_plans(*, mission_plan_steps(*)), mission_progress(*)').eq('workspace_id', workspaceId).in('status', ['ACTIVE', 'BLOCKED', 'PAUSED']),
      supabase.from('business_data_registry').select('*').eq('workspace_id', workspaceId),
      supabase.from('business_bottlenecks').select('*').eq('workspace_id', workspaceId).in('status', ['DETECTED', 'RESOLVING']),
      supabase.from('incidents').select('*').eq('workspace_id', workspaceId).in('status', ['NEW', 'ACTIVE', 'BLOCKED']),
      supabase.from('agents').select('*').eq('workspace_id', workspaceId),
      supabase.from('company_memory').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(100)
    ]);

    const goals = goalsRes.data || [];
    const missions = missionsRes.data || [];
    const registry = registryRes.data || [];
    const bottlenecks = bottlenecksRes.data || [];
    const incidents = incidentsRes.data || [];
    const agents = agentsRes.data || [];
    const memories = memoryRes.data || [];

    // Filter memory categories
    const recentDecisions = memories.filter((m: any) => m.category === 'DECISION').slice(0, 10);
    const recentLessons = memories.filter((m: any) => m.category === 'LESSON').slice(0, 10);
    const recentOutcomes = memories.filter((m: any) => m.category === 'OUTCOME').slice(0, 10);

    // Executives vs Workers
    const executives = agents.filter((a: any) => ['CEO', 'CTO', 'CMO', 'CFO', 'COO'].includes(a.role));
    const workers = agents.filter((a: any) => !['CEO', 'CTO', 'CMO', 'CFO', 'COO'].includes(a.role));

    // Consolidate Active Blockers from Missions and Incidents
    const blockers = [];
    for (const m of missions) {
      if (m.status === 'BLOCKED') {
        blockers.push({ type: 'MISSION_BLOCKED', missionId: m.id, objective: m.objective, details: 'Mission execution is blocked.' });
      }
    }
    for (const i of incidents) {
      if (i.type === 'PROVIDER_RATE_LIMIT' || i.status === 'BLOCKED') {
        blockers.push({ type: 'INCIDENT_BLOCKER', incidentId: i.id, details: i.title });
      }
    }

    // Build Data Metrics Nodes
    const metrics: Record<string, BrainDataNode<number>> = {};
    
    // Revenue Metric Check
    const revSource = registry.find((r: any) => r.domain === 'REVENUE');
    if (!revSource) {
      metrics['REVENUE'] = { value: null, state: 'MISSING', source: 'None' };
    } else if (revSource.availability !== 'AVAILABLE') {
      metrics['REVENUE'] = { value: null, state: 'UNAVAILABLE', source: revSource.source };
    } else {
      const isStale = new Date(revSource.last_synced).getTime() < Date.now() - 24 * 60 * 60 * 1000;
      metrics['REVENUE'] = {
        value: revSource.schema_info?.current_value || 0,
        state: isStale ? 'STALE' : (revSource.data_quality === 'VERIFIED' ? 'VERIFIED' : 'INFERRED'),
        lastVerified: revSource.last_synced,
        source: revSource.source
      };
    }

    // Customers Metric Check
    const custSource = registry.find((r: any) => r.domain === 'CUSTOMERS');
    if (!custSource) {
      metrics['CUSTOMERS'] = { value: null, state: 'MISSING', source: 'None' };
    } else if (custSource.availability !== 'AVAILABLE') {
      metrics['CUSTOMERS'] = { value: null, state: 'UNAVAILABLE', source: custSource.source };
    } else {
      const isStale = new Date(custSource.last_synced).getTime() < Date.now() - 24 * 60 * 60 * 1000;
      metrics['CUSTOMERS'] = {
        value: custSource.schema_info?.current_count || 0,
        state: isStale ? 'STALE' : (custSource.data_quality === 'VERIFIED' ? 'VERIFIED' : 'INFERRED'),
        lastVerified: custSource.last_synced,
        source: custSource.source
      };
    }

    return {
      workspaceId,
      identity: { name: company?.name || 'Unknown Company' },
      strategicGoals: goals,
      activeMissions: missions,
      metrics,
      dataSources: registry,
      bottlenecks,
      incidents,
      blockers,
      executiveResponsibilities: executives,
      workerCapabilities: workers.map((w: any) => ({ name: w.name, role: w.role, capabilities: w.capabilities })),
      recentDecisions,
      recentLessons,
      recentOutcomes
    };
  }
}
