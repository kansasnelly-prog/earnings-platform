import os

with open('update_master_builder.py', 'r', encoding='utf-8') as f:
    text = f.read()

sync_pos = text.find('sample_path =')
clean_head = text[:sync_pos]

clean_tail = '''sample_path = 'app/src/main/java/com/example/data/SampleMiniApps.kt'
dollar_sign = '$'
kt_escaped_html = html.replace(dollar_sign, '${"$"}')
full_kt_code = (
    "package com.example.data\\n\\n"
    "data class MiniAppTemplate(\\n"
    "    val id: String,\\n"
    "    val title: String,\\n"
    "    val description: String,\\n"
    "    val iconName: String,\\n"
    "    val htmlCode: String\\n"
    ")\\n\\n"
    "object SampleMiniApps {\\n"
    "    val templates = listOf(\\n"
    "        MiniAppTemplate(\\n"
    "            id = \\"executive_paradise_optimizer\\",\\n"
    "            title = \\"👑 Executive Web2/Web3 Solana Paradise Hub\\",\\n"
    "            description = \\"Luxurious Web2/Web3 Ecosystem with Solana 2-hour Token Drops, Master Wallet Binding, earnings.ink Cinema, & @OnlineCustomerOptimizeTasksBot integration.\\",\\n"
    "            iconName = \\"star\\",\\n"
    "            htmlCode = \\"\\"\\\"" + kt_escaped_html + "\\"\\"\\\"\\n"
    "        )\\n"
    "    )\\n"
    "}\\n"
)
with open(sample_path, 'w', encoding='utf-8') as f:
    f.write(full_kt_code)
print("Updated SampleMiniApps.kt cleanly!")
'''

full_script = clean_head + clean_tail
with open('update_master_builder.py', 'w', encoding='utf-8') as f:
    f.write(full_script)

print("Updated update_master_builder.py successfully!")
