import os, re

with open("build_master_app.py", "r", encoding="utf-8") as f:
    text = f.read()

# Extract portal_viewer_new
p1 = text.find('portal_viewer_new = """')
p2 = text.find('"""\n\n# 4. REPLACE USA MAIL', p1)
portal_viewer_new = text[p1+len('portal_viewer_new = """'):p2]

# Extract upgraded_mail_module_html
p3 = text.find('upgraded_mail_module_html = """')
p4 = text.find('"""\n\n# 5. WRITE COMPLETE MASTER SCRIPT', p3)
upgraded_mail_module_html = text[p3+len('upgraded_mail_module_html = """'):p4]

# Extract master_script
p5 = text.find('master_script = """<script>')
p_end = text.find('</script>"""', p5)
master_script = text[p5 + len('master_script = """'):p_end + len('</script>')]

new_builder_code = '''import os, re

print("Starting Master Application HTML build with Monetag SDK & Upgraded Webmail Client...")

# Read clean_base_html from app/index.html up to repetitive comment if any
with open("app/index.html", "r", encoding="utf-8") as f:
    raw_html = f.read()

pos_comment = raw_html.find("<!-- Browser Controls & URL Bar -->")
if pos_comment != -1:
    clean_base_html = raw_html[:pos_comment].strip()
else:
    clean_base_html = raw_html.strip()

# 1. Inject Monetag SDK tags into <head> if not present
monetag_head_snippet = """  <!-- TELEGRAM WEBAPP & SUPABASE & MONETAG SDK MONETIZATION -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://thubanoa.com/1?z=8843921" async data-cfasync="false"></script>
  <script src="https://alwingulla.com/88/43/92/8843921.js" async data-cfasync="false"></script>"""

if "thubanoa.com" not in clean_base_html:
    clean_base_html = clean_base_html.replace(
        '<script src="https://telegram.org/js/telegram-web-app.js"></script>\\n  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
        monetag_head_snippet
    )

portal_viewer_new = """''' + portal_viewer_new + '''"""

upgraded_mail_module_html = """''' + upgraded_mail_module_html + '''"""

master_script = """''' + master_script + '''"""

browser_controls_html = """
      <!-- Browser Controls & URL Bar -->
      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; background: rgba(2, 6, 23, 0.8); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.3);">
        <button onclick="document.getElementById('linux-iframe').contentWindow.history.back()" class="gold-bevel-btn" style="padding: 4px 10px; font-size: 11px;">◀</button>
        <button onclick="document.getElementById('linux-iframe').contentWindow.history.forward()" class="gold-bevel-btn" style="padding: 4px 10px; font-size: 11px;">▶</button>
        <button onclick="document.getElementById('linux-iframe').contentWindow.location.reload()" class="gold-bevel-btn" style="padding: 4px 10px; font-size: 11px;">🔄</button>
        <input type="text" id="linux-url-input" value="https://duckduckgo.com" style="flex: 1; background: #020408; border: 1px solid #334155; color: #38BDF8; font-family: monospace; font-size: 12px; padding: 6px 10px; border-radius: 6px;" onkeydown="if(event.key==='Enter') { document.getElementById('linux-iframe').src = this.value; }">
        <button onclick="document.getElementById('linux-iframe').src = document.getElementById('linux-url-input').value" class="emerald-cta-btn" style="padding: 6px 14px; font-size: 11px; font-weight: 800;">GO</button>
      </div>
      <div style="position: relative; width: 100%; height: 600px; border-radius: 8px; overflow: hidden; border: 1px solid #1E293B;">
        <iframe id="linux-iframe" src="https://duckduckgo.com" style="width: 100%; height: 100%; border: none;"></iframe>
      </div>
    </div>
  </div>
"""

full_html = clean_base_html + "\\n" + browser_controls_html + "\\n" + upgraded_mail_module_html + "\\n" + portal_viewer_new + "\\n" + master_script + "\\n</body>\\n</html>"

with open("app/index.html", "w", encoding="utf-8") as f:
    f.write(full_html)

os.makedirs("app/src/main/assets", exist_ok=True)
with open("app/src/main/assets/index.html", "w", encoding="utf-8") as f:
    f.write(full_html)

print("Updated app/index.html and app/src/main/assets/index.html successfully.")

# Sync with SampleMiniApps.kt
sample_path = "app/src/main/java/com/example/data/SampleMiniApps.kt"
if os.path.exists(sample_path):
    kt_escaped_html = full_html.replace("$", "${" + '"' + "$" + '"' + "}")
    full_kt_code = """package com.example.data

data class MiniAppTemplate(
    val id: String,
    val title: String,
    val description: String,
    val iconName: String,
    val htmlCode: String
)

object SampleMiniApps {
    val templates = listOf(
        MiniAppTemplate(
            id = "executive_paradise_optimizer",
            title = "👑 Executive Web2/Web3 Solana Paradise Hub",
            description = "Luxurious Web2/Web3 Ecosystem with Solana 2-hour Token Drops, Master Wallet Binding, earnings.ink Cinema, & @OnlineCustomerOptimizeTasksBot integration.",
            iconName = "star",
            htmlCode = \"\"\"""" + kt_escaped_html + """\"\"\"
        )
    )
}
"""
    with open(sample_path, "w", encoding="utf-8") as f:
        f.write(full_kt_code)
    print("Updated SampleMiniApps.kt with Kotlin-escaped HTML code!")
'''

with open("build_master_app.py", "w", encoding="utf-8") as f:
    f.write(new_builder_code)

print("Rebuilt build_master_app.py successfully!")
