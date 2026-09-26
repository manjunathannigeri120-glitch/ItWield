import express from 'express';
import { requireAuth } from '../middleware/auth';
import { CompanyMemoryService, MemoryCategory, SourceType } from '../services/CompanyMemoryService';

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;
  const includeArchived = req.query.includeArchived === 'true';

  try {
    let query = supabase
      .from('company_memory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.in('status', ['active', 'VERIFIED']);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: any, res) => {
  const { workspaceId } = req.params;
  const { memory_type, content } = req.body;
  const userId = req.user.id;

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  const validTypes = ['RULE', 'FACT', 'PREFERENCE', 'DECISION'];
  if (!memory_type || !validTypes.includes(memory_type)) {
    return res.status(400).json({ error: `Invalid memory type for owner. Allowed: ${validTypes.join(', ')}` });
  }

  // Basic secret detection
  const lower = content.toLowerCase();
  if (lower.includes('password') || lower.includes('sk-ant-') || lower.includes('api_key') || lower.includes('secret_key') || lower.includes('bearer ')) {
    return res.status(400).json({ error: 'Cannot store credentials or secrets as company memory.' });
  }

  try {
    const memory = await CompanyMemoryService.createMemory({
      workspaceId,
      memoryType: memory_type as MemoryCategory,
      category: memory_type as MemoryCategory,
      title: `Owner ${memory_type.charAt(0) + memory_type.slice(1).toLowerCase()}`,
      content,
      sourceType: 'OWNER' as SourceType,
      createdBy: userId,
      importance: memory_type === 'RULE' ? 'high' : 'medium'
    }, req.supabase);

    if (!memory) throw new Error('Failed to create memory');
    res.status(201).json(memory);
  } catch (error: any) {
    if (error.message.includes('Security')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: any, res) => {
  const { workspaceId, id } = req.params;
  const { content, status } = req.body;

  try {
    // Ensure the memory belongs to this workspace and is OWNER authored
    const { data: existing, error: findError } = await req.supabase
      .from('company_memory')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (findError || !existing) return res.status(404).json({ error: 'Memory not found' });
    
    if (existing.source_type !== 'OWNER') {
      return res.status(403).json({ error: 'Cannot edit AI-generated or system memory directly' });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;

    const { data: updated, error: updateError } = await req.supabase
      .from('company_memory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
