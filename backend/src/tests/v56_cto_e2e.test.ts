import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CTOService } from '../services/CTOService';
import { WorkerAssignmentService } from '../services/WorkerAssignmentService';
import { ControlLayerService } from '../services/ControlLayerService';

describe('V5.6 Autonomous CTO E2E Validation', () => {
    let mockDb: any;
    
    beforeEach(() => {
        mockDb = {
            workspaces: [{ id: 'ws-1', operating_state: 'OPERATING', cto_locked_until: null, cto_status: 'IDLE' }],
            tasks: [
                { id: 'task-orig-1', workspace_id: 'ws-1', title: 'Deploy Website', status: 'FAILED', failure_reason: 'Vercel Timeout' }
            ],
            incidents: [],
            agents: [
                { id: 'agent-1', workspace_id: 'ws-1', status: 'AVAILABLE', current_workload: 0, authority_level: 'AUTONOMOUS', risk_ceiling: 'HIGH' }
            ]
        };

        WorkerAssignmentService.assignTask = vi.fn().mockImplementation(async (taskId, criteria, db) => {
             return { success: true, workerId: 'agent-1' };
        });
        
        ControlLayerService.executeTool = vi.fn().mockImplementation(async (db, req) => {
             return { success: true, executed: true };
        });
    });

    const createMockSupabase = () => {
        return {
            from: vi.fn((table: string) => {
                const chain = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn((col, val) => {
                        chain._filters.push((row: any) => row[col] === val);
                        return chain;
                    }),
                    in: vi.fn((col, vals) => {
                        chain._filters.push((row: any) => vals.includes(row[col]));
                        return chain;
                    }),
                    limit: vi.fn().mockReturnThis(),
                    single: vi.fn().mockImplementation(() => {
                        let rows = mockDb[table] || [];
                        for (const f of chain._filters) rows = rows.filter(f);
                        return Promise.resolve({ data: rows[0] || null });
                    }),
                    insert: vi.fn().mockImplementation((payload) => {
                        const newRow = { id: `new-${table}-${Date.now()}`, ...payload };
                        if (!mockDb[table]) mockDb[table] = [];
                        mockDb[table].push(newRow);
                        return { select: () => ({ single: () => Promise.resolve({ data: newRow }) }) };
                    }),
                    update: vi.fn().mockImplementation((payload) => {
                        let rows = mockDb[table] || [];
                        for (const f of chain._filters) rows = rows.filter(f);
                        for (const row of rows) {
                            Object.assign(row, payload);
                        }
                        return { eq: vi.fn().mockResolvedValue({ data: rows }) };
                    }),
                    then: (cb: any) => {
                        let rows = mockDb[table] || [];
                        for (const f of chain._filters) rows = rows.filter(f);
                        return cb({ data: rows });
                    },
                    _filters: [] as any[]
                };
                return chain;
            })
        } as unknown as any;
    };

    it('PROVE: End-to-End CTO Path', async () => {
        const supabase = createMockSupabase();

        // 1. Detect -> Diagnosed
        await CTOService.operate(supabase, 'ws-1');
        
        let incident = mockDb.incidents[0];
        expect(incident).toBeDefined();
        expect(incident.status).toBe('DIAGNOSED');
        
        // 2. Diagnosed -> Planned
        await CTOService.operate(supabase, 'ws-1');
        incident = mockDb.incidents[0];
        expect(incident.status).toBe('PLANNED');
        expect(incident.affected_resource).toBeDefined();
        
        // 3. Planned -> Fixing (Delegate)
        await CTOService.operate(supabase, 'ws-1');
        incident = mockDb.incidents[0];
        expect(incident.status).toBe('FIXING');
        expect(incident.assigned_worker_id).toBe('agent-1');
    });

    it('PROVE: Incident Diagnosis distinguishes KNOWN_FACT and INFERENCE', async () => {
        const supabase = createMockSupabase();
        await CTOService.operate(supabase, 'ws-1');
        const incident = mockDb.incidents[0];
        
        expect(incident.confirmed_cause).toContain('KNOWN_FACT:');
        expect(incident.suspected_cause).toContain('INFERENCE:');
    });

    it('PROVE: Verification requires actual evidence, no fake success', async () => {
        const supabase = createMockSupabase();
        
        // Tick 1: Detect -> Diagnosed
        await CTOService.operate(supabase, 'ws-1');
        // Tick 2: Diagnosed -> Planned
        await CTOService.operate(supabase, 'ws-1');
        // Tick 3: Planned -> Fixing
        await CTOService.operate(supabase, 'ws-1');

        const incident = mockDb.incidents[0];
        expect(incident.status).toBe('FIXING');
        
        // We simulate task completion.
        const taskId = incident.affected_resource;
        const task = mockDb.tasks.find((t: any) => t.id === taskId);
        task.status = 'COMPLETED';

        // Tick 4: Fixing -> Verify
        await CTOService.operate(supabase, 'ws-1');
        
        // Since ControlLayer mock allows it, it should resolve.
        const updatedIncident = mockDb.incidents.find((i: any) => i.id === incident.id);
        expect(updatedIncident.status).toBe('RESOLVED');
        expect(updatedIncident.resolution).toContain('Verified independently');
    });

    it('PROVE: Emergency Stop', async () => {
        mockDb.workspaces[0].operating_state = 'PAUSED';
        const supabase = createMockSupabase();
        await CTOService.operate(supabase, 'ws-1');
        
        // Incident should not have been created
        expect(mockDb.incidents.length).toBe(0);
    });
});
