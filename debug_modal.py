from bs4 import BeautifulSoup

with open('buy.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

modal = soup.find(id='address-modal-overlay')
print(f"Modal exists: {modal is not None}")
if modal:
    print(f"Modal style: {modal.get('style')}")

delivery_block = soup.find(class_='delivery-address-block')
print(f"Delivery block exists: {delivery_block is not None}")
if delivery_block:
    print(f"Delivery block onclick: {delivery_block.get('onclick')}")

script_tags = soup.find_all('script')
for script in script_tags:
    if script.string and 'openAddressModal' in script.string:
        print("Found openAddressModal in script")
