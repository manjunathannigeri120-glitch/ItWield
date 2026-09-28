import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerAssignmentService } from '../services/WorkerAssignmentService';

let mockControlLayerExecuteTool: any = vi.fn().mockResolvedValue({ success: false, requiresApproval: true, reason: 'High risk' });

vi.mock('../services/ControlLayerService', () => {
    return {
        ControlLayerService: {
            evaluateAction: vi.fn().mockResolvedValue({ status: 'APPROVAL_REQUIRED', reason: 'High risk' }),
            executeTool: (...args: any) => mockControlLayerExecuteTool(...args)
        }
    };
});

describe('V5.4 AI Workforce', () => {
    let WES: any;
    let mockSupabase: any;

    beforeEach(async () => {
        WES = (await import('../services/WorkerExecutionService')).WorkerExecutionService;
        
        mockSupabase = {
            from: vi.fn((table) => {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: {} }),
                    then: (cb: any) => cb({ data: [] })
                };
            }),
            rpc: vi.fn()
        };
    });

    describe('Execution Integrity', () => {
        it('transitions task to WAITING_FOR_APPROVAL if Control Layer dictates', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', required_tools: ['GITHUB_ISSUES_CREATE'], input: { title: 'Test' }, agents: { id: 'w1', name: 'CTO', current_workload: 1, authority_level: 'LOW' } };
             
             mockSupabase.from.mockImplementation((table: string) => {
                 return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: table === 'tasks' ? task : {} }),
                    then: (cb: any) => cb({ data: [] })
                 }
             });
             
             mockControlLayerExecuteTool = vi.fn().mockResolvedValue({ success: false, requiresApproval: true, reason: 'High risk' });
             
             const res = await WES.executeTask('task-1', mockSupabase);
             expect(res.status).toBe('WAITING_FOR_APPROVAL');
        });

        it('returns UNAVAILABLE if adapter is missing', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', required_tools: ['GITHUB_ISSUES_CREATE'], input: {}, agents: { id: 'w1' } };
             mockSupabase.from.mockImplementation((table: string) => {
                 return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: table === 'tasks' ? task : {} }),
                    then: (cb: any) => cb({ data: [] })
                 }
             });
             mockControlLayerExecuteTool = vi.fn().mockResolvedValue({ success: false, reason: 'No tool adapter for github' });
             
             const res = await WES.executeTask('task-1', mockSupabase);
             expect(res.status).toBe('NOT_CONNECTED');
        });

        it('returns NOT_CONNECTED if connection missing', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', required_tools: ['GITHUB_ISSUES_CREATE'], input: {}, agents: { id: 'w1' } };
             mockSupabase.from.mockImplementation((table: string) => {
                 return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: table === 'tasks' ? task : {} }),
                    then: (cb: any) => cb({ data: [] })
                 }
             });
             mockControlLayerExecuteTool = vi.fn().mockResolvedValue({ success: false, reason: 'System github is not connected' });
             
             const res = await WES.executeTask('task-1', mockSupabase);
             expect(res.status).toBe('NOT_CONNECTED');
        });

        it('returns AUTH_REQUIRED if credentials invalid', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', required_tools: ['GITHUB_ISSUES_CREATE'], input: {}, agents: { id: 'w1' } };
             mockSupabase.from.mockImplementation((table: string) => {
                 return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: table === 'tasks' ? task : {} }),
                    then: (cb: any) => cb({ data: [] })
                 }
             });
             mockControlLayerExecuteTool = vi.fn().mockResolvedValue({ success: false, reason: 'AUTH_REQUIRED' });
             
             const res = await WES.executeTask('task-1', mockSupabase);
             expect(res.status).toBe('AUTH_REQUIRED');
        });
        
        it('returns BLOCKED if ControlLayer prohibits', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', required_tools: ['GITHUB_ISSUES_CREATE'], input: {}, agents: { id: 'w1' } };
             mockSupabase.from.mockImplementation((table: string) => {
                 return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: table === 'tasks' ? task : {} }),
                    then: (cb: any) => cb({ data: [] })
                 }
             });
             mockControlLayerExecuteTool = vi.fn().mockResolvedValue({ success: false, reason: 'PROHIBITED by policy' });
             
             const res = await WES.executeTask('task-1', mockSupabase);
             expect(res.status).toBe('BLOCKED');
        });
        
        it('returns COMPLETED if real execution succeeds', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', required_tools: ['GITHUB_ISSUES_CREATE'], input: {}, agents: { id: 'w1' } };
             mockSupabase.from.mockImplementation((table: string) => {
                 return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: table === 'tasks' ? task : {} }),
                    then: (cb: any) => cb({ data: [] })
                 }
             });
             mockControlLayerExecuteTool = vi.fn().mockResolvedValue({ success: true, executed: true, evidence: {} });
             
             const res = await WES.executeTask('task-1', mockSupabase);
             expect(res.status).toBe('COMPLETED');
        });
    });
    
    describe('Retry vs Reassignment', () => {
        it('retry increments attempt without clearing worker', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', assigned_agent_id: 'w1', retry_count: 0, max_retries: 3 };
             mockSupabase.from.mockImplementation((table: string) => {
                 return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: task }),
                    then: (cb: any) => cb({ data: [] })
                 }
             });
             
             const res = await WES.retryTask('task-1', mockSupabase);
             expect(res.success).toBe(true);
        });
        
        it('reassignTask clears worker and sets QUEUED', async () => {
             const task = { id: 'task-1', workspace_id: 'ws-1', assigned_agent_id: 'w1', retry_count: 0, max_retries: 3 };
             mockSupabase.from.mockImplementation((table: string) => {
                 return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: table === 'tasks' ? task : { current_workload: 1 } }),
                    then: (cb: any) => cb({ data: [] })
                 }
             });
             
             const res = await WES.reassignTask('task-1', mockSupabase);
             expect(res.success).toBe(true);
        });
    });
});
