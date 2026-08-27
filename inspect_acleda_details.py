with open('./app/src/main/assets/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find all occurrences of text like ACLEDA or 10371231
print("Occurrences of 10371231:")
for m in re.finditer(r'10371231', text):
    start = max(0, m.start() - 200)
    end = min(len(text), m.end() + 200)
    print(f"At {m.start()}:\n", text[start:end], "\n" + "="*50)

print("\nOccurrences of acleda-bakong-khqr-gateway or acleda-qr:")
for m in re.finditer(r'(?:acleda|bakong|khqr|qr-code|store)', text, re.IGNORECASE):
    # Only print element IDs or class names
    pass
