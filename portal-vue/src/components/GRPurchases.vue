<template>
  <div class="header">
    <h2>GR Purchases (Inbound)</h2>
    <p>Manage incoming bonded stock and generate warehousing documents</p>
  </div>

  <div class="card mb-6">
    <div class="card-title">Create GR Purchase</div>
    <form @submit.prevent="createTransaction">
      <!-- Admin Target Company Selector -->
      <div v-if="currentUser?.role === 'admin'" class="form-group mb-4" style="background-color: #eff6ff; padding: 14px; border-radius: 6px; border: 1px solid #bfdbfe;">
        <label class="form-label" style="color: #1e40af; font-weight: 600;">Select Target Company Portal</label>
        <select v-model="form.companyId" class="form-control" @change="onCompanyChanged" required>
          <option value="">-- Choose Target Company --</option>
          <option v-for="comp in allCompanies" :key="comp.id" :value="comp.id">{{ comp.displayName }} ({{ comp.subdomain }})</option>
        </select>
        <p style="font-size: 11px; color: #1e40af; margin-top: 4px; margin-bottom: 0;">As Super Admin, select the company context to generate this transaction for.</p>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="form-label">GR Purchase Number</label>
          <input type="text" v-model="form.grPurchaseNumber" class="form-control" required />
        </div>
        <div>
          <label class="form-label">Date</label>
          <input type="date" v-model="form.date" class="form-control" required />
        </div>
        <div>
          <label class="form-label">Vendor</label>
          <select v-model="form.vendorId" class="form-control" required>
            <option value="">-- Select Vendor --</option>
            <option v-for="v in filteredVendors" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Exchange Rate (1 USD = INR)</label>
          <input type="number" step="0.01" v-model="form.exchangeRate" class="form-control" @input="recalcAll" required />
        </div>
      </div>

      <div class="card-title mt-6">Items</div>
      <table class="table mb-4">
        <thead>
          <tr>
            <th>Commodity</th>
            <th>Type</th>
            <th>Qty</th>
            <th>Packing</th>
            <th>Rate (USD/Case)</th>
            <th>USD Value</th>
            <th>Assessable (INR)</th>
            <th>Duty %</th>
            <th>Duty (INR)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in form.items" :key="idx">
            <td><input v-model="item.commodityName" class="form-control" required /></td>
            <td>
              <select v-model="item.commodityType" class="form-control" required>
                <option value="Beer">Beer</option>
                <option value="Alcohol/Wine">Alcohol/Wine</option>
                <option value="Cigarettes">Cigarettes</option>
              </select>
            </td>
            <td><input type="number" v-model="item.qty" class="form-control" @input="calc(item)" required style="width:70px;" /></td>
            <td><input v-model="item.packing" class="form-control" placeholder="1X12X100CL" style="width:110px;" /></td>
            <td><input type="number" step="0.01" v-model="item.rate" class="form-control" @input="calc(item)" required style="width:80px;" /></td>
            <td style="white-space:nowrap;">{{ item.usdValue?.toFixed(2) }}</td>
            <td style="white-space:nowrap;">{{ item.assessableValueInr?.toFixed(2) }}</td>
            <td><input type="number" step="0.01" v-model="item.dutyPercentage" class="form-control" @input="calcDuty(item)" style="width:70px;" required /></td>
            <td style="white-space:nowrap;">{{ item.dutyAmountInr?.toFixed(2) }}</td>
            <td><button type="button" @click="removeItem(idx)" class="btn btn-danger btn-sm">X</button></td>
          </tr>
        </tbody>
        <tfoot v-if="form.items.length">
          <tr style="font-weight:bold;">
            <td colspan="2">TOTAL</td>
            <td>{{ form.items.reduce((s,i) => s + (+i.qty||0), 0) }}</td>
            <td></td>
            <td></td>
            <td>{{ form.items.reduce((s,i) => s + (+i.usdValue||0), 0).toFixed(2) }}</td>
            <td>{{ form.items.reduce((s,i) => s + (+i.assessableValueInr||0), 0).toFixed(2) }}</td>
            <td></td>
            <td>{{ form.items.reduce((s,i) => s + (+i.dutyAmountInr||0), 0).toFixed(2) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <button type="button" @click="addItem" class="btn btn-secondary btn-sm mb-4">+ Add Item</button>

      <div class="flex gap-4">
        <button type="submit" class="btn btn-primary" :disabled="loading">Save Draft</button>
      </div>
    </form>
  </div>

  <div class="card">
    <div class="card-title">GR Purchase Transactions</div>
    <table class="table">
      <thead>
        <tr>
          <th>GR Number</th>
          <th>Date</th>
          <th>Vendor</th>
          <th>Bond Value</th>
          <th>Status</th>
          <th>Actions &amp; Documents</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tx in transactions" :key="tx.id">
          <td>{{ tx.grPurchaseNumber }}</td>
          <td>{{ new Date(tx.date).toLocaleDateString('en-GB') }}</td>
          <td>{{ tx.vendor?.name }}</td>
          <td>Rs. {{ tx.bondValue?.toFixed(2) }}</td>
          <td>
            <span class="badge" :class="tx.status === 'finalized' ? 'badge-success' : 'badge-warning'">{{ tx.status }}</span>
          </td>
          <td>
            <div class="flex gap-1 flex-wrap">
              <button v-if="tx.status === 'draft'" @click="openFinalizeModal(tx.id)" class="btn btn-primary btn-sm mr-2" :disabled="loading">Finalize</button>
              <button @click="openPreview(tx, 'bond')" class="btn btn-secondary btn-sm">Preview Docs</button>
            </div>
          </td>
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
          <h3 style="font-size: 15px; font-weight: 700; margin: 0;">Document Package Preview — {{ activeTx?.grPurchaseNumber }}</h3>
          <p style="font-size: 12px; color: #6b7280; margin: 2px 0 0 0;">Viewing: {{ activeDoc.replace('-', ' ').toUpperCase() }}</p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button @click="printDoc" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 6px;">
            🖨️ Print Current
          </button>
          <button @click="showPreviewModal = false" class="btn btn-danger btn-sm" style="font-weight: bold; font-size: 16px; line-height: 1; padding: 4px 10px;">✕</button>
        </div>
      </div>

      <!-- Document Navigation Tabs -->
      <div style="display: flex; gap: 6px; padding: 10px 20px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; overflow-x: auto;">
        <button @click="activeDoc = 'bond'" class="btn btn-sm" :class="activeDoc === 'bond' ? 'btn-primary' : 'btn-secondary'">1. Triple Duty Bond</button>
        <button @click="activeDoc = 'submission-letter'" class="btn btn-sm" :class="activeDoc === 'submission-letter' ? 'btn-primary' : 'btn-secondary'">2. Bond Submission Letter</button>
        <button @click="activeDoc = 'notesheet'" class="btn btn-sm" :class="activeDoc === 'notesheet' ? 'btn-primary' : 'btn-secondary'">3. Notesheet</button>
        <button @click="activeDoc = 'duty-calculation'" class="btn btn-sm" :class="activeDoc === 'duty-calculation' ? 'btn-primary' : 'btn-secondary'">4. Duty Calculation</button>
        <button @click="activeDoc = 'stocklist'" class="btn btn-sm" :class="activeDoc === 'stocklist' ? 'btn-primary' : 'btn-secondary'">5. Stocklist / Tally</button>
      </div>

      <!-- Embedded Iframe -->
      <div style="flex: 1; position: relative; background: #f1f5f9; display: flex; justify-content: center; align-items: center; padding: 12px; overflow: auto;">
        <iframe id="grPreviewFrame" :src="getApiUrl('/api/gr-purchases/' + activeTx?.id + '/preview/' + activeDoc + '?token=' + token)" style="width: 100%; height: 100%; border: none; background-color: #ffffff; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></iframe>
      </div>

    </div>
  </div>
  <!-- FINALIZE MODAL FOR CUSTOM BOND NUMBER -->
  <div v-if="showFinalizeModal" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
    <div class="modal-card" style="background: white; border-radius: 8px; width: 100%; max-width: 450px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
      <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 12px 0; color: #1e3a8a;">Finalize GR Purchase</h3>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 16px;">
        Please enter the official <strong>Customs Allotted Bond Number</strong> to finalize this purchase and transfer stock to warehouse inventory.
      </p>
      <form @submit.prevent="submitFinalize">
        <div class="form-group mb-4">
          <label class="form-label" style="font-weight: 600;">Customs Allotted Bond Number *</label>
          <input type="text" v-model="customBondNumberInput" class="form-control" placeholder="e.g. BOND/2026/089" required />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" @click="showFinalizeModal = false" class="btn btn-secondary btn-sm">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="loading">Confirm &amp; Finalize</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getApiUrl } from '../config.js';

const props = defineProps({
  token: String,
  currentUser: Object,
  vendors: Array,
  allCompanies: Array
});

const form = ref({
  companyId: props.currentUser?.companyId || '',
  grPurchaseNumber: '',
  date: new Date().toISOString().split('T')[0],
  vendorId: '',
  exchangeRate: 84.50,
  items: []
});

const transactions = ref([]);
const loading = ref(false);

const showPreviewModal = ref(false);
const showFinalizeModal = ref(false);
const finalizeTxId = ref(null);
const customBondNumberInput = ref('');
const activeTx = ref(null);
const activeDoc = ref('bond');

const filteredVendors = computed(() => {
  if (props.currentUser?.role === 'admin' && form.value.companyId) {
    return (props.vendors || []).filter(v => v.companyId === form.value.companyId || !v.companyId);
  }
  return props.vendors || [];
});

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${props.token}`
});

const fetchNextNumber = async () => {
  let url = '/api/gr-purchases/next-number';
  if (form.value.companyId) url += `?companyId=${form.value.companyId}`;
  const res = await fetch(getApiUrl(url), { headers: getHeaders() });
  const data = await res.json();
  if (data.nextNumber) form.value.grPurchaseNumber = data.nextNumber;
};

const loadTransactions = async () => {
  const res = await fetch(getApiUrl('/api/gr-purchases'), { headers: getHeaders() });
  const data = await res.json();
  transactions.value = data.transactions || [];
};

const onCompanyChanged = () => {
  form.value.vendorId = '';
  fetchNextNumber();
};

const addItem = () => {
  const item = {
    commodityName: '',
    commodityType: 'Beer',
    qty: 1,
    unit: 'Cases',
    packing: '',
    rate: 0,
    usdValue: 0,
    assessableValueInr: 0,
    dutyPercentage: 110,
    dutyAmountInr: 0
  };
  calc(item);
  form.value.items.push(item);
};

const removeItem = (idx) => {
  form.value.items.splice(idx, 1);
};

const calc = (item) => {
  item.usdValue = (item.qty || 0) * (item.rate || 0);
  item.assessableValueInr = item.usdValue * (form.value.exchangeRate || 84.50);
  calcDuty(item);
};

const calcDuty = (item) => {
  item.dutyAmountInr = (item.assessableValueInr || 0) * ((item.dutyPercentage || 0) / 100);
};

const recalcAll = () => {
  form.value.items.forEach(item => calc(item));
};

const createTransaction = async () => {
  loading.value = true;
  try {
    const res = await fetch(getApiUrl('/api/gr-purchases'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(form.value)
    });
    if (res.ok) {
      alert('Draft saved!');
      loadTransactions();
      form.value.items = [];
      fetchNextNumber();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to save');
    }
  } finally {
    loading.value = false;
  }
};

const openFinalizeModal = (id) => {
  finalizeTxId.value = id;
  customBondNumberInput.value = '';
  showFinalizeModal.value = true;
};

const submitFinalize = async () => {
  if (!customBondNumberInput.value.trim()) {
    alert('Please enter Customs Allotted Bond Number.');
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(getApiUrl(`/api/gr-purchases/${finalizeTxId.value}/finalize`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ customBondNumber: customBondNumberInput.value.trim() })
    });
    if (res.ok) {
      alert('Finalized successfully! Stock added to inventory.');
      showFinalizeModal.value = false;
      loadTransactions();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to finalize');
    }
  } finally {
    loading.value = false;
  }
};

const openPreview = (tx, doc = 'bond') => {
  activeTx.value = tx;
  activeDoc.value = doc;
  showPreviewModal.value = true;
};

const printDoc = () => {
  const frame = document.getElementById('grPreviewFrame');
  if (frame && frame.contentWindow) {
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }
};

onMounted(() => {
  fetchNextNumber();
  loadTransactions();
});
</script>
