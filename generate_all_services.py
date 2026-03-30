import os
import re

# Read index.html for header and footer template
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

header_match = re.search(r'(.*?<main>)', content, re.DOTALL)
header = header_match.group(1) if header_match else ''

footer_match = re.search(r'(</main>.*)', content, re.DOTALL)
footer = footer_match.group(1) if footer_match else ''

def build_page(title, desc, h1, body_content, slug):
    page_header = header.replace('<head>', '<head>\n    <base href="/">')
    page_header = re.sub(r'<title>.*?</title>', f'<title>{title} | DRKD TRADELINK</title>', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{desc}">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta name="title" content=".*?">', f'<meta name="title" content="{title} | DRKD TRADELINK">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{title} | DRKD TRADELINK">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{desc}">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<meta property="og:url" content=".*?">', f'<meta property="og:url" content="https://www.drkdtradelink.com/{slug}.html">', page_header, flags=re.DOTALL)
    page_header = re.sub(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="https://www.drkdtradelink.com/{slug}.html">', page_header, flags=re.DOTALL)
    
    page_header = page_header.replace('href="#services"', 'href="/#services"')
    page_header = page_header.replace('href="#about"', 'href="/#about"')
    page_header = page_header.replace('href="#testimonials"', 'href="/#testimonials"')
    page_header = page_header.replace('href="#contact"', 'href="/#contact"')
    
    page_footer = footer.replace('href="#services"', 'href="/#services"')
    page_footer = page_footer.replace('href="#about"', 'href="/#about"')
    page_footer = page_footer.replace('href="#testimonials"', 'href="/#testimonials"')
    page_footer = page_footer.replace('href="#contact"', 'href="/#contact"')

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

services = [
    {
        "name": "Road Transport",
        "slug": "road-transport",
        "title": "Road Transport & Surface Logistics in India",
        "desc": "On-time last-mile delivery and comprehensive road transport solutions across India. Reliable, secure, and fast logistics operations.",
        "h1": "India-Wide Road Transport Services",
        "body": "<p>Our comprehensive road transport services provide end-to-end surface logistics. From partial loads (LTL) to full truckloads (FTL), we ensure secure and timely pickup and delivery across India. Our network optimizes last-mile delivery, minimizing transit times and maximizing cost-efficiency for domestic operations.</p>"
    },
    {
        "name": "Custom Brokers",
        "slug": "custom-brokers",
        "title": "Expert Custom Brokers in India",
        "desc": "Professional custom brokerage services. We handle complex documentation, tariffs, and duty calculations to ensure swift customs clearance.",
        "h1": "Registered Custom Brokers",
        "body": "<p>We act as your dedicated Custom House Agent (CHA). By staying updated on the latest tariff structures, documentation mandates, and policy shifts, we prevent costly delays or penalties. Leave the bureaucratic hurdles to our expert brokers.</p>"
    },
    {
        "name": "Cargo Handling",
        "slug": "cargo-handling",
        "title": "Professional Cargo Handling Services",
        "desc": "Secure and efficient cargo handling at ports and warehouses. We ensure safety, speed, and precision for all types of freight.",
        "h1": "Expert Cargo Handling",
        "body": "<p>Proper cargo handling minimizes the risk of damage, loss, or delay. We manage loading, unloading, stowage, and securing at all major transit points. From fragile electronics to heavy industrial equipment, we have the specialized manpower and machinery required.</p>"
    },
    {
        "name": "Warehousing",
        "slug": "warehousing",
        "title": "Secure Warehousing Solutions",
        "desc": "Safe, secure, and highly optimized storage facilities. Streamline your supply chain with our modern warehousing options.",
        "h1": "Modern Warehousing Facilities",
        "body": "<p>Our warehousing services offer secure, dry, and strategically located storage space. Inventory goes in safely and comes out exactly when you need it, serving as a reliable hub in your broader supply chain operations.</p>"
    },
    {
        "name": "Bulk & Break Bulk",
        "slug": "bulk-and-break-bulk",
        "title": "Bulk & Break Bulk Cargo Handling",
        "desc": "Specialized handling for non-containerized cargo, oversized freight, and raw materials. Cost-effective logistics for heavy industries.",
        "h1": "Bulk & Break Bulk Logistics",
        "body": "<p>When cargo doesn't fit standard containers, we deploy specialized break bulk logistics. This includes heavy machinery, project freight, and loose commodities. We charter vessels and arrange specialized handling gear at the ports to ensure seamless transit.</p>"
    },
    {
        "name": "Project Cargo Handling",
        "slug": "project-cargo-handling",
        "title": "Project Cargo & Heavy Lift Logistics",
        "desc": "Tailor-made logistics solutions for massive, high-value, and complex project cargo shipments in India.",
        "h1": "Project Cargo Transport",
        "body": "<p>Complex industrial setups demand precisely coordinated project cargo operations. We provide end-to-end planning, road surveys, bridge reinforcements, and multi-modal heavy lift solutions to move massive structures safely to remote sites.</p>"
    },
    {
        "name": "Stevedore",
        "slug": "stevedore",
        "title": "Stevedoring & Port Services",
        "desc": "Professional port services and stevedoring. We handle vessel loading and unloading swiftly to minimize port turnaround time.",
        "h1": "Stevedoring Operations",
        "body": "<p>Efficient loading and discharging of vessels are crucial to port logistics. Our stevedoring teams optimize turnaround times by organizing expert dock labor, coordinating cranes, and ensuring safe stowage for international shipping vessels.</p>"
    },
    {
        "name": "Flexi Tank Supply",
        "slug": "flexi-tank-supply",
        "title": "Flexi Tank Supply & Liquid Logistics",
        "desc": "Cost-effective bulk liquid transport using standard ISO containers outfitted with our premium Flexi Tanks.",
        "h1": "Flexi Tank Solutions",
        "body": "<p>Transform standard 20-foot containers into high-capacity bulk liquid carriers with our Flexi Tank supply. This is a safer, highly economical alternative to drums or traditional ISO tanks for shipping non-hazardous liquids worldwide.</p>"
    },
    {
        "name": "Domestic Seaways Transport",
        "slug": "domestic-seaways-transport",
        "title": "Domestic Seaways & Coastal Shipping",
        "desc": "Affordable and sustainable coastal shipping solutions transporting goods across India's domestic seaways.",
        "h1": "Domestic Coastal Shipping",
        "body": "<p>Bypass heavily congested roadways by utilizing India's coastal routes. Domestic seaways transport significantly reduces carbon footprints and transportation costs for high-volume domestic cargo crossing long coastal distances.</p>"
    },
    {
        "name": "Valuer",
        "slug": "valuer",
        "title": "Certified Cargo Valuer Services",
        "desc": "Accurate asset and cargo valuation for customs, insurance, and financial compliance. Expert validation services.",
        "h1": "Certified Cargo Valuations",
        "body": "<p>Disputes in customs often stem from incorrect valuation. Our certified valuers provide accurate, market-tested appraisals for imported machinery, second-hand goods, and unique assets to satisfy regulatory and insurance criteria.</p>"
    },
    {
        "name": "Surveyor",
        "slug": "surveyor",
        "title": "Detailed Cargo Survey & Inspection",
        "desc": "Comprehensive cargo surveys, damage assessments, and pre-shipment inspections to protect your financial interests.",
        "h1": "Cargo Surveying Services",
        "body": "<p>Our independent surveying services provide detailed inspection reports on cargo condition, stowage, and discrepancies. From pre-loading inspections to damage assessment for insurance claims, we deliver transparent and factual survey operations.</p>"
    },
    {
        "name": "Pest Control",
        "slug": "pest-control",
        "title": "Cargo & Warehouse Pest Control",
        "desc": "Certified fumigation and pest control services for agricultural freight, timber, and warehouse facilities.",
        "h1": "Fumigation & Pest Control",
        "body": "<p>International trade demands strict phytosanitary compliance. We provide ISPM-15 compliant fumigation and general pest control services for cargo and bonded warehouses, ensuring shipments are free of biological contaminants.</p>"
    },
    {
        "name": "Tank Cleaning",
        "slug": "tank-cleaning",
        "title": "ISO Tank Cleaning Services",
        "desc": "Professional, environmentally compliant ISO tank cleaning and maintenance services for liquid logistics.",
        "h1": "Professional Tank Cleaning",
        "body": "<p>We offer rigorous ISO tank cleaning services, ensuring vessels are decontaminated, odor-free, and certified ready for their next load. Our processes adhere to strict environmental and safety regulations.</p>"
    },
    {
        "name": "Ship Chandler",
        "slug": "ship-chandler",
        "title": "Ship Chandler & Vessel Supply",
        "desc": "Reliable supply of provisions, spare parts, and essential gear for vessels calling at Indian ports.",
        "h1": "Ship Chandlery Services",
        "body": "<p>Our round-the-clock ship chandlery operations provision vessels with high-quality stores, from fresh food supplies to critical engine deck components, ensuring crews and ships are fully equipped before sail independently.</p>"
    },
    {
        "name": "NVOCC",
        "slug": "nvocc",
        "title": "NVOCC Carrier Solutions",
        "desc": "Global sea freight solutions with specialized Non-Vessel Operating Common Carrier (NVOCC) services.",
        "h1": "NVOCC Services",
        "body": "<p>As an established NVOCC, we issue our own Bills of Lading and offer scalable container leasing and slots across major shipping routes, delivering maximum flexibility without owning the physical vessels.</p>"
    }
]

os.makedirs('services', exist_ok=True)
sitemap_urls = []

# Generate pages and prepare index.html replacements
for s in services:
    slug = s["slug"]
    html = build_page(
        title=s["title"],
        desc=s["desc"],
        h1=s["h1"],
        body_content=s["body"],
        slug=f"services/{slug}"
    )
    # Save file
    with open(f"services/{slug}.html", "w", encoding="utf-8") as f:
        f.write(html)
    
    # Sitemap entry
    url_xml = f'''  <url>
    <loc>https://www.drkdtradelink.com/services/{slug}.html</loc>
    <lastmod>2026-03-27</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>'''
    sitemap_urls.append(url_xml)

    # replace in index.html exactly looking for the original H3 text.
    # We will search for <h3 class="text-lg font-bold">Name</h3> 
    # Or <h3 class="text-lg font-bold">Name</h3>
    pattern = r'(<h3[^>]*>)' + re.escape(s["name"]) + r'(</h3>)'
    replacement = r'\1<a href="/services/' + slug + r'.html" class="hover:underline text-blue-800">' + s["name"] + r'</a>\2'
    content = re.sub(pattern, replacement, content)

# Write updated index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Update sitemap.xml
with open('sitemap.xml', 'r', encoding='utf-8') as f:
    sitemap_content = f.read()

sitemap_insertion = "\n".join(sitemap_urls) + "\n</urlset>"
sitemap_content = sitemap_content.replace('</urlset>', sitemap_insertion)

with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write(sitemap_content)

print("Generated 15 pages, updated index.html, and updated sitemap.xml successfully.")
