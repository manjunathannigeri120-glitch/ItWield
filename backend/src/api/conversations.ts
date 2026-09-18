import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

export let mockMessages: any[] = [];

// Get messages for a conversation
router.get('/:id/messages', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      return res.json(mockMessages.filter(m => m.conversation_id === req.params.id));
    }

    const { data, error } = await req.supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
