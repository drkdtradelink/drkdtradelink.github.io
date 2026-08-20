import re

with open('portal/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The body is everything between <body> and <script
body_start = html.find('<body>')
script_start = html.rfind('<script>')
if script_start == -1:
    script_start = html.rfind('<script ')

template_content = html[body_start + 6:script_start]
# remove the mounting script tag
template_content = re.sub(r'<script src=".*?"></script>', '', template_content)
template_content = template_content.replace('<div id="app" v-cloak>', '<div id="app-wrapper">')

# Script
setup_start = html.find('setup() {')
if setup_start != -1:
    mount_end = html.find('.mount(\'#app\');')
    # Find the last return { before mount_end
    setup_end = html.rfind('return {', setup_start, mount_end)
    setup_content = html[setup_start + 9:setup_end]
    script_final = f"""<script setup>
import {{ ref, computed, onMounted }} from 'vue';
import jsPDF from 'jspdf';
import GRPurchases from './components/GRPurchases.vue';
import ShippingBills from './components/ShippingBills.vue';

{setup_content}
</script>"""
else:
    script_final = "<script setup></script>"

# Styles
style_start = html.find('<style>')
style_end = html.find('</style>')
if style_start != -1:
    style_content = html[style_start + 7:style_end]
else:
    style_content = ""

vue_file_content = f"""<template>
{template_content}
</template>

{script_final}

<style scoped>
{style_content}
</style>
"""

with open('portal-vue/src/LegacyPortal.vue', 'w', encoding='utf-8') as f:
    f.write(vue_file_content)

print("Extraction complete. Check portal-vue/src/LegacyPortal.vue")
