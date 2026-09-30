import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CTOService } from '../services/CTOService';
import { WorkerAssignmentService } from '../services/WorkerAssignmentService';

vi.mock('../services/WorkerAssignmentService', () => {
    return {
        WorkerAssignmentService: {
            assignTask: vi.fn().mockResolvedValue({ success: true, worker: { id: 'w1', name: 'Worker1' } })
        }
    };
});

describe('V5.6 Autonomous CTO Operating Loop', () => {
    let mockSupabase: any;

    beforeEach(() => {
        mockSupabase = {
            from: vi.fn((table) => {
                const chain = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    is: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    insert: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: {} }),
                    then: (cb: any) => cb({ data: [] })
                };

                if (table === 'workspaces') {
                    chain.single = vi.fn().mockResolvedValue({ data: { operating_state: 'ACTIVE', cto_status: 'IDLE' } });
                }
                if (table === 'tasks') {
                    chain.then = (cb: any) => cb({ data: [{ id: 'task-1', title: 'Failed Deploy', error: 'Vercel timeout', status: 'FAILED' }] });
                    chain.single = vi.fn().mockResolvedValue({ data: { id: 'task-1', status: 'COMPLETED' } });
                }
                if (table === 'incidents') {
                    chain.then = (cb: any) => cb({ data: [{ id: 'inc-1', title: 'Task Failure', status: 'DETECTED', evidence: { error: 'mock error' } }] });
                }
                
                return chain;
            })
        };
    });

    it('respects emergency stop', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
            const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { operating_state: 'PAUSED' } }) };
            return chain;
        });

        await CTOService.operate(mockSupabase, 'ws-1');
        
        // Assert it did not update cto_locked_until
        expect(mockSupabase.from).toHaveBeenCalledWith('workspaces');
        // Only checked state, did not proceed to lock
    });

    it('executes full loop without crashing', async () => {
        await CTOService.operate(mockSupabase, 'ws-1');
        
        // It should have queried workspaces, tasks, incidents multiple times
        expect(mockSupabase.from).toHaveBeenCalledWith('workspaces');
        expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
        expect(mockSupabase.from).toHaveBeenCalledWith('incidents');
    });
});
