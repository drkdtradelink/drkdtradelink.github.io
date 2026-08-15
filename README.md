# DRKD TRADELINK - Web Platform & Tools

DRKD TRADELINK is a comprehensive logistics, customs clearance, and freight forwarding company based in Gandhidham, Gujarat, India. This repository contains the source code for the public website, digital business cards, SEO-optimized landing pages, and a client-side **GR Documents Generator** tool.

---

## 🌟 Features & Structure

The project is structured as a static website powered by vanilla HTML, Tailwind CSS, and Vue.js.

### 1. Main Website & Navigation
- **Homepage ([index.html](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/index.html))**: The primary landing page featuring service highlights (18+ logistics services), value propositions (SEZ specialists, tech transparency, firefighter approach), customer testimonials, and an interactive quote request/contact form integrated with Formspree.
- **Digital Business Card ([card.html](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/card.html))**: A streamlined, mobile-optimized business card version of the homepage designed for direct contact and sharing.

### 2. GR Documents Generator ([grdocs/index.html](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/grdocs/index.html))
A client-side utility built with **Vue 3** and styled using **Tailwind CSS**. It allows customs clearance operators to input transaction and cargo details to dynamically generate printable customs documents:
- **GR Front Page (Part 1)**: Form for the transfer of goods from a warehouse.
- **GR Back Page (Part 2)**: Details of dispatch and receipt of goods.
- **Duty Calculation**: Precise duty calculations (USD to INR conversion, percentage calculations).
- **GR Submission Letter**: Automatic generation of formal requests onto the company letterhead layout.
- **Notesheet**: Formal adjudicating notesheet template.

### 3. SEO Services & Guides
- **Services Directory (`services/`)**: Independent SEO landing pages for key offerings such as Road Transport, Custom Brokers, Warehousing, and Bonded Warehouses.
- **Guides Directory (`guides/`)**: Expert advice resources like `reply-customs-show-cause-notice.html`.

---

## 🛠️ Automation & Maintenance Scripts

The repository includes utility Python scripts to maintain internal links, compile templates, and automate page generation:

* **[generate_all_services.py](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/generate_all_services.py)**: Extracts the header/footer templates from `index.html`, generates 15+ standalone service subpages under `services/`, creates internal links, and updates `sitemap.xml`.
* **[generate_seo_pages.py](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/generate_seo_pages.py)**: Compiles key service pages (SCN, customs, freight, bond stores) and updates links in `index.html`.
* **[generate_guide.py](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/generate_guide.py)**: Generates the Customs Show Cause Notice (SCN) step-by-step reply guide.
* **[update_card.py](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/update_card.py)**: Synchronizes internal anchor links and service details inside the `card.html` template.
* **[fix_grdocs.py](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/fix_grdocs.py)** & **[apply_css_fix.py](file:///Users/kushagragarwal/Documents/projs/drkd%20new/drkdtradelink.github.io/apply_css_fix.py)**: Maintenance scripts adjusting layout constraints, print-media margins, page breaks, and element positioning in the GR documents tool to guarantee precise printing outputs.

---

## 🚀 How to Run Locally

Since this is a static site, you do not need complex bundlers or build frameworks.

### Prerequisites
- **Python 3.x** (for generating pages or running a quick local web server)

### 1. Serve the Website Locally
You can run a local development server using any of the following methods:

#### Method A: Python (Recommended)
Run the following command in your terminal from the root folder:
```bash
python3 -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

#### Method B: VS Code Live Server
If using VS Code, install the **Live Server** extension, open the repository folder, and click **Go Live** in the bottom status bar.

#### Method C: Node.js / npx
If you prefer Node:
```bash
npx serve .
```

### 2. Updating Pages (Regeneration)
If you modify the templates (e.g. updating headers or footers in `index.html`), regenerate the service subpages and guides using Python:
```bash
python3 generate_all_services.py
python3 generate_seo_pages.py
python3 generate_guide.py
python3 update_card.py
```

---

## 📁 Repository Structure

```
.
├── GR SAMPLE DOCS/               # PDF examples of generated GR forms
├── CNAME                         # Custom domain configuration for GitHub Pages
├── index.html                    # Homepage (Main website Entrypoint)
├── card.html                     # Digital business card
├── robots.txt                    # Search engine instructions
├── sitemap.xml                   # Autogenerated XML sitemap
├── letterhead.png                # Brand asset for the printable letterheads
├── grdocs/
│   └── index.html                # Vue 3 GR Documents Generator Tool
├── services/                     # Autogenerated Service SEO subpages
├── guides/                       # Autogenerated Guides subpages
└── *.py                          # Automation and utility scripts
```

---

## 🌐 Deployment
This project is configured to be hosted on **GitHub Pages**. Simply commit and push changes to the main repository. Any custom domain settings are automatically directed via the `CNAME` file. Ensure that after updating the service definitions or structural headers, you run the generator scripts before deploying to ensure all subpages remain synchronized.
