export class IntelligenceService {
  /**
   * Generates a snapshot of the current company state based on recent events and task statuses.
   */
  static async generateSnapshot(supabase: any, workspaceId: string) {
    // Operations: Gather recent tasks
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('id, status, error, title, created_at, workflow_run_id')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Workforce: Agents
    const { data: agents } = await supabase
      .from('agents')
      .select('id, status')
      .eq('workspace_id', workspaceId);

    // Incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .neq('status', 'RESOLVED');

    // Competitors
    const { data: competitors } = await supabase
      .from('competitors')
      .select('id, name, website, monitoring_enabled')
      .eq('workspace_id', workspaceId)
      .eq('monitoring_enabled', true);

    // Unprocessed Observations
    const { data: observations } = await supabase
      .from('competitor_observations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('processed', false);

    // Improvement Proposals
    const { data: allProposals } = await supabase
      .from('improvement_proposals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(50);

    const activeProposals = allProposals?.filter((p: any) => !['COMPLETED', 'REJECTED', 'ROLLED_BACK'].includes(p.state)) || [];
    const completedProposals = allProposals?.filter((p: any) => ['COMPLETED', 'REJECTED', 'ROLLED_BACK'].includes(p.state)) || [];

    const total_agents = agents?.length || 0;
    const working = agents?.filter((a: any) => a.status === 'working').length || 0;
    const blocked_agents = agents?.filter((a: any) => a.status === 'blocked').length || 0;
    const idle = total_agents - working - blocked_agents;

    const snapshot = {
      generated_at: new Date().toISOString(),
      workspace_id: workspaceId,
      operations: {
        total_recent_tasks: recentTasks?.length || 0,
        failed_tasks: recentTasks?.filter((t: any) => t.status === 'FAILED').length || 0,
        blocked_tasks: recentTasks?.filter((t: any) => t.status === 'BLOCKED').length || 0,
        escalated_tasks: recentTasks?.filter((t: any) => t.status === 'ESCALATED').length || 0,
      },
      workforce: {
        total_agents,
        working,
        idle,
        blocked_agents,
      },
      incidents: incidents || [],
      competitive: {
        monitored_competitors: competitors?.length || 0,
        unprocessed_observations: observations || [],
        active_proposals: activeProposals,
        completed_proposals: completedProposals
      },
      raw_tasks: recentTasks || []
    };

    return snapshot;
  }

  /**
   * Deterministically finds anomalies in the snapshot and returns a list of incident objects to create/update.
   */
  static detectAnomalies(snapshot: any) {
    const newAnomalies: any[] = [];
    const tasks = snapshot.raw_tasks || [];

    // Rule 1: 3 consecutive failures of the SAME task title (representing repeated failure)
    const taskFailuresByTitle = tasks.reduce((acc: any, t: any) => {
      if (!acc[t.title]) acc[t.title] = [];
      acc[t.title].push(t);
      return acc;
    }, {});

    for (const [title, group] of Object.entries(taskFailuresByTitle)) {
      const g = group as any[];
      if (g.length >= 3) {
        const last3 = g.slice(0, 3);
        if (last3.every(t => t.status === 'FAILED' || t.status === 'ESCALATED')) {
          newAnomalies.push({
            type: 'REPEATED_TASK_FAILURE',
            title: `Repeated failures for: ${title}`,
            severity: 'high',
            description: `The task "${title}" has failed or escalated 3 consecutive times recently.`
          });
        }
      }
    }

    // Rule 2: Blocked tasks
    const blocked = tasks.filter((t: any) => t.status === 'BLOCKED');
    if (blocked.length > 0) {
      newAnomalies.push({
        type: 'TASKS_BLOCKED',
        title: `Tasks are blocked`,
        severity: 'medium',
        description: `${blocked.length} task(s) are currently blocked due to missing capabilities or agent issues.`
      });
    }

    // Rule 3: Blocked agents
    if (snapshot.workforce.blocked_agents > 0) {
      newAnomalies.push({
        type: 'WORKER_BLOCKED',
        title: `Workers blocked`,
        severity: 'high',
        description: `${snapshot.workforce.blocked_agents} worker(s) are in a blocked state.`
      });
    }

    // Rule 4: Unprocessed competitor observations
    if (snapshot.competitive?.unprocessed_observations?.length > 0) {
      newAnomalies.push({
        type: 'NEW_COMPETITOR_OBSERVATION',
        title: `${snapshot.competitive.unprocessed_observations.length} new competitor observation(s)`,
        severity: 'low',
        description: 'New competitive information detected.'
      });
    }

    return newAnomalies;
  }

  static async syncIncidents(supabase: any, workspaceId: string, detectedAnomalies: any[], existingIncidents: any[]) {
    const activeTypes = new Set(detectedAnomalies.map(a => a.type));
    let incidentsChanged = false;

    // Auto-resolve incidents that are no longer detected
    for (const inc of existingIncidents) {
      if (!activeTypes.has(inc.type) && inc.status !== 'RESOLVED') {
        await supabase.from('incidents').update({ 
          status: 'RESOLVED',
          resolved_at: new Date().toISOString()
        }).eq('id', inc.id);
        incidentsChanged = true;
      }
    }

    // Create new incidents
    const existingTypes = new Set(existingIncidents.filter(i => i.status !== 'RESOLVED').map(i => i.type));
    for (const anomaly of detectedAnomalies) {
      if (anomaly.type === 'NEW_COMPETITOR_OBSERVATION') {
        incidentsChanged = true;
        continue; // This just forces the CEO to wake up, it's not a normal incident
      }

      if (!existingTypes.has(anomaly.type)) {
        await supabase.from('incidents').insert({
          workspace_id: workspaceId,
          type: anomaly.type,
          severity: anomaly.severity,
          status: 'DETECTED',
          title: anomaly.title,
          description: anomaly.description,
          source: 'System Intelligence'
        });
        incidentsChanged = true;
      }
    }

    return incidentsChanged;
  }
}
