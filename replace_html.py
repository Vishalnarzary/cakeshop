import re

with open('buy.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace from <!-- Order Layout --> to </main> inclusive.
# But wait, we also need to extract the new address form and saved addresses section to put them in the modal.
# Instead of complex regex, let's just write the entire new <main> and address modal, and append it.

new_html = """
    <!-- Product Loading -->
    <div id="product-loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading product...</p>
    </div>

    <!-- Timer -->
    <div class="timer-banner fade-up" id="timer-banner" style="margin-bottom: 24px;">
      ⏳ Order reserved! Complete checkout in <span id="timer-display">05:00</span>
    </div>

    <!-- Checkout Unified Card -->
    <div class="checkout-unified-card fade-up" id="order-layout" style="display:none; max-width: 480px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: var(--radius-lg); padding: 24px; position: relative;">
      
      <!-- Top product info -->
      <div class="unified-product-header" style="display:flex; gap:16px; align-items:center; margin-bottom:24px;">
        <div class="unified-product-img" id="product-img-display" style="width:72px; height:72px; border-radius:12px; background:var(--bg-glass); display:flex; align-items:center; justify-content:center; font-size:2rem; flex-shrink:0;">📦</div>
        <div class="unified-product-details">
          <div style="font-size:0.75rem; color:var(--accent-blue-light); margin-bottom:4px; font-weight:600;">You're ordering</div>
          <div style="font-size:1.15rem; font-weight:800; line-height:1.2; margin-bottom:4px;" id="product-name-display">—</div>
          <div style="font-size:0.875rem; color:var(--text-secondary);" id="product-stock-display"></div>
        </div>
      </div>

      <h3 style="font-size:1rem; font-weight:700; margin-bottom:16px; border-top:1px solid var(--border-glass); padding-top:24px;">📋 Order Summary</h3>
      
      <div class="summary-row">
        <span class="label">Product</span>
        <span class="value" id="summary-product" style="font-weight:600; color:#fff;">—</span>
      </div>
      <div class="summary-row">
        <span class="label">Unit Price</span>
        <span class="value" id="summary-price" style="font-weight:700; color:#fff;">—</span>
      </div>
      <div class="summary-row" style="align-items: center; border-bottom: none; padding-bottom: 24px;">
        <span class="label">Quantity</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-secondary btn-qty" onclick="changeQuantity(-1)" style="padding: 2px 8px; font-size: 1rem; min-width: 32px; background:transparent; border-color:var(--border-glass);">-</button>
          <span class="value" id="summary-quantity" style="width: 20px; text-align: center; color:#fff; font-weight:700;">1</span>
          <button class="btn btn-secondary btn-qty" onclick="changeQuantity(1)" style="padding: 2px 8px; font-size: 1rem; min-width: 32px; background:transparent; border-color:var(--border-glass);">+</button>
        </div>
      </div>

      <!-- Address selector block -->
      <div class="delivery-address-block" onclick="openAddressModal()" style="border: 1px solid var(--border-glass); border-radius: 8px; padding: 12px 16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background: rgba(255,255,255,0.02); margin-bottom: 24px; transition: var(--transition);">
        <div>
          <div style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:2px;">Delivery address</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);" id="display-selected-address">No address selected</div>
        </div>
        <div style="color:var(--accent-blue-light); font-weight:700;">›</div>
      </div>

      <!-- Delivery speed block -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
        <span style="font-weight:700; font-size:0.95rem; color:#fff;">Choose delivery speed</span>
        <span style="font-size:0.75rem; color:var(--text-secondary);">Added to total</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
        <label class="speed-option" style="display:flex; align-items:flex-start; gap:12px; border:1px solid var(--border-glass); border-radius:8px; padding:12px 16px; cursor:pointer; transition:var(--transition); position:relative;" id="speed-label-instant">
          <input type="radio" name="delivery-speed" value="instant" checked onchange="selectSpeed('instant')" style="margin-top:4px; accent-color:var(--accent-blue-light);">
          <div style="flex:1;">
            <div style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:2px;">Instant delivery</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">Fastest option at the normal delivery rate (20-30 mins)</div>
          </div>
          <div style="font-weight:700; font-size:0.95rem; color:#fff;" id="speed-price-instant">₹—</div>
        </label>

        <label class="speed-option" style="display:flex; align-items:flex-start; gap:12px; border:1px solid var(--border-glass); border-radius:8px; padding:12px 16px; cursor:pointer; transition:var(--transition); position:relative;" id="speed-label-delayed">
          <input type="radio" name="delivery-speed" value="delayed" onchange="selectSpeed('delayed')" style="margin-top:4px; accent-color:var(--accent-blue-light);">
          <div style="flex:1;">
            <div style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:2px;">Delivery in 2-4 hours</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">Lower fee when the order is not urgent</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700; font-size:0.95rem; color:#fff;" id="speed-price-delayed">₹—</div>
            <div style="font-size:0.7rem; color:var(--success); font-weight:700; margin-top:2px;">₹15 less</div>
          </div>
        </label>
      </div>

      <div class="discount-block" style="display:flex; gap:8px; margin-bottom:8px;">
        <input type="text" id="discount-input" class="form-control" style="text-transform:uppercase; font-size:0.875rem;" placeholder="DISCOUNT CODE">
        <button class="btn btn-secondary" style="padding:0 16px; font-size:0.875rem;" onclick="applyDiscount()">Apply</button>
      </div>
      <div id="discount-message" style="font-size:0.75rem; margin-bottom:24px;"></div>

      <div class="summary-row" id="discount-row" style="display:none; margin-bottom:12px; border:none; padding:0;">
        <span class="label">Discount (<span id="summary-discount-code"></span>)</span>
        <span class="value" id="summary-discount-amount" style="color:var(--success);">—</span>
      </div>

      <div class="divider"></div>

      <div class="summary-row total" style="margin-top:24px; margin-bottom: 24px; border:none; padding:0;">
        <span class="label" style="font-weight:800;font-size:1.15rem; color:#fff;">Total</span>
        <span class="value" id="summary-total" style="font-size:1.5rem; font-weight:800; color:#fff;">—</span>
      </div>

      <button class="btn btn-primary btn-full" onclick="submitOrder()" id="submit-btn" style="height: 52px; font-size:1rem;">
        <span id="submit-btn-text">Place Order</span>
      </button>
      <div id="delivery-limit-message" style="display:none; color:var(--error); font-size:0.875rem; text-align:center; margin-top:12px; font-weight:600;">
        ❌ We currently deliver only in Kolkata (30km area)
      </div>
      <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:14px;">
        By placing this order you agree to our terms. Your<br/>payment will be verified by the admin.
      </p>

      <div id="form-error" class="alert alert-error" style="display:none; margin-top: 16px;"></div>
    </div>
  </div>
</main>

<!-- Address Modal Overlay -->
<div class="modal-overlay" id="address-modal-overlay" style="display:none; z-index:1000;" onclick="closeAddressModal()">
  <div class="modal-content" style="max-width:480px; width:100%; position:relative; background:var(--bg-card); padding:24px; border-radius:var(--radius-lg); border:1px solid var(--border-glass);" onclick="event.stopPropagation()">
    <button class="modal-close" onclick="closeAddressModal()" style="position:absolute; top:16px; right:16px; background:transparent; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">×</button>
    <h3 style="margin-bottom: 20px; font-size:1.15rem; color:#fff;">📍 Delivery Address</h3>
    
    <div id="address-error" class="alert alert-error" style="display:none"></div>
    
    <!-- Saved Addresses -->
    <div id="saved-addresses-section">
      <div id="address-loading" style="text-align:center;padding:16px;color:var(--text-secondary);font-size:0.875rem;">Loading saved addresses...</div>
      <div class="address-list" id="address-list" style="display:none; flex-direction:column; gap:12px;"></div>
    </div>

    <!-- Add New Address Toggle -->
    <button class="add-address-toggle" id="toggle-new-address" onclick="toggleNewAddress()" style="margin-top:16px; width:100%; display:flex; align-items:center; gap:8px; padding:12px 16px; border:2px dashed var(--border-glass); background:rgba(255,255,255,0.02); color:#fff; border-radius:var(--radius-md); font-size:0.875rem; cursor:pointer; justify-content:center; transition:var(--transition);">
      ＋ Add a new delivery address
    </button>

    <!-- New Address Form -->
    <div class="new-address-form" id="new-address-form" style="display:none; margin-top:16px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input id="addr-name" type="text" class="form-control" placeholder="Recipient's full name" />
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number <span class="required">*</span></label>
          <input id="addr-phone" type="tel" class="form-control" placeholder="10-digit number" />
        </div>
      </div>
      <div class="form-group" style="position:relative;">
        <label class="form-label">Search Delivery Address <span class="required">*</span></label>
        <input id="addr-full-address" type="text" class="form-control" placeholder="Search area or landmark..." oninput="handleAddressSearch(event)" autocomplete="off" />
        <div id="address-suggestions" style="position:absolute; top:100%; left:0; right:0; background:#121212; border:1px solid var(--border-glass); border-radius:var(--radius-md); z-index:10; display:none; max-height:200px; overflow-y:auto; box-shadow:0 15px 30px -5px rgba(0,0,0,0.8);"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Building Name and Floor <span class="required">*</span></label>
        <input id="addr-building-floor" type="text" class="form-control" placeholder="e.g. Tower B, 3rd Floor" />
      </div>
      <div id="distance-display" style="font-size:0.875rem; color:rgba(255,255,255,0.7); margin-bottom:16px; display:none;">
        📍 Distance from bakery: <strong id="distance-val">...</strong>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:0.875rem;color:var(--text-secondary);cursor:pointer; margin-bottom:16px;">
        <input type="checkbox" id="save-address" checked style="accent-color:#000000;" />
        Save this address for future orders
      </label>
      <button class="btn btn-primary btn-full" onclick="confirmNewAddress()" style="margin-bottom:8px;">Save & Use Address</button>
    </div>
  </div>
</div>
"""

start_marker = "<!-- Product Loading -->"
end_marker = "</main>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx != -1 and end_idx != -1:
    updated_content = content[:start_idx] + new_html + content[end_idx:]
    with open('buy.html', 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print("Replaced main content.")
else:
    print("Markers not found.")
