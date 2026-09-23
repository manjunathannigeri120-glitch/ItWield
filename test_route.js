const express = require('express');
const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { workspaceId } = req.params;
  const supabase = req.supabase;

  try {
    const { data, error } = await supabase
      .from('business_missions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const req = {
  params: { workspaceId: '123' },
  supabase: {
    from: (table) => {
      return {
        select: (cols) => {
          return {
            eq: (col, val) => {
              return {
                order: (col, opts) => {
                  return Promise.resolve({ data: [], error: null });
                }
              }
            }
          }
        }
      }
    }
  }
};

const res = {
  json: (data) => console.log('JSON:', data),
  status: (code) => { console.log('STATUS:', code); return res; }
};

router.handle({ method: 'GET', url: '/', params: { workspaceId: '123' }, ...req }, res, (err) => {
  if (err) console.error('Next called with error:', err);
});
