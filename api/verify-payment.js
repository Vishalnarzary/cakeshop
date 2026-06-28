const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  // Basic Auth token check
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });
  const token = authHeader.replace('Bearer ', '');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ message: 'Server misconfiguration: Missing Supabase credentials' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmt6cGx0dmp2eWppcWprcWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTUxNTMsImV4cCI6MjA5ODAzMTE1M30.ryHeukWAXmg6VYBgUK9Rsmsc9etKDlKyX7x8lTgShBk';
  const authClient = createClient(process.env.SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    if (token === 'undefined' || !token) {
        return res.status(401).json({ message: 'No valid token provided. Please log out and log back in.' });
    }
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ message: `Auth Error: ${authError?.message || 'User not found'}. Please log out and log back in.` });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Signature is valid, securely update order status to 'approved' in DB
      const { error: updateError } = await supabase.from('orders')
          .update({ 
              status: 'approved',
              payment_proof_url: razorpay_payment_id
          })
          .eq('id', order_id)
          .eq('user_id', user.id); // extra safety check

      if (updateError) {
          throw updateError;
      }
      return res.status(200).json({ message: 'Payment verified and order updated successfully' });
    } else {
      // Signature is invalid
      // Update order to rejected
      await supabase.from('orders').update({ status: 'rejected' }).eq('id', order_id);
      return res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ message: error.message || 'Server error during verification' });
  }
}
