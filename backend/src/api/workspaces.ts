import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

const WorkspaceSchema = z.object({
  name: z.string().min(1)
});

let mockWorkspaces: any[] = [];

// List workspaces for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.json(mockWorkspaces);

    const { data, error } = await req.supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create workspace
router.post('/', async (req: AuthRequest, res) => {
  try {
    const validatedData = WorkspaceSchema.parse(req.body);
    
    if (!req.supabase) {
      const mockWorkspace = {
        id: 'mock-ws-' + Date.now(),
        owner_id: req.user?.id,
        name: validatedData.name,
        created_at: new Date().toISOString()
      };
      mockWorkspaces.unshift(mockWorkspace);
      return res.json(mockWorkspace);
    }

    const { data, error } = await req.supabase
      .from('workspaces')
      .insert({
        owner_id: req.user?.id,
        name: validatedData.name
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
