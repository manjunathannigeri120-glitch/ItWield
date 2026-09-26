import { SupabaseClient } from '@supabase/supabase-js';
import { CompanyState } from './CompanyStateService';
import { WorkforceIntegrityService } from './WorkforceIntegrityService';

export class ManagementIntelligenceService {
    
    /**
     * Detects, deduplicates, and persists management items deterministically.
     */
    static async detectAndPrioritize(supabase: SupabaseClient, workspaceId: string, state: CompanyState): Promise<void> {
        const detectedItems = [];

        // 1. Detect Provider Incidents (V3.6.1 - Aggregation)
        const providerIncidents = state.incidents.filter(i => i.type === 'PROVIDER_RATE_LIMIT' && (i.status === 'ACTIVE' || i.status === 'NEW'));
        if (providerIncidents.length > 0) {
            // Sort to find first and latest
            const sortedIncidents = providerIncidents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const firstOcc = sortedIncidents[0];
            const latestOcc = sortedIncidents[sortedIncidents.length - 1];
            
            detectedItems.push({
                type: 'TECHNOLOGY', // Changed from RELIABILITY to match V3.6.1 categories
                title: 'AI Provider Availability Degraded',
                description: 'OpenRouter free-model daily quota exhausted or provider unavailable.',
                priority: 'CRITICAL',
                priority_reason: 'Completely blocks company operations and task execution.',
                source: 'INCIDENT',
                fingerprint: `TECHNOLOGY:PROVIDER_RATE_LIMIT:OPENROUTER`,
                evidence: { 
                    occurrences: providerIncidents.length,
                    first_detected: firstOcc.created_at,
                    latest_detected: latestOcc.created_at,
                    incidents: providerIncidents.map(i => i.id) 
                },
                incident_id: latestOcc.id
            });
        }

        // 1b. Detect Duplicate Active Missions (V3.6.1 Phase 2)
        const activeMissions = state.missions.filter(m => m.status === 'ACTIVE');
        const missionObjectives = new Map<string, typeof activeMissions>();
        for (const m of activeMissions) {
            // Normalize: lowercase, remove non-alphanumeric, trim
            const normalized = (m.objective || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!missionObjectives.has(normalized)) missionObjectives.set(normalized, []);
            missionObjectives.get(normalized)!.push(m);
        }

        for (const [norm, duplicates] of missionObjectives.entries()) {
            if (duplicates.length > 1) {
                detectedItems.push({
                    type: 'OPERATIONS',
                    title: 'Duplicate Active Missions Detected',
                    description: `${duplicates.length} active missions appear to represent the exact same objective.`,
                    priority: 'HIGH',
                    priority_reason: 'Wastes resources and creates conflicting execution paths.',
                    source: 'SYSTEM',
                    fingerprint: `OPERATIONS:DUPLICATE_MISSIONS:${norm.substring(0, 30)}`,
                    evidence: { 
                        duplicate_count: duplicates.length,
                        missions: duplicates.map(m => ({ id: m.id, name: m.name, created_at: m.created_at, objective: m.objective }))
                    }
                });
            }
        }

        // 2. Detect Failed Tasks (Part 10 - Deduplication)
        const failedTasks = state.tasks.filter(t => t.status === 'FAILED');
        const groupedFailures = new Map<string, typeof failedTasks>();
        for (const task of failedTasks) {
            // Group by error or title to consolidate identical failures
            const key = task.error ? String(task.error).substring(0, 50) : task.title;
            if (!groupedFailures.has(key)) groupedFailures.set(key, []);
            groupedFailures.get(key)!.push(task);
        }

        for (const [key, tasks] of groupedFailures.entries()) {
            const firstTask = tasks[0];
            const isMultiple = tasks.length > 1;
            detectedItems.push({
                type: 'OPERATIONS',
                title: isMultiple ? `Repeated Task Failure: ${firstTask.title}` : `Task Execution Failure: ${firstTask.title || firstTask.id}`,
                description: isMultiple ? `${tasks.length} consecutive failures detected. Root cause: ${key}` : `A task failed with error: ${firstTask.error}`,
                priority: isMultiple ? 'CRITICAL' : 'HIGH',
                priority_reason: isMultiple ? 'Repeated failures indicate a systemic blocker.' : 'Task failures directly block mission progress.',
                source: 'SYSTEM',
                fingerprint: `OPERATIONS:TASK_FAILURE_GROUP:${key.replace(/[^a-zA-Z0-9]/g, '')}`,
                evidence: { failure_count: tasks.length, tasks: tasks.map(t => t.id), error: key }
            });
        }

        // 3. Detect Pending Approvals
        if (state.pendingApprovals.length > 0) {
            detectedItems.push({
                type: 'OPERATIONS',
                title: 'Pending Owner Approvals Required',
                description: `${state.pendingApprovals.length} actions are waiting for owner approval.`,
                priority: 'MEDIUM',
                priority_reason: 'Workforce is stalled waiting for human intervention.',
                source: 'SYSTEM',
                fingerprint: `OPERATIONS:PENDING_APPROVALS`,
                evidence: { approval_count: state.pendingApprovals.length }
            });
        }

        // 4. Detect CRM Pipeline Gaps (Qualified but no outreach, etc.)
        const qualifiedOpportunities = state.opportunities.filter(o => o.stage === 'QUALIFIED');
        if (qualifiedOpportunities.length > 0) {
            detectedItems.push({
                type: 'BUSINESS',
                title: 'Uncontacted Qualified Prospects',
                description: `${qualifiedOpportunities.length} qualified prospects are waiting for outreach or prioritization.`,
                priority: 'HIGH',
                priority_reason: 'Directly impacts customer acquisition and revenue goals.',
                source: 'SYSTEM',
                fingerprint: `CUSTOMER_GROWTH:UNCONTACTED_QUALIFIED`,
                evidence: { qualified_count: qualifiedOpportunities.length }
            });
        }

        // 5. Detect Workforce Misconfigurations
        const workforceState = await WorkforceIntegrityService.evaluateWorkforceReadiness(supabase, workspaceId);
        for (const worker of workforceState) {
            if (worker.state === 'MISCONFIGURED' || worker.state === 'BLOCKED') {
               detectedItems.push({
                  type: 'OPERATIONS',
                  title: `Workforce Capability Gap: ${worker.name}`,
                  description: worker.reason,
                  priority: 'HIGH',
                  priority_reason: 'A worker is misconfigured or lacks valid capabilities to accept delegated work.',
                  source: 'SYSTEM',
                  fingerprint: `OPERATIONS:WORKFORCE_MISCONFIG:${worker.id}`,
                  evidence: { worker_id: worker.id, reason: worker.reason }
               });
            }
        }

        // Persist and Deduplicate
        for (const item of detectedItems) {
            // Because of the unique index on (workspace_id, fingerprint) where status is active,
            // we can attempt to insert and ignore on conflict.
            const { error } = await supabase.from('management_items').insert({
                workspace_id: workspaceId,
                ...item
            }).select().single();
            if (error && error.code !== '23505') {
                console.error('[ManagementIntelligence] Failed to insert management item:', error);
            }
        }
    }

    /**
     * Gets the highest priority QUEUED or ACTIVE management item for the CEO.
     */
    static async getHighestPriorityItem(supabase: SupabaseClient, workspaceId: string): Promise<any> {
        // Fetch all non-resolved items
        const { data: items, error } = await supabase
            .from('management_items')
            .select('*')
            .eq('workspace_id', workspaceId)
            .in('status', ['QUEUED', 'ANALYZING', 'REVIEW_REQUIRED']);

        if (error || !items || items.length === 0) return null;

        // Custom priority sorting: CRITICAL > HIGH > MEDIUM > LOW
        const weight: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        
        items.sort((a, b) => {
            const wA = weight[a.priority] || 0;
            const wB = weight[b.priority] || 0;
            if (wA !== wB) return wB - wA; // Highest weight first
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Oldest first
        });

        return items[0];
    }
}
