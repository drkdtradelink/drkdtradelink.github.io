import re

with open("grdocs/index.html", "r") as f:
    html = f.read()

css_replacement = """
        /* Print Styles */
        @media print {
            body { 
                background: white; 
                margin: 0; 
                padding: 0; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
            }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            
            .page-break { page-break-after: always; }
            
            @page portrait-page {
                size: A4 portrait;
                margin: 0;
            }
            @page landscape-page {
                size: A4 landscape;
                margin: 0;
            }
            
            .portrait-page { 
                page: portrait-page;
                width: 210mm; 
                min-height: 297mm; 
                margin: 0;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
            }
            
            .landscape-page { 
                page: landscape-page;
                width: 297mm; 
                min-height: 210mm; 
                margin: 0;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
            }

            .letterhead-bg {
                background-image: url('../letterhead.png') !important;
                background-size: 100% auto !important;
                background-position: center top !important;
                background-repeat: no-repeat !important;
                padding-top: 45mm !important;
                padding-bottom: 30mm !important;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 4px; font-size: 11px; text-align: left; }
            th { font-weight: bold; text-align: center; }
            h1, h2, h3, h4, h5 { margin: 0; padding: 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-justify { text-align: justify; }
            .font-bold { font-weight: bold; }
            .underline { text-decoration: underline; }
        }
"""

html = re.sub(r'/\* Print Styles \*/.*?@media print \{.*?\n        \}', css_replacement.strip(), html, flags=re.DOTALL)

with open("grdocs/index.html", "w") as f:
    f.write(html)
