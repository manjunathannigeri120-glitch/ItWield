import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Development-only route to bypass SMTP limits for OTP
router.post('/dev-otp', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Only available in development mode' });
    }
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error) throw error;
    
    res.json({ otp: data.properties?.email_otp });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Development-only route to bypass SMTP limits for Sign Up
router.post('/dev-signup', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Only available in development mode' });
    }
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Create and auto-confirm the user, bypassing SMTP entirely
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) throw error;
    
    res.json({ success: true, user: data.user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

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
    res.status(400).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request.' });
  }
});

export default router;
