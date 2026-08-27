with open('./app/src/main/assets/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Look around index 1735000 to end
pos_start = max(0, 1735000 - 5000)
sample = text[pos_start:]
# Strip out base64 images so we can see the entire structure
sample_clean = re.sub(r'src="data:image/[^"]+"', 'src="[BASE64_IMAGE]"', sample)
print(sample_clean[:8000])
