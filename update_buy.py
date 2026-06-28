import re

with open('buy.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_submit_logic = """
    try {
      // 1. Create order on backend securely
      const session = await _supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          product_id: product.id,
          quantity: orderQuantity,
          address_id: addressId,
          delivery_speed: selectedDeliverySpeed,
          discount_code: appliedDiscountCode
        })
      });
      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.message || 'Failed to initialize payment');
      }

      // If total was 0, backend might just confirm order directly without Razorpay
      if (orderData.status === 'paid' || orderData.amount === 0) {
          // Free order
          markOrderCompleted();
          await _supabase.rpc('clear_reservation', {
            p_user_id: currentUser.id,
            p_product_id: product.id
          });
          window.location.href = 'orders.html';
          return;
      }

      // 2. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Caramel',
        description: `${product.name} Checkout`,
        order_id: orderData.razorpay_order_id,
        handler: async function (response) {
          btnText.textContent = 'Verifying Payment...';
          try {
            // 3. Verify signature and update order status securely on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                order_id: orderData.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            // Stop timer and clear reservation
            markOrderCompleted();
            await _supabase.rpc('clear_reservation', {
              p_user_id: currentUser.id,
              p_product_id: product.id
            });

            window.location.href = 'orders.html';
          } catch (err) {
            console.error(err);
            document.getElementById('form-error').innerHTML = '❌ ' + err.message;
            document.getElementById('form-error').style.display = 'flex';
            btn.disabled = false;
            btnText.textContent = 'Place Order • ₹' + (orderData.amount / 100).toLocaleString('en-IN');
            
            // Re-start timer if we stopped it
            if (!timerInterval) startCheckoutTimer();
          }
        },
        prefill: {
          name: currentUser?.user_metadata?.full_name || currentUser?.email || '',
          email: currentUser?.email || '',
          contact: ''
        },
        theme: {
          color: '#10B981'
        },
        modal: {
          ondismiss: function() {
            btn.disabled = false;
            btnText.textContent = 'Place Order • ₹' + (orderData.amount / 100).toLocaleString('en-IN');
          }
        }
      };

      const rzp1 = new Razorpay(options);
      rzp1.on('payment.failed', function (response){
         console.error('Payment failed', response.error);
         document.getElementById('form-error').innerHTML = '❌ Payment failed. Please try again.';
         document.getElementById('form-error').style.display = 'flex';
      });
      rzp1.open();

    } catch (err) {
      console.error(err);
      document.getElementById('form-error').innerHTML = '❌ ' + err.message;
      document.getElementById('form-error').style.display = 'flex';
      btn.disabled = false;
      const totalAmount = Math.round(((product.price * orderQuantity) + calcDeliveryFee(selectedDistance, selectedDeliverySpeed, product.price * orderQuantity) - appliedDiscountAmount));
      btnText.textContent = 'Place Order • ₹' + Math.max(0, totalAmount).toLocaleString('en-IN');
    }
"""

content = re.sub(r'    try \{\s*// 1\. Create order on backend.*?btnText\.textContent = \'Place Order.*?;(\s*\}\n)?\s*\}\n', new_submit_logic, content, flags=re.DOTALL)

with open('buy.html', 'w', encoding='utf-8') as f:
    f.write(content)
