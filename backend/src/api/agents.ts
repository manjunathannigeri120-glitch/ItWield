import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { AgentRuntime } from '../agents/runtime';
import { mockMessages } from './conversations';

const router = Router();
router.use(requireAuth);

const AgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  system_prompt: z.string().optional(),
  model: z.string().default('mock-model-v1'),
  temperature: z.number().min(0).max(2).default(0.7),
  tools: z.array(z.string()).optional(),
  knowledge_bases: z.array(z.string()).optional()
});

let mockAgents: any[] = [];

// Create agent in workspace
router.post('/workspace/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const { workspaceId } = req.params;
    const validatedData = AgentSchema.parse(req.body);

    if (!req.supabase) {
      const mockAgent = {
        id: 'mock-agent-' + Date.now(),
        workspace_id: workspaceId,
        ...validatedData,
        created_at: new Date().toISOString()
      };
      mockAgents.unshift(mockAgent);
      return res.json(mockAgent);
    }

    const { tools, knowledge_bases, ...agentData } = validatedData;
    const { data, error } = await req.supabase
      .from('agents')
      .insert({
        workspace_id: workspaceId,
        ...agentData
      })
      .select()
      .single();

    if (error) throw error;

    if (tools && tools.length > 0) {
      const toolInserts = tools.map((t: string) => ({ agent_id: data.id, tool_name: t }));
      const { error: toolError } = await req.supabase.from('agent_tools').insert(toolInserts);
      if (toolError) throw toolError;
    }

    if (knowledge_bases && knowledge_bases.length > 0) {
      const kbInserts = knowledge_bases.map((kb: string) => ({ agent_id: data.id, knowledge_base_id: kb }));
      const { error: kbError } = await req.supabase.from('agent_knowledge_bases').insert(kbInserts);
      if (kbError) throw kbError;
    }

    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List agents in workspace
router.get('/workspace/:workspaceId', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      return res.json(mockAgents.filter(a => a.workspace_id === req.params.workspaceId));
    }
    
    const { data, error } = await req.supabase
      .from('agents')
      .select('*')
      .eq('workspace_id', req.params.workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific agent
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      const mockAgent = mockAgents.find(a => a.id === req.params.id);
      if (!mockAgent) return res.status(404).json({ error: 'Not found' });
      return res.json(mockAgent);
    }

    const { data, error } = await req.supabase
      .from('agents')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Chat with agent
router.post('/:id/chat', async (req: AuthRequest, res) => {
  try {
    const { id: agentId } = req.params;
    const { message, conversationId } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });
    if (!message) return res.status(400).json({ error: 'Message is required' });

    let agent;
    if (!req.supabase) {
      agent = mockAgents.find(a => a.id === agentId);
      if (!agent) throw new Error('Agent not found or access denied');
    } else {
      // Fetch agent config
      const { data: dbAgent, error: agentError } = await req.supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError || !dbAgent) throw new Error('Agent not found or access denied');
      agent = dbAgent;
    }

    let currentConversationId = conversationId;

    // Create conversation if it doesn't exist
    if (!currentConversationId) {
      if (!req.supabase) {
        currentConversationId = 'mock-conv-' + Date.now();
      } else {
        const { data: conv, error: convError } = await req.supabase
          .from('conversations')
          .insert({
            agent_id: agentId,
            user_id: req.user?.id,
            title: message.substring(0, 50)
          })
          .select()
          .single();
        
        if (convError) throw convError;
        currentConversationId = conv.id;
      }
    }

    // Save user message
    if (req.supabase) {
      await req.supabase.from('messages').insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      });
    } else {
      mockMessages.push({
        id: 'msg-' + Date.now(),
        conversation_id: currentConversationId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      });
    }

    // Run agent
    const responseText = await AgentRuntime.runChat(req.supabase, agent, currentConversationId, message, req.user?.id!);

    // Save AI message mock
    if (!req.supabase) {
      mockMessages.push({
        id: 'msg-' + (Date.now() + 1),
        conversation_id: currentConversationId,
        role: 'assistant',
        content: responseText,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      conversationId: currentConversationId,
      response: responseText
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent runs
router.get('/:id/runs', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      return res.json([
        {
          id: 'mock-run-123',
          agent_id: req.params.id,
          status: 'completed',
          created_at: new Date().toISOString()
        }
      ]);
    }
    const { data, error } = await req.supabase
      .from('agent_runs')
      .select('*')
      .eq('agent_id', req.params.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get run events
router.get('/runs/:runId/events', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      return res.json([
        { id: 1, run_id: req.params.runId, event_type: 'agent_started', created_at: new Date(Date.now() - 3000).toISOString() },
        { id: 2, run_id: req.params.runId, event_type: 'model_called', created_at: new Date(Date.now() - 2500).toISOString(), duration_ms: 500 },
        { id: 3, run_id: req.params.runId, event_type: 'tool_requested', tool_name: 'web_search', created_at: new Date(Date.now() - 2000).toISOString() },
        { id: 4, run_id: req.params.runId, event_type: 'tool_completed', tool_name: 'web_search', created_at: new Date(Date.now() - 1000).toISOString(), duration_ms: 1000 },
        { id: 5, run_id: req.params.runId, event_type: 'agent_completed', created_at: new Date().toISOString(), duration_ms: 3000 },
      ]);
    }
    const { data, error } = await req.supabase
      .from('agent_run_events')
      .select('*')
      .eq('run_id', req.params.runId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
