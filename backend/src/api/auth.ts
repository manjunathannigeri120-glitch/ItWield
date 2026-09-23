import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/me', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase || !req.user) return res.status(400).json({ error: 'DB required' });
    const { data, error } = await req.supabase
      .from('profiles')
      .select('email, last_login')
      .eq('id', req.user.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
