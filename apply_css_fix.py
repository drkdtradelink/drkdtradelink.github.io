import re

with open("grdocs/index.html", "r") as f:
    html = f.read()

# 1. Update CSS
css_old = """
            .portrait-page { 
                page: portrait-page;
                width: 210mm; 
                height: 295mm; 
                margin: 0;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .landscape-page { 
                page: landscape-page;
                width: 297mm; 
                height: 208mm; 
                margin: 0;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .mt-auto { margin-top: auto; }

            .letterhead-bg {
                background-image: url('../letterhead.png') !important;
                background-size: 100% auto !important;
                background-position: center top !important;
                background-repeat: no-repeat !important;
                padding-top: 45mm !important;
                padding-bottom: 30mm !important;
            }
"""

css_new = """
            .portrait-page { 
                page: portrait-page;
                width: 210mm; 
                min-height: 296mm; 
                margin: 0 auto;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            
            .landscape-page { 
                page: landscape-page;
                width: 297mm; 
                min-height: 209mm; 
                margin: 0 auto;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            .mt-auto { margin-top: auto; }

            .letterhead-bg {
                background-image: url('../letterhead.png') !important;
                background-size: 100% 100% !important;
                background-position: center center !important;
                background-repeat: no-repeat !important;
                padding-top: 45mm !important;
                padding-bottom: 30mm !important;
                min-height: 296mm !important;
            }
"""
if css_old in html:
    html = html.replace(css_old, css_new)

# 2. Add top spacing to Notesheet
notesheet_old = """        <!-- Document 5: Notesheet -->
        <div class="portrait-page page-break" style="font-size: 13px;">"""
notesheet_new = """        <!-- Document 5: Notesheet -->
        <div class="portrait-page page-break" style="font-size: 13px; padding-top: 25mm;">"""
if notesheet_old in html:
    html = html.replace(notesheet_old, notesheet_new)

# 3. Ensure the landscape-page elements are actually forced landscape in Safari/Firefox too if @page fails
# The user said "GR PART 1 and DUTY CALCULATION NEEDS TO BE HORIZONTAL". 
# They didn't mention GR Part 2. But GR Part 2 is also landscape.
# Let's ensure `@page landscape-page` is strongly defined. It already is.

with open("grdocs/index.html", "w") as f:
    f.write(html)
