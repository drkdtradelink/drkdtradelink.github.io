import sys
import os

try:
    import pypdf
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    import pypdf

for file in os.listdir("GR SAMPLE DOCS"):
    if file.endswith(".pdf"):
        path = os.path.join("GR SAMPLE DOCS", file)
        reader = pypdf.PdfReader(path)
        page = reader.pages[0]
        mb = page.mediabox
        width = float(mb.width)
        height = float(mb.height)
        orientation = "Landscape" if width > height else "Portrait"
        print(f"\n--- {file} ({orientation}, {width}x{height}) ---")
        text = page.extract_text()
        print(text[:1500])
