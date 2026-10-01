const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

const route = `
// Control state (Pause/Resume/Stop)
router.post('/:id/control/state', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;
    const supabase = req.supabase!;
    
    if (!['OPERATING', 'PAUSED', 'STOPPED', 'READY'].includes(state)) {
       return res.status(400).json({ error: 'Invalid state' });
    }
    
    // Update workspace status
    const { data, error } = await supabase
      .from('workspaces')
      .update({ status: state.toLowerCase() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the action to decision_traces for the audit log
    await supabase.from('decision_traces').insert({
       workspace_id: id,
       event_name: 'CONTROL_LAYER_UPDATE',
       context_data: { new_state: state },
       conclusion: `Founder explicitly changed operating state to ${state}`,
       proposed_action: 'Enforce state globally',
       reasoning: 'Manual founder override from Control Layer',
       confidence: 1.0
    });
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approvals pending for Control Layer
router.get('/:id/control/approvals/pending', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase!;
    
    const { data: approvals, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('workspace_id', id)
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json({ approvals });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;

// Insert the new route right before export default router
content = content.replace("export default router;", route + "\nexport default router;");

fs.writeFileSync(file, content);
console.log('Fixed control routes in workspaces.ts');
