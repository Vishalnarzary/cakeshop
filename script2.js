
  // ---- Navbar Scroll ----
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar && window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else if (navbar) {
      navbar.classList.remove('scrolled');
    }
  });

  // ---- Auth Check ----
  let currentUser = null;

  const STATUS_CONFIG = {
    pending:    { emoji:'⏳', label:'Pending',    cls:'badge-pending',    msg:'Your order is under review. We\'ll verify your payment shortly.' },
    processing: { emoji:'🔄', label:'Processing', cls:'badge-processing', msg:'Your order will be delivered soon.' },
    completed:  { emoji:'✅', label:'Completed',  cls:'badge-completed',  msg:'Your order has been completed! Thank you for shopping with us.' },
    rejected:   { emoji:'❌', label:'Rejected',   cls:'badge-rejected',   msg:'Your order was rejected. Please contact support or re-submit with a valid payment proof.' },
  };

  function getDynamicStatus(order) {
    let statusKey = order.status || 'pending';
    // If it's pending but paid via Razorpay, it's processing
    if (statusKey === 'pending' && order.payment_proof_url && order.payment_proof_url !== 'pending') {
      statusKey = 'processing';
    }
    
    let cfg = { ...(STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending) };
    
    if (statusKey === 'processing') {
      const orderDate = new Date(order.created_at);
      let minTime, maxTime;
      if (order.delivery_speed === 'delayed') {
        minTime = new Date(orderDate.getTime() + 2 * 60 * 60000); // +2 hours
        maxTime = new Date(orderDate.getTime() + 4 * 60 * 60000); // +4 hours
      } else {
        minTime = new Date(orderDate.getTime() + 20 * 60000); // +20 mins
        maxTime = new Date(orderDate.getTime() + 40 * 60000); // +40 mins
      }
      const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      cfg.msg = `Your order will be delivered by ${formatTime(minTime)} to ${formatTime(maxTime)}`;
    }
    return { statusKey, cfg };
  }

  (async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    currentUser = session.user;

    const { data: profile } = await _supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
    if (profile?.role === 'admin') { window.location.href = 'admin.html'; return; }
    document.getElementById('user-name-display').textContent = profile?.name || profile?.email || '';
    document.getElementById('user-avatar').textContent = (profile?.name || profile?.email || 'U')[0].toUpperCase();

    await loadOrders();
    subscribeToOrderUpdates();
  })();

  async function loadOrders() {
    const { data: orders, error } = await _supabase
      .from('orders')
      .select(`*, products (name, price, image_url, emoji), addresses (name, phone, street, city, state, pincode, full_address, building_floor)`)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    document.getElementById('orders-loading').style.display = 'none';

    if (error || !orders || orders.length === 0) {
      document.getElementById('orders-empty').style.display = 'block';
      return;
    }
    renderOrders(orders);
  }

  function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    list.innerHTML = '';
    if (!orders || orders.length === 0) { document.getElementById('orders-empty').style.display = 'block'; return; }
    document.getElementById('orders-empty').style.display = 'none';

    orders.forEach((order, i) => {
      const p = order.products;
      const addr = order.addresses;
      const { statusKey, cfg } = getDynamicStatus(order);
      const date = new Date(order.created_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const imgHtml = p?.image_url
        ? `<img src="${p.image_url}" style="width:56px;height:56px;object-fit:cover;border-radius:12px;" />`
        : `<div class="order-prod-img">${p?.emoji || '📦'}</div>`;

      const div = document.createElement('div');
      div.className = 'order-card-full fade-up';
      div.style.animationDelay = `${i * 0.07}s`;
      div.style.opacity = '0';
      div.id = `order-${order.id}`;

      div.innerHTML = `
        <div class="order-top">
          <div class="order-product-row">
            ${imgHtml}
            <div>
              <div style="font-size:1rem;font-weight:700;">${escHtml(p?.name || 'Unknown Product')}</div>
              <div style="font-size:0.875rem;font-weight:700;background:var(--gradient-main);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                ₹${Number(p?.price || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <span class="order-status-pill ${cfg.cls}" id="status-badge-${order.id}">${cfg.emoji} ${cfg.label}</span>
        </div>
        <div class="order-info-grid">
          <div class="order-info-item">
            <label>Delivery To</label>
            <span>${addr ? escHtml(addr.name.split(' ')[0]) : '—'}</span>
          </div>
          <div class="order-info-item">
            <label>Address</label>
            <span>${escHtml(addr?.full_address || addr?.street || '—')}</span>
          </div>
          <div class="order-info-item">
            <label>Order Date</label>
            <span>${date}</span>
          </div>
        </div>
        <div class="status-msg ${cfg.cls}" id="status-msg-${order.id}">
          ${cfg.emoji} ${cfg.msg}
        </div>`;

      list.appendChild(div);
    });
  }

  // ---- Supabase Realtime ----
  function subscribeToOrderUpdates() {
    _supabase
      .channel(`orders-user-${currentUser.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders'
      }, (payload) => {
        console.log('Realtime update received:', payload);
        handleOrderUpdate(payload.new);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          document.getElementById('realtime-badge').style.display = 'flex';
        }
      });
  }

  function handleOrderUpdate(updated) {
    const { statusKey, cfg } = getDynamicStatus(updated);

    const badge = document.getElementById(`status-badge-${updated.id}`);
    if (badge) { badge.className = `order-status-pill ${cfg.cls}`; badge.textContent = `${cfg.emoji} ${cfg.label}`; }

    const msgEl = document.getElementById(`status-msg-${updated.id}`);
    if (msgEl) { msgEl.className = `status-msg ${cfg.cls}`; msgEl.innerHTML = `${cfg.emoji} ${cfg.msg}`; }

    const card = document.getElementById(`order-${updated.id}`);
    if (card) {
      card.classList.add('status-update-flash');
      setTimeout(() => card.classList.remove('status-update-flash'), 1000);
    }

    const toastType = statusKey === 'completed' ? 'success' : statusKey === 'rejected' ? 'error' : 'info';
    showToast(`Order status updated to: ${cfg.label}`, toastType);
  }

async function logout() { await _supabase.auth.signOut(); window.location.href = 'login.html'; }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
