import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/adminAuth';
import { getServiceSupabase } from '../db/supabaseClient';

const router = Router();

// Apply auth and super admin guards to ALL routes in this file
router.use(requireAuth);
router.use(requireSuperAdmin);

// Get all users and their total credits (from workspaces)
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const serviceClient = getServiceSupabase();
    if (!serviceClient) throw new Error("Service client not initialized");

    // 1. Get all users from Supabase Auth
    const { data: { users }, error: usersError } = await serviceClient.auth.admin.listUsers();
    if (usersError) throw usersError;

    // 2. Get all workspaces to aggregate credits
    const { data: workspaces, error: workspacesError } = await serviceClient
      .from('workspaces')
      .select('id, name, owner_id, credits');
    if (workspacesError) throw workspacesError;

    // 3. Map together
    const enrichedUsers = users.map(user => {
      const userWorkspaces = workspaces.filter(w => w.owner_id === user.id);
      const totalCredits = userWorkspaces.reduce((acc, ws) => acc + (ws.credits || 0), 0);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        workspaces: userWorkspaces,
        totalCredits
      };
    });

    res.json(enrichedUsers);
  } catch (error: any) {
    console.error('Admin API Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update credits for a specific user (adds to their first workspace)
router.post('/users/:userId/credits', async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    const { amount, action } = req.body; // action: 'add' or 'set'
    const parsedAmount = parseInt(amount);

    if (isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const serviceClient = getServiceSupabase();
    if (!serviceClient) throw new Error("Service client not initialized");

    // Find the user's first workspace (default)
    const { data: workspaces, error: findError } = await serviceClient
      .from('workspaces')
      .select('id, credits')
      .eq('owner_id', userId)
      .limit(1);

    if (findError || !workspaces || workspaces.length === 0) {
      return res.status(404).json({ error: 'No workspace found for this user' });
    }

    const workspace = workspaces[0];
    let newBalance = action === 'set' ? parsedAmount : (workspace.credits || 0) + parsedAmount;
    if (newBalance < 0) newBalance = 0;

    const { error: updateError } = await serviceClient
      .from('workspaces')
      .update({ credits: newBalance })
      .eq('id', workspace.id);

    if (updateError) throw updateError;

    res.json({ success: true, newBalance });
  } catch (error: any) {
    console.error('Admin API Error:', error);
    res.status(500).json({ error: 'Failed to update credits' });
  }
});

// Delete a user account completely
router.post('/users/:userId/ban', async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    if (userId === req.user?.id) return res.status(400).json({ error: 'Cannot ban yourself' });
    const serviceClient = getServiceSupabase();
    if (!serviceClient) throw new Error("Service client not initialized");
    const { error } = await serviceClient.auth.admin.updateUserById(userId, { ban_duration: '8760h' });
    if (error) throw error;
    res.json({ success: true, message: 'User banned' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

router.post('/users/:userId/unban', async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    const serviceClient = getServiceSupabase();
    if (!serviceClient) throw new Error("Service client not initialized");
    const { error } = await serviceClient.auth.admin.updateUserById(userId, { ban_duration: 'none' });
    if (error) throw error;
    res.json({ success: true, message: 'User unbanned' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

router.delete('/users/:userId', async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    
    // Prevent self-deletion
    if (userId === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own SuperAdmin account' });
    }

    const serviceClient = getServiceSupabase();
    if (!serviceClient) throw new Error("Service client not initialized");

    const { error } = await serviceClient.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json({ success: true, message: 'User permanently deleted' });
  } catch (error: any) {
    console.error('Admin API Error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;







