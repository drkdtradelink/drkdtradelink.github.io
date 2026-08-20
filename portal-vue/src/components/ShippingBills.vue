<template>
  <div class="header">
    <h2>Pink Shipping Bills</h2>
    <p>Manage outbound ex-bond export shipments and generate shipping documents</p>
  </div>

  <div class="card mb-6">
    <div class="card-title">Create Shipping Bill</div>
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
          <label class="form-label">SB Number</label>
          <input type="text" v-model="form.sbNumber" class="form-control" required />
        </div>
        <div>
          <label class="form-label">Date</label>
          <input type="date" v-model="form.date" class="form-control" required />
        </div>
        <div>
          <label class="form-label">Consignee (Vessel Master / Buyer)</label>
          <select v-model="form.consigneeId" class="form-control" required>
            <option value="">-- Select Consignee --</option>
            <option v-for="c in filteredConsignees" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Vessel Name</label>
          <input type="text" v-model="form.vesselName" class="form-control" placeholder="MT SOYO" />
        </div>
        <div>
          <label class="form-label">Rotation No.</label>
          <input type="text" v-model="form.rotationNo" class="form-control" placeholder="1XY1S021" />
        </div>
        <div>
          <label class="form-label">Port of Loading</label>
          <input type="text" v-model="form.portOfLoading" class="form-control" placeholder="Kandla / Dahej Port" />
        </div>
        <div>
          <label class="form-label">Port of Discharge</label>
          <input type="text" v-model="form.portOfDischarge" class="form-control" placeholder="AT Dahej Port" />
        </div>
        <div>
          <label class="form-label">Invoice Number</label>
          <input type="text" v-model="form.invoiceNumber" class="form-control" :placeholder="'INV-' + form.sbNumber" />
        </div>
        <div>
          <label class="form-label">Exchange Rate (1 USD = INR)</label>
          <input type="number" step="0.01" v-model="form.exchangeRate" class="form-control" required />
        </div>
      </div>

      <div class="card-title mt-6">Select Bonded Stock Items to Export</div>
      <table class="table mb-4">
        <thead>
          <tr>
            <th>Select Stock</th>
            <th>Bond No.</th>
            <th>Remaining Qty</th>
            <th>Export Qty</th>
            <th>FOB Value (USD)</th>
            <th>FOB Value (INR)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in form.items" :key="idx">
            <td>
              <select v-model="item.stockItemId" class="form-control" required @change="updateStockInfo(item)">
                <option value="">-- Select Bonded Stock --</option>
                <option v-for="s in filteredStock" :key="s.id" :value="s.id">
                  {{ s.commodityName }} ({{ s.remainingQuantity }} rem)
                </option>
              </select>
            </td>
            <td>{{ item._bondNo || '-' }}</td>
            <td>{{ item._remainingQty || '-' }}</td>
            <td>
              <input type="number" v-model="item.exportQty" class="form-control" required :max="item._remainingQty" style="width:80px;" @input="calcFOBINR(item)" />
            </td>
            <td>
              <input type="number" step="0.01" v-model="item.fobValue" class="form-control" style="width:100px;" @input="calcFOBINR(item)" required />
            </td>
            <td style="white-space:nowrap;">{{ item._fobInr ? item._fobInr.toFixed(2) : '-' }}</td>
            <td><button type="button" @click="removeItem(idx)" class="btn btn-danger btn-sm">X</button></td>
          </tr>
        </tbody>
        <tfoot v-if="form.items.length">
          <tr style="font-weight:bold;">
            <td colspan="3">TOTAL FOB (USD)</td>
            <td>{{ form.items.reduce((s,i) => s + (+i.exportQty||0), 0) }} cases</td>
            <td>{{ form.items.reduce((s,i) => s + (+i.fobValue||0), 0).toFixed(2) }}</td>
            <td>{{ form.items.reduce((s,i) => s + (i._fobInr||0), 0).toFixed(2) }}</td>
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
    <div class="card-title">Shipping Bill Transactions</div>
    <table class="table">
      <thead>
        <tr>
          <th>SB Number</th>
          <th>Date</th>
          <th>Consignee</th>
          <th>Vessel</th>
          <th>Port</th>
          <th>Status</th>
          <th>Actions &amp; Documents</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tx in transactions" :key="tx.id">
          <td>{{ tx.sbNumber }}</td>
          <td>{{ new Date(tx.date).toLocaleDateString('en-GB') }}</td>
          <td>{{ tx.consignee?.name }}</td>
          <td>{{ tx.vesselName || '-' }}</td>
          <td>{{ tx.portOfLoading || '-' }}</td>
          <td>
            <span class="badge" :class="tx.status === 'finalized' ? 'badge-success' : 'badge-warning'">{{ tx.status }}</span>
          </td>
          <td>
            <div class="flex gap-1 flex-wrap">
              <button v-if="tx.status === 'draft'" @click="finalize(tx.id)" class="btn btn-primary btn-sm mr-2" :disabled="loading">Finalize</button>
              <button @click="openPreview(tx, 'sb-all')" class="btn btn-secondary btn-sm">Preview Docs</button>
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
          <h3 style="font-size: 15px; font-weight: 700; margin: 0;">Shipping Bill Package Preview — {{ activeTx?.sbNumber }}</h3>
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
        <button @click="activeDoc = 'sb-all'" class="btn btn-sm" :class="activeDoc === 'sb-all' ? 'btn-primary' : 'btn-secondary'">1. Pink SB (4 Copies)</button>
        <button @click="activeDoc = 'notesheet'" class="btn btn-sm" :class="activeDoc === 'notesheet' ? 'btn-primary' : 'btn-secondary'">2. Notesheet</button>
        <button @click="activeDoc = 'duty-calculation'" class="btn btn-sm" :class="activeDoc === 'duty-calculation' ? 'btn-primary' : 'btn-secondary'">3. Duty Calculation</button>
        <button @click="activeDoc = 'invoice'" class="btn btn-sm" :class="activeDoc === 'invoice' ? 'btn-primary' : 'btn-secondary'">4. Export Invoice</button>
        <button @click="activeDoc = 'delivery-challan'" class="btn btn-sm" :class="activeDoc === 'delivery-challan' ? 'btn-primary' : 'btn-secondary'">5. Delivery Challan</button>
        <button @click="activeDoc = 'packing-list'" class="btn btn-sm" :class="activeDoc === 'packing-list' ? 'btn-primary' : 'btn-secondary'">6. Packing List</button>
      </div>

      <!-- Embedded Iframe -->
      <div style="flex: 1; position: relative; background: #525659;">
        <iframe id="sbPreviewFrame" :src="'/api/shipping-bills/' + activeTx?.id + '/preview/' + activeDoc + '?token=' + token" style="width: 100%; height: 100%; border: none;"></iframe>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  token: String,
  currentUser: Object,
  consignees: Array,
  allCompanies: Array
});

const form = ref({
  companyId: props.currentUser?.companyId || '',
  sbNumber: '',
  date: new Date().toISOString().split('T')[0],
  consigneeId: '',
  vesselName: '',
  rotationNo: '',
  portOfLoading: '',
  portOfDischarge: '',
  invoiceNumber: '',
  exchangeRate: 93.45,
  items: []
});

const transactions = ref([]);
const availableStock = ref([]);
const loading = ref(false);

const showPreviewModal = ref(false);
const activeTx = ref(null);
const activeDoc = ref('sb-all');

const filteredConsignees = computed(() => {
  if (props.currentUser?.role === 'admin' && form.value.companyId) {
    return (props.consignees || []).filter(c => c.companyId === form.value.companyId || !c.companyId);
  }
  return props.consignees || [];
});

const filteredStock = computed(() => {
  if (props.currentUser?.role === 'admin' && form.value.companyId) {
    return availableStock.value.filter(s => s.companyId === form.value.companyId || !s.companyId);
  }
  return availableStock.value;
});

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${props.token}`
});

const fetchNextNumber = async () => {
  let url = '/api/shipping-bills/next-number';
  if (form.value.companyId) url += `?companyId=${form.value.companyId}`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (data.nextNumber) form.value.sbNumber = data.nextNumber;
};

const loadStock = async () => {
  const res = await fetch('/api/stock-items?status=active', { headers: getHeaders() });
  const data = await res.json();
  availableStock.value = (data.stockItems || []).filter(s => s.remainingQuantity > 0);
};

const loadTransactions = async () => {
  const res = await fetch('/api/shipping-bills', { headers: getHeaders() });
  const data = await res.json();
  transactions.value = data.transactions || [];
};

const onCompanyChanged = () => {
  form.value.consigneeId = '';
  form.value.items = [];
  fetchNextNumber();
};

const addItem = () => {
  form.value.items.push({
    stockItemId: '',
    exportQty: 0,
    fobValue: 0,
    _bondNo: '',
    _remainingQty: 0,
    _fobInr: 0
  });
};

const removeItem = (idx) => {
  form.value.items.splice(idx, 1);
};

const updateStockInfo = (item) => {
  const stock = availableStock.value.find(s => s.id === item.stockItemId);
  if (stock) {
    item._bondNo = stock.bondNumber || '-';
    item._remainingQty = stock.remainingQuantity;
    item._beDetails = stock.beDetails;
  }
};

const calcFOBINR = (item) => {
  item._fobInr = (item.fobValue || 0) * (form.value.exchangeRate || 93.45);
};

const createTransaction = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/shipping-bills', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...form.value,
        items: form.value.items.map(i => ({
          stockItemId: i.stockItemId,
          exportQty: i.exportQty,
          fobValue: i.fobValue
        }))
      })
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

const finalize = async (id) => {
  if (!confirm('Are you sure? This will deduct stock and lock the document.')) return;
  loading.value = true;
  try {
    const res = await fetch(`/api/shipping-bills/${id}/finalize`, { method: 'POST', headers: getHeaders() });
    if (res.ok) {
      alert('Finalized successfully!');
      loadTransactions();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to finalize');
    }
  } finally {
    loading.value = false;
  }
};

const openPreview = (tx, doc = 'sb-all') => {
  activeTx.value = tx;
  activeDoc.value = doc;
  showPreviewModal.value = true;
};

const printDoc = () => {
  const frame = document.getElementById('sbPreviewFrame');
  if (frame && frame.contentWindow) {
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }
};

onMounted(() => {
  fetchNextNumber();
  loadStock();
  loadTransactions();
});
</script>
