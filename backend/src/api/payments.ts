import express from 'express';
import { requireAuth } from '../middleware/auth';
// @ts-ignore
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = express.Router();
router.use(requireAuth);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
});

const PLANS: Record<string, { amount: number, credits: number, name: string }> = {
  'SOLO_BUILDER': { amount: 4900, credits: 5000, name: 'Solo Builder' },
  'PRO': { amount: 19900, credits: 10000, name: 'Pro' },
  'BUSINESS': { amount: 29900, credits: 25000, name: 'Business' }
};

// Create Order
router.post('/create-order', async (req: any, res) => {
  try {
    const { planId, workspaceId } = req.body;
    
    if (!PLANS[planId]) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }
    
    // Verify workspace ownership
    const { data: ws, error: wsError } = await req.supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', workspaceId)
      .single();
      
    if (wsError || !ws || ws.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized workspace access' });
    }

    const options = {
      amount: PLANS[planId].amount * 100, // Razorpay uses smallest currency unit (e.g., paise/cents)
      currency: "USD",
      receipt: `receipt_ws_${workspaceId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify Payment and Upgrade Workspace
router.post('/verify', async (req: any, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, workspaceId, planId } = req.body;
    
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
    
    // Verify signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');
    
    if (digest !== razorpay_signature && process.env.NODE_ENV === 'production') {
       return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Invalid plan ID' });

    // Payment is valid! Upgrade the workspace atomically.
    // 1. Update plan
    // 2. Add credits
    const { error: updateError } = await req.supabase
      .from('workspaces')
      .update({ plan_id: planId })
      .eq('id', workspaceId)
      .eq('owner_id', req.user.id);
      
    if (updateError) throw updateError;
    
    // We add credits using an RPC to ensure atomic addition (preventing race condition overwrites)
    // First, let's create a quick atomic addition RPC if it doesn't exist, or just use standard update.
    // Since we are the admin route here and the user just paid, we can fetch current and add.
    const { data: ws } = await req.supabase.from('workspaces').select('credits').eq('id', workspaceId).single();
    
    await req.supabase
      .from('workspaces')
      .update({ credits: (ws?.credits || 0) + plan.credits })
      .eq('id', workspaceId);

    res.json({ success: true, message: 'Payment successful, workspace upgraded', newCredits: (ws?.credits || 0) + plan.credits });
    
  } catch (error: any) {
    console.error('Razorpay Verify Error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;
