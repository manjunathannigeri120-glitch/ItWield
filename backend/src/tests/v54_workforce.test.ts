import { describe, it, expect, vi } from 'vitest';
import { WorkerAssignmentService } from '../services/WorkerAssignmentService';

vi.mock('../services/ControlLayerService', () => {
    return {
        ControlLayerService: {
            evaluateAction: vi.fn().mockResolvedValue({ status: 'APPROVAL_REQUIRED', reason: 'High risk' })
        }
    };
});

describe('V5.4 AI Workforce', () => {

    describe('Worker Assignment', () => {
        it('assigns task to highest scored worker that matches capabilities and workload', async () => {
            const workers = [
                { id: 'w1', workspace_id: 'ws-1', status: 'AVAILABLE', max_concurrent_tasks: 2, current_workload: 0, authority_level: 'LOW', capabilities: ['marketing'] },
                { id: 'w2', workspace_id: 'ws-1', status: 'AVAILABLE', max_concurrent_tasks: 2, current_workload: 2, authority_level: 'HIGH', capabilities: ['marketing'] },
                { id: 'w3', workspace_id: 'ws-1', status: 'AVAILABLE', max_concurrent_tasks: 2, current_workload: 0, authority_level: 'HIGH', capabilities: ['engineering'] }
            ];
            
            // Simpler mock
            const mockSupabase = {
                from: vi.fn((table) => {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        update: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: 'task-1' }, error: null }),
                        then: (cb: any) => cb({ data: table === 'agents' ? workers : null, error: null })
                    };
                })
            } as any;
            
            const res = await WorkerAssignmentService.assignTask('task-1', {
                workspaceId: 'ws-1',
                requiredCapabilities: ['marketing'],
                authorityRequired: 'LOW'
            }, mockSupabase);
            
            console.log(res);
            expect(res.success).toBe(true);
            expect(res.workerId).toBe('w1');
        });
    });
    
    describe('Worker Execution with Control Layer', () => {
        it('transitions task to WAITING_FOR_APPROVAL if Control Layer dictates', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', required_tools: ['prod_deploy'], agents: { id: 'w1', name: 'CTO', current_workload: 1 } };
             
             const mockSupabase = {
                from: vi.fn((table) => {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        update: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: task })
                    };
                })
             } as any;
             
             const { WorkerExecutionService: WES } = await import('../services/WorkerExecutionService');
             
             const res = await WES.executeTask('task-1', mockSupabase);
             expect(res.status).toBe('WAITING_FOR_APPROVAL');
             expect(res.reason).toBe('High risk');
        });
    });

});
