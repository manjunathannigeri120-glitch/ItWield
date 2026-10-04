import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimiters';

const router = Router();
router.use(requireAuth);
router.use(paymentLimiter);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// Store prices in their native subunit (cents, paise, fils, cents)
const PLANS: Record<string, { USD: number; INR: number; AED: number; EUR: number; credits: number; name: string }> = {
  solo: { USD: 4900, INR: 406700, AED: 17900, EUR: 4500, credits: 5000, name: 'Solo Builder' },
  professional: { USD: 19900, INR: 1651700, AED: 73000, EUR: 18300, credits: 10000, name: 'Professional' },
  business: { USD: 29900, INR: 2481700, AED: 109700, EUR: 27500, credits: 20000, name: 'Business' }
};

router.post('/create-subscription', async (req: AuthRequest, res: any) => {
  try {
    if (!req.supabase || !req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { planId, workspaceId, currency = 'USD' } = req.body;
    
    if (!planId || !PLANS[planId] || !workspaceId) {
      return res.status(400).json({ error: 'Invalid plan or missing workspace ID' });
    }

    const { data: workspace } = await req.supabase.from('workspaces').select('owner_id').eq('id', workspaceId).single();
    let isAuthorized = workspace && workspace.owner_id === req.user.id;
    if (!isAuthorized) {
      const { data: member } = await req.supabase.from('workspace_members').select('id').eq('workspace_id', workspaceId).eq('user_id', req.user.id).single();
      if (member) isAuthorized = true;
    }
    if (!isAuthorized) return res.status(403).json({ error: 'Unauthorized to purchase credits for this workspace' });

    // Determine amount based on requested currency
    const planObj = PLANS[planId] as any;
    const amount = planObj[currency] || planObj.USD;

    const plan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: `${planObj.name} (${currency})`,
        amount: amount,
        currency: currency,
        description: `Monthly subscription to ItWield ${planObj.name}`
      }
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.id,
      total_count: 120,
      customer_notify: 0,
      notes: {
        workspaceId: workspaceId,
        credits: planObj.credits,
        userId: req.user.id
      }
    });

    return res.json({
      subscriptionId: subscription.id,
      amount: amount,
      currency: currency
    });
  } catch (error: any) {
    console.error('[Payments] Create Subscription Error:', error);
    return res.status(500).json({ error: error.error ? error.error.description || error.error.message : error.message || 'Failed to create subscription' });
  }
});

router.post('/verify-subscription', async (req: AuthRequest, res: any) => {
  try {
    if (!req.supabase || !req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    
    const text = razorpay_payment_id + '|' + razorpay_subscription_id;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(text);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const sub = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    const workspaceId = sub.notes?.workspaceId as string;
    const creditsToAdd = parseInt(sub.notes?.credits as string) || 0;

    if (!workspaceId || creditsToAdd <= 0) {
      return res.status(400).json({ error: 'Invalid subscription notes' });
    }

    let client = req.supabase; 
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (supabaseUrl && supabaseServiceKey) {
      client = createClient(supabaseUrl, supabaseServiceKey);
    }

    const { error: insertError } = await client.from('processed_payments').insert({
      workspace_id: workspaceId,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_subscription_id,
      amount: 0, 
      credits_added: creditsToAdd
    });

    if (insertError && insertError.code !== '23505') {
      return res.status(500).json({ error: 'Failed to record payment' });
    }

    const { error: rpcError } = await client.rpc('add_workspace_credits', { ws_id: workspaceId, amount: creditsToAdd });
    if (rpcError) {
      const { data: ws } = await client.from('workspaces').select('credits').eq('id', workspaceId).single();
      if (ws) await client.from('workspaces').update({ credits: (ws.credits || 0) + creditsToAdd }).eq('id', workspaceId);
    }

    return res.json({ success: true, message: 'Subscription verified and credits added.' });
  } catch (error) {
    console.error('[Payments] Verify Error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
