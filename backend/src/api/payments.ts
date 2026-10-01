import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_TikRfveSfskcj6',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'DOYUOMT5Oov2ym0mK1wyeOCB',
});

const PLANS: Record<string, { amount: number; credits: number; name: string }> = {
  solo: { amount: 4900, credits: 5000, name: 'Solo Builder' },
  professional: { amount: 19900, credits: 10000, name: 'Professional' },
  business: { amount: 29900, credits: 20000, name: 'Business' }
};

router.post('/create-order', async (req: any, res: any) => {
  try {
    const { planId } = req.body;
    let amount = req.body.amount;
    let creditsToUnlock = req.body.credits || 1000;
    
    if (planId && PLANS[planId]) {
      amount = PLANS[planId].amount; 
      creditsToUnlock = PLANS[planId].credits;
    }

    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan or amount' });
    }

    const options = {
      amount: amount, 
      currency: "USD",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
      notes: {
        workspaceId: req.body.workspaceId || 'unknown',
        credits: creditsToUnlock
      }
    };

    const order = await razorpay.orders.create(options);
    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      credits: creditsToUnlock
    });
  } catch (error) {
    console.error('[Payments] Create Order Error:', error);
    return res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

router.post('/verify', async (req: any, res: any) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, workspaceId, credits } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'DOYUOMT5Oov2ym0mK1wyeOCB';
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    if (workspaceId) {
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      
      let client = req.supabase;
      
      if (supabaseUrl && supabaseServiceKey) {
        client = createClient(supabaseUrl, supabaseServiceKey);
      }

      const { error } = await client.rpc('add_workspace_credits', {
        ws_id: workspaceId,
        amount: credits || 1000
      });
      
      if (error) {
        console.error('[Payments] RPC Error:', error);
        const { data: ws } = await client.from('workspaces').select('credits').eq('id', workspaceId).single();
        if (ws) {
           await client.from('workspaces').update({ credits: (ws.credits || 0) + (credits || 1000) }).eq('id', workspaceId);
        }
      }
    }

    return res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('[Payments] Verify Error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
