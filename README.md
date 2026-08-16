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
│   └── index.html                # Legacy client-side Vue 3 GR Tool (UNTOUCHED)
├── portal/
│   └── index.html                # New Multi-Tenant Documents Portal SPA (Vue 3)
├── server/
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma SQLite Database Schema
│   │   └── seed.js               # Database Seeding Script (Admin/Rules/Stock)
│   ├── src/
│   │   ├── index.js              # Express API Server entry point
│   │   ├── routes/               # API Router Handlers (Auth, GR, Stock, Parties)
│   │   ├── middleware/           # Subdomain Multi-tenant & JWT Auth Middleware
│   │   └── services/             # Calculations & Server HTML Rendering Engines
│   ├── reset-password.js         # CLI tool to reset user passwords
│   └── package.json
├── services/                     # Autogenerated Service SEO subpages
├── guides/                       # Autogenerated Guides subpages
└── *.py                          # Automation and utility scripts
```

---

## 🏛️ Documents Portal (Subdomain Multi-Tenant System)

The **Documents Portal** is a full-featured multi-company enterprise document management platform located at `portal/`. It is connected to a Node.js + Express backend running a SQLite database (via Prisma) with full support for subdomain multi-tenancy.

### Key Features
- **Subdomain Routing**: Dedicated domains for system admin (`admin.drkdtradelink.com`) and individual companies (`drkd.drkdtradelink.com` or `companya.drkdtradelink.com`).
- **Role-based Access Control**: System Admin, Company Manager, and Company Operator roles.
- **Company-Prefixed GR Numbers**: Company-specific GR numbering format (e.g. `DRKD-GR-2026-001`, `RA-GR-2026-001`).
- **Draft GR Package Editing**: Draft GR packages can be edited via "Edit Draft Package" (`PUT /api/gr-docs/:id`) before finalization.
- **Dynamic Cargo Item Units**: Supports dynamic units across stock items and generated GR documents (Cases, Cartons, Boxes, Bottles, Packs).
- **User Phone Number Visibility & Admin Authorization**: Super Admin Users directory displays phone/contact details. Account suspension/activation requires Super Admin password authorization (`X-Admin-Password`).
- **User Profile Settings (`#/profile`)**: Profile settings for name, phone, and password updates (email remains read-only).
- **Manager Party & Stock Edits with Audit Logs**: Managers can edit stock items and parties. All edits are tracked in an `AuditLog` table and displayed in the Super Admin console under **"Changes Made by Users"** (`#/admin/audit-logs`) with side-by-side diff checkers.
- **Editable Commodity Price per Case (USD)**: Customs clearance operators can customize price per case USD during GR package creation.
- **Auto-Incremental Invoice & DC Numbers**: Auto-generates next sequential Invoice (`INV-001`, `INV-002`) and Delivery Challan (`DC-001`, `DC-002`) numbers.
- **Auto-Fetched Present Duty Balance (INR)**: Auto-calculates total remaining duty value across all active warehouse stock items.
- **Independent Invoice & DC Dates**: Customizable dates for Invoice and Delivery Challan printing.
- **PNG Letterhead Support**: Custom company letterhead PNG upload rendered at the top of Invoice, Delivery Challan, and Submission Letter.
- **Seeded Duty Calculation Engine**: Centralized calculations for Alcohol/Wine (150% duty) and Beer (110% duty) based on dynamic, non-hardcoded company rules.
- **Unified Document Preview**: Generate and preview the entire GR Document Package (8 documents: Part 1 Front, Part 2 Back, Duty Calc, Submission Letter, Notesheet, Invoice, Delivery Challan, Stocklist) inside a single tabbed interface.
- **Stock Validation**: Prevents drawing items beyond available warehouse stock. Decrements stock levels when transactions are finalized.

### Local Development Setup & Launch

1. **Install Server Dependencies**:
   ```bash
   cd server
   npm install --legacy-peer-deps
   ```

2. **Sync database and generate Prisma Client**:
   ```bash
   npx prisma db push
   ```

3. **Seed Default Data**:
   This populates the database with the default Super Admin, DRKD Tradelink company, user accounts, duty rules, parties, and initial stock items:
   ```bash
   npm run seed
   ```

4. **Start the server in Development mode**:
   ```bash
   npm run dev
   ```
   The backend server will run on port `3000`. The portal frontend will be served at `http://localhost:3000/portal/`.

### Default Seeding Credentials
When testing locally, you can simulate company subdomains by using the `X-Subdomain` header or typing the subdomain slug in the login card.

- **Super System Admin (No Company Constraint)**:
  - **Email**: `admin@drkdtradelink.com`
  - **Password**: `DRKDAdmin#2026!Secured`
  - **Subdomain/Tenant**: `admin`
  
- **DRKD Tradelink Company Manager**:
  - **Email**: `manager@drkdtradelink.com`
  - **Password**: `DRKDManager#2026!`
  - **Subdomain/Tenant**: `drkd`

- **DRKD Tradelink Company Operator**:
  - **Email**: `operator@drkdtradelink.com`
  - **Password**: `DRKDOperator#2026!`
  - **Subdomain/Tenant**: `drkd`

### 🔑 Emergency Password Reset
If you ever lose or forget the admin credentials, you can reset any account's password directly from the server command line:
```bash
cd server
node reset-password.js <email_address> <new_password>
```
Example:
```bash
node reset-password.js admin@drkdtradelink.com NewSecurePassword123!
```

### 📮 Postman Collection
An API integration collection is provided at `server/Documents_Portal_APIs.postman_collection.json` containing pre-configured requests for Auth, Stock, Parties, and GR Documents.
- **Importing**: Open Postman -> click **Import** -> select `server/Documents_Portal_APIs.postman_collection.json`.
- **Environment variables**: The collection defines `base_url` (defaults to `http://localhost:3000`) and a placeholder `jwt_token`. Copy the token returned by the **Login** request and save it as the collection-wide `jwt_token` variable.

---

## 🌐 Deployment
This project keeps the public website hosted on **GitHub Pages**. The new **Documents Portal** requires a server environment to run the Express API and SQLite database (e.g. VPS, Render, Railway, or AWS EC2). Ensure the server is configured to forward request subdomains to the Express application host header for tenant routing.

