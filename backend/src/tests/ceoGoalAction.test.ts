import { describe, it, expect, vi } from 'vitest';
import { ActionRegistry } from '../workflows/actions/ActionRegistry';
import { CompetitorAnalysisAction } from '../workflows/actions/CompetitorAnalysisAction';

ActionRegistry.register(new CompetitorAnalysisAction());
// Deterministic AI mock — eliminates all live OpenRouter calls
vi.mock('openai', () => {
  const ceoEvaluation = JSON.stringify({
    evaluation: 'Mock evaluation. Task completed successfully.',
    conclusion: 'HEALTHY',
    follow_up_tasks: [],
    owner_update: 'Task evaluated. Result looks fine.'
  });
  const ceoOrchestration = JSON.stringify({
    assessment: 'Mock CEO assessment.',
    priority: 'high',
    decision: 'delegate',
    tasks: [],
    owner_update: 'Mock run completed.'
  });
  function OpenAIConstructor(this: any) {
    this.chat = {
      completions: {
        create: ({ messages }: any) => {
          const isEval = messages?.some((m: any) => typeof m.content === 'string' && m.content.includes('evaluating a completed task'));
          return Promise.resolve({ choices: [{ message: { content: isEval ? ceoEvaluation : ceoOrchestration } }] });
        }
      }
    };
  }
  return { default: OpenAIConstructor, OpenAI: OpenAIConstructor };
});

import { CEOService } from '../services/CEOService';

describe('AI CEO Goal-to-Action Loop', () => {
  it('A. Goal exists + safe objective available -> task created', async () => {
    let insertedTasks: any[] = [];
    const supabase = {
      from: vi.fn((table: string) => {
        let chain: any = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          neq: vi.fn(() => chain),
          single: vi.fn(() => Promise.resolve({ data: table === 'workspaces' ? { name: 'Test', company_goals: 'Acquire early customers', operational_context: '{}' } : null })),
          in: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
          insert: vi.fn((data: any) => {
            if (table === 'tasks') insertedTasks.push(data);
            return { select: () => ({ single: () => Promise.resolve({ data: { id: 'task-1', title: data.title } }) }) };
          }),
          then: (resolve: any) => {
             if (table === 'agents') return resolve({ data: [{ id: 'a1', name: 'Competitor Analyst' }] });
             return resolve({ data: [] });
          }
        };
        return chain;
      })
    };

    const res = await CEOService.run(supabase as any, 'ws-1', 'SCHEDULED_OBSERVATION:COMPETITIVE_ANALYSIS', 'user-1');
    expect(res!.tasksCreated).toBe(1);
    expect(insertedTasks[0].input.task_type).toBe('COMPETITIVE_ANALYSIS');
  });

  it('D. Existing equivalent active task -> no duplicate', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        let chain: any = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          insert: vi.fn(() => chain),
          single: vi.fn(() => {
            if (table === 'workspaces') return Promise.resolve({ data: { name: 'Test', company_goals: 'Acquire early customers' } });
            return Promise.resolve({ data: null });
          }),
          then: (resolve: any) => resolve({ data: table === 'tasks' ? [{ input: { task_type: 'COMPETITIVE_ANALYSIS' } }] : [] })
        };
        return chain;
      })
    };

    
    // observeWorkspace should abort early if task exists
    let runCalled = false;
    const originalRun = CEOService.run;
    CEOService.run = vi.fn(() => { runCalled = true; return Promise.resolve({} as any); });
    
    await CEOService.observeWorkspace(supabase as any, 'ws-1');
    expect(runCalled).toBe(false); // Should not trigger because task exists
    
    CEOService.run = originalRun;
  });

  it('H. Successful execution of CompetitorAnalysisAction', async () => {
    let updateCalled = false;
    let eventInserted = false;
    const supabase = {
      from: vi.fn((table: string) => {
        let chain: any = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          neq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          update: vi.fn(() => {
            if (table === 'tasks') updateCalled = true;
            return chain;
          }),
          upsert: vi.fn(() => chain),
          insert: vi.fn((data: any) => {
            if (table === 'task_events' && data.event_type === 'TASK_COMPLETED') eventInserted = true;
            return chain;
          }),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          single: vi.fn(() => Promise.resolve({ data: { workspace_id: 'ws-1' } })),
          then: (resolve: any) => resolve({ data: table === 'competitors' ? [] : [] })
        };
        return chain;
      })
    };

    await CEOService.executeInlineTask(supabase as any, 'task-1', { task_type: 'COMPETITIVE_ANALYSIS' }, 'user-1');
    expect(updateCalled).toBe(true);
    expect(eventInserted).toBe(true);
  });
});
