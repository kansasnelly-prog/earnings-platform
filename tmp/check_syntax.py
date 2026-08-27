import subprocess, os, re

with open('./app/src/main/assets/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('Coins Available`;')
print('Found Coins Available at:', pos)
if pos != -1:
    print('Context around it:')
    print(text[pos-100:pos+300])

