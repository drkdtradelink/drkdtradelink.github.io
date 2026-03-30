import re

with open('card.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the SCN and Customs Clearance featured replacements we did earlier to index.html manually
content = content.replace(
    '<h3 class="text-xl font-extrabold text-blue-900">SCN Consultations</h3>',
    '<h3 class="text-xl font-extrabold text-blue-900"><a href="/services/scn-consultations.html" class="hover:underline">SCN Consultations</a></h3>'
)
content = content.replace(
    '<h2 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Premium Bond Store Facilities</h2>',
    '<h2 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight"><a href="/services/bonded-warehouses.html" class="hover:underline">Premium Bond Store Facilities</a></h2>'
)
content = content.replace(
    '<h3 class="text-lg font-bold">Customs Clearance</h3>',
    '<h3 class="text-lg font-bold"><a href="/services/customs-clearance.html" class="hover:underline before:absolute before:inset-0">Customs Clearance</a></h3>'
)
content = content.replace(
    '<h3 class="text-lg font-bold">Freight Forwarding</h3>',
    '<h3 class="text-lg font-bold"><a href="/services/freight-forwarding.html" class="hover:underline text-blue-800">Freight Forwarding</a></h3>'
)
content = content.replace(
    '<h3 class="text-lg font-bold">Custom Bonded Warehouse</h3>',
    '<h3 class="text-lg font-bold"><a href="/services/bonded-warehouses.html" class="hover:underline text-blue-800">Custom Bonded Warehouse</a></h3>'
)

# And now the 15 others
services = [
    {"name": "Road Transport", "slug": "road-transport"},
    {"name": "Custom Brokers", "slug": "custom-brokers"},
    {"name": "Cargo Handling", "slug": "cargo-handling"},
    {"name": "Warehousing", "slug": "warehousing"},
    {"name": "Bulk & Break Bulk", "slug": "bulk-and-break-bulk"},
    {"name": "Project Cargo Handling", "slug": "project-cargo-handling"},
    {"name": "Stevedore", "slug": "stevedore"},
    {"name": "Flexi Tank Supply", "slug": "flexi-tank-supply"},
    {"name": "Domestic Seaways Transport", "slug": "domestic-seaways-transport"},
    {"name": "Valuer", "slug": "valuer"},
    {"name": "Surveyor", "slug": "surveyor"},
    {"name": "Pest Control", "slug": "pest-control"},
    {"name": "Tank Cleaning", "slug": "tank-cleaning"},
    {"name": "Ship Chandler", "slug": "ship-chandler"},
    {"name": "NVOCC", "slug": "nvocc"}
]

for s in services:
    pattern = r'(<h3[^>]*>)' + re.escape(s["name"]) + r'(</h3>)'
    replacement = r'\1<a href="/services/' + s["slug"] + r'.html" class="hover:underline text-blue-800">' + s["name"] + r'</a>\2'
    content = re.sub(pattern, replacement, content)

with open('card.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated card.html")
