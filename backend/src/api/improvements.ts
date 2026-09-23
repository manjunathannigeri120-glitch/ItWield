import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { CEOService } from '../services/CEOService';

const router = Router();
router.use(requireAuth);

router.post('/:id/approve', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(400).json({ error: 'DB required' });

    const proposalId = req.params.id;

    // Fetch the proposal to ensure it's APPROVAL_REQUIRED and belongs to the user
    const { data: proposal, error: fetchErr } = await req.supabase
      .from('improvement_proposals')
      .select('*, workspaces!inner(owner_id)')
      .eq('id', proposalId)
      .single();

    if (fetchErr) throw fetchErr;

    if (proposal.workspaces.owner_id !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (proposal.state !== 'APPROVAL_REQUIRED') {
      return res.status(400).json({ error: 'Proposal is not pending approval.' });
    }

    // Determine target state (if it had implementation summary, maybe TESTING, else IN_PROGRESS)
    const targetState = proposal.implementation_summary ? 'TESTING' : 'IN_PROGRESS';

    const { data: updatedProposal, error: updateErr } = await req.supabase
      .from('improvement_proposals')
      .update({ state: targetState })
      .eq('id', proposalId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log the manual approval as a task event for transparency
    await req.supabase.from('task_events').insert({
      workspace_id: proposal.workspace_id,
      event_type: 'CEO_EVALUATION',
      details: {
        owner_update: `Owner manually approved high-risk proposal: "${proposal.title}". Transitioned to ${targetState}.`
      }
    });

    res.json(updatedProposal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
