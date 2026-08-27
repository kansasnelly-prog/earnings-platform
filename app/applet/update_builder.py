with open('build_master_app.py', 'r', encoding='utf-8') as f:
    text = f.read()

pos1 = text.find('# Inject master_script into html')
pos2 = text.find('# Write updated HTML back to app/index.html')

clean_code = """# Inject master_script into html
if "</body>" in html:
    html = html.replace("</body>", master_script + "\\n</body>")
else:
    html = html + "\\n" + master_script

"""

if pos1 != -1 and pos2 != -1:
    text = text[:pos1] + clean_code + text[pos2:]

with open('build_master_app.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('Successfully cleaned build_master_app.py!')
