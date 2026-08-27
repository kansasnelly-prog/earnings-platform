with open('./app/src/main/assets/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find store-view
pos_store = text.find('id="store-view"')
print("pos_store:", pos_store)

# Look from pos_store to end of body or next major section
pos_next = text.find('<!-- ONBOARDING MODAL:', pos_store)
if pos_next == -1:
    pos_next = text.find('</body>', pos_store)
print("pos_next:", pos_next)

store_html = text[pos_store:pos_next]
print("Store HTML length:", len(store_html))

# Let's clean out base64 strings to inspect structure clearly
cleaned = re.sub(r'src="data:image/[^"]+"', 'src="[BASE64_IMAGE]"', store_html)
print("\n--- Cleaned Store HTML Structure ---")
print(cleaned)
