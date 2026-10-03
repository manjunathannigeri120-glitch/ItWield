import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

const PLANS: Record<string, { amountUSD: number; amountINR: number; credits: number; name: string }> = {
  solo: { amountUSD: 4900, amountINR: 406700, credits: 5000, name: 'Solo Builder' },
  professional: { amountUSD: 19900, amountINR: 1651700, credits: 10000, name: 'Professional' },
  business: { amountUSD: 29900, amountINR: 2481700, credits: 20000, name: 'Business' }
};

// V2 Route that creates an automated Subscription instead of a one-time order
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
    let amount = PLANS[planId].amountUSD;
    if (currency === 'INR') amount = PLANS[planId].amountINR;

    // Create a dynamic plan on Razorpay for this specific checkout
    // (In production, you'd cache plan IDs, but creating on the fly works perfectly for diverse currencies)
    const plan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: `${PLANS[planId].name} (${currency})`,
        amount: amount,
        currency: currency,
        description: `Monthly subscription to ItWield ${PLANS[planId].name}`
      }
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.id,
      total_count: 120, // 10 years duration
      customer_notify: 0,
      notes: {
        workspaceId: workspaceId,
        credits: PLANS[planId].credits,
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
    
    // Subscriptions use a different signature payload format
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

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    let client = req.supabase; 
    if (supabaseUrl && supabaseServiceKey) {
      client = createClient(supabaseUrl, supabaseServiceKey);
    }

    const { error: insertError } = await client.from('processed_payments').insert({
      workspace_id: workspaceId,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_subscription_id, // Store sub ID as order ID for tracing
      amount: 0, 
      credits_added: creditsToAdd
    });

    if (insertError && insertError.code !== '23505') {
      return res.status(500).json({ error: 'Failed to record payment' });
    }

    const { error: rpcError } = await client.rpc('add_workspace_credits', {
      ws_id: workspaceId,
      amount: creditsToAdd
    });
    
    if (rpcError) {
      const { data: ws } = await client.from('workspaces').select('credits').eq('id', workspaceId).single();
      if (ws) {
         await client.from('workspaces').update({ credits: (ws.credits || 0) + creditsToAdd }).eq('id', workspaceId);
      }
    }

    return res.json({ success: true, message: 'Subscription verified and credits added.' });
  } catch (error) {
    console.error('[Payments] Verify Error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
