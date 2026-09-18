import { describe, it, expect, vi } from 'vitest';
import { WorkflowEngine } from '../workflows/engine';
import { AgentRuntime } from '../agents/runtime';
import { HttpRequestTool } from '../tools/httpRequest';

vi.mock('../agents/runtime', () => ({
  AgentRuntime: {
    runChat: vi.fn().mockResolvedValue('AI Response')
  }
}));

vi.mock('../tools/httpRequest', () => {
  return {
    HttpRequestTool: class {
      execute() {
        return Promise.resolve({ status: 200, data: 'OK' });
      }
    }
  };
});

import { ActionRegistry } from '../workflows/actions/ActionRegistry';
import { ConditionAction } from '../workflows/actions/ConditionAction';
import { AiAgentAction } from '../workflows/actions/AiAgentAction';
import { HttpAction } from '../workflows/actions/HttpAction';

ActionRegistry.register(new ConditionAction());
ActionRegistry.register(new AiAgentAction());
ActionRegistry.register(new HttpAction());

describe('WorkflowEngine', () => {
  it('runs successfully without supabase mock', async () => {
    const workflow = {
      workspace_id: 'ws-1',
      definition: {
        startNode: 'node1',
        nodes: [
          {
            id: 'node1',
            type: 'control_condition',
            config: {
              left: '{{trigger.type}}',
              operator: '==',
              right: 'support',
              true_next: 'node2',
              false_next: 'node3'
            }
          },
          {
            id: 'node2',
            type: 'action_ai_agent',
            config: { agent_id: 'agent-1', prompt: 'Analyze {{trigger.message}}' },
            next: null
          },
          {
            id: 'node3',
            type: 'action_http',
            config: { url: 'https://example.com' },
            next: null
          }
        ]
      }
    };

    // Test True path
    const resultTrue = await WorkflowEngine.run(null, workflow, 'run-1', { type: 'support', message: 'help' }, 'user-1');
    if (resultTrue.error) console.error('True Path Error:', resultTrue.error);
    expect(resultTrue.status).toBe('completed');
    expect(resultTrue.execution_log.length).toBe(2);
    expect(resultTrue.execution_log[1].node_type).toBe('action_ai_agent');

    // Test False path
    const resultFalse = await WorkflowEngine.run(null, workflow, 'run-2', { type: 'other', message: 'hello' }, 'user-1');
    if (resultFalse.error) console.error('False Path Error:', resultFalse.error);
    expect(resultFalse.status).toBe('completed');
    expect(resultFalse.execution_log.length).toBe(2);
    expect(resultFalse.execution_log[1].node_type).toBe('action_http');
  });
});
