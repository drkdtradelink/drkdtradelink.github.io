<template>
  <div class="bank-management-container">
    <!-- HEADER -->
    <div class="card p-4 mb-4" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">Bank & Financial Settings</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">Manage multiple company bank accounts, designate primary account for invoices, and track Bank Guarantees (BG).</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button @click="activeSubTab = 'accounts'" class="btn" :class="activeSubTab === 'accounts' ? 'btn-primary' : 'btn-secondary'">
            🏦 Bank Accounts ({{ accounts.length }})
          </button>
          <button @click="activeSubTab = 'guarantees'" class="btn" :class="activeSubTab === 'guarantees' ? 'btn-primary' : 'btn-secondary'">
            📜 Bank Guarantees ({{ guarantees.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- ALERT ERROR/SUCCESS -->
    <div v-if="alertMsg" class="alert mb-4" :class="alertType === 'error' ? 'alert-danger' : 'alert-success'">
      {{ alertMsg }}
    </div>

    <!-- SUB-TAB 1: BANK ACCOUNTS -->
    <div v-if="activeSubTab === 'accounts'">
      <div class="card p-4 mb-4" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: #0f172a;">Company Bank Accounts</h3>
          <button @click="openAddAccountModal" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Bank Account
          </button>
        </div>

        <div v-if="loadingAccounts" class="text-center p-4 text-muted">Loading bank accounts...</div>

        <div v-else-if="accounts.length === 0" class="text-center p-4" style="background: #f8fafc; border-radius: 8px; color: #64748b;">
          No bank accounts configured yet. Add your first bank account to display on commercial invoices.
        </div>

        <div v-else class="accounts-grid">
          <div v-for="acc in accounts" :key="acc.id" class="account-card" :class="{ 'primary-card': acc.isPrimary }">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <span v-if="acc.isPrimary" class="badge badge-success" style="font-size: 11px; padding: 4px 8px; margin-bottom: 6px; display: inline-block;">
                  ★ PRIMARY INVOICE ACCOUNT
                </span>
                <h4 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">{{ acc.bankName }}</h4>
                <p style="font-size: 13px; color: #475569; margin: 2px 0 0 0;">{{ acc.branchName }} Branch</p>
              </div>
              <div style="display: flex; gap: 6px;">
                <button @click="editAccount(acc)" class="btn btn-secondary btn-sm" title="Edit Account">Edit</button>
                <button @click="deleteAccount(acc)" class="btn btn-danger btn-sm" title="Delete Account">Delete</button>
              </div>
            </div>

            <div style="background: #f8fafc; border-radius: 6px; padding: 10px 12px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; border: 1px solid #e2e8f0;">
              <div><strong style="color: #64748b;">A/C Holder:</strong> <span style="font-weight: 600; color: #0f172a;">{{ acc.accountHolderName }}</span></div>
              <div><strong style="color: #64748b;">A/C Number:</strong> <code style="font-size: 14px; font-weight: 700; color: #1e3a8a;">{{ acc.accountNumber }}</code></div>
              <div><strong style="color: #64748b;">IFSC Code:</strong> <code style="font-size: 13px; font-weight: 600; color: #059669;">{{ acc.ifscCode }}</code></div>
            </div>

            <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
              <button v-if="!acc.isPrimary" @click="setPrimaryAccount(acc)" class="btn btn-outline-primary btn-sm">
                Make Primary for Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SUB-TAB 2: BANK GUARANTEES -->
    <div v-if="activeSubTab === 'guarantees'">
      <div class="card p-4 mb-4" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: #0f172a;">Customs Bank Guarantees (BG)</h3>
          <button @click="openAddGuaranteeModal" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Bank Guarantee
          </button>
        </div>

        <div v-if="loadingGuarantees" class="text-center p-4 text-muted">Loading bank guarantees...</div>

        <div v-else-if="guarantees.length === 0" class="text-center p-4" style="background: #f8fafc; border-radius: 8px; color: #64748b;">
          No Bank Guarantees recorded. Click "Add Bank Guarantee" to track company customs BG limits.
        </div>

        <div v-else class="table-responsive">
          <table class="table">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th>BG Number</th>
                <th>Issuing Bank</th>
                <th>BG Amount (INR)</th>
                <th>Expiry Date</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bg in guarantees" :key="bg.id">
                <td style="font-weight: 700; color: #1e3a8a;">{{ bg.bgNumber }}</td>
                <td style="font-weight: 600;">{{ bg.bankName }}</td>
                <td style="font-weight: 700; color: #059669;">₹ {{ Number(bg.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</td>
                <td>{{ bg.expiryDate ? new Date(bg.expiryDate).toLocaleDateString('en-GB') : 'N/A' }}</td>
                <td style="color: #64748b; font-size: 12px;">{{ bg.remarks || '-' }}</td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button @click="editGuarantee(bg)" class="btn btn-secondary btn-sm">Edit</button>
                    <button @click="deleteGuarantee(bg)" class="btn btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- BANK ACCOUNT MODAL -->
    <div v-if="showAccountModal" class="modal-backdrop">
      <div class="modal-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 700; margin: 0;">{{ editingAccountId ? 'Edit Bank Account' : 'Add Bank Account' }}</h3>
          <button @click="showAccountModal = false" class="btn btn-secondary btn-sm">✕</button>
        </div>

        <form @submit.prevent="saveAccount">
          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600;">Account Holder Name *</label>
            <input type="text" v-model="accountForm.accountHolderName" class="form-control" placeholder="e.g. MERAKI AQUATIC SOLUTIONS" required />
          </div>

          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600;">Bank Name *</label>
            <input type="text" v-model="accountForm.bankName" class="form-control" placeholder="e.g. PUNJAB NATIONAL BANK" required />
          </div>

          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600;">Account Number (Strictly Digits Only) *</label>
            <input type="text" v-model="accountForm.accountNumber" @input="onAccountNumberInput" class="form-control" placeholder="e.g. 00831100012345" required />
            <small v-if="accountNumError" style="color: #dc2626; font-size: 11px;">{{ accountNumError }}</small>
          </div>

          <div class="grid-2 mb-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">IFSC Code *</label>
              <input type="text" v-model="accountForm.ifscCode" class="form-control" placeholder="e.g. PUNB0008300" style="text-transform: uppercase;" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Branch Name *</label>
              <input type="text" v-model="accountForm.branchName" class="form-control" placeholder="e.g. GANDHIDHAM" required />
            </div>
          </div>

          <div class="form-group mb-4">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" v-model="accountForm.isPrimary" />
              <span style="font-weight: 600; font-size: 13px;">Set as Primary Bank Account for Invoices</span>
            </label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" @click="showAccountModal = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="savingAccount || !!accountNumError">
              {{ savingAccount ? 'Saving...' : 'Save Bank Account' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- BANK GUARANTEE MODAL -->
    <div v-if="showGuaranteeModal" class="modal-backdrop">
      <div class="modal-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 700; margin: 0;">{{ editingGuaranteeId ? 'Edit Bank Guarantee' : 'Add Bank Guarantee' }}</h3>
          <button @click="showGuaranteeModal = false" class="btn btn-secondary btn-sm">✕</button>
        </div>

        <form @submit.prevent="saveGuarantee">
          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600;">BG Number *</label>
            <input type="text" v-model="guaranteeForm.bgNumber" class="form-control" placeholder="e.g. 00831ILG001225" required />
          </div>

          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600;">Issuing Bank Name *</label>
            <input type="text" v-model="guaranteeForm.bankName" class="form-control" placeholder="e.g. Punjab National Bank" required />
          </div>

          <div class="grid-2 mb-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">BG Amount (INR) *</label>
              <input type="number" step="0.01" v-model="guaranteeForm.amount" class="form-control" placeholder="e.g. 5000000" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Expiry Date</label>
              <input type="date" v-model="guaranteeForm.expiryDate" class="form-control" />
            </div>
          </div>

          <div class="form-group mb-4">
            <label class="form-label" style="font-weight: 600;">Remarks / Customs Bond Ref</label>
            <textarea v-model="guaranteeForm.remarks" class="form-control" rows="2" placeholder="e.g. Executed for Kandla Special Bonded Warehouse limit"></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" @click="showGuaranteeModal = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="savingGuarantee">
              {{ savingGuarantee ? 'Saving...' : 'Save Bank Guarantee' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getApiUrl } from '../config.js';

const activeSubTab = ref('accounts');
const accounts = ref([]);
const guarantees = ref([]);
const loadingAccounts = ref(false);
const loadingGuarantees = ref(false);

const alertMsg = ref('');
const alertType = ref('success');

// Modal States
const showAccountModal = ref(false);
const editingAccountId = ref(null);
const savingAccount = ref(false);
const accountNumError = ref('');
const accountForm = ref({
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  isPrimary: false
});

const showGuaranteeModal = ref(false);
const editingGuaranteeId = ref(null);
const savingGuarantee = ref(false);
const guaranteeForm = ref({
  bgNumber: '',
  bankName: '',
  amount: '',
  expiryDate: '',
  remarks: ''
});

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

function showAlert(msg, type = 'success') {
  alertMsg.value = msg;
  alertType.value = type;
  setTimeout(() => { alertMsg.value = ''; }, 4000);
}

function onAccountNumberInput(e) {
  const val = e.target.value;
  if (val && !/^\d+$/.test(val)) {
    accountNumError.value = 'Account Number must contain strictly numbers (digits 0-9 only).';
  } else {
    accountNumError.value = '';
  }
}

async function fetchAccounts() {
  loadingAccounts.value = true;
  try {
    const res = await fetch(getApiUrl('/api/bank/accounts'), { headers: getHeaders() });
    if (res.ok) {
      accounts.value = await res.json();
    }
  } catch (err) {
    console.error('Fetch accounts error:', err);
  } finally {
    loadingAccounts.value = false;
  }
}

async function fetchGuarantees() {
  loadingGuarantees.value = true;
  try {
    const res = await fetch(getApiUrl('/api/bank/guarantees'), { headers: getHeaders() });
    if (res.ok) {
      guarantees.value = await res.json();
    }
  } catch (err) {
    console.error('Fetch guarantees error:', err);
  } finally {
    loadingGuarantees.value = false;
  }
}

function openAddAccountModal() {
  editingAccountId.value = null;
  accountNumError.value = '';
  accountForm.value = {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    isPrimary: accounts.value.length === 0
  };
  showAccountModal.value = true;
}

function editAccount(acc) {
  editingAccountId.value = acc.id;
  accountNumError.value = '';
  accountForm.value = {
    accountHolderName: acc.accountHolderName,
    bankName: acc.bankName,
    accountNumber: acc.accountNumber,
    ifscCode: acc.ifscCode,
    branchName: acc.branchName,
    isPrimary: acc.isPrimary
  };
  showAccountModal.value = true;
}

async function saveAccount() {
  if (accountNumError.value) return;
  savingAccount.value = true;
  try {
    const url = editingAccountId.value
      ? getApiUrl(`/api/bank/accounts/${editingAccountId.value}`)
      : getApiUrl('/api/bank/accounts');
    const method = editingAccountId.value ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(accountForm.value)
    });

    if (res.ok) {
      showAlert(editingAccountId.value ? 'Bank account updated successfully.' : 'Bank account added successfully.');
      showAccountModal.value = false;
      fetchAccounts();
    } else {
      const err = await res.json();
      showAlert(err.error || 'Failed to save bank account.', 'error');
    }
  } catch (err) {
    showAlert('Server error saving bank account.', 'error');
  } finally {
    savingAccount.value = false;
  }
}

async function setPrimaryAccount(acc) {
  try {
    const res = await fetch(getApiUrl(`/api/bank/accounts/${acc.id}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isPrimary: true })
    });
    if (res.ok) {
      showAlert(`"${acc.bankName}" is now the primary bank account for commercial invoices.`);
      fetchAccounts();
    }
  } catch (err) {
    showAlert('Failed to update primary account.', 'error');
  }
}

async function deleteAccount(acc) {
  if (!confirm(`Are you sure you want to delete bank account "${acc.bankName} - ${acc.accountNumber}"?`)) return;
  try {
    const res = await fetch(getApiUrl(`/api/bank/accounts/${acc.id}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      showAlert('Bank account deleted successfully.');
      fetchAccounts();
    }
  } catch (err) {
    showAlert('Failed to delete bank account.', 'error');
  }
}

function openAddGuaranteeModal() {
  editingGuaranteeId.value = null;
  guaranteeForm.value = {
    bgNumber: '',
    bankName: '',
    amount: '',
    expiryDate: '',
    remarks: ''
  };
  showGuaranteeModal.value = true;
}

function editGuarantee(bg) {
  editingGuaranteeId.value = bg.id;
  guaranteeForm.value = {
    bgNumber: bg.bgNumber,
    bankName: bg.bankName,
    amount: bg.amount,
    expiryDate: bg.expiryDate ? new Date(bg.expiryDate).toISOString().split('T')[0] : '',
    remarks: bg.remarks || ''
  };
  showGuaranteeModal.value = true;
}

async function saveGuarantee() {
  savingGuarantee.value = true;
  try {
    const url = editingGuaranteeId.value
      ? getApiUrl(`/api/bank/guarantees/${editingGuaranteeId.value}`)
      : getApiUrl('/api/bank/guarantees');
    const method = editingGuaranteeId.value ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(guaranteeForm.value)
    });

    if (res.ok) {
      showAlert(editingGuaranteeId.value ? 'Bank guarantee updated successfully.' : 'Bank guarantee recorded successfully.');
      showGuaranteeModal.value = false;
      fetchGuarantees();
    } else {
      const err = await res.json();
      showAlert(err.error || 'Failed to save bank guarantee.', 'error');
    }
  } catch (err) {
    showAlert('Server error saving bank guarantee.', 'error');
  } finally {
    savingGuarantee.value = false;
  }
}

async function deleteGuarantee(bg) {
  if (!confirm(`Are you sure you want to delete Bank Guarantee "${bg.bgNumber}"?`)) return;
  try {
    const res = await fetch(getApiUrl(`/api/bank/guarantees/${bg.id}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      showAlert('Bank guarantee deleted successfully.');
      fetchGuarantees();
    }
  } catch (err) {
    showAlert('Failed to delete bank guarantee.', 'error');
  }
}

onMounted(() => {
  fetchAccounts();
  fetchGuarantees();
});
</script>

<style scoped>
.bank-management-container {
  max-width: 1200px;
  margin: 0 auto;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.account-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.account-card.primary-card {
  border: 2px solid #059669;
  background: #f0fdf4;
}

.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 16px;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}
</style>
