with open('./app/src/main/assets/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Let's find all occurrences of 'ACLEDA' or 'KHQR' or 'QR' in the HTML body
pos_body = text.find('<body>')
pos_script = text.find('<script>')
body_html = text[pos_body:pos_script]

print("Body length:", len(body_html))

# Let's search for all blocks containing KHQR or ACLEDA or store
blocks = list(re.finditer(r'<!--[^>]*?(?:KHQR|STORE|ACLEDA)[^>]*?-->', body_html, re.IGNORECASE))
print("Found comments:", len(blocks))
for b in blocks:
    print(b.group(0), "at index", b.start())

# Also check for elements with id containing khqr or store
ids = list(re.finditer(r'id=["\']([^"\']*(?:khqr|store|acleda)[^"\']*)["\']', body_html, re.IGNORECASE))
print("Found IDs:", len(ids))
for i in ids:
    print(i.group(1), "at index", i.start())
