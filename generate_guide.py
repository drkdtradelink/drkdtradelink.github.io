import re
from datetime import datetime

# Read the SCN page to use as template
with open('services/scn-consultations.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace body content and title
title = "How to Reply to a Customs Show Cause Notice (SCN) | Expert Guide"
desc = "Received a Customs SCN? Learn the step-by-step process to draft a reply, understand penalties, and resolve disputes swiftly with DRKD Tradelink."
slug = "guides/reply-customs-show-cause-notice"
h1 = "What is a Customs Show Cause Notice (SCN) & How to Respond?"

body_content = """
<h2 class="text-2xl font-bold mt-8 mb-4">1. Understand the Grounds of the SCN</h2>
<p class="mb-4">Before drafting a reply, thoroughly analyze the specific sections of the Customs Act, 1962 invoked in the notice. Common reasons include misdeclaration of value, incorrect classification, or claiming ineligible exemptions.</p>

<h2 class="text-2xl font-bold mt-8 mb-4">2. Check the Time Limit</h2>
<p class="mb-4">Most SCNs strictly mandate a reply within <strong>30 days</strong>. If you miss this window, the adjudicating authority may pass an ex-parte order (a decision made without your defense).</p>

<h2 class="text-2xl font-bold mt-8 mb-4">3. Draft a Factual and Legally Sound Reply</h2>
<p class="mb-4">Your reply must be paragraph-wise, addressing every allegation. Back your claims with documentary evidence such as Bills of Lading, Commercial Invoices, Technical Literature, and past CESTAT judgments favoring your interpretation.</p>

<h3 class="text-xl font-bold mt-6 mb-3">Key Elements of the Reply:</h3>
<ul class="list-disc pl-6 mb-6 space-y-2">
    <li><strong>Request for relied upon documents (RUDs):</strong> If the department hasn't provided all evidence, formally ask for it before submitting the final reply.</li>
    <li><strong>Request for Personal Hearing (PH):</strong> Always invoke your right to be heard in person by stating: "We request a personal hearing before any adverse decision is taken."</li>
    <li><strong>Cross-examination:</strong> If the SCN relies on third-party statements, request the right to cross-examine them.</li>
</ul>

<div class="bg-red-50 border-l-4 border-red-500 p-4 mt-8 mb-8">
    <p class="text-red-700 font-bold mb-2">Warning: What NOT to Do</p>
    <p class="text-red-700">Do not admit liability arbitrarily or submit a haphazard one-page letter. Do not ignore the SCN hoping it will go away. Do not fabricate documents.</p>
</div>

<h2 class="text-2xl font-bold mt-8 mb-4">4. Why Hire an SCN Consultant?</h2>
<p class="mb-4">Customs litigation is incredibly complex. A specialized customs broker or legal counsel understands tribunal precedents and the precise formatting required by the Adjudicating Authority. At DRKD Tradelink, our experts have a 95%+ success rate in dropping or significantly mitigating penalty demands.</p>
"""

# Replace in content
content = re.sub(r'<title>.*?</title>', f'<title>{title} | DRKD TRADELINK</title>', content, flags=re.DOTALL)
content = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{desc}">', content, flags=re.DOTALL)
content = re.sub(r'<meta name="title" content=".*?">', f'<meta name="title" content="{title}">', content, flags=re.DOTALL)
content = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{title}">', content, flags=re.DOTALL)
content = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{desc}">', content, flags=re.DOTALL)
content = re.sub(r'<meta property="og:url" content=".*?">', f'<meta property="og:url" content="https://www.drkdtradelink.com/{slug}.html">', content, flags=re.DOTALL)
content = re.sub(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="https://www.drkdtradelink.com/{slug}.html">', content, flags=re.DOTALL)

# Replace H1
content = re.sub(r'<h1 class="text-4xl md:text-5xl font-extrabold mb-4">.*?</h1>', f'<h1 class="text-4xl md:text-5xl font-extrabold mb-4">{h1}</h1>', content, flags=re.DOTALL)
# Replace Desc under H1
content = re.sub(r'<p class="text-xl text-blue-200 max-w-3xl mx-auto">.*?</p>', f'<p class="text-xl text-blue-200 max-w-3xl mx-auto">{desc}</p>', content, flags=re.DOTALL)

# Replace the inner prose container
content = re.sub(r'<div class="container mx-auto px-6 max-w-4xl prose prose-lg text-gray-700">.*?</div>', 
                 f'<div class="container mx-auto px-6 max-w-4xl prose prose-lg text-gray-700">{body_content}\n</div>', 
                 content, flags=re.DOTALL)

with open('guides/reply-customs-show-cause-notice.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Created SCN Guide.")
