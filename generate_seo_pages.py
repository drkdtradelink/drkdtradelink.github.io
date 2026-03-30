import os
import re
from datetime import datetime

# Read index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract header and footer
# Header is everything up to <main>
header_match = re.search(r'(.*?<main>)', content, re.DOTALL)
header = header_match.group(1) if header_match else ''

# Footer is everything exactly from </main> to the end
footer_match = re.search(r'(</main>.*)', content, re.DOTALL)
footer = footer_match.group(1) if footer_match else ''

# Modify header for subpages (update paths like href="/#services" or add base tag?
# Actually, since we'll put them in /services/, we need to update relatives or just rely on absolute paths.
# Let's use <base href="/"> in the head for the generated pages to ensure relative assets work.
# And change <title> and OpenGraph tags dynamically.

def build_page(title, desc, h1, body_content, slug):
    # Adjust header for this page
    page_header = header.replace('<head>', '<head>\n    <base href="/">')
    page_header = re.sub(r'<title>.*?</title>', f'<title>{title} | DRKD TRADELINK</title>', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{desc}">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta name="title" content=".*?">', f'<meta name="title" content="{title} | DRKD TRADELINK">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{title} | DRKD TRADELINK">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{desc}">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta property="og:url" content=".*?">', f'<meta property="og:url" content="https://www.drkdtradelink.com/{slug}">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="https://www.drkdtradelink.com/{slug}">', page_header, flags=re.DOTALL)
    
    # Navigation links should point to /#section instead of #section since we are on a subpage
    page_header = page_header.replace('href="#services"', 'href="/#services"')
    page_header = page_header.replace('href="#about"', 'href="/#about"')
    page_header = page_header.replace('href="#testimonials"', 'href="/#testimonials"')
    page_header = page_header.replace('href="#contact"', 'href="/#contact"')
    
    # Also fix footer links
    page_footer = footer.replace('href="#services"', 'href="/#services"')
    page_footer = page_footer.replace('href="#about"', 'href="/#about"')
    page_footer = page_footer.replace('href="#testimonials"', 'href="/#testimonials"')
    page_footer = page_footer.replace('href="#contact"', 'href="/#contact"')

    # Build Hero block and Body
    main_body = f"""
        <section class="bg-blue-900 text-white py-16">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-4xl md:text-5xl font-extrabold mb-4">{h1}</h1>
                <p class="text-xl text-blue-200 max-w-3xl mx-auto">{desc}</p>
            </div>
        </section>
        <section class="py-16 bg-white">
            <div class="container mx-auto px-6 max-w-4xl prose prose-lg text-gray-700">
                {body_content}
            </div>
        </section>
        <section class="py-12 bg-gray-50 text-center">
            <h3 class="text-2xl font-bold text-gray-800 mb-6">Need expert assistance?</h3>
            <a href="/#contact" class="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition">Get a Free Quote Now</a>
        </section>
    """
    
    return page_header + main_body + page_footer

# Page 1: SCN Consultations
scn_content = """
<h2 class="text-2xl font-bold mt-8 mb-4">What is a Customs Show Cause Notice (SCN)?</h2>
<p class="mb-4">An SCN is a formal notice from the Indian Customs authorities asking you to explain why a certain action (like penalty, confiscation, or duty demand) should not be taken against you. It is a critical stage in customs disputes.</p>
<h2 class="text-2xl font-bold mt-8 mb-4">How Can We Help?</h2>
<p class="mb-4">At DRKD TRADELINK, our 'firefighter' approach means we analyze your SCN down to the last legal detail, prepare an airtight reply relying on the latest customs tribunals' rulings, and represent your case robustly in front of the adjudicating authorities.</p>
<ul class="list-disc pl-6 mb-6 space-y-2">
    <li>Rapid SCN analysis and fact-checking</li>
    <li>Drafting legally sound and comprehensive replies</li>
    <li>Personal representation in front of Customs commissioners</li>
    <li>Filing appeals to CESTAT, if necessary</li>
</ul>
<p class="mb-4">Don't let an SCN derail your supply chain. <strong>Time is of the essence</strong>—usually, you only have 30 days to respond.</p>
"""
scn_html = build_page(
    title="SCN Consultations & Customs Dispute Resolution",
    desc="Expert consultation and representation for Customs Show Cause Notices (SCN) in India. Protect your business from severe penalties with DRKD Tradelink.",
    h1="Expert Customs SCN Consultations",
    body_content=scn_content,
    slug="services/scn-consultations"
)

# Page 2: Customs Clearance
customs_content = """
<h2 class="text-2xl font-bold mt-8 mb-4">Seamless Customs Clearance Across India</h2>
<p class="mb-4">Delays at customs can cost millions in demurrage and lost sales. We specialize in swift, fully compliant customs clearance at major Indian ports and airports.</p>
<h3 class="text-xl font-bold mt-6 mb-3">Our Core Clearance Capabilities:</h3>
<ul class="list-disc pl-6 mb-6 space-y-2">
    <li><strong>SEZ Imports & Exports:</strong> Deep understanding of Special Economic Zone regulations and zero-duty compliance.</li>
    <li><strong>Project Cargo:</strong> Clearance of heavy machinery and project imports under specific concessional duty schemes.</li>
    <li><strong>SVB & DPD:</strong> Handling Special Valuation Branch (SVB) registrations and Direct Port Delivery (DPD) enrollments.</li>
</ul>
<p class="mb-4">We act as your dedicated Custom House Agent (CHA), ensuring 100% transparency and tracking.</p>
"""
customs_html = build_page(
    title="Customs Clearance Agents in India & SEZ",
    desc="Fast, compliant, and transparent customs clearance services across all major Indian ports. Specialists in DTA and SEZ operations.",
    h1="Customs Clearance & Brokerage",
    body_content=customs_content,
    slug="services/customs-clearance"
)

# Page 3: Freight Forwarding
freight_content = """
<h2 class="text-2xl font-bold mt-8 mb-4">Global Freight Forwarding Solutions</h2>
<p class="mb-4">Air, Sea, or Road—we connect India to the global market. Through our expansive NVOCC network and direct carrier partnerships, we offer highly competitive freight routing.</p>
<h3 class="text-xl font-bold mt-6 mb-3">Our Freight Forwarding Services Include:</h3>
<ul class="list-disc pl-6 mb-6 space-y-2">
    <li><strong>Ocean Freight (FCL/LCL):</strong> Secure container shipping from and to major hubs in Europe, USA, Middle East, and Asia.</li>
    <li><strong>Air Freight:</strong> Expedited air cargo for high-value and time-sensitive shipments.</li>
    <li><strong>Multimodal Transport:</strong> Combining sea, rail, and road to give you the most cost-effective door-to-door transit time.</li>
</ul>
"""
freight_html = build_page(
    title="International Freight Forwarding | Ocean & Air",
    desc="Reliable international freight forwarding services via Air and Sea. Get cost-effective ocean freight (FCL/LCL) and rapid air cargo solutions.",
    h1="Global Freight Forwarding",
    body_content=freight_content,
    slug="services/freight-forwarding"
)

# Page 4: Bonded Warehouses
bond_content = """
<h2 class="text-2xl font-bold mt-8 mb-4">Optimize Cash Flow with Custom Bonded Warehouses</h2>
<p class="mb-4">A custom bonded warehouse allows you to store imported goods safely in India without immediately paying the customs duty. Duty is deferred until you clear the goods for domestic consumption or re-export them.</p>
<h3 class="text-xl font-bold mt-6 mb-3">Benefits of our Bond Stores:</h3>
<ul class="list-disc pl-6 mb-6 space-y-2">
    <li><strong>Duty Deferment:</strong> Free up your working capital by paying duties only when goods are sold.</li>
    <li><strong>Partial Clearance:</strong> Clear shipments partially as per your immediate factory or distribution requirements.</li>
    <li><strong>Unmatched Security:</strong> 24/7 CCTV surveillance and secured perimeters.</li>
</ul>
<p class="mb-4">Our premium bond store facilities are strategically located to connect seamlessly with major expressways and ports.</p>
"""
bond_html = build_page(
    title="Custom Bonded Warehouses & Storage Facilities",
    desc="State-of-the-art custom bonded warehousing facilities for import duty deferment. Highly secure storage with seamless clearance integration.",
    h1="Premium Bond Store Facilities",
    body_content=bond_content,
    slug="services/bonded-warehouses"
)


# Save files
os.makedirs('services', exist_ok=True)
os.makedirs('guides', exist_ok=True)

with open('services/scn-consultations.html', 'w', encoding='utf-8') as f:
    f.write(scn_html)
with open('services/customs-clearance.html', 'w', encoding='utf-8') as f:
    f.write(customs_html)
with open('services/freight-forwarding.html', 'w', encoding='utf-8') as f:
    f.write(freight_html)
with open('services/bonded-warehouses.html', 'w', encoding='utf-8') as f:
    f.write(bond_html)

print("Created service pages successfully.")

# Modify index.html
# 1. Update <html lang="en"> to <html lang="en-IN">
content = content.replace('<html lang="en" class="scroll-smooth">', '<html lang="en-IN" class="scroll-smooth">')
# 2. Add decoding="async" to images without it
content = re.sub(r'<img(?!.*?decoding="async")(.*?)>', r'<img decoding="async"\1>', content)

# 3. Add link wrappers to cards in index.html to point to new pages (Internal Linking SEO Step 6)
# SCN Box (Featured)
content = content.replace(
    '<h3 class="text-xl font-extrabold text-blue-900">SCN Consultations</h3>',
    '<h3 class="text-xl font-extrabold text-blue-900"><a href="/services/scn-consultations.html" class="hover:underline">SCN Consultations</a></h3>'
)
# Premium Bonded Warehouse Box in Hero section
content = content.replace(
    '<h2 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Premium Bond Store Facilities</h2>',
    '<h2 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight"><a href="/services/bonded-warehouses.html" class="hover:underline">Premium Bond Store Facilities</a></h2>'
)
# Customs Clearance Card
content = content.replace(
    '<h3 class="text-lg font-bold">Customs Clearance</h3>',
    '<h3 class="text-lg font-bold"><a href="/services/customs-clearance.html" class="hover:underline before:absolute before:inset-0">Customs Clearance</a></h3>'
)
# To use before:inset-0 make the parent relative. Wait, the parent is already relative? 
# The card classes: class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex items-start space-x-4"
# Using regex to add "relative group" to that specific class, wait, that might be tricky using replace.
# Let's just wrap the H3 content manually.

content = content.replace(
    '<h3 class="text-lg font-bold">Freight Forwarding</h3>',
    '<h3 class="text-lg font-bold"><a href="/services/freight-forwarding.html" class="hover:underline text-blue-800">Freight Forwarding</a></h3>'
)

# Custom Bonded Warehouse Card (down the list)
content = content.replace(
    '<h3 class="text-lg font-bold">Custom Bonded Warehouse</h3>',
    '<h3 class="text-lg font-bold"><a href="/services/bonded-warehouses.html" class="hover:underline text-blue-800">Custom Bonded Warehouse</a></h3>'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html successfully.")
