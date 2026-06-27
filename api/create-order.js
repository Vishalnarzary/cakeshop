const Razorpay = require('razorpay');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { amount, currency = 'INR', receipt = 'receipt#1' } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({ message: 'Amount must be at least 100 paise' });
  }

  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(`Environment variables not loaded! ID exists: ${!!process.env.RAZORPAY_KEY_ID}, Secret exists: ${!!process.env.RAZORPAY_KEY_SECRET}`);
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount,
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    
    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    if (error.statusCode === 401) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    return res.status(500).json({ message: error.message || 'Error creating order' });
  }
}
