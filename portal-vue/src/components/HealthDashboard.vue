<template>
  <div class="health-dashboard-container">
    <!-- TOP HEADER BAR -->
    <div class="dashboard-header card">
      <div class="header-main">
        <div class="header-title">
          <div class="status-indicator" :class="systemStatus">
            <span class="status-dot"></span>
            <span class="status-text">{{ statusHeading }}</span>
          </div>
          <h1>System & API Health Observability</h1>
          <p class="subtitle">Real-time status monitoring for Server, Database, Frontend assets, and API modules</p>
        </div>
        <div class="header-actions">
          <div class="auto-refresh-toggle">
            <label class="toggle-label">
              <input type="checkbox" v-model="autoRefresh" @change="toggleAutoRefresh" />
              <span>Auto-refresh (10s)</span>
            </label>
          </div>
          <button @click="fetchHealthData" class="btn btn-primary refresh-btn" :disabled="loading">
            <svg class="spin-icon" :class="{ spinning: loading }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
            </svg>
            {{ loading ? 'Diagnosing...' : 'Run Diagnostics' }}
          </button>
        </div>
      </div>
      <div class="last-checked" v-if="lastChecked">
        Last updated: {{ new Date(lastChecked).toLocaleTimeString() }} ({{ new Date(lastChecked).toLocaleDateString() }})
      </div>
    </div>

    <!-- ERROR ALERT IF ANY -->
    <div v-if="errorMessage" class="alert alert-danger mb-4">
      <strong>Health Diagnostic Alert:</strong> {{ errorMessage }}
    </div>

    <!-- METRICS OVERVIEW CARDS -->
    <div class="metrics-grid">
      <!-- CARD 1: SERVER & UPTIME -->
      <div class="metric-card card">
        <div class="metric-icon server">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <div class="metric-content">
          <span class="metric-label">Server Uptime</span>
          <span class="metric-value">{{ healthData?.system?.uptimeFormatted || 'N/A' }}</span>
          <div class="metric-footer">
            <span>Node {{ healthData?.system?.nodeVersion || 'v18+' }}</span>
            <span class="badge badge-success">Online</span>
          </div>
        </div>
      </div>

      <!-- CARD 2: DATABASE HEALTH -->
      <div class="metric-card card">
        <div class="metric-icon db">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M21 19c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        </div>
        <div class="metric-content">
          <span class="metric-label">Database (Prisma SQLite)</span>
          <span class="metric-value" :class="{ 'text-danger': !healthData?.database?.connected }">
            {{ healthData?.database?.connected ? `${healthData.database.latencyMs} ms` : 'Disconnected' }}
          </span>
          <div class="metric-footer">
            <span>{{ healthData?.database?.companyCount || 0 }} Active Companies</span>
            <span class="badge" :class="healthData?.database?.connected ? 'badge-success' : 'badge-danger'">
              {{ healthData?.database?.connected ? 'Connected' : 'Error' }}
            </span>
          </div>
        </div>
      </div>

      <!-- CARD 3: MEMORY USAGE -->
      <div class="metric-card card">
        <div class="metric-icon memory">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
            <line x1="20" y1="9" x2="23" y2="9"></line>
            <line x1="20" y1="15" x2="23" y2="15"></line>
            <line x1="1" y1="9" x2="4" y2="9"></line>
            <line x1="1" y1="15" x2="4" y2="15"></line>
          </svg>
        </div>
        <div class="metric-content">
          <span class="metric-label">Heap Memory Used</span>
          <span class="metric-value">{{ healthData?.system?.memoryUsage?.heapUsedMb || 0 }} MB</span>
          <div class="metric-footer">
            <span>RSS: {{ healthData?.system?.memoryUsage?.rssMb || 0 }} MB</span>
            <span class="badge badge-info">Normal</span>
          </div>
        </div>
      </div>

      <!-- CARD 4: FRONTEND ASSETS -->
      <div class="metric-card card">
        <div class="metric-icon frontend">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <div class="metric-content">
          <span class="metric-label">Frontend Assets Build</span>
          <span class="metric-value">{{ healthData?.frontend?.buildExists ? 'Verified' : 'Missing' }}</span>
          <div class="metric-footer">
            <span>Path: {{ healthData?.frontend?.portalPath || '/portal' }}</span>
            <span class="badge" :class="healthData?.frontend?.buildExists ? 'badge-success' : 'badge-warning'">
              {{ healthData?.frontend?.buildExists ? 'Built' : 'Warning' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- API MODULES HEALTH MATRIX -->
    <div class="card apis-section">
      <div class="section-header">
        <div>
          <h2>API Subsystem Operational Matrix</h2>
          <p class="subtitle">Operational status of all 11 backend service endpoints</p>
        </div>
        <span class="badge badge-primary">{{ apiModules.length }} Active Modules</span>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Module Name</th>
              <th>Endpoint Path</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mod in apiModules" :key="mod.path">
              <td>
                <span class="status-chip" :class="mod.status">
                  <span class="chip-dot"></span>
                  {{ mod.status.toUpperCase() }}
                </span>
              </td>
              <td class="font-weight-bold">{{ mod.name }}</td>
              <td><code>{{ mod.path }}</code></td>
              <td class="text-muted">{{ mod.description }}</td>
              <td>
                <button @click="testApiModule(mod)" class="btn btn-sm btn-secondary" :disabled="testingModule === mod.path">
                  {{ testingModule === mod.path ? 'Testing...' : 'Test Probe' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PRODUCTION ENDPOINTS REFERENCE -->
    <div class="card reference-section">
      <h3>Production Observability Endpoints</h3>
      <p class="subtitle">Configure load balancers and uptime monitoring probes using these URLs</p>

      <div class="endpoints-grid">
        <div class="endpoint-box">
          <span class="method">GET</span>
          <code class="url">/health</code>
          <span class="desc">Root System & DB Probe</span>
        </div>
        <div class="endpoint-box">
          <span class="method">GET</span>
          <code class="url">/api/health</code>
          <span class="desc">API Subsystem Diagnostics</span>
        </div>
        <div class="endpoint-box">
          <span class="method">GET</span>
          <code class="url">/api/health/db</code>
          <span class="desc">Prisma SQLite Latency Probe</span>
        </div>
        <div class="endpoint-box">
          <span class="method">GET</span>
          <code class="url">/api/health/apis</code>
          <span class="desc">API Modules Inventory</span>
        </div>
        <div class="endpoint-box">
          <span class="method">GET</span>
          <code class="url">/api/health/frontend</code>
          <span class="desc">Static Portal Build Check</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getApiUrl } from '../config.js';

const healthData = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const lastChecked = ref(null);
const autoRefresh = ref(false);
const testingModule = ref('');
let timer = null;

const defaultModules = [
  { name: 'Auth Module', path: '/api/auth', status: 'ok', description: 'Authentication & Session Management' },
  { name: 'Companies Module', path: '/api/companies', status: 'ok', description: 'Multi-tenant Company Management' },
  { name: 'Users Module', path: '/api/users', status: 'ok', description: 'User RBAC & Credentials' },
  { name: 'Parties Module', path: '/api/parties', status: 'ok', description: 'Vendors & Consignees Directory' },
  { name: 'Stock Module', path: '/api/stock', status: 'ok', description: 'Warehouse Inventory & Duty Balance' },
  { name: 'Duty Rules Module', path: '/api/duty-rules', status: 'ok', description: 'Customs Duty Rate Calculator Rules' },
  { name: 'GR Docs Module', path: '/api/gr-docs', status: 'ok', description: 'GR Transaction Package Generation' },
  { name: 'GR Purchases Module', path: '/api/gr-purchases', status: 'ok', description: 'Inbound Warehousing & Bonded Receipts' },
  { name: 'Shipping Bills Module', path: '/api/shipping-bills', status: 'ok', description: 'Pink Shipping Bills Ex-Bond Exports' },
  { name: 'Monthly Returns Module', path: '/api/monthly-returns', status: 'ok', description: 'Customs Ex-Bond Monthly Compliance Reports' },
  { name: 'Audit Logs Module', path: '/api/audit-logs', status: 'ok', description: 'System Audit Trail & Diff Logs' }
];

const apiModules = computed(() => {
  return healthData.value?.apis?.modules || defaultModules;
});

const systemStatus = computed(() => {
  if (!healthData.value) return 'unknown';
  return healthData.value.status || 'ok';
});

const statusHeading = computed(() => {
  if (loading.value && !healthData.value) return 'Checking System...';
  if (systemStatus.value === 'ok') return 'All Systems Operational';
  if (systemStatus.value === 'degraded') return 'Degraded Performance';
  return 'System Alert';
});

async function fetchHealthData() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const healthUrl = getApiUrl('/health');
    const res = await fetch(healthUrl, { cache: 'no-store' });
    if (!res.ok && res.status !== 503) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    healthData.value = data;
    lastChecked.value = new Date().toISOString();
  } catch (err) {
    console.error('Failed to fetch health data:', err);
    errorMessage.value = `Unable to connect to health endpoint: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

async function testApiModule(mod) {
  testingModule.value = mod.path;
  try {
    const testUrl = getApiUrl(mod.path);
    const res = await fetch(testUrl, { method: 'OPTIONS' });
    console.log(`Probe ${mod.name}: HTTP ${res.status}`);
  } catch (err) {
    console.error(`Probe error for ${mod.name}:`, err);
  } finally {
    setTimeout(() => {
      testingModule.value = '';
    }, 400);
  }
}

function toggleAutoRefresh() {
  if (autoRefresh.value) {
    timer = setInterval(fetchHealthData, 10000);
  } else if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onMounted(() => {
  fetchHealthData();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.health-dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  padding: 24px;
  border-radius: 12px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
  margin: 8px 0 4px 0;
}

.subtitle {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-indicator.ok {
  background-color: #dcfce7;
  color: #15803d;
}

.status-indicator.degraded {
  background-color: #fef9c3;
  color: #a16207;
}

.status-indicator.error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.auto-refresh-toggle {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #475569;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spin-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.last-checked {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

/* METRICS GRID */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 20px;
  border-radius: 12px;
  display: flex;
  gap: 16px;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon.server { background: #eff6ff; color: #2563eb; }
.metric-icon.db { background: #f0fdf4; color: #16a34a; }
.metric-icon.memory { background: #faf5ff; color: #9333ea; }
.metric-icon.frontend { background: #fff7ed; color: #ea580c; }

.metric-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.metric-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 4px 0;
}

.metric-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #94a3b8;
}

.badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.badge-success { background: #dcfce7; color: #15803d; }
.badge-danger { background: #fee2e2; color: #b91c1c; }
.badge-warning { background: #fef9c3; color: #a16207; }
.badge-info { background: #e0f2fe; color: #0369a1; }
.badge-primary { background: #e0e7ff; color: #4338ca; }

/* TABLES & APIS */
.apis-section {
  padding: 24px;
  border-radius: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.status-chip.ok { background: #dcfce7; color: #16a34a; }
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* REFERENCE SECTION */
.reference-section {
  padding: 24px;
  border-radius: 12px;
}

.reference-section h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.endpoints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.endpoint-box {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.endpoint-box .method {
  font-size: 11px;
  font-weight: 800;
  color: #2563eb;
}

.endpoint-box .url {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.endpoint-box .desc {
  font-size: 12px;
  color: #64748b;
}
</style>
