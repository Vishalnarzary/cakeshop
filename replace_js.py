import re

with open('buy.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update selectAddress
new_select_address = """  function selectAddress(id) {
    selectedAddressId = id;
    isNewAddress = false;
    document.querySelectorAll('.address-option').forEach(el => el.classList.remove('selected'));
    const optDiv = document.getElementById(`addr-opt-${id}`);
    optDiv?.classList.add('selected');
    // Check the radio button
    const radio = optDiv?.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    hideNewAddressForm();

    // Read distance directly from the data attribute on the card div (most reliable)
    const distVal = optDiv?.dataset.distance;
    selectedDistance = distVal ? parseFloat(distVal) : null;
    
    // Update the trigger block text
    const addrText = optDiv ? optDiv.querySelector('.address-details h4').textContent : 'Address Selected';
    document.getElementById('display-selected-address').textContent = addrText;

    validateDeliveryDistance();
    updateSummaryUI();
    closeAddressModal();
  }

  async function confirmNewAddress() {
    const name = document.getElementById('addr-name').value.trim();
    const phone = document.getElementById('addr-phone').value.trim();
    const full_address = document.getElementById('addr-full-address').value.trim();
    const building_floor = document.getElementById('addr-building-floor').value.trim();

    if (!name || !phone || !full_address || !building_floor || selectedDistance === null) {
      document.getElementById('address-error').innerHTML = '❌ Please select a valid address from suggestions and fill all fields.';
      document.getElementById('address-error').style.display = 'flex';
      return;
    }

    const { data: newAddr, error: addrError } = await _supabase.from('addresses').insert({
      user_id: currentUser.id, name, phone, full_address, building_floor, distance: selectedDistance
    }).select().single();

    if (addrError) {
      document.getElementById('address-error').innerHTML = '❌ Failed to save address: ' + addrError.message;
      document.getElementById('address-error').style.display = 'flex';
      return;
    }

    // Refresh address list and select this new address
    await loadSavedAddresses();
    selectAddress(newAddr.id);
  }"""

content = re.sub(r'  function selectAddress\(id\) \{.*?(?=  async function deleteAddress)', new_select_address + '\n\n', content, flags=re.DOTALL)

# 2. Update submitOrder
old_submit_order_start = """  async function submitOrder() {
    document.getElementById('address-error').style.display = 'none';
    document.getElementById('form-error').style.display = 'none';

    // Validate address selection
    if (!selectedAddressId && !isNewAddress) {
      document.getElementById('address-error').innerHTML = '❌ Please select or add a delivery address.';
      document.getElementById('address-error').style.display = 'flex';
      document.getElementById('address-error').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Validate new address fields
    let addressId = selectedAddressId;
    if (isNewAddress) {
      const name = document.getElementById('addr-name').value.trim();
      const phone = document.getElementById('addr-phone').value.trim();
      const full_address = document.getElementById('addr-full-address').value.trim();
      const building_floor = document.getElementById('addr-building-floor').value.trim();

      if (!name || !phone || !full_address || !building_floor || selectedDistance === null) {
        document.getElementById('address-error').innerHTML = '❌ Please select a valid address from suggestions and fill all fields.';
        document.getElementById('address-error').style.display = 'flex';
        return;
      }

      // Save address
      const { data: newAddr, error: addrError } = await _supabase.from('addresses').insert({
        user_id: currentUser.id, name, phone, full_address, building_floor, distance: selectedDistance
      }).select().single();

      if (addrError) {
        document.getElementById('address-error').innerHTML = '❌ Failed to save address: ' + addrError.message;
        document.getElementById('address-error').style.display = 'flex';
        return;
      }
      addressId = newAddr.id;
    }"""

new_submit_order_start = """  async function submitOrder() {
    document.getElementById('address-error').style.display = 'none';
    document.getElementById('form-error').style.display = 'none';

    // Validate address selection
    if (!selectedAddressId) {
      document.getElementById('form-error').innerHTML = '❌ Please select a delivery address.';
      document.getElementById('form-error').style.display = 'flex';
      openAddressModal();
      return;
    }
    let addressId = selectedAddressId;"""

content = content.replace(old_submit_order_start, new_submit_order_start)

# 3. Update calcDeliveryFee calls inside submitOrder
content = content.replace('const deliveryFee = calcDeliveryFee(selectedDistance);', 'const deliveryFee = calcDeliveryFee(selectedDistance, selectedDeliverySpeed, product.price * orderQuantity);')

# 4. Insert delivery_speed into orders insert block
# old: discount_amount: appliedDiscountAmount
# new: discount_amount: appliedDiscountAmount, delivery_speed: selectedDeliverySpeed
content = content.replace('discount_amount: appliedDiscountAmount\n            });', 'discount_amount: appliedDiscountAmount,\n              delivery_speed: selectedDeliverySpeed\n            });')

# 5. Remove timer update setting summary-total text since updateSummaryUI handles it
content = content.replace("document.getElementById('summary-total').textContent = `₹${total.toLocaleString('en-IN')}`;", "document.getElementById('summary-total').textContent = `₹${total.toLocaleString('en-IN')}`;\n    document.getElementById('submit-btn-text').textContent = `Place Order • ₹${total.toLocaleString('en-IN')}`;")

# Write back
with open('buy.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("JS replaced successfully")
