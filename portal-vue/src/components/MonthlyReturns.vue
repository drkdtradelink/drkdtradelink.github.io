<template>
  <div class="header">
    <h2>Monthly Warehouse Returns &amp; Stock Reconciliation</h2>
    <p>Reconcile monthly bonded stock movements, inward receipts, ex-bond sales, exports, and document checklists</p>
  </div>

  <!-- RETURN GENERATOR & FILTERS -->
  <div class="card mb-6">
    <div class="card-title">Generate / View Monthly Return</div>
    
    <!-- Admin Target Company Selector -->
    <div v-if="currentUser?.role === 'admin'" class="form-group mb-4" style="background-color: #eff6ff; padding: 14px; border-radius: 6px; border: 1px solid #bfdbfe;">
      <label class="form-label" style="color: #1e40af; font-weight: 600;">Select Target Company Portal</label>
      <select v-model="selectedCompanyId" class="form-control" @change="onPeriodOrCompanyChanged">
        <option value="">-- Choose Target Company --</option>
        <option v-for="comp in allCompanies" :key="comp.id" :value="comp.id">{{ comp.displayName }} ({{ comp.subdomain }})</option>
      </select>
      <p style="font-size: 11px; color: #1e40af; margin-top: 4px; margin-bottom: 0;">Select company context to run monthly stock ledger reconciliation.</p>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-4" style="align-items: flex-end;">
      <div>
        <label class="form-label">Select Return Period (Month / Year)</label>
        <input type="month" v-model="selectedPeriod" class="form-control" @change="onPeriodOrCompanyChanged" required />
      </div>
      <div>
        <button @click="calculateReturn" class="btn btn-primary" :disabled="loading" style="height: 42px; width: 100%;">
          🔍 Reconcile &amp; Calculate Return
        </button>
      </div>
      <div>
        <button v-if="returnData" @click="saveReturn('submitted')" class="btn btn-secondary" :disabled="loading" style="height: 42px; width: 100%;">
          📄 Finalize &amp; Mark Submitted
        </button>
      </div>
    </div>
  </div>

  <!-- RECONCILIATION SUMMARY CARDS -->
  <div v-if="returnData" class="grid grid-cols-3 gap-4 mb-6">
    <div class="card" style="border-top: 4px solid #3b82f6;">
      <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Inbound Receipts (This Month)</div>
      <div style="font-size: 24px; font-weight: 700; color: #1e40af; margin-top: 6px;">
        {{ returnData.summary.totalInboundQty }} Cases
      </div>
      <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">
        Duty Accrued: <b>Rs. {{ returnData.summary.totalInboundDuty?.toFixed(2) }}</b>
      </div>
    </div>

    <div class="card" style="border-top: 4px solid #f59e0b;">
      <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Outbound Dispatches / Sales / Exports</div>
      <div style="font-size: 24px; font-weight: 700; color: #d97706; margin-top: 6px;">
        {{ returnData.summary.totalOutboundQty }} Cases
      </div>
      <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">
        Duty Debited: <b>Rs. {{ returnData.summary.totalOutboundDuty?.toFixed(2) }}</b>
      </div>
    </div>

    <div class="card" style="border-top: 4px solid #10b981;">
      <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Current Closing Stock Balance</div>
      <div style="font-size: 24px; font-weight: 700; color: #059669; margin-top: 6px;">
        {{ returnData.summary.totalClosingQty }} Cases
      </div>
      <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">
        Duty Balance: <b>Rs. {{ returnData.summary.totalClosingDutyBalance?.toFixed(2) }}</b>
      </div>
    </div>
  </div>

  <!-- DETAILED RECONCILIATION TABLES -->
  <div v-if="returnData">
    <!-- INBOUND TABLE -->
    <div class="card mb-6">
      <div class="card-title">1. Inbound Stock Received (GR Purchases &amp; Inward BEs)</div>
      <table class="table">
        <thead>
          <tr>
            <th>Doc No &amp; Date</th>
            <th>Bond Number</th>
            <th>Supplier / Vendor</th>
            <th>Commodity Name</th>
            <th>Inward Qty</th>
            <th>Assessable Value (INR)</th>
            <th>Duty Value (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in returnData.inboundRows" :key="idx">
            <td><b>{{ item.docNumber }}</b><br><small>{{ formatDate(item.date) }}</small></td>
            <td>{{ item.bondNumber }}</td>
            <td>{{ item.partyName }}</td>
            <td>{{ item.commodityName }}</td>
            <td><b>{{ item.qty }}</b> {{ item.unit || 'Cases' }}</td>
            <td>Rs. {{ item.assessableValueInr?.toFixed(2) }}</td>
            <td>Rs. {{ item.dutyAmountInr?.toFixed(2) }}</td>
          </tr>
          <tr v-if="!returnData.inboundRows.length">
            <td colspan="7" class="text-center">No inward receipts recorded for this month.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- OUTBOUND TABLE -->
    <div class="card mb-6">
      <div class="card-title">2. Outbound Dispatches (Pink Shipping Bills &amp; Ex-Bond Sales)</div>
      <table class="table">
        <thead>
          <tr>
            <th>Doc No &amp; Date</th>
            <th>Bond Number</th>
            <th>Consignee / Buyer</th>
            <th>Commodity Name</th>
            <th>Outward Qty</th>
            <th>Dispatch Category</th>
            <th>Duty Debited (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in returnData.outboundRows" :key="idx">
            <td><b>{{ item.docNumber }}</b><br><small>{{ formatDate(item.date) }}</small></td>
            <td>{{ item.bondNumber }}</td>
            <td>{{ item.partyName }}</td>
            <td>{{ item.commodityName }}</td>
            <td><b>{{ item.qty }}</b> {{ item.unit || 'Cases' }}</td>
            <td><span class="badge" :class="item.docType.includes('Export') ? 'badge-info' : 'badge-success'">{{ item.docType }}</span></td>
            <td>Rs. {{ item.dutyDebitedINR?.toFixed(2) }}</td>
          </tr>
          <tr v-if="!returnData.outboundRows.length">
            <td colspan="7" class="text-center">No outward dispatches recorded for this month.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- COMPLIANCE CHECKLIST -->
    <div class="card mb-6">
      <div class="card-title">3. Monthly Return Compliance Checklist</div>
      <div class="flex flex-col gap-3" style="margin-top: 12px;">
        <label v-for="c in returnData.checklist" :key="c.id" style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 10px 14px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
          <input type="checkbox" v-model="c.completed" style="width: 18px; height: 18px;" />
          <span style="font-size: 13px; font-weight: 500;" :style="{ textDecoration: c.completed ? 'none' : 'none', color: c.completed ? '#111827' : '#374151' }">
            {{ c.text }}
          </span>
          <span v-if="c.required" class="badge badge-warning" style="margin-left: auto;">Mandatory</span>
        </label>
      </div>

      <div class="flex gap-4 mt-6">
        <button @click="saveReturn('draft')" class="btn btn-primary" :disabled="loading">
          💾 Save Return Snapshot
        </button>
        <button v-if="savedReturnId" @click="openPreviewReport" class="btn btn-secondary">
          🖨️ Preview &amp; Print Return Statement
        </button>
      </div>
    </div>
  </div>

  <!-- SAVED MONTHLY RETURNS HISTORY -->
  <div class="card">
    <div class="card-title">Saved Monthly Returns History</div>
    <table class="table">
      <thead>
        <tr>
          <th>Return Number</th>
          <th>Period</th>
          <th>Date Range</th>
          <th>Prepared By</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ret in savedReturns" :key="ret.id">
          <td><b>{{ ret.returnNumber }}</b></td>
          <td>{{ ret.period }}</td>
          <td>{{ formatDate(ret.startDate) }} — {{ formatDate(ret.endDate) }}</td>
          <td>{{ ret.user?.name || 'Admin' }}</td>
          <td>
            <span class="badge" :class="ret.status === 'submitted' ? 'badge-success' : 'badge-warning'">
              {{ ret.status.toUpperCase() }}
            </span>
          </td>
          <td>
            <button @click="openReportById(ret.id)" class="btn btn-secondary btn-sm">
              🖨️ View / Print Statement
            </button>
          </td>
        </tr>
        <tr v-if="!savedReturns.length">
          <td colspan="6" class="text-center">No saved monthly returns found. Select a period above to calculate.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- IN-PAGE DOCUMENT PREVIEW MODAL -->
  <div v-if="showPreviewModal" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
    <div class="modal-card" style="background: white; border-radius: 8px; width: 95vw; max-width: 1200px; height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
      
      <!-- Modal Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
        <div>
          <h3 style="font-size: 15px; font-weight: 700; margin: 0;">Monthly Warehouse Return Statement</h3>
          <p style="font-size: 12px; color: #6b7280; margin: 2px 0 0 0;">Official Monthly Stock &amp; Duty Reconciliation Statement</p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button @click="printDoc" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 6px;">
            🖨️ Print Statement
          </button>
          <button @click="showPreviewModal = false" class="btn btn-danger btn-sm" style="font-weight: bold; font-size: 16px; line-height: 1; padding: 4px 10px;">✕</button>
        </div>
      </div>

      <!-- Embedded Iframe -->
      <div style="flex: 1; position: relative; background: #f1f5f9; display: flex; justify-content: center; align-items: center; padding: 12px; overflow: auto;">
        <iframe id="monthlyReturnFrame" :src="getApiUrl('/api/monthly-returns/' + activeReturnId + '/preview/report?token=' + token)" style="width: 100%; height: 100%; border: none; background-color: #ffffff; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></iframe>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getApiUrl } from '../config.js';

const props = defineProps({
  token: String,
  currentUser: Object,
  allCompanies: Array
});

const selectedCompanyId = ref(props.currentUser?.companyId || '');
const selectedPeriod = ref(new Date().toISOString().substring(0, 7)); // e.g. "2026-08"

const returnData = ref(null);
const savedReturns = ref([]);
const savedReturnId = ref(null);
const loading = ref(false);

const showPreviewModal = ref(false);
const activeReturnId = ref(null);

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${props.token}`
});

const formatDate = (dateVal) => {
  if (!dateVal) return '';
  return new Date(dateVal).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const onPeriodOrCompanyChanged = () => {
  returnData.value = null;
  savedReturnId.value = null;
};

const calculateReturn = async () => {
  loading.value = true;
  try {
    let url = `/api/monthly-returns/calculate?period=${selectedPeriod.value}`;
    if (selectedCompanyId.value) url += `&companyId=${selectedCompanyId.value}`;

    const res = await fetch(getApiUrl(url), { headers: getHeaders() });
    if (res.ok) {
      returnData.value = await res.json();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to calculate return.');
    }
  } finally {
    loading.value = false;
  }
};

const saveReturn = async (status = 'draft') => {
  if (!returnData.value) return;
  loading.value = true;
  try {
    const payload = {
      companyId: selectedCompanyId.value,
      period: returnData.value.period,
      startDate: returnData.value.startDate,
      endDate: returnData.value.endDate,
      inboundRows: returnData.value.inboundRows,
      outboundRows: returnData.value.outboundRows,
      closingStock: returnData.value.closingStock,
      checklist: returnData.value.checklist,
      status
    };

    const res = await fetch(getApiUrl('/api/monthly-returns'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const saved = await res.json();
      savedReturnId.value = saved.id;
      alert(`Monthly return ${status === 'submitted' ? 'finalized & marked submitted' : 'draft saved'} successfully!`);
      loadSavedReturns();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to save return.');
    }
  } finally {
    loading.value = false;
  }
};

const loadSavedReturns = async () => {
  const res = await fetch(getApiUrl('/api/monthly-returns'), { headers: getHeaders() });
  if (res.ok) {
    const data = await res.json();
    savedReturns.value = data.returns || [];
  }
};

const openPreviewReport = () => {
  if (savedReturnId.value) {
    activeReturnId.value = savedReturnId.value;
    showPreviewModal.value = true;
  } else {
    alert('Please save the return draft first to view the report.');
  }
};

const openReportById = (id) => {
  activeReturnId.value = id;
  showPreviewModal.value = true;
};

const printDoc = () => {
  const frame = document.getElementById('monthlyReturnFrame');
  if (frame && frame.contentWindow) {
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }
};

onMounted(() => {
  loadSavedReturns();
  calculateReturn();
});
</script>
