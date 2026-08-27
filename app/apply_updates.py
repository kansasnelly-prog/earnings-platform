import os
import shutil

with open('app/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Check if scrollToSection function exists in HTML
scroll_fn = """
    function scrollToSection(id) {
      showPage(1);
      setTimeout(function() {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
"""

if 'function scrollToSection' not in html:
    html = html.replace('function showPage(pageNumber) {', scroll_fn + '\n    function showPage(pageNumber) {')
    print("Added scrollToSection function to index.html")

with open('app/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# Sync index.html to assets/index.html
assets_dir = 'app/src/main/assets'
os.makedirs(assets_dir, exist_ok=True)
shutil.copy('app/index.html', os.path.join(assets_dir, 'index.html'))
print("Copied app/index.html to app/src/main/assets/index.html")

# Sync to SampleMiniApps.kt
escaped_html = html.replace('$', '${"$"}')

kt_path = 'app/src/main/java/com/example/data/SampleMiniApps.kt'
if os.path.exists(kt_path):
    with open(kt_path, 'r', encoding='utf-8') as f:
        kt_code = f.read()

    start_marker = 'htmlCode = """'
    end_marker = '""".trimIndent()\n        )'

    first_start = kt_code.find(start_marker)
    first_end = kt_code.find(end_marker, first_start)

    if first_start != -1 and first_end != -1:
        new_kt_code = kt_code[:first_start + len(start_marker)] + "\n" + escaped_html + "\n" + kt_code[first_end:]
        with open(kt_path, 'w', encoding='utf-8') as f:
            f.write(new_kt_code)
        print("Updated SampleMiniApps.kt successfully with escaped HTML!")
