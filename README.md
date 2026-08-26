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

### Prerequisites
- **Node.js** (v18+ recommended)
- **Python 3.x** (for generating static pages or serving the landing pages)

### 1. Serve the Landing Pages Locally
You can serve the static frontend landing pages (outside of the Documents Portal) using:
```bash
python3 -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000).

### 2. Run the Documents Portal (Vite Vue 3 App + Backend Server)

The Documents Portal has a split architecture:
- **Backend API**: Node.js, Express, SQLite, Prisma ORM (located in `server/`).
- **Frontend SPA**: Vite, Vue 3, SFCs (located in `portal-vue/` and built/served from `portal/`).

#### Step A: Setup & Run Backend API
```bash
cd server
npm install --legacy-peer-deps
npx prisma db push
npm run seed
npm run dev
```
The backend server runs on `http://localhost:3000`.

#### Step B: Setup & Run Frontend (Development)
To run the frontend with hot-reload for development (uses Testing environment `http://localhost:3000`):
```bash
cd portal-vue
npm install
npm run dev
```
By default, the Vite dev server will run on `http://localhost:5173`. Requests are directed to `http://localhost:3000` as defined in `portal-vue/.env.development`.

#### Step C: Build Frontend (Production & Development Modes)
Vite will compile and bundle the Single File Components (.vue) directly into the static `portal/` folder.

- **Build for Production** (Uses Production backend: `https://drkdtradelink-github-kmi0vufck-drkd.vercel.app`):
  ```bash
  cd portal-vue
  npm run build:prod    # or npm run build
  ```

- **Build for Development / Testing** (Uses Localhost backend: `http://localhost:3000`):
  ```bash
  cd portal-vue
  npm run build:dev
  ```

Once built, you can access the portal directly via the backend server at:
[http://localhost:3000/portal/](http://localhost:3000/portal/)

---

### 🌐 Environment Configuration (`portal-vue`)

The portal supports dynamic environment configurations via Vite `.env` files:

| Environment | Mode | Configuration File | API Base URL |
| :--- | :--- | :--- | :--- |
| **Testing / Development** | `development` | `portal-vue/.env.development` | `http://localhost:3000` |
| **Production** | `production` | `portal-vue/.env.production` | `https://drkdtradelink-github-kmi0vufck-drkd.vercel.app` |

Centralized environment resolution logic resides in `portal-vue/src/config.js`. You can override the API endpoint for any build by setting the `VITE_API_BASE_URL` environment variable.

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
├── portal/                       # Production build directory for the Portal SPA
├── portal-vue/                   # Scalable Vite + Vue 3 Single File Component frontend source
├── server/
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma SQLite Database Schema
│   │   └── seed.js               # Database Seeding Script (Admin/Rules/Stock)
│   ├── src/
│   │   ├── index.js              # Express API Server entry point
│   │   ├── routes/               # API Router Handlers (Auth, GR, Stock, Parties, GR Purchases, Shipping Bills)
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

The **Documents Portal** is a full-featured multi-company enterprise document management platform. It is connected to a Node.js + Express backend running a SQLite database (via Prisma) with full support for subdomain multi-tenancy.

### Key Features
- **Subdomain Routing**: Dedicated domains for system admin (`admin.drkdtradelink.com`) and individual companies (`drkd.drkdtradelink.com`).
- **Role-based Access Control**: System Admin, Company Manager, and Company Operator roles.
- **GR Purchase (Inbound/Warehousing) Module**:
  - Auto-generating company context-aware reference numbers (`GRP-[Subdomain]-YYYY-XXX`).
  - Automatically calculates triple-duty bond values based on company bond multipliers.
  - Converts items into available bonded inventory upon finalization.
  - Printable mockups: Warehousing Bond (Section 59), Notesheet, Space Availability Certificate, Inbound Tally/Stocklist, and Covering Letter.
- **Pink Shipping Bill (Ex-Bond Export) Module**:
  - Auto-generating reference numbers (`PSB-[Subdomain]-YYYY-XXX`).
  - Validation against active stock quantities.
  - Dynamic stock subtraction from available bonded inventory upon finalization.
  - Printable mockups: Pink Shipping Bill (Customs, Exporter, and Transport copies), Export Invoice, Packing List, and Annexure/Declarations.
- **Editable Commodity Price per Case (USD)**: Customs clearance operators can customize price per case USD during GR package creation.
- **Auto-Incremental Invoice & DC Numbers**: Auto-generates next sequential Invoice (`INV-001`, `INV-002`) and Delivery Challan (`DC-001`, `DC-002`).
- **Auto-Fetched Present Duty Balance (INR)**: Auto-calculates total remaining duty value across all active warehouse stock items.
- **Unified Document Preview**: Generate and preview document packages inside a single tabbed interface.
- **Stock Validation**: Prevents drawing items beyond available warehouse stock. Decrements stock levels when transactions are finalized.

### 🟢 Health Monitoring & Production Observability (`/health`)

The platform features unified health check endpoints and an interactive frontend telemetry dashboard to monitor server metrics, SQLite database connectivity, static frontend assets, and operational status for all 11 API modules in production.

#### Production Health Endpoints
- **`GET /health` & `GET /api/health`**: Primary health probe for cloud uptime checkers (Render, Railway, AWS ALB, UptimeRobot, Datadog). Returns process uptime, Node version, heap memory stats, live Prisma database query latency, static `portal/index.html` build verification, and individual API module statuses. Returns HTTP `200` when operational or HTTP `503` if database connection fails.
- **`GET /api/health/db`**: Dedicated lightweight database probe testing Prisma connection status, query latency (ms), and active companies count.
- **`GET /api/health/apis`**: Inventory of all 11 API route modules (`auth`, `companies`, `users`, `parties`, `stock`, `duty-rules`, `gr-docs`, `gr-purchases`, `shipping-bills`, `monthly-returns`, `audit-logs`).
- **`GET /api/health/frontend`**: Verifies static frontend portal build asset availability.

#### Visual Telemetry Dashboard (`/portal/#/health`)
An interactive dashboard is built directly into the Documents Portal:
- **Public & Authenticated Access**: Accessible via the Portal sidebar under **System & API Health** or directly via login card link (`#/health`).
- **Live Diagnostics**: Features metrics cards (Server Uptime, Database Query Latency, Heap Memory, Portal Build status), API module test probes, and auto-refresh telemetry.

#### Sample `/health` Response Payload
```json
{
  "status": "ok",
  "timestamp": "2026-08-26T12:00:00.000Z",
  "service": "DRKD Tradelink Documents Portal API",
  "version": "1.0.0",
  "environment": "production",
  "system": {
    "uptimeSeconds": 14200,
    "uptimeFormatted": "0d 3h 56m 40s",
    "nodeVersion": "v20.10.0",
    "platform": "linux",
    "memoryUsage": {
      "rssMb": "64.20",
      "heapTotalMb": "32.10",
      "heapUsedMb": "24.50"
    }
  },
  "database": {
    "status": "ok",
    "connected": true,
    "latencyMs": 4,
    "companyCount": 2,
    "error": null
  },
  "frontend": {
    "status": "ok",
    "buildExists": true,
    "portalPath": "/portal"
  },
  "apis": {
    "status": "ok",
    "totalModules": 11,
    "modules": [
      { "name": "Auth Module", "path": "/api/auth", "status": "ok" },
      { "name": "Companies Module", "path": "/api/companies", "status": "ok" },
      { "name": "Users Module", "path": "/api/users", "status": "ok" },
      { "name": "Parties Module", "path": "/api/parties", "status": "ok" },
      { "name": "Stock Module", "path": "/api/stock", "status": "ok" },
      { "name": "Duty Rules Module", "path": "/api/duty-rules", "status": "ok" },
      { "name": "GR Docs Module", "path": "/api/gr-docs", "status": "ok" },
      { "name": "GR Purchases Module", "path": "/api/gr-purchases", "status": "ok" },
      { "name": "Shipping Bills Module", "path": "/api/shipping-bills", "status": "ok" },
      { "name": "Monthly Returns Module", "path": "/api/monthly-returns", "status": "ok" },
      { "name": "Audit Logs Module", "path": "/api/audit-logs", "status": "ok" }
    ]
  }
}
```

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
