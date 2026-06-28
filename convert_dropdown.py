import re

with open('buy.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the old inline modal CSS
content = re.sub(r'/\* --- Modal Styles Fallback ---\s*\*/.*?\.modal-content\s*\{[^}]*\}', '', content, flags=re.DOTALL)

# 2. Add new CSS for the dropdown
dropdown_css = """    /* --- Address Dropdown Styles --- */
    .address-dropdown-container {
      display: none;
      background: var(--bg-card);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-top: -12px;
      margin-bottom: 24px;
      animation: slideDown 0.3s ease forwards;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }"""
content = content.replace('</style>', dropdown_css + '\n  </style>')

# 3. Replace the `.delivery-address-block` with the new structure.
old_address_block = """      <!-- Address selector block -->
      <button type="button" class="delivery-address-block" onclick="openAddressModal()" style="width: 100%; text-align: left; border: 1px solid var(--border-glass); border-radius: 8px; padding: 12px 16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background: rgba(255,255,255,0.02); margin-bottom: 24px; transition: var(--transition);">
        <div>
          <div style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:2px;">Delivery address</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);" id="display-selected-address">No address selected</div>
        </div>
        <div style="color:var(--accent-blue-light); font-weight:700;">›</div>
      </button>"""

# Find the modal content
modal_regex = re.search(r'<!-- Address Modal Overlay -->.*?<div class="modal-content"[^>]*>(.*?)</div>\s*</div>\s*<script src="https://checkout', content, flags=re.DOTALL)

if modal_regex:
    modal_inner_html = modal_regex.group(1).strip()
    # Replace closeAddressModal with inline hide
    modal_inner_html = modal_inner_html.replace('onclick="closeAddressModal()"', "onclick=\"document.getElementById('address-dropdown-container').style.display='none'\"")
    # Tweak the close button style for dropdown (no absolute positioning needed, just top right)
    modal_inner_html = modal_inner_html.replace('style="position:absolute; top:16px; right:16px;', 'style="position:absolute; top:-8px; right:-8px;')
    
    # Remove the modal overlay from the bottom
    content = content.replace(modal_regex.group(0), '<script src="https://checkout')
else:
    print("Modal regex not found")

new_address_block = f"""      <!-- Address selector block -->
      <button type="button" class="delivery-address-block" onclick="toggleAddressDropdown()" style="width: 100%; text-align: left; border: 1px solid var(--border-glass); border-radius: 8px; padding: 12px 16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background: rgba(255,255,255,0.02); margin-bottom: 24px; transition: var(--transition);">
        <div>
          <div style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:2px;">Delivery address</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);" id="display-selected-address">No address selected</div>
        </div>
        <div style="color:var(--accent-blue-light); font-weight:700;">›</div>
      </button>

      <!-- Address Dropdown Container -->
      <div id="address-dropdown-container" class="address-dropdown-container" style="position:relative;">
        {modal_inner_html}
      </div>"""

content = content.replace(old_address_block, new_address_block)


# 4. Update JavaScript Functions
content = content.replace('function openAddressModal() {', 'function toggleAddressDropdown() {')
content = content.replace("document.getElementById('address-modal-overlay').style.display = 'flex';", """
    const dropdown = document.getElementById('address-dropdown-container');
    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    } else {
      dropdown.style.display = 'block';
    }
""")
content = content.replace("console.log(\"Opening address modal...\");", "")

content = content.replace('closeAddressModal();', "document.getElementById('address-dropdown-container').style.display = 'none';")

# 5. Remove indestructible click listener
fallback_regex = r'// Fallback indestructible click listener.*?\}\);'
content = re.sub(fallback_regex, '', content, flags=re.DOTALL)

with open('buy.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("buy.html successfully updated")
