const fs = require('fs');

let content = fs.readFileSync('src/api/tasks.ts', 'utf8');

const eventsEndpoint = \
// Get task events
router.get('/:id/events', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
    const { data, error } = await req.supabase
      .from('task_events')
      .select('*')
      .eq('task_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
\;

content = content.replace(/export const tasksRouter = router;/, eventsEndpoint + '\\nexport const tasksRouter = router;');

fs.writeFileSync('src/api/tasks.ts', content);
console.log('Tasks API Patched');
