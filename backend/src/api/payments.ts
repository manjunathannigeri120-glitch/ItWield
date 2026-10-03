import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Ensure keys are safely pulled from environment, with fallbacks for this specific session
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

const PLANS: Record<string, { amount: number; credits: number; name: string }> = {
  solo: { amount: 4900, credits: 5000, name: 'Solo Builder' },
  professional: { amount: 19900, credits: 10000, name: 'Professional' },
  business: { amount: 29900, credits: 20000, name: 'Business' }
};

router.post('/create-order', async (req: AuthRequest, res: any) => {
  try {
    if (!req.supabase || !req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { planId, workspaceId } = req.body;
    let amount = req.body.amount;
    let creditsToUnlock = req.body.credits || 0;
    
    if (planId && PLANS[planId]) {
      amount = PLANS[planId].amount; 
      creditsToUnlock = PLANS[planId].credits;
    }

    if (!amount || !workspaceId) {
      return res.status(400).json({ error: 'Invalid plan or missing workspace ID' });
    }

    // Server-side authorization check: Ensure user is owner or member
    const { data: workspace } = await req.supabase.from('workspaces').select('owner_id').eq('id', workspaceId).single();
    let isAuthorized = workspace && workspace.owner_id === req.user.id;
    
    if (!isAuthorized) {
      const { data: member } = await req.supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', req.user.id)
        .single();
      if (member) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized to purchase credits for this workspace' });
    }

    const options = {
      amount: amount, 
      currency: "USD", // Adjust to INR if your live account only supports INR
      receipt: "receipt_" + Math.random().toString(36).substring(7),
      notes: {
        workspaceId: workspaceId,
        credits: creditsToUnlock
      }
    };

    const order = await razorpay.orders.create(options);
    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error: any) {
    console.error('[Payments] Create Order Error:', error);
    return res.status(500).json({ error: error.error ? error.error.description || error.error.message : error.message || 'Failed to create Razorpay order' });
  }
});

router.post('/verify', async (req: AuthRequest, res: any) => {
  try {
    if (!req.supabase || !req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    
    // 1. Verify HMAC Signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // 2. Fetch the Order from Razorpay securely (Server-side source of truth)
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const workspaceId = order.notes?.workspaceId as string;
    const creditsToAdd = parseInt(order.notes?.credits as string) || 0;

    if (!workspaceId || creditsToAdd <= 0) {
      return res.status(400).json({ error: 'Invalid order notes' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // Default to the user's client, but highly recommend using Service Role for payment fulfillment
    let client = req.supabase; 
    if (supabaseUrl && supabaseServiceKey) {
      client = createClient(supabaseUrl, supabaseServiceKey);
    }

    // 3. Prevent Duplicate Fulfillment
    const { error: insertError } = await client.from('processed_payments').insert({
      workspace_id: workspaceId,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      amount: order.amount,
      credits_added: creditsToAdd
    });

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
         return res.status(400).json({ error: 'Payment already processed' });
      }
      console.error('[Payments] Failed to record payment in DB:', insertError);
      return res.status(500).json({ error: 'Failed to record payment' });
    }

    // 4. Safely Add Credits
    const { error: rpcError } = await client.rpc('add_workspace_credits', {
      ws_id: workspaceId,
      amount: creditsToAdd
    });
    
    if (rpcError) {
      console.error('[Payments] RPC Error, using fallback update:', rpcError);
      const { data: ws } = await client.from('workspaces').select('credits').eq('id', workspaceId).single();
      if (ws) {
         await client.from('workspaces').update({ credits: (ws.credits || 0) + creditsToAdd }).eq('id', workspaceId);
      }
    }

    return res.json({ success: true, message: 'Payment verified and credits fulfilled securely.' });
  } catch (error) {
    console.error('[Payments] Verify Error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;

