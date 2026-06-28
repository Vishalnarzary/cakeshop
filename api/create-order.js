const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

// Shared delivery fee calculation logic from frontend
function calcDeliveryFee(distanceKm, speed, subtotal) {
  if (distanceKm === null || distanceKm === undefined) return 0;
  let instantFee = 0;
  if (subtotal < 100) {
    let partnerCost = 0;
    if (distanceKm <= 2) {
      partnerCost = distanceKm * 20;
    } else {
      partnerCost = (2 * 20) + ((distanceKm - 2) * 10);
    }
    instantFee = Math.max(0, partnerCost - 10);
  } else {
    if (distanceKm <= 6) {
      instantFee = 0;
    } else {
      instantFee = (distanceKm - 6) * 10;
    }
  }
  instantFee = Math.round(instantFee);
  if (speed === 'delayed') {
    if (instantFee === 0) return 0;
    return Math.max(0, instantFee - 10);
  }
  return instantFee;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { product_id, quantity, address_id, delivery_speed, discount_code } = req.body;
  
  if (!product_id || !quantity || !address_id) {
    return res.status(400).json({ message: 'Missing required order details' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });
  const token = authHeader.replace('Bearer ', '');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ message: 'Server misconfiguration: Missing Supabase credentials in ENV variables' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Verify User Token securely
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Unauthorized or token expired' });
    const user_id = user.id;

    // 2. Fetch product securely
    const { data: product, error: prodError } = await supabase.from('products').select('*').eq('id', product_id).single();
    if (prodError || !product) return res.status(404).json({ message: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ message: 'Not enough stock available' });

    // 3. Fetch address distance securely
    const { data: address, error: addrError } = await supabase.from('addresses').select('*').eq('id', address_id).eq('user_id', user_id).single();
    if (addrError || !address) return res.status(404).json({ message: 'Address not found or unauthorized' });
    const distanceKm = address.distance || 0;

    // 4. Handle Disount Code (Hardcoded logic mapping frontend)
    let discountAmount = 0;
    if (discount_code) {
      const codeUpper = discount_code.trim().toUpperCase();
      const productPrice = Number(product.price);
      if (codeUpper === 'WELCOME') {
        discountAmount = productPrice * 0.10;
        if (discountAmount > 100) discountAmount = 100;
      } else if (codeUpper === 'CAKE100' && productPrice >= 1500) {
        discountAmount = 100;
      } else if (codeUpper === 'FLAT10') {
        discountAmount = 10;
      } else {
        return res.status(400).json({ message: 'Invalid or inapplicable discount code' });
      }
      discountAmount = Math.round(discountAmount);
    }

    // 5. Calculate final total securely
    const subtotal = Number(product.price) * quantity;
    const deliveryFee = calcDeliveryFee(distanceKm, delivery_speed, subtotal);
    let totalAmount = Math.round(subtotal + deliveryFee - discountAmount);
    if (totalAmount < 0) totalAmount = 0;
    
    // Convert to paise for Razorpay
    const totalAmountPaise = totalAmount * 100;

    // 6. Pre-create the order in Supabase with 'pending' status
    const { data: newOrder, error: insertError } = await supabase.from('orders').insert({
      user_id,
      product_id,
      address_id,
      quantity,
      payment_proof_url: 'pending',
      status: 'pending',
      discount_code: discount_code || '',
      discount_amount: discountAmount,
      delivery_speed: delivery_speed || 'instant'
    }).select().single();

    if (insertError || !newOrder) throw insertError || new Error('Failed to create pending order');

    // 7. If free order, return immediately
    if (totalAmountPaise === 0) {
        // Update order status to paid since it's free
        await supabase.from('orders').update({ status: 'paid', payment_proof_url: 'free_order' }).eq('id', newOrder.id);
        return res.status(200).json({ status: 'paid', order_id: newOrder.id, amount: 0 });
    }

    // 8. Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    const rzpOrder = await razorpay.orders.create({
      amount: totalAmountPaise,
      currency: 'INR',
      receipt: `order_${newOrder.id}`
    });

    return res.status(200).json({
      order_id: newOrder.id,
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating secure order:', error);
    return res.status(500).json({ message: error.message || 'Error creating order' });
  }
}
