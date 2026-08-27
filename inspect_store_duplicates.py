with open('./app/src/main/assets/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find all occurrences of QR code images or cards
qr_imgs = list(re.finditer(r'<img[^>]*qr[^>]*>', text, re.IGNORECASE))
print("QR Image occurrences:", len(qr_imgs))
for i, img in enumerate(qr_imgs):
    print(f"--- QR Image {i+1} at index {img.start()} ---")
    print(text[max(0, img.start()-150):min(len(text), img.end()+150)])

# Find all store-view or view-khqr occurrences
store_matches = list(re.finditer(r'id=["\'](?:store-view|view-khqr|store-modal)["\']', text))
print("\nStore/KHQR ID occurrences:", len(store_matches))
for m in store_matches:
    print(m.group(0), "at index", m.start())

# Let's inspect the entire section around store-view
pos_store = text.find('id="store-view"')
if pos_store == -1:
    pos_store = text.find('id="view-khqr"')
print("\n--- Section around store view ---")
print(text[pos_store:pos_store+4000])
