<template>


<div id="app">
  <!-- CUSTOM CONFIRMATION MODAL -->
  <div v-if="confirmModal.show" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999;">
    <div class="card" style="width: 100%; max-width: 450px; margin-bottom: 0; padding: 28px; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
      <h3 style="font-size: 18px; font-weight: 700; color: var(--secondary); margin-bottom: 12px;">{{ confirmModal.title }}</h3>
      <p style="font-size: 14px; color: var(--text-muted); line-height: 1.5; margin-bottom: 24px;">{{ confirmModal.message }}</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" @click="closeConfirm(false)" class="btn btn-secondary">Cancel</button>
        <button type="button" @click="closeConfirm(true)" class="btn btn-danger">Confirm</button>
      </div>
    </div>
  </div>

  <!-- CUSTOM PROMPT MODAL -->
  <div v-if="promptModal.show" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999;">
    <div class="card" style="width: 100%; max-width: 450px; margin-bottom: 0; padding: 28px; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
      <h3 style="font-size: 18px; font-weight: 700; color: var(--secondary); margin-bottom: 12px;">{{ promptModal.title }}</h3>
      <p style="font-size: 14px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px;">{{ promptModal.message }}</p>
      
      <!-- Input 1: Optional Target Input (e.g. New Password) -->
      <div v-if="promptModal.showValueInput" class="form-group">
        <label class="form-label">{{ promptModal.valueLabel }}</label>
        <input :type="promptModal.valueInputType || 'text'" v-model="promptModal.value" class="form-control" required>
      </div>

      <!-- Input 2: Admin Password Verification (Always required for admin actions) -->
      <div class="form-group">
        <label class="form-label">Verify Admin Password</label>
        <input type="password" v-model="promptModal.adminPassword" placeholder="Enter your system admin password" class="form-control" required>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" @click="closePrompt(false)" class="btn btn-secondary">Cancel</button>
        <button type="button" @click="closePrompt(true)" class="btn btn-primary" :disabled="!promptModal.adminPassword">Submit</button>
      </div>
    </div>
  </div>
  <!-- LOGIN CONTAINER -->
  <div v-if="currentRoute === '#/login'" class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Documents Portal</h1>
        <p>DRKD Tradelink Multi-Tenant System</p>
      </div>

      <div v-if="authError" class="alert alert-danger">{{ authError }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Subdomain (e.g. drkd, companya)</label>
          <input type="text" v-model="loginForm.subdomain" placeholder="Identify your company portal" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" v-model="loginForm.email" placeholder="name@company.com" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" v-model="loginForm.password" placeholder="••••••••" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary w-full" :disabled="authLoading">
          {{ authLoading ? 'Signing in...' : 'Sign In' }}
        </button>
        <div style="margin-top: 16px; text-align: center;">
          <a @click.prevent="navigate('#/health')" href="#/health" style="font-size: 13px; color: var(--primary, #2563eb); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
            Check System & API Health
          </a>
        </div>
      </form>
    </div>
  </div>

  <!-- PUBLIC HEALTH VIEW (UNAUTHENTICATED) -->
  <div v-else-if="currentRoute === '#/health' && !currentToken" style="min-height: 100vh; background: var(--bg-body, #f8fafc); padding: 40px 20px;">
    <div style="max-width: 1200px; margin: 0 auto;">
      <HealthDashboard />
      <div style="text-align: center; margin-top: 24px;">
        <button type="button" @click="navigate('#/login')" class="btn btn-secondary">
          &larr; Back to Login
        </button>
      </div>
    </div>
  </div>

  <!-- AUTHENTICATED PORTAL APP SHELL -->
  <div v-else class="app-shell">
    
    <!-- SIDEBAR -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="user-avatar">{{ (currentCompany?.displayName || 'SA')[0] }}</div>
        <div class="sidebar-logo">
          {{ currentCompany?.displayName || 'System Admin' }}
        </div>
      </div>

      <div class="sidebar-nav">
        <a @click="navigate('#/dashboard')" class="nav-item" :class="{ active: currentRoute === '#/dashboard' }">
          <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          Dashboard
        </a>

        <!-- Collapsible Customs Documents Category -->
        <div style="margin: 6px 0;">
          <div @click="isCustomsDocsOpen = !isCustomsDocsOpen" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; user-select: none; border-radius: 6px; background: rgba(241, 245, 249, 0.6);">
            <span style="display: flex; align-items: center; gap: 6px;">📑 Customs Documents</span>
            <span style="font-size: 9px; transition: transform 0.2s;" :style="{ transform: isCustomsDocsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }">▶</span>
          </div>
          <div v-show="isCustomsDocsOpen" style="display: flex; flex-direction: column; gap: 2px; padding-left: 6px; margin-top: 4px;">
            <a @click="navigate('#/gr-docs')" class="nav-item" :class="{ active: currentRoute === '#/gr-docs' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              GR Sale Docs
            </a>
            <a @click="navigate('#/gr-purchases')" class="nav-item" :class="{ active: currentRoute === '#/gr-purchases' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M12 18v-6M9 15l3 3 3-3"/></svg>
              GR Purchases
            </a>
            <a @click="navigate('#/shipping-bills')" class="nav-item" :class="{ active: currentRoute === '#/shipping-bills' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M12 12v6M9 15l3-3 3 3"/></svg>
              Shipping Bills
            </a>
            <a @click="navigate('#/monthly-returns')" class="nav-item" :class="{ active: currentRoute === '#/monthly-returns' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
              Monthly Returns
            </a>
          </div>
        </div>

        <a @click="navigate('#/stock')" class="nav-item" :class="{ active: currentRoute === '#/stock' }">
          <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-18v10l-8 4m0-4L4 7m8 4v10M4 7v10l8 4"></path></svg>
          Stock
        </a>
        <a @click="navigate('#/parties')" class="nav-item" :class="{ active: currentRoute === '#/parties' }">
          <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          Parties / Buyers
        </a>
        <a @click="navigate('#/bank')" class="nav-item" :class="{ active: currentRoute === '#/bank' }">
          <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m4 0h1M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          Bank & Accounts
        </a>
        <a @click="navigate('#/profile')" class="nav-item" :class="{ active: currentRoute === '#/profile' }">
          <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          Profile Settings
        </a>
        <a @click="navigate('#/health')" class="nav-item" :class="{ active: currentRoute === '#/health' }">
          <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          System & API Health
        </a>

        <!-- System Administration Section (Visible to 'admin' role) -->
        <template v-if="currentUser?.role === 'admin'">
          <div style="font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; margin-top: 24px; padding: 0 14px; letter-spacing: 0.5px;">Administration</div>
          
          <a @click="navigate('#/admin/companies')" class="nav-item" :class="{ active: currentRoute === '#/admin/companies' }">
            <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            Companies List
          </a>
          <a @click="navigate('#/admin/users')" class="nav-item" :class="{ active: currentRoute === '#/admin/users' }">
            <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            User Accounts
          </a>
          <a @click="navigate('#/admin/duty-rules')" class="nav-item" :class="{ active: currentRoute === '#/admin/duty-rules' }">
            <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            Manage Duty Rules
          </a>
          <a @click="navigate('#/admin/audit-logs')" class="nav-item" :class="{ active: currentRoute === '#/admin/audit-logs' }">
            <svg style="width: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Changes Made by Users
          </a>
        </template>
      </div>

      <div class="sidebar-footer">
        <div>User: {{ currentUser?.name }}</div>
        <div>Role: {{ currentUser?.role.toUpperCase() }}</div>
      </div>
    </div>

    <!-- MAIN WINDOW -->
    <div class="main-content">
      
      <!-- TOPBAR -->
      <div class="topbar">
        <div class="topbar-title">
          {{ getRouteTitle() }}
        </div>
        <div class="topbar-actions">
          <div class="user-profile">
            <span @click="navigate('#/profile')" style="cursor: pointer; text-decoration: underline; font-weight: 600; color: var(--primary);">{{ currentUser?.name }}</span>
            <button type="button" @click="handleLogout" class="btn btn-secondary btn-sm">Sign Out</button>
          </div>
        </div>
      </div>

      <!-- APP CONTENT PAGES -->
      <div class="content-body">
        
        <div v-if="currentRoute === '#/gr-purchases'">
          <GRPurchases :token="currentToken" :current-user="currentUser" :vendors="allParties.filter(p => p.partyType === 'Vendor' || p.partyType === 'Both')" :all-companies="allCompanies" />
        </div>
        
        <div v-if="currentRoute === '#/shipping-bills'">
          <ShippingBills :token="currentToken" :current-user="currentUser" :consignees="allParties.filter(p => p.partyType === 'Consignee' || p.partyType === 'Both')" :all-companies="allCompanies" />
        </div>

        <div v-if="currentRoute === '#/monthly-returns'">
          <MonthlyReturns :token="currentToken" :current-user="currentUser" :all-companies="allCompanies" />
        </div>

        <!-- DASHBOARD ROUTE -->
        <div v-if="currentRoute === '#/dashboard'">
          <div class="stats-grid">
            <div class="stat-card">
              <div>
                <div class="stat-label">Active Stock Commodities</div>
                <div class="stat-val">{{ allStock.length }}</div>
              </div>
              <div class="stat-icon">📦</div>
            </div>
            <div class="stat-card">
              <div>
                <div class="stat-label">Registered Buyers (Parties)</div>
                <div class="stat-val">{{ allParties.length }}</div>
              </div>
              <div class="stat-icon">👥</div>
            </div>
            <div class="stat-card">
              <div>
                <div class="stat-label">Total GR Transactions</div>
                <div class="stat-val">{{ grDocsMeta.total || 0 }}</div>
              </div>
              <div class="stat-icon">📄</div>
            </div>
          </div>

          <!-- Critical To-Do & Compliance Section -->
          <div class="card mb-6" style="border-left: 4px solid #3b82f6; margin-bottom: 24px;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🚨</span>
                <span class="card-title" style="margin: 0; font-size: 16px;">Critical To-Do &amp; Compliance Alerts</span>
              </div>
              <button @click="fetchAlerts" class="btn btn-secondary btn-sm" style="font-size: 12px;">🔄 Refresh Alerts</button>
            </div>

            <!-- 1. Overdue Monthly Return Alert -->
            <div v-if="dashboardAlerts.pendingReturn" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">⚠️</span>
                <div>
                  <div style="font-weight: 700; color: #92400e; font-size: 14px;">Monthly Return Pending Submission</div>
                  <div style="font-size: 13px; color: #78350f;">{{ dashboardAlerts.pendingReturn.message }}</div>
                </div>
              </div>
              <button @click="navigate('#/monthly-returns')" class="btn btn-primary btn-sm">Prepare Monthly Return &rarr;</button>
            </div>

            <!-- 2. Expired Bonds Alert (Critical) -->
            <div v-if="dashboardAlerts.expiredStock && dashboardAlerts.expiredStock.length" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <span class="badge badge-danger" style="font-size: 12px; padding: 3px 8px;">EXPIRED BONDS (ACTION REQUIRED)</span>
                <span style="font-size: 13px; color: #991b1b; font-weight: 600;">{{ dashboardAlerts.expiredStock.length }} inventory item(s) have expired bond validity!</span>
              </div>
              <div class="table-container" style="background: white;">
                <table class="table-main" style="font-size: 13px;">
                  <thead>
                    <tr style="background-color: #fee2e2;">
                      <th>Commodity</th>
                      <th>Bond Details</th>
                      <th>Bond Expiry</th>
                      <th>Remaining Qty</th>
                      <th>Present Duty (INR)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in dashboardAlerts.expiredStock" :key="item.id">
                      <td style="font-weight: 600;">{{ item.commodityName }}</td>
                      <td>{{ item.bondDetails }}</td>
                      <td style="color: #dc2626; font-weight: 700;">{{ formatDate(item.bondExpiryDate) }} (EXPIRED)</td>
                      <td><b>{{ item.remainingQuantity }}</b> {{ item.unit }}</td>
                      <td>₹{{ Number(item.presentDutyBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</td>
                      <td>
                        <button @click="navigate('#/stock')" class="btn btn-secondary btn-sm">Manage Stock</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 3. Expiring Bonds Alert (Within 30 Days) -->
            <div v-if="dashboardAlerts.expiringStock && dashboardAlerts.expiringStock.length" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <span class="badge badge-warning" style="font-size: 12px; padding: 3px 8px;">BONDS EXPIRING SOON</span>
                <span style="font-size: 13px; color: #9a3412; font-weight: 600;">{{ dashboardAlerts.expiringStock.length }} inventory item(s) expiring within 30 days</span>
              </div>
              <div class="table-container" style="background: white;">
                <table class="table-main" style="font-size: 13px;">
                  <thead>
                    <tr style="background-color: #ffedd5;">
                      <th>Commodity</th>
                      <th>Bond Details</th>
                      <th>Expiry Date</th>
                      <th>Remaining Qty</th>
                      <th>Present Duty (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in dashboardAlerts.expiringStock" :key="item.id">
                      <td style="font-weight: 600;">{{ item.commodityName }}</td>
                      <td>{{ item.bondDetails }}</td>
                      <td style="color: #ea580c; font-weight: 700;">{{ formatDate(item.bondExpiryDate) }}</td>
                      <td><b>{{ item.remainingQuantity }}</b> {{ item.unit }}</td>
                      <td>₹{{ Number(item.presentDutyBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 4. Bank Guarantee Alerts -->
            <div v-if="(dashboardAlerts.expiredBGs && dashboardAlerts.expiredBGs.length) || (dashboardAlerts.expiringBGs && dashboardAlerts.expiringBGs.length)" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Bank Guarantee (BG) Validity Notifications</span>
                <button @click="navigate('#/bank')" class="btn btn-secondary btn-sm">Manage BGs &rarr;</button>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div v-for="bg in dashboardAlerts.expiredBGs" :key="'exp-bg-'+bg.id" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #fee2e2; border-radius: 4px; font-size: 13px;">
                  <span class="badge badge-danger">EXPIRED BG</span>
                  <span><strong>{{ bg.bankName }}</strong> (BG No: {{ bg.bgNumber }}) of <strong>₹{{ Number(bg.amount).toLocaleString('en-IN') }}</strong> expired on {{ formatDate(bg.expiryDate) }}</span>
                </div>
                <div v-for="bg in dashboardAlerts.expiringBGs" :key="'expiring-bg-'+bg.id" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #fef3c7; border-radius: 4px; font-size: 13px;">
                  <span class="badge badge-warning">EXPIRING BG</span>
                  <span><strong>{{ bg.bankName }}</strong> (BG No: {{ bg.bgNumber }}) of <strong>₹{{ Number(bg.amount).toLocaleString('en-IN') }}</strong> expires on {{ formatDate(bg.expiryDate) }}</span>
                </div>
              </div>
            </div>

            <!-- 5. All Clear State -->
            <div v-if="!dashboardAlerts.pendingReturn && (!dashboardAlerts.expiredStock || !dashboardAlerts.expiredStock.length) && (!dashboardAlerts.expiringStock || !dashboardAlerts.expiringStock.length) && (!dashboardAlerts.expiredBGs || !dashboardAlerts.expiredBGs.length) && (!dashboardAlerts.expiringBGs || !dashboardAlerts.expiringBGs.length)" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 22px;">✅</span>
              <div>
                <div style="font-weight: 700; color: #065f46; font-size: 14px;">All Compliance &amp; Bonds in Good Standing</div>
                <div style="font-size: 13px; color: #047857;">No expired bonds, pending monthly returns, or expiring bank guarantees requiring immediate attention.</div>
              </div>
            </div>
          </div>

          <div class="grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <!-- Recent GR Documents -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">Recent Transactions</div>
                <button @click="navigate('#/gr-docs/create')" class="btn btn-primary btn-sm">+ New GR Doc</button>
              </div>
              
              <div v-if="!allGRDocs.length" style="padding: 32px; text-align: center; color: var(--text-muted);">
                No GR Documents generated yet. Click "+ New GR Doc" to begin.
              </div>
              
              <div v-else class="table-container">
                <table class="table-main">
                  <thead>
                    <tr>
                      <th>GR Number</th>
                      <th v-if="currentUser?.role === 'admin'">Company</th>
                      <th>Party Name</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="doc in allGRDocs.slice(0, 5)" :key="doc.id">
                      <td style="font-weight: 600;">{{ doc.grNumber }}</td>
                      <td v-if="currentUser?.role === 'admin'"><span class="badge badge-info">{{ doc.company?.displayName }}</span></td>
                      <td>{{ doc.party?.name }}</td>
                      <td>{{ formatDate(doc.date) }}</td>
                      <td>
                        <span class="badge" :class="getStatusBadgeClass(doc.status)">{{ doc.status }}</span>
                      </td>
                      <td>
                        <button @click="navigate('#/gr-docs/' + doc.id)" class="btn btn-secondary btn-sm">View Package</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Operational Modules & Quick Actions -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">Operational Modules & Quick Actions</div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <button @click="openCreateStockModal" class="btn btn-outline-primary" style="justify-content: flex-start; gap: 10px; font-weight: 700; text-align: left; padding: 10px 14px;">
                  <span style="font-size: 16px;">📦</span> Add Stock Item
                </button>
                <button @click="navigate('#/gr-docs')" class="btn btn-outline-primary" style="justify-content: flex-start; gap: 10px; font-weight: 700; text-align: left; padding: 10px 14px;">
                  <span style="font-size: 16px;">📄</span> GR Sale Docs
                </button>
                <button @click="navigate('#/gr-purchases')" class="btn btn-outline-primary" style="justify-content: flex-start; gap: 10px; font-weight: 700; text-align: left; padding: 10px 14px;">
                  <span style="font-size: 16px;">📥</span> GR Purchase
                </button>
                <button @click="navigate('#/shipping-bills')" class="btn btn-outline-primary" style="justify-content: flex-start; gap: 10px; font-weight: 700; text-align: left; padding: 10px 14px;">
                  <span style="font-size: 16px;">🚢</span> Shipping Bills
                </button>
                <button @click="navigate('#/monthly-returns')" class="btn btn-outline-primary" style="justify-content: flex-start; gap: 10px; font-weight: 700; text-align: left; padding: 10px 14px;">
                  <span style="font-size: 16px;">📊</span> Monthly Returns
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- GR DOCUMENTS HISTORY ROUTE -->
        <div v-if="currentRoute === '#/gr-docs'">
          <div class="card">
            <div class="card-header">
              <div class="card-title">GR Transactions Listing</div>
              <button @click="navigate('#/gr-docs/create')" class="btn btn-primary btn-sm">+ Create GR Document</button>
            </div>

            <!-- Search Filters -->
            <div style="margin-bottom: 20px; display: flex; gap: 16px;">
              <input type="text" v-model="grDocsFilter.search" placeholder="Search by GR No, Invoice, DC, or Buyer..." class="form-control" style="max-width: 400px;" @input="fetchGRDocs">
              <select v-model="grDocsFilter.status" class="form-control" style="max-width: 180px;" @change="fetchGRDocs">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="generated">Generated / Finalized</option>
              </select>
            </div>

            <div v-if="!allGRDocs.length" style="padding: 40px; text-align: center; color: var(--text-muted);">
              No GR Documents matching the filters found.
            </div>

            <div v-else>
              <div class="table-container">
                <table class="table-main">
                  <thead>
                    <tr>
                      <th>GR Number</th>
                      <th v-if="currentUser?.role === 'admin'">Company</th>
                      <th>Buyer</th>
                      <th>Invoice No</th>
                      <th>DC No</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Operator</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="doc in allGRDocs" :key="doc.id">
                      <td style="font-weight: 600;">{{ doc.grNumber }}</td>
                      <td v-if="currentUser?.role === 'admin'"><span class="badge badge-info">{{ doc.company?.displayName }}</span></td>
                      <td>{{ doc.party?.name }}</td>
                      <td>{{ doc.invoiceNumber }}</td>
                      <td>{{ doc.dcNumber }}</td>
                      <td>{{ formatDate(doc.date) }}</td>
                      <td>
                        <span class="badge" :class="getStatusBadgeClass(doc.status)">{{ doc.status }}</span>
                      </td>
                      <td>{{ doc.user?.name }}</td>
                      <td>
                        <button @click="navigate('#/gr-docs/' + doc.id)" class="btn btn-secondary btn-sm">View Package</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- CREATE NEW GR DOCUMENT WORKFLOW -->
        <div v-if="currentRoute === '#/gr-docs/create'">
          <div class="card">
            <div class="card-header">
              <div class="card-title">New GR Transaction Form</div>
              <button @click="navigate('#/gr-docs')" class="btn btn-secondary btn-sm">Cancel</button>
            </div>

            <form @submit.prevent="submitGRForm">
              <!-- Admin Target Company Selector -->
              <div v-if="currentUser?.role === 'admin'" class="form-group" style="background-color: #eff6ff; padding: 16px; border-radius: 6px; border: 1px solid #bfdbfe; margin-bottom: 24px;">
                <label class="form-label" style="color: #1e40af;">Select Target Company Portal</label>
                <select v-model="grForm.companyId" class="form-control" @change="onAdminTargetCompanyChanged" required>
                  <option value="">-- Choose Company --</option>
                  <option v-for="comp in allCompanies" :value="comp.id">{{ comp.displayName }} ({{ comp.subdomain }})</option>
                </select>
                <p style="font-size: 11px; color: #1e40af; margin-top: 4px;">As Super Admin, select the company to load their respective stock and parties.</p>
              </div>

              <!-- Grid details -->
              <h3 style="font-size: 14px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; font-weight: 700;">1. Transaction Head Details</h3>
              <div class="form-grid" style="margin-bottom: 24px;">
                <div class="form-group">
                  <label class="form-label">Transaction Date</label>
                  <input type="date" v-model="grForm.date" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Exchange Rate (USD -> INR)</label>
                  <input type="number" step="0.01" v-model="grForm.exchangeRate" @change="fetchPresentDutyBalance" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Invoice Number (Auto Incremental)</label>
                  <input type="text" v-model="grForm.invoiceNumber" class="form-control" disabled readonly placeholder="Auto Generated">
                </div>
                <div class="form-group">
                  <label class="form-label">Delivery Challan (DC) Number (Auto Incremental)</label>
                  <input type="text" v-model="grForm.dcNumber" class="form-control" disabled readonly placeholder="Auto Generated">
                </div>
                <div class="form-group">
                  <label class="form-label">Present Duty Balance (INR) (Auto Fetched)</label>
                  <input type="number" step="0.01" v-model="grForm.presentDutyBalance" class="form-control" disabled readonly placeholder="Auto Fetched from Stock">
                </div>
              </div>

              <!-- Buyer selection -->
              <h3 style="font-size: 14px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; font-weight: 700;">2. Select Consignee / Buyer</h3>
              <div class="form-group" style="margin-bottom: 32px;">
                <label class="form-label">Consignee Party</label>
                <select v-model="grForm.partyId" class="form-control" required>
                  <option value="">-- Choose Party --</option>
                  <option v-for="party in filteredParties" :value="party.id">{{ party.name }} - {{ party.city }}</option>
                </select>
              </div>

              <!-- Item selection & rows -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                  <h3 style="font-size: 14px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 0;">3. Add Stock Items</h3>
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 500; color: var(--text-muted);">
                    <input type="checkbox" v-model="hideZeroStock"> Hide zero-stock items
                  </label>
                </div>
                <button type="button" @click="addGRItemRow" class="btn btn-secondary btn-sm">+ Add Item Row</button>
              </div>

              <div class="table-container" style="margin-bottom: 32px;">
                <table class="table-main">
                  <thead>
                    <tr>
                      <th style="width: 35%;">Stock Commodity / BE & Bond Reference</th>
                      <th style="width: 15%;">Quantity (Cases)</th>
                      <th style="width: 12%;">Type</th>
                      <th style="width: 15%;">USD Price / Case (Editable)</th>
                      <th style="width: 13%;">Remaining Bond Qty</th>
                      <th style="width: 10%; text-align: center;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in grForm.items" :key="idx">
                      <td>
                        <select v-model="row.stockItemId" class="form-control" @change="onGRStockSelected(idx)" required>
                          <option value="">-- Select Available Stock --</option>
                          <option v-for="stock in filteredStock" :value="stock.id">
                            {{ stock.commodityName }} [BE: {{ stock.beDetails }} / Bond: {{ stock.bondDetails }}]
                          </option>
                        </select>
                      </td>
                      <td>
                        <input type="number" v-model.number="row.qty" class="form-control" min="1" required>
                      </td>
                      <td>
                        <span style="font-size: 13px; font-weight: 600; color: #475569;">{{ row.type || 'N/A' }}</span>
                      </td>
                      <td>
                        <input type="number" step="0.01" v-model.number="row.pricePerCaseUSD" class="form-control" placeholder="Price USD" required>
                      </td>
                      <td>
                        <span style="font-size: 13px; color: var(--text-muted);">{{ row.remainingQuantity !== undefined ? row.remainingQuantity + ' Cases' : 'N/A' }}</span>
                      </td>
                      <td style="text-align: center;">
                        <button type="button" @click="removeGRItemRow(idx)" class="btn btn-danger btn-sm" :disabled="grForm.items.length === 1">Remove</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Action buttons -->
              <div style="display: flex; gap: 16px; justify-content: flex-end;">
                <button type="submit" class="btn btn-primary">Save as Draft Package</button>
              </div>
            </form>
          </div>
        </div>

        <!-- GR PACKAGE VIEW / Unified Previewer -->
        <div v-if="currentRoute.startsWith('#/gr-docs/') && currentRoute.split('/').length === 3">
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">GR Document Package: {{ selectedGRDoc?.transaction?.grNumber }}</h2>
                <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
                  Status: <span class="badge" :class="getStatusBadgeClass(selectedGRDoc?.transaction?.status)">{{ selectedGRDoc?.transaction?.status }}</span>
                  | Invoice No: {{ selectedGRDoc?.transaction?.invoiceNumber }}
                  | GR Date: {{ formatDate(selectedGRDoc?.transaction?.date) }}
                </div>
                
                <!-- Custom dates for Invoice and Delivery Challan -->
                <div style="margin-top: 10px; display: flex; gap: 16px; align-items: center; background-color: #f1f5f9; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1;">
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <label style="font-size: 12px; font-weight: 600; color: #334155;">Invoice Date:</label>
                    <input type="date" v-model="selectedInvoiceDate" @change="updateDocumentDates" class="form-control" style="width: 140px; padding: 2px 6px; font-size: 12px;">
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <label style="font-size: 12px; font-weight: 600; color: #334155;">DC Date:</label>
                    <input type="date" v-model="selectedDcDate" @change="updateDocumentDates" class="form-control" style="width: 140px; padding: 2px 6px; font-size: 12px;">
                  </div>
                  <span style="font-size: 11px; color: #64748b;">(Modify date to print Invoice/DC with custom date)</span>
                </div>
              </div>
              <div style="display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap;">
                <!-- Edit Draft button if draft -->
                <button v-if="selectedGRDoc?.transaction?.status === 'draft'" @click="editDraftGRPackage" class="btn btn-secondary">
                  Edit Draft Package
                </button>
                <!-- Finalize button if draft -->
                <button v-if="selectedGRDoc?.transaction?.status === 'draft'" @click="openFinalizeGrModal" class="btn btn-primary">
                  Finalize & Lock Document
                </button>
                <!-- Cancel button if generated -->
                <button v-if="selectedGRDoc?.transaction?.status === 'generated' && canCancelGR(selectedGRDoc?.transaction)" @click="cancelGRDocumentPackage" class="btn btn-danger">
                  Cancel GR Package
                </button>
                <button @click="navigate('#/gr-docs')" class="btn btn-secondary">
                  Back to List
                </button>
              </div>
            </div>

            <!-- Calculation totals preview -->
            <div style="background-color: #f8fafc; border: 1px solid var(--border); border-radius: 6px; padding: 16px; margin-bottom: 24px; display: flex; gap: 32px;">
              <div>
                <p style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Total Cases</p>
                <p style="font-size: 18px; font-weight: 700;">{{ selectedGRDoc?.totals?.cases }}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Total Assessable Value (INR)</p>
                <p style="font-size: 18px; font-weight: 700;">₹ {{ selectedGRDoc?.totals?.assessable?.toFixed(2) }}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Total Duty Amount (INR)</p>
                <p style="font-size: 18px; font-weight: 700; color: var(--danger);">₹ {{ selectedGRDoc?.totals?.duty?.toFixed(2) }}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Remaining Balance Duty (INR)</p>
                <p style="font-size: 18px; font-weight: 700; color: var(--success);">₹ {{ selectedGRDoc?.totals?.balanceDutyAmount?.toFixed(2) }}</p>
              </div>
            </div>

            <!-- Unified tabbed preview panel -->
            <div class="preview-shell">
              <div class="preview-sidebar">
                <h4>Landscape Documents</h4>
                <button @click="activePreviewDoc = 'gr-front'" class="preview-doc-btn" :class="{ active: activePreviewDoc === 'gr-front' }">1. GR Front Page (Part 1)</button>
                <button @click="activePreviewDoc = 'gr-back'" class="preview-doc-btn" :class="{ active: activePreviewDoc === 'gr-back' }">2. GR Back Page (Part 2)</button>
                <button @click="activePreviewDoc = 'duty-calculation'" class="preview-doc-btn" :class="{ active: activePreviewDoc === 'duty-calculation' }">3. Duty Calculation</button>
                
                <h4 style="margin-top: 16px;">Portrait Documents</h4>
                <button @click="activePreviewDoc = 'submission-letter'" class="preview-doc-btn" :class="{ active: activePreviewDoc === 'submission-letter' }">4. GR Submission Letter</button>
                <button @click="activePreviewDoc = 'notesheet'" class="preview-doc-btn" :class="{ active: activePreviewDoc === 'notesheet' }">5. Notesheet Template</button>
                <button @click="activePreviewDoc = 'invoice'" class="preview-doc-btn" :class="{ active: activePreviewDoc === 'invoice' }">6. Invoice</button>
                <button @click="activePreviewDoc = 'delivery-challan'" class="preview-doc-btn" :class="{ active: activePreviewDoc === 'delivery-challan' }">7. Delivery Challan</button>
                <button @click="activePreviewDoc = 'stock-list'" class="preview-doc-btn" :class="{ active: activePreviewDoc === 'stock-list' }">8. Stock List / Stocksheet</button>
              </div>
              <div class="preview-viewer">
                <div class="preview-toolbar">
                  <span style="font-weight: 600; font-size: 14px; color: var(--secondary);">Viewing: {{ activePreviewDoc.toUpperCase().replace('-', ' ') }}</span>
                  <div style="display: flex; gap: 8px;">
                    <button @click="printPreviewDoc" class="btn btn-secondary btn-sm">Print Current</button>
                  </div>
                </div>
                <div class="preview-frame-container">
                  <iframe :src="getApiUrl('/api/gr-docs/' + selectedGRDoc?.transaction?.id + '/preview/' + activePreviewDoc + '?token=' + currentToken)" class="preview-frame" id="docPreviewFrame"></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STOCK ROUTE -->
        <div v-if="currentRoute === '#/stock'">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <div class="card-title" style="margin-bottom: 2px;">Stock / Bonded Shipments Inventory</div>
                <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Manage bonded stock consignments, tracking, and duty calculations</p>
              </div>
              <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <button type="button" @click="openCreateConsignmentModal" class="btn btn-primary btn-sm">📦 + Add Consignment (Batch)</button>
                <button type="button" @click="openCreateStockModal" class="btn btn-secondary btn-sm">+ Add Single Item</button>
              </div>
            </div>

            <!-- Filters & Search Bar -->
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; background: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid var(--border);">
              <div style="flex: 2; min-width: 220px;">
                <input type="text" v-model="stockSearchFilter" placeholder="Search by Commodity Name, Bond No, BE No..." class="form-control" style="font-size: 13px;">
              </div>
              <div style="flex: 1; min-width: 150px;">
                <select v-model="stockTypeFilter" class="form-control" style="font-size: 13px;">
                  <option value="">All Commodity Types</option>
                  <option value="Beer">Beer</option>
                  <option value="Alcohol/Wine">Alcohol/Wine</option>
                  <option value="Cigarettes">Cigarettes</option>
                </select>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-main); margin: 0;">
                  <input type="checkbox" v-model="hideZeroStock"> Hide zero-stock items
                </label>
              </div>
            </div>

            <div v-if="!stockTableItems.length" style="padding: 40px; text-align: center; color: var(--text-muted);">
              No stock items found matching current filters. Click "+ Add Consignment" to add batch stock.
            </div>

            <div v-else class="table-container">
              <table class="table-main">
                <thead>
                  <tr>
                    <th>Commodity Name</th>
                    <th v-if="currentUser?.role === 'admin'">Company</th>
                    <th>Type</th>
                    <th>BE / GR Details</th>
                    <th>Bond Details</th>
                    <th>Bond Expiry</th>
                    <th>Price/Unit</th>
                    <th>Duty %</th>
                    <th>Qty (Total / Rem)</th>
                    <th>Present Duty Balance</th>
                    <th>Status</th>
                    <th v-if="['admin', 'manager'].includes(currentUser?.role)">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stockTableItems" :key="item.id">
                    <td style="font-weight: 600;">{{ item.commodityName }}</td>
                    <td v-if="currentUser?.role === 'admin'"><span class="badge badge-info">{{ item.company?.displayName }}</span></td>
                    <td><span class="badge" style="background-color: #f1f5f9; color: #475569;">{{ item.commodityType }}</span></td>
                    <td><span style="font-size: 11px; color: var(--text-muted);">{{ item.beDetails }}</span></td>
                    <td><span style="font-size: 11px; font-weight: 600; color: #1e40af;">{{ item.bondDetails }}</span></td>
                    <td>
                      <span v-if="item.bondExpiryDate" :style="{ color: new Date(item.bondExpiryDate) < new Date() && item.remainingQuantity > 0 ? '#dc2626' : '#475569', fontWeight: new Date(item.bondExpiryDate) < new Date() && item.remainingQuantity > 0 ? '700' : 'normal' }">
                        {{ formatDate(item.bondExpiryDate) }}
                        <span v-if="new Date(item.bondExpiryDate) < new Date() && item.remainingQuantity > 0" class="badge badge-danger" style="margin-left: 4px; font-size: 9px;">EXPIRED</span>
                      </span>
                      <span v-else style="color: var(--text-muted); font-size: 11px;">-</span>
                    </td>
                    <td>${{ Number(item.pricePerCaseUSD || 0).toFixed(2) }}</td>
                    <td>{{ item.dutyPercentage }}%</td>
                    <td>{{ item.totalQuantity }} / <b>{{ item.remainingQuantity }}</b> {{ item.unit }}</td>
                    <td style="font-weight: 600;">₹{{ Number(item.presentDutyBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</td>
                    <td>
                      <span class="badge" :class="item.remainingQuantity > 0 ? 'badge-success' : 'badge-danger'">
                        {{ item.remainingQuantity > 0 ? 'In Stock' : 'Cleared' }}
                      </span>
                    </td>
                    <td v-if="['admin', 'manager'].includes(currentUser?.role)">
                      <button type="button" @click="editStockItem(item)" class="btn btn-secondary btn-sm">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add Consignment (Batch) Modal -->
          <div v-if="showConsignmentModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;">
            <div class="card" style="width: 95vw; max-width: 1000px; margin-bottom: 0; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
              <div class="card-header">
                <div>
                  <div class="card-title">Add Inbound Consignment (Batch Stock Entry)</div>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Enter shared BE/Bond details once, then add multiple commodity items in this batch</p>
                </div>
                <button type="button" @click="showConsignmentModal = false" class="btn btn-secondary btn-sm">Close</button>
              </div>
              <form @submit.prevent="submitConsignment">
                <!-- Admin Company Target Selector -->
                <div v-if="currentUser?.role === 'admin'" class="form-group" style="background-color: #eff6ff; padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe; margin-bottom: 16px;">
                  <label class="form-label" style="color: #1e40af; font-weight: 600;">Target Company</label>
                  <select v-model="consignmentForm.companyId" class="form-control" required>
                    <option value="">-- Choose Company --</option>
                    <option v-for="comp in allCompanies" :key="comp.id" :value="comp.id">{{ comp.displayName }}</option>
                  </select>
                </div>

                <!-- Shared Consignment Master Info -->
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid var(--border); margin-bottom: 20px;">
                  <h4 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #475569; margin-bottom: 12px; letter-spacing: 0.5px;">Master Consignment Details</h4>
                  <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label">Purchase Type *</label>
                      <select v-model="consignmentForm.purchaseType" class="form-control" required>
                        <option value="BE">Bill of Entry (BE)</option>
                        <option value="GR">GR Purchase</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label">BE or GR Number *</label>
                      <input type="text" v-model="consignmentForm.purchaseNumber" placeholder="e.g. 98765/26" class="form-control" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label">BE or GR Date *</label>
                      <input type="date" v-model="consignmentForm.purchaseDate" class="form-control" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label">Bond Number *</label>
                      <input type="text" v-model="consignmentForm.bondNumber" placeholder="e.g. BOND/2026/102" class="form-control" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label">Bond Date *</label>
                      <input type="date" v-model="consignmentForm.bondDate" class="form-control" required>
                    </div>
                  </div>
                  <p style="font-size: 11px; color: var(--text-muted); margin: 8px 0 0 0;">Note: Bond Expiry will be automatically calculated as exactly 1 year from Bond Date.</p>
                </div>

                <!-- Consignment Items Table -->
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #475569; margin: 0; letter-spacing: 0.5px;">Consignment Commodity Items</h4>
                    <button type="button" @click="addConsignmentItem" class="btn btn-secondary btn-sm">+ Add Item Row</button>
                  </div>
                  <div class="table-container">
                    <table class="table-main" style="font-size: 13px;">
                      <thead>
                        <tr>
                          <th>Commodity Name *</th>
                          <th>Type *</th>
                          <th>Quantity *</th>
                          <th>Unit</th>
                          <th>Packing</th>
                          <th>Rate ($/Unit)</th>
                          <th>Duty %</th>
                          <th>Duty Balance (INR)</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, idx) in consignmentForm.items" :key="'c-item-'+idx">
                          <td><input type="text" v-model="item.commodityName" placeholder="e.g. Corona Extra" class="form-control" style="font-size: 12px; padding: 6px 8px;" required></td>
                          <td>
                            <select v-model="item.commodityType" class="form-control" style="font-size: 12px; padding: 6px 8px; width: 110px;" required>
                              <option value="Beer">Beer</option>
                              <option value="Alcohol/Wine">Alcohol/Wine</option>
                              <option value="Cigarettes">Cigarettes</option>
                            </select>
                          </td>
                          <td><input type="number" min="1" v-model.number="item.totalQuantity" class="form-control" style="font-size: 12px; padding: 6px 8px; width: 70px;" required></td>
                          <td>
                            <select v-model="item.unit" class="form-control" style="font-size: 12px; padding: 6px 8px; width: 90px;">
                              <option value="Cases">Cases</option>
                              <option value="Cartons">Cartons</option>
                              <option value="Boxes">Boxes</option>
                              <option value="Bottles">Bottles</option>
                            </select>
                          </td>
                          <td><input type="text" v-model="item.packing" placeholder="24x330ml" class="form-control" style="font-size: 12px; padding: 6px 8px; width: 100px;"></td>
                          <td><input type="number" step="0.01" min="0" v-model.number="item.pricePerCaseUSD" class="form-control" style="font-size: 12px; padding: 6px 8px; width: 80px;" required></td>
                          <td><input type="number" step="0.1" min="0" v-model.number="item.dutyPercentage" class="form-control" style="font-size: 12px; padding: 6px 8px; width: 70px;" required></td>
                          <td><input type="number" step="0.01" min="0" v-model.number="item.presentDutyBalance" class="form-control" style="font-size: 12px; padding: 6px 8px; width: 110px;" required></td>
                          <td><button type="button" @click="removeConsignmentItem(idx)" class="btn btn-danger btn-sm" :disabled="consignmentForm.items.length <= 1">✕</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border);">
                  <div style="font-size: 13px; color: var(--text-muted);">
                    Total Items: <strong>{{ consignmentForm.items.length }}</strong> | 
                    Total Qty: <strong>{{ consignmentForm.items.reduce((s,i) => s + (+i.totalQuantity||0), 0) }}</strong> |
                    Total Duty: <strong>₹{{ consignmentForm.items.reduce((s,i) => s + (+i.presentDutyBalance||0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</strong>
                  </div>
                  <div style="display: flex; gap: 10px;">
                    <button type="button" @click="showConsignmentModal = false" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Consignment Stock</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Add/Edit Single Stock Modal -->
          <div v-if="showStockModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="width: 100%; max-width: 600px; margin-bottom: 0; max-height: 90vh; overflow-y: auto;">
              <div class="card-header">
                <div class="card-title">{{ editingStockId ? 'Edit Stock Commodity Item' : 'Add Stock Commodity Item' }}</div>
                <button type="button" @click="showStockModal = false" class="btn btn-secondary btn-sm">Close</button>
              </div>
              <form @submit.prevent="submitStockItem">
                <!-- Admin Company Target Selector -->
                <div v-if="currentUser?.role === 'admin'" class="form-group" style="background-color: #eff6ff; padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
                  <label class="form-label" style="color: #1e40af;">Target Company</label>
                  <select v-model="stockForm.companyId" class="form-control" required>
                    <option value="">-- Choose Company --</option>
                    <option v-for="comp in allCompanies" :key="comp.id" :value="comp.id">{{ comp.displayName }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Commodity Name / Brand</label>
                  <input type="text" v-model="stockForm.commodityName" placeholder="e.g. Corona Extra Beer" class="form-control" required>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Type</label>
                    <select v-model="stockForm.commodityType" class="form-control" required>
                      <option value="Beer">Beer</option>
                      <option value="Alcohol/Wine">Alcohol/Wine</option>
                      <option value="Cigarettes">Cigarettes</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Price per Unit (USD)</label>
                    <input type="number" step="0.01" min="0" v-model.number="stockForm.pricePerCaseUSD" class="form-control" required>
                  </div>
                </div>
                <!-- Structured purchase details -->
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Purchase Type</label>
                    <select v-model="stockForm.purchaseType" class="form-control" required>
                      <option value="BE">Bought via BE (Bill of Entry)</option>
                      <option value="GR">Bought via GR</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">BE or GR Number</label>
                    <input type="text" v-model="stockForm.purchaseNumber" placeholder="e.g. 12345/12" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">BE or GR Date</label>
                    <input type="date" v-model="stockForm.purchaseDate" class="form-control" required>
                  </div>
                </div>
                <!-- Structured bond details -->
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Bond Number</label>
                    <input type="text" v-model="stockForm.bondNumber" placeholder="e.g. BOND/2026/089" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Bond Date</label>
                    <input type="date" v-model="stockForm.bondDate" class="form-control" required>
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Total Quantity</label>
                    <input type="number" min="0" v-model.number="stockForm.totalQuantity" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Packing details</label>
                    <input type="text" v-model="stockForm.packing" placeholder="e.g. 24 Bottles x 330ml" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Quantity Unit</label>
                    <select v-model="stockForm.unit" class="form-control" required>
                      <option value="Cases">Cases</option>
                      <option value="Cartons">Cartons</option>
                      <option value="Boxes">Boxes</option>
                      <option value="Bottles">Bottles</option>
                      <option value="Packs">Packs</option>
                    </select>
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Duty Percentage (%)</label>
                    <input type="number" step="0.1" min="0" v-model.number="stockForm.dutyPercentage" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Present Duty Balance (INR)</label>
                    <input type="number" step="0.01" min="0" v-model.number="stockForm.presentDutyBalance" class="form-control" required>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Bond Expiry Date</label>
                  <input type="date" v-model="stockForm.bondExpiryDate" class="form-control">
                </div>
                <button type="submit" class="btn btn-primary w-full">Save Stock Item</button>
              </form>
            </div>
          </div>
        </div>

        <!-- PARTIES ROUTE -->
        <div v-if="currentRoute === '#/parties'">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Registered Consignees / Buyers</div>
              <button type="button" @click="openCreatePartyModal" class="btn btn-primary btn-sm">+ Register Party</button>
            </div>

            <div v-if="!allParties.length" style="padding: 40px; text-align: center; color: var(--text-muted);">
              No parties registered. Click "+ Register Party" to create.
            </div>

            <div v-else class="table-container">
              <table class="table-main">
                <thead>
                  <tr>
                    <th>Party Name</th>
                    <th v-if="currentUser?.role === 'admin'">Company</th>
                    <th>Warehouse Address</th>
                    <th>City / State</th>
                    <th>GSTIN</th>
                    <th>Warehouse Code</th>
                    <th>Phone / Email</th>
                    <th>Status</th>
                    <th v-if="['admin', 'manager'].includes(currentUser?.role)">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="party in allParties" :key="party.id">
                    <td style="font-weight: 600;">{{ party.name }}</td>
                    <td v-if="currentUser?.role === 'admin'"><span class="badge badge-info">{{ party.company?.displayName }}</span></td>
                    <td>{{ party.address }}</td>
                    <td>{{ party.city }} / {{ party.state }}</td>
                    <td>{{ party.gstin || 'N/A' }}</td>
                    <td>{{ party.warehouseCode || 'N/A' }}</td>
                    <td>{{ party.phone || 'N/A' }}<br><span style="font-size: 11px; color: var(--text-muted);">{{ party.email }}</span></td>
                    <td>
                      <span class="badge" :class="party.status === 'active' ? 'badge-success' : 'badge-danger'">{{ party.status }}</span>
                    </td>
                    <td v-if="['admin', 'manager'].includes(currentUser?.role)">
                      <button type="button" @click="editParty(party)" class="btn btn-secondary btn-sm">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add/Edit Party Modal -->
          <div v-if="showPartyModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="width: 100%; max-width: 500px; margin-bottom: 0; max-height: 90vh; overflow-y: auto;">
              <div class="card-header">
                <div class="card-title">{{ editingPartyId ? 'Edit Party (Buyer)' : 'Register Party (Buyer)' }}</div>
                <button type="button" @click="showPartyModal = false" class="btn btn-secondary btn-sm">Close</button>
              </div>
              <form @submit.prevent="submitParty">
                <!-- Admin Company Target Selector -->
                <div v-if="currentUser?.role === 'admin'" class="form-group" style="background-color: #eff6ff; padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
                  <label class="form-label" style="color: #1e40af;">Target Company</label>
                  <select v-model="partyForm.companyId" class="form-control" required>
                    <option value="">-- Choose Company --</option>
                    <option v-for="comp in allCompanies" :value="comp.id">{{ comp.displayName }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Buyer Name</label>
                  <input type="text" v-model="partyForm.name" placeholder="M/S SAPPHIRE SHIPPING" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Warehouse Address</label>
                  <input type="text" v-model="partyForm.address" placeholder="Plot 12, GIDC" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Party Type</label>
                  <select v-model="partyForm.partyType" class="form-control" required>
                    <option value="Both">Both (Vendor & Consignee)</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Consignee">Consignee</option>
                  </select>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">City</label>
                    <input type="text" v-model="partyForm.city" placeholder="Gandhidham" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">State</label>
                    <input type="text" v-model="partyForm.state" placeholder="Gujarat" class="form-control" required>
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Buyer GSTIN</label>
                    <input type="text" v-model="partyForm.gstin" placeholder="24AAAAA0000A1Z1" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Buyer Warehouse Code</label>
                    <input type="text" v-model="partyForm.warehouseCode" placeholder="IXYS022" class="form-control">
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="text" v-model="partyForm.phone" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" v-model="partyForm.email" class="form-control">
                  </div>
                </div>
                <button type="submit" class="btn btn-primary w-full">Register Party</button>
              </form>
            </div>
          </div>
        </div>

        <!-- SUPER ADMIN: COMPANIES LIST -->
        <div v-if="currentRoute === '#/admin/companies'">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Tenant Companies Registry</div>
              <button type="button" @click="openCreateCompanyModal" class="btn btn-primary btn-sm">+ Add New Company</button>
            </div>

            <div class="table-container">
              <table class="table-main">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Legal Corporate Name</th>
                    <th>Subdomain</th>
                    <th>Letterhead</th>
                    <th>GSTIN / IEC</th>
                    <th>Warehouse Code</th>
                    <th>City / State</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="comp in allCompanies" :key="comp.id">
                    <td style="font-weight: 600;">{{ comp.displayName }}</td>
                    <td>{{ comp.legalName }}</td>
                    <td style="color: var(--primary); font-weight: 600;">{{ comp.subdomain }}</td>
                    <td>
                      <img v-if="comp.letterheadBase64" :src="comp.letterheadBase64" style="max-height: 35px; max-width: 70px; object-fit: contain; border: 1px solid var(--border); padding: 2px; border-radius: 2px;">
                      <span v-else style="font-size: 11px; color: var(--text-muted);">None</span>
                    </td>
                    <td>{{ comp.gstin || 'N/A' }} / {{ comp.iec || 'N/A' }}</td>
                    <td>{{ comp.warehouseCode || 'N/A' }}</td>
                    <td>{{ comp.city }} / {{ comp.state }}</td>
                    <td>
                      <span class="badge" :class="comp.status === 'active' ? 'badge-success' : 'badge-danger'">{{ comp.status === 'active' ? 'Active' : 'Disabled' }}</span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 4px;">
                        <button type="button" @click="editCompany(comp)" class="btn btn-secondary btn-sm">Edit</button>
                        <button type="button" @click="toggleCompanyStatus(comp)" :class="comp.status === 'active' ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'">
                          {{ comp.status === 'active' ? 'Disable' : 'Enable' }}
                        </button>
                        <button type="button" @click="deleteCompany(comp)" class="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Onboarding Modal -->
          <div v-if="showOnboardingModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div class="card" style="width: 500px; max-width: 95%; max-height: 90vh; overflow-y: auto;">
              <div class="card-header" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white;">
                <div class="card-title">Welcome! Let's get set up</div>
              </div>
              <div style="padding: 0 4px;">
                <div v-if="onboardingStep === 1">
                  <h5 style="color: #1e40af; margin-bottom: 1rem;">Step 1: Add Primary Bank Account</h5>
                  <p style="font-size: 13px; margin-bottom: 1rem;">This is required to finalize documents. You can add more later.</p>
                  <form @submit.prevent="submitOnboardingBank" class="form-grid">
                    <input type="text" v-model="onboardingBank.accountHolderName" placeholder="Account Holder Name" class="form-control" required>
                    <input type="text" v-model="onboardingBank.bankName" placeholder="Bank Name" class="form-control" required>
                    <input type="text" v-model="onboardingBank.accountNumber" placeholder="Account Number (Numbers only)" pattern="[0-9]+" class="form-control" required>
                    <input type="text" v-model="onboardingBank.ifscCode" placeholder="IFSC Code" class="form-control" required>
                    <input type="text" v-model="onboardingBank.branchName" placeholder="Branch Name" class="form-control" required>
                    <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 10px;">
                      <button type="submit" class="btn btn-primary" :disabled="onboardingLoading">Save & Continue</button>
                    </div>
                  </form>
                </div>

                <div v-if="onboardingStep === 2">
                  <h5 style="color: #1e40af; margin-bottom: 1rem;">Step 2: Add Bank Guarantee (BG)</h5>
                  <p style="font-size: 13px; margin-bottom: 1rem;">This is required for custom duties. You can add more later.</p>
                  <form @submit.prevent="submitOnboardingBG" class="form-grid">
                    <input type="text" v-model="onboardingBG.bgNumber" placeholder="BG Number" class="form-control" required>
                    <input type="text" v-model="onboardingBG.bankName" placeholder="Bank Name" class="form-control" required>
                    <input type="number" v-model="onboardingBG.amount" placeholder="Amount (₹)" class="form-control" required>
                    <div style="grid-column: 1 / -1;">
                      <label style="font-size: 12px; color: #64748b; margin-bottom: 4px; display: block;">Expiry Date</label>
                      <input type="date" v-model="onboardingBG.expiryDate" class="form-control" required>
                    </div>
                    <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 10px;">
                      <button type="submit" class="btn btn-primary" :disabled="onboardingLoading">Save & Continue</button>
                    </div>
                  </form>
                </div>

                <div v-if="onboardingStep === 3">
                  <h5 style="color: #1e40af; margin-bottom: 1rem;">Step 3: Add Initial Stock</h5>
                  <p style="font-size: 13px; margin-bottom: 1rem;">If you have stock available, you can add it now. Otherwise, you can skip and add it later from the Dashboard.</p>
                  <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" @click="finishOnboarding">Skip for now</button>
                    <button type="button" class="btn btn-primary" @click="finishOnboardingAndAddStock">Add Stock</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Finalize GR Document Modal (Custom GR Number) -->
          <div v-if="showFinalizeGrModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
            <div class="card" style="width: 100%; max-width: 480px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
              <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 12px 0; color: var(--primary);">Finalize GR Document Package</h3>
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                Please enter the official <strong>Customs Allotted GR Number</strong> to lock calculations, finalize documents, and deduct warehouse stock and duty balance.
              </p>
              <form @submit.prevent="submitFinalizeGr(false)">
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label" style="font-weight: 600;">Customs Allotted GR Number *</label>
                  <input type="text" v-model="customGrNumberInput" class="form-control" placeholder="e.g. GR/2026/012" required autofocus />
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                  <button type="button" @click="showFinalizeGrModal = false" class="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" class="btn btn-primary btn-sm">Confirm &amp; Finalize</button>
                </div>
              </form>
            </div>
          </div>

          <!-- Add/Edit Company Modal -->
          <div v-if="showCompanyModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="width: 100%; max-width: 600px; margin-bottom: 0; max-height: 90vh; overflow-y: auto;">
              <div class="card-header">
                <div class="card-title">{{ editingCompanyId ? 'Edit Corporate Tenant Company' : 'Create Corporate Tenant Company' }}</div>
                <button type="button" @click="showCompanyModal = false" class="btn btn-secondary btn-sm">Close</button>
              </div>
              <form @submit.prevent="submitCompany">
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Display Name</label>
                    <input type="text" v-model="companyForm.displayName" placeholder="DRKD Tradelink" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Subdomain (slug)</label>
                    <input type="text" v-model="companyForm.subdomain" placeholder="e.g. drkd, companya" class="form-control" :disabled="!!editingCompanyId" required>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Legal Name</label>
                  <input type="text" v-model="companyForm.legalName" placeholder="DRKD TRADELINK LLP" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Warehouse Code</label>
                  <input type="text" v-model="companyForm.warehouseCode" placeholder="IXYS021" class="form-control" required>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">GSTIN</label>
                    <input type="text" v-model="companyForm.gstin" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">IEC Code</label>
                    <input type="text" v-model="companyForm.iec" class="form-control">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Office Address</label>
                  <input type="text" v-model="companyForm.address" class="form-control" required>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">City</label>
                    <input type="text" v-model="companyForm.city" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">State</label>
                    <input type="text" v-model="companyForm.state" class="form-control" required>
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Bank Name</label>
                    <input type="text" v-model="companyForm.bankName" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Bank Account Number</label>
                    <input type="text" v-model="companyForm.bankAccount" class="form-control">
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Bank Guarantee Number</label>
                    <input type="text" v-model="companyForm.bgNumber" placeholder="e.g. 00831ILG001225" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">BG Issuing Bank Name</label>
                    <input type="text" v-model="companyForm.bgBankName" placeholder="e.g. Punjab National Bank" class="form-control">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Total Bank Guarantee Amount (INR)</label>
                  <input type="number" v-model="companyForm.bgAmount" placeholder="e.g. 5000000" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Allowed Commodity Types (Comma-separated)</label>
                  <input type="text" v-model="companyForm.commodityTypes" placeholder="e.g. Beer, Whisky/Wine/Rum, Cigarette" class="form-control">
                  <small style="color: #64748b; font-size: 11px;">Default ones: Beer, Whisky/Wine/Rum, Cigarette. Admins can add custom commodity types.</small>
                </div>
                <div class="form-group">
                  <label class="form-label">Letterhead Image (PNG only)</label>
                  <input type="file" @change="onLetterheadSelected" accept="image/png" class="form-control">
                  <div v-if="companyForm.letterheadBase64" style="margin-top: 10px;">
                    <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Letterhead Preview:</p>
                    <img :src="companyForm.letterheadBase64" style="max-height: 80px; max-width: 100%; border: 1px solid var(--border); border-radius: 4px; padding: 4px; background-color: #f8fafc;">
                    <button type="button" @click="companyForm.letterheadBase64 = ''" class="btn btn-danger btn-sm" style="display: block; margin-top: 6px;">Remove Letterhead</button>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary w-full">{{ editingCompanyId ? 'Save Changes' : 'Create Company Portal' }}</button>
              </form>
            </div>
          </div>

          <!-- 3-Step Confirmation Delete Company Modal -->
          <div v-if="showDeleteCompanyModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 1100;">
            <div class="card" style="width: 100%; max-width: 580px; margin-bottom: 0; border: 2px solid #ef4444; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
              <div class="card-header" style="background-color: #fef2f2; border-bottom: 1px solid #fee2e2;">
                <div class="card-title" style="color: #991b1b; display: flex; align-items: center; gap: 8px; font-weight: 700;">
                  ⚠️ Delete Corporate Tenant Company
                </div>
                <button type="button" @click="closeDeleteCompanyModal" class="btn btn-secondary btn-sm">Cancel</button>
              </div>

              <div style="padding: 20px;">
                <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px;">
                  <strong style="color: #9f1239; font-size: 14px;">Warning: Deleting "{{ companyToDelete?.displayName }}" ({{ companyToDelete?.subdomain }})</strong>
                  <p style="font-size: 12px; color: #be123c; margin: 4px 0 0 0;">
                    Deleting a company is an irreversible multi-phase process. You must complete all 3 verification checks below before permanently erasing database records.
                  </p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                  <!-- Check 1 -->
                  <label style="display: flex; align-items: flex-start; gap: 10px; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer;">
                    <input type="checkbox" v-model="deleteCheck1" style="margin-top: 2px; width: 18px; height: 18px; accent-color: #dc2626;">
                    <div>
                      <div style="font-weight: 600; font-size: 13px; color: #111827;">Check 1: Revoke Access & Disable Tenant</div>
                      <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">I confirm that proceeding will immediately revoke access tokens and set company status to Disabled for all users of "{{ companyToDelete?.displayName }}".</div>
                    </div>
                  </label>

                  <!-- Check 2 -->
                  <label style="display: flex; align-items: flex-start; gap: 10px; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer;">
                    <input type="checkbox" v-model="deleteCheck2" style="margin-top: 2px; width: 18px; height: 18px; accent-color: #dc2626;">
                    <div>
                      <div style="font-weight: 600; font-size: 13px; color: #111827;">Check 2: Confirm Record Purge</div>
                      <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">I confirm that all associated Stock Items, Parties, Duty Rules, GR Transactions, Shipping Bills, Monthly Returns, and Bank Accounts will be queued for permanent deletion.</div>
                    </div>
                  </label>

                  <!-- Check 3 -->
                  <label style="display: flex; align-items: flex-start; gap: 10px; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer;">
                    <input type="checkbox" v-model="deleteCheck3" style="margin-top: 2px; width: 18px; height: 18px; accent-color: #dc2626;">
                    <div>
                      <div style="font-weight: 600; font-size: 13px; color: #111827;">Check 3: Final Data Eradication (Irreversible)</div>
                      <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">I acknowledge that all company data and user accounts will be permanently erased from the system database. Data CANNOT be recovered.</div>
                    </div>
                  </label>
                </div>

                <!-- Admin Password Input -->
                <div class="form-group" style="margin-bottom: 20px;">
                  <label class="form-label" style="color: #991b1b; font-weight: 600;">System Administrator Password *</label>
                  <input type="password" v-model="deleteAdminPassword" placeholder="Enter System Admin Password to authorize" class="form-control" style="border-color: #f87171;" required>
                </div>

                <div v-if="deleteErrorMsg" style="color: #dc2626; font-size: 13px; margin-bottom: 14px; font-weight: 600; background-color: #fef2f2; padding: 8px 12px; border-radius: 4px; border: 1px solid #fecdd3;">
                  {{ deleteErrorMsg }}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <button type="button" @click="disableCompanyOnly(companyToDelete)" class="btn btn-secondary btn-sm" title="Disable access without deleting data">
                    Disable Company Only
                  </button>
                  <div style="display: flex; gap: 8px;">
                    <button type="button" @click="closeDeleteCompanyModal" class="btn btn-secondary btn-sm">Cancel</button>
                    <button type="button" 
                            @click="confirmDeleteCompany" 
                            :disabled="!deleteCheck1 || !deleteCheck2 || !deleteCheck3 || !deleteAdminPassword || isDeletingCompany" 
                            class="btn btn-danger btn-sm" 
                            style="font-weight: 600; background-color: #dc2626;">
                      {{ isDeletingCompany ? 'Deleting Data...' : 'Permanently Delete Company & All Data' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SUPER ADMIN: USERS LIST -->
        <div v-if="currentRoute === '#/admin/users'">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div class="card-title">User Accounts Directory</div>
              <div style="display: flex; gap: 12px; align-items: center;">
                <label style="font-size: 13px; font-weight: 500;">Filter Company:</label>
                <select v-model="userFilterCompanyId" class="form-control" style="width: 200px; padding: 4px 8px; font-size: 13px;">
                  <option value="">-- All Companies --</option>
                  <option v-for="comp in allCompanies" :value="comp.id">{{ comp.displayName }}</option>
                </select>
                <button type="button" @click="openCreateUserModal" class="btn btn-primary btn-sm">+ Create Account</button>
              </div>
            </div>

            <div class="table-container">
              <table class="table-main">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Phone / Contact</th>
                    <th>Assigned Company</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in filteredUsers" :key="u.id">
                    <td style="font-weight: 600;">{{ u.name }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.phone || 'N/A' }}</td>
                    <td>{{ u.company ? u.company.displayName : 'System Admin (Global)' }}</td>
                    <td>
                      <span class="badge" :class="u.role === 'admin' ? 'badge-danger' : u.role === 'manager' ? 'badge-warning' : 'badge-info'">
                        {{ u.role }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="u.status === 'active' ? 'badge-success' : 'badge-danger'">{{ u.status }}</span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 4px;">
                        <button type="button" @click="editUser(u)" class="btn btn-secondary btn-sm">Edit</button>
                        <button type="button" v-if="u.id !== currentUser.id" @click="deleteUser(u)" class="btn btn-danger btn-sm">Delete</button>
                        <button type="button" @click="adminResetUserPassword(u)" class="btn btn-secondary btn-sm">Reset Pass</button>
                        <button type="button" v-if="u.id !== currentUser.id" @click="toggleUserStatus(u)" class="btn btn-secondary btn-sm">
                          {{ u.status === 'active' ? 'Suspend' : 'Activate' }}
                        </button>
                        <span v-else style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Current User</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add/Edit User Modal -->
          <div v-if="showUserModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="width: 100%; max-width: 500px; margin-bottom: 0; max-height: 90vh; overflow-y: auto;">
              <div class="card-header">
                <div class="card-title">{{ editingUserId ? 'Edit User Account' : 'Create User Account' }}</div>
                <button type="button" @click="showUserModal = false" class="btn btn-secondary btn-sm">Close</button>
              </div>
              <form @submit.prevent="submitUser">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" v-model="userForm.name" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" v-model="userForm.email" class="form-control" :disabled="!!editingUserId" required>
                </div>
                <div v-if="!editingUserId" class="form-group">
                  <label class="form-label">Password</label>
                  <input type="password" v-model="userForm.password" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Assigned Company</label>
                  <select v-model="userForm.companyId" class="form-control">
                    <option value="">System Admin (No Company)</option>
                    <option v-for="comp in allCompanies" :value="comp.id">{{ comp.displayName }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Role</label>
                  <select v-model="userForm.role" class="form-control" required>
                    <option value="operator">Operator</option>
                    <option value="manager">Manager</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-full">{{ editingUserId ? 'Save Changes' : 'Create User Account' }}</button>
              </form>
            </div>
          </div>
        </div>

        <!-- SUPER ADMIN: DUTY RULES -->
        <div v-if="currentRoute === '#/admin/duty-rules'">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div class="card-title">Configured Duty Calculation Formulas</div>
              <div style="display: flex; gap: 12px; align-items: center;">
                <label style="font-size: 13px; font-weight: 500;">Filter Company:</label>
                <select v-model="ruleFilterCompanyId" class="form-control" style="width: 200px; padding: 4px 8px; font-size: 13px;">
                  <option value="">-- All Companies --</option>
                  <option v-for="comp in allCompanies" :value="comp.id">{{ comp.displayName }}</option>
                </select>
                <button type="button" @click="openCreateRuleModal" class="btn btn-primary btn-sm">+ Add Duty Rule</button>
              </div>
            </div>

            <div class="table-container">
              <table class="table-main">
                <thead>
                  <tr>
                    <th>Rule Name</th>
                    <th>Company</th>
                    <th>Commodity Type</th>
                    <th>Duty Percentage</th>
                    <th>Formula</th>
                    <th>Status</th>
                    <th>Version</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rule in filteredRules" :key="rule.id">
                    <td style="font-weight: 600;">{{ rule.name }}</td>
                    <td><span class="badge badge-info">{{ rule.company?.displayName || 'N/A' }}</span></td>
                    <td>{{ rule.commodityType }}</td>
                    <td style="font-weight: 600; color: var(--danger);">{{ rule.dutyPercentage }}%</td>
                    <td><code>{{ rule.formula || 'assessableValueInr * (dutyPercentage / 100)' }}</code></td>
                    <td>
                      <span class="badge" :class="rule.status === 'active' ? 'badge-success' : 'badge-danger'">{{ rule.status }}</span>
                    </td>
                    <td>v{{ rule.version }}</td>
                    <td>
                      <div style="display: flex; gap: 4px;">
                        <button type="button" @click="editRule(rule)" class="btn btn-secondary btn-sm">Edit</button>
                        <button type="button" @click="deleteRule(rule)" class="btn btn-danger btn-sm">Delete</button>
                        <button type="button" @click="toggleRuleStatus(rule)" class="btn btn-secondary btn-sm">
                          {{ rule.status === 'active' ? 'Deactivate' : 'Activate' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add/Edit Duty Rule Modal -->
          <div v-if="showRuleModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="card" style="width: 100%; max-width: 500px; margin-bottom: 0; max-height: 90vh; overflow-y: auto;">
              <div class="card-header">
                <div class="card-title">{{ editingRuleId ? 'Edit Duty Rule' : 'Create Duty Rule' }}</div>
                <button type="button" @click="showRuleModal = false" class="btn btn-secondary btn-sm">Close</button>
              </div>
              <form @submit.prevent="submitRule">
                <div class="form-group">
                  <label class="form-label">Target Company</label>
                  <select v-model="ruleForm.companyId" class="form-control" required>
                    <option value="">-- Choose Company --</option>
                    <option v-for="comp in allCompanies" :value="comp.id">{{ comp.displayName }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Rule Name</label>
                  <input type="text" v-model="ruleForm.name" placeholder="Standard Beer Duty" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Commodity Type</label>
                  <input type="text" v-model="ruleForm.commodityType" placeholder="e.g. Beer, Whiskey, Wine, Cigars" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Duty Percentage (%)</label>
                  <input type="number" step="0.1" v-model="ruleForm.dutyPercentage" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Calculation Formula (Optional)</label>
                  <input type="text" v-model="ruleForm.formula" placeholder="e.g. assessableValueInr * (dutyPercentage / 100)" class="form-control">
                  <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Variables allowed: qty, pricePerCaseUSD, exchangeRate, dutyPercentage, usdValue, assessableValueInr</p>
                </div>
                <button type="submit" class="btn btn-primary w-full">{{ editingRuleId ? 'Save Changes' : 'Create Duty Rule' }}</button>
              </form>
            </div>
          </div>
        </div>

        <!-- USER PROFILE ROUTE -->
        <div v-if="currentRoute === '#/profile'">
          <div class="card" style="max-width: 600px; margin: 0 auto;">
            <div class="card-header">
              <div class="card-title">My Account Profile Settings</div>
            </div>
            
            <form @submit.prevent="updateUserProfile">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" v-model="profileForm.name" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Email Address (Read-only)</label>
                <input type="email" :value="profileForm.email" class="form-control" disabled>
              </div>

              <div class="form-group">
                <label class="form-label">Contact / Phone Number</label>
                <input type="text" v-model="profileForm.phone" class="form-control">
              </div>

              <div class="form-group">
                <label class="form-label">New Password (Leave blank to keep current)</label>
                <input type="password" v-model="profileForm.password" placeholder="Enter new password" class="form-control">
              </div>

              <button type="submit" class="btn btn-primary w-full">Save Changes</button>
            </form>
          </div>
        </div>

        <!-- SUPER ADMIN: AUDIT LOGS ROUTE -->
        <div v-if="currentRoute === '#/admin/audit-logs'">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div class="card-title">Changes Made by Users (Audit Trail)</div>
              <button type="button" @click="fetchAuditLogs" class="btn btn-secondary btn-sm">Refresh Audit Log</button>
            </div>

            <div v-if="!allAuditLogs.length" style="padding: 40px; text-align: center; color: var(--text-muted);">
              No user edits recorded yet.
            </div>

            <div v-else class="table-container">
              <table class="table-main">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User / Role</th>
                    <th>Company</th>
                    <th>Entity Type</th>
                    <th>Entity Name</th>
                    <th>Action</th>
                    <th>Diff Checker (Old &rarr; New)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in allAuditLogs" :key="log.id">
                    <td style="font-size: 12px; white-space: nowrap;">
                      {{ formatDate(log.createdAt) }}<br>
                      <span style="color: var(--text-muted);">{{ new Date(log.createdAt).toLocaleTimeString() }}</span>
                    </td>
                    <td style="font-weight: 600;">
                      {{ log.userName }}<br>
                      <span class="badge badge-info" style="font-size: 10px;">{{ log.userRole }}</span>
                    </td>
                    <td>{{ log.company?.displayName || 'System Admin' }}</td>
                    <td><span class="badge badge-warning">{{ log.entityType }}</span></td>
                    <td style="font-weight: 600;">{{ log.entityName }}</td>
                    <td><span class="badge badge-success">{{ log.action }}</span></td>
                    <td>
                      <div style="font-family: monospace; font-size: 11px; max-width: 380px; background-color: #f8fafc; padding: 6px; border: 1px solid var(--border); border-radius: 4px;">
                        <div v-for="(change, idx) in parseChanges(log.changes)" :key="idx" style="margin-bottom: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
                          <strong style="color: var(--primary);">{{ change.field }}:</strong><br>
                          <span style="color: var(--danger); text-decoration: line-through;">{{ change.oldVal || '(empty)' }}</span>
                          &nbsp;&rarr;&nbsp;
                          <span style="color: var(--success); font-weight: 600;">{{ change.newVal }}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- BANK MANAGEMENT ROUTE -->
        <div v-if="currentRoute === '#/bank'">
          <BankManagement />
        </div>

        <!-- SYSTEM HEALTH MONITOR ROUTE -->
        <div v-if="currentRoute === '#/health'">
          <HealthDashboard :userRole="currentUser?.role" />
        </div>

      </div>
    </div>
  </div>
</div>


</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import jsPDF from 'jspdf';
import { getApiUrl } from './config.js';
import GRPurchases from './components/GRPurchases.vue';
import ShippingBills from './components/ShippingBills.vue';
import MonthlyReturns from './components/MonthlyReturns.vue';
import HealthDashboard from './components/HealthDashboard.vue';
import BankManagement from './components/BankManagement.vue';

const formatDate = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isCustomsDocsOpen = ref(true);


      // Session states
      const currentToken = ref(localStorage.getItem('token') || '');
      const currentUser = ref(null);
      const currentCompany = ref(null);
      const initialHash = window.location.hash;
      const currentRoute = ref((initialHash && initialHash !== '#') ? initialHash : (localStorage.getItem('token') ? '#/dashboard' : '#/login'));
      
      const authError = ref('');
      const authLoading = ref(false);

      // Login form state
      const loginForm = ref({
        subdomain: '',
        email: '',
        password: ''
      });

      // Data Lists
      const allCompanies = ref([]);
      const allUsers = ref([]);
      const allParties = ref([]);
      const allStock = ref([]);
      const allRules = ref([]);
      const allGRDocs = ref([]);
      const allAuditLogs = ref([]);
      const grDocsMeta = ref({});
      const selectedGRDoc = ref(null);
      const activePreviewDoc = ref('gr-front');
      const selectedInvoiceDate = ref('');
      const selectedDcDate = ref('');

      // Modals
      const showStockModal = ref(false);
      const showPartyModal = ref(false);
      const showOnboardingModal = ref(false);
      const onboardingStep = ref(1);
      const onboardingLoading = ref(false);
      const onboardingBank = ref({ accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', isPrimary: true });
      const onboardingBG = ref({ bgNumber: '', bankName: '', amount: null, expiryDate: '' });

      const showFinalizeGrModal = ref(false);
      const customGrNumberInput = ref('');
      const showConsignmentModal = ref(false);
      const dashboardAlerts = ref({ expiredStock: [], expiringStock: [], expiringBGs: [], expiredBGs: [], pendingReturn: null });
      const stockSearchFilter = ref('');
      const stockTypeFilter = ref('');
      const consignmentForm = ref({
        companyId: '',
        purchaseType: 'BE',
        purchaseNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        bondNumber: '',
        bondDate: new Date().toISOString().split('T')[0],
        items: []
      });

      const showCompanyModal = ref(false);
      const showDeleteCompanyModal = ref(false);
      const companyToDelete = ref(null);
      const deleteCheck1 = ref(false);
      const deleteCheck2 = ref(false);
      const deleteCheck3 = ref(false);
      const deleteAdminPassword = ref('');
      const deleteErrorMsg = ref('');
      const isDeletingCompany = ref(false);
      const showUserModal = ref(false);
      const showRuleModal = ref(false);

      // Filters
      const grDocsFilter = ref({
        search: '',
        status: ''
      });

      // Modal/Creation form states
      const stockForm = ref({
        companyId: '',
        commodityName: '',
        commodityType: 'Beer',
        pricePerCaseUSD: 0,
        purchaseType: 'BE',
        purchaseNumber: '',
        purchaseDate: '',
        bondNumber: '',
        bondDate: '',
        totalQuantity: 0,
        packing: '',
        unit: 'Cases',
        dutyPercentage: 110,
        presentDutyBalance: 0,
        bondExpiryDate: ''
      });

      const partyForm = ref({
        companyId: '',
        name: '',
        address: '',
        city: '',
        state: '',
        gstin: '',
        warehouseCode: '',
        phone: '',
        email: '',
        partyType: 'Both'
      });

      const ruleForm = ref({
        companyId: '',
        name: '',
        commodityType: '',
        dutyPercentage: 110,
        formula: ''
      });

      const confirmModal = ref({
        show: false,
        title: '',
        message: '',
        onConfirm: null
      });

      const triggerConfirm = (title, message, callback) => {
        confirmModal.value = {
          show: true,
          title,
          message,
          onConfirm: callback
        };
      };

      const closeConfirm = (confirmed) => {
        const cb = confirmModal.value.onConfirm;
        confirmModal.value.show = false;
        if (confirmed && cb) {
          cb();
        }
      };

      const companyForm = ref({
        displayName: '',
        legalName: '',
        subdomain: '',
        warehouseCode: '',
        gstin: '',
        iec: '',
        address: '',
        city: '',
        state: '',
        bankName: '',
        bankAccount: '',
        bgNumber: '',
        bgBankName: '',
        bgAmount: null,
        commodityTypes: 'Beer,Whisky/Wine/Rum,Cigarette',
        letterheadBase64: ''
      });

      const userForm = ref({
        name: '',
        email: '',
        password: '',
        companyId: '',
        role: 'operator'
      });

      const grForm = ref({
        companyId: '',
        date: new Date().toISOString().substr(0, 10),
        exchangeRate: 84.50,
        invoiceNumber: '',
        dcNumber: '',
        presentDutyBalance: 1000000,
        partyId: '',
        items: [
          { stockItemId: '', qty: 1, type: '', pricePerCaseUSD: 0, remainingQuantity: 0 }
        ]
      });

      // Profiles and edits state
      const profileForm = ref({
        name: '',
        email: '',
        phone: '',
        password: ''
      });

      const editingCompanyId = ref(null);
      const editingUserId = ref(null);
      const editingRuleId = ref(null);
      const editingPartyId = ref(null);
      const editingStockId = ref(null);
      const editingGRDocId = ref(null);

      // Filters refs
      const userFilterCompanyId = ref('');
      const ruleFilterCompanyId = ref('');
      const hideZeroStock = ref(true);

      // Custom prompt modal state
      const promptModal = ref({
        show: false,
        title: '',
        message: '',
        value: '',
        valueLabel: '',
        showValueInput: false,
        valueInputType: 'text',
        adminPassword: '',
        onConfirm: null
      });

      const triggerPrompt = ({ title, message, showValueInput, valueLabel, valueInputType, onConfirm }) => {
        promptModal.value = {
          show: true,
          title,
          message,
          value: '',
          valueLabel: valueLabel || 'New Value',
          showValueInput: !!showValueInput,
          valueInputType: valueInputType || 'text',
          adminPassword: '',
          onConfirm
        };
      };

      const closePrompt = (confirmed) => {
        const pm = promptModal.value;
        const cb = pm.onConfirm;
        pm.show = false;
        if (confirmed && cb) {
          cb(pm.value, pm.adminPassword);
        }
      };

      // Computed filters to separate company scoped values for super admin
      const filteredParties = computed(() => {
        if (currentUser.value?.role !== 'admin') return allParties.value;
        if (!grForm.value.companyId) return [];
        return allParties.value.filter(p => p.companyId === grForm.value.companyId);
      });

      const filteredStock = computed(() => {
        let list = allStock.value;
        if (currentUser.value?.role === 'admin') {
          if (!grForm.value.companyId) return [];
          list = allStock.value.filter(s => s.companyId === grForm.value.companyId);
        }
        if (hideZeroStock.value) {
          list = list.filter(s => s.remainingQuantity > 0);
        }
        return list;
      });

      const stockTableItems = computed(() => {
        let list = allStock.value;
        if (hideZeroStock.value) {
          list = list.filter(s => s.remainingQuantity > 0);
        }
        if (stockTypeFilter.value) {
          list = list.filter(s => s.commodityType === stockTypeFilter.value);
        }
        if (stockSearchFilter.value.trim()) {
          const q = stockSearchFilter.value.trim().toLowerCase();
          list = list.filter(s =>
            (s.commodityName && s.commodityName.toLowerCase().includes(q)) ||
            (s.bondNumber && s.bondNumber.toLowerCase().includes(q)) ||
            (s.purchaseNumber && s.purchaseNumber.toLowerCase().includes(q)) ||
            (s.beDetails && s.beDetails.toLowerCase().includes(q)) ||
            (s.bondDetails && s.bondDetails.toLowerCase().includes(q))
          );
        }
        return list;
      });

      const filteredUsers = computed(() => {
        if (!userFilterCompanyId.value) return allUsers.value;
        return allUsers.value.filter(u => u.companyId === userFilterCompanyId.value);
      });

      const filteredRules = computed(() => {
        if (!ruleFilterCompanyId.value) return allRules.value;
        return allRules.value.filter(r => r.companyId === ruleFilterCompanyId.value);
      });

      // Headers Helper
      const getHeaders = () => {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken.value}`
        };
        if (loginForm.value.subdomain) {
          headers['X-Subdomain'] = loginForm.value.subdomain;
        } else if (currentCompany.value?.subdomain) {
          headers['X-Subdomain'] = currentCompany.value.subdomain;
        } else if (currentUser.value?.role === 'admin') {
          headers['X-Subdomain'] = 'admin';
        }
        return headers;
      };

      const detectSubdomain = () => {
        const host = window.location.host;
        const parts = host.split('.');
        if (parts.length > 2) {
          loginForm.value.subdomain = parts[0];
        }
      };

      const navigate = (hash) => {
        window.location.hash = hash;
        currentRoute.value = hash;
        loadRouteData();
      };

      const getRouteTitle = () => {
        switch (currentRoute.value) {
          case '#/dashboard': return 'Dashboard Overview';
          case '#/gr-docs': return 'GR Sale Docs (Ex-Bond)';
          case '#/gr-purchases': return 'GR Purchases (Inbound)';
          case '#/shipping-bills': return 'Shipping Bills';
          case '#/monthly-returns': return 'Monthly Returns Compliance';
          case '#/gr-docs/create': return 'Create GR Document Package';
          case '#/stock': return 'Stock / Bonded Inventory';
          case '#/parties': return 'Parties / Consignees Registry';
          case '#/bank': return 'Bank Accounts & Guarantees';
          case '#/profile': return 'My Account Profile Settings';
          case '#/health': return 'System & API Operational Health';
          case '#/admin/companies': return 'Super Admin - Companies Tenant Registry';
          case '#/admin/users': return 'Super Admin - User Accounts Directory';
          case '#/admin/duty-rules': return 'Super Admin - Seeded Duty Calculation Rules';
          case '#/admin/audit-logs': return 'Super Admin - Changes Made by Users (Audit Logs)';
          default:
            if (currentRoute.value.startsWith('#/gr-docs/')) return 'Unified Document Package Preview';
            return 'Documents Portal';
        }
      };

      // Authentication API
      const handleLogin = async () => {
        authLoading.value = true;
        authError.value = '';
        try {
          const res = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginForm.value)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Login failed.');
          
          localStorage.setItem('token', data.token);
          currentToken.value = data.token;
          currentUser.value = data.user;
          
          await checkSession();
          navigate('#/dashboard');
        } catch (err) {
          authError.value = err.message;
        } finally {
          authLoading.value = false;
        }
      };

      const handleLogout = () => {
        localStorage.removeItem('token');
        currentToken.value = '';
        currentUser.value = null;
        currentCompany.value = null;
        navigate('#/login');
      };

      const checkSession = async () => {
        if (currentRoute.value === '#/health') {
          return;
        }
        if (!currentToken.value) {
          navigate('#/login');
          return;
        }
        try {
          const res = await fetch(getApiUrl('/api/auth/me'), {
            headers: getHeaders()
          });
          const data = await res.json();
          if (!res.ok) throw new Error('Session expired');
          
          currentUser.value = data.user;
          currentCompany.value = data.company;
        } catch (err) {
          if (currentRoute.value !== '#/health') {
            handleLogout();
          }
        }
      };

      // Data Load routing logic
      const loadRouteData = () => {
        if (currentRoute.value === '#/login' || currentRoute.value === '#/health') return;
        
        checkSession().then(() => {
          if (currentUser.value?.role === 'admin') {
            fetchCompanies();
          }

          if (currentRoute.value === '#/profile') {
            profileForm.value = {
              name: currentUser.value?.name || '',
              email: currentUser.value?.email || '',
              phone: currentUser.value?.phone || '',
              password: ''
            };
          } else if (currentRoute.value === '#/dashboard') {
            fetchStock();
            fetchParties();
            fetchGRDocs();
            fetchAlerts();
            fetchOnboardingStatus();
          } else if (currentRoute.value === '#/gr-docs') {
            fetchGRDocs();
          } else if (currentRoute.value === '#/gr-docs/create') {
            selectedGRDoc.value = null; // Clear unsaved preview memory
            if (currentUser.value?.role !== 'admin') {
              grForm.value.companyId = currentUser.value?.companyId || '';
            }
            fetchParties();
            fetchStock();
            fetchNextNumbers();
            fetchPresentDutyBalance();
          } else if (currentRoute.value === '#/stock') {
            fetchStock();
          } else if (currentRoute.value === '#/parties') {
            fetchParties();
          } else if (currentRoute.value === '#/admin/companies') {
            fetchCompanies();
          } else if (currentRoute.value === '#/admin/users') {
            fetchUsers();
          } else if (currentRoute.value === '#/admin/duty-rules') {
            fetchRules();
          } else if (currentRoute.value === '#/admin/audit-logs') {
            fetchAuditLogs();
          } else if (currentRoute.value.startsWith('#/gr-docs/')) {
            const parts = currentRoute.value.split('/');
            if (parts.length === 3) {
              fetchSingleGRDoc(parts[2]);
            }
          }
        });
      };

      const fetchAlerts = async () => {
        try {
          const res = await fetch(getApiUrl('/api/alerts'), { headers: getHeaders() });
          if (res.ok) {
            dashboardAlerts.value = await res.json();
          }
        } catch (e) {
          console.error('Failed to fetch dashboard alerts', e);
        }
      };

      const addConsignmentItem = () => {
        consignmentForm.value.items.push({
          commodityName: '',
          commodityType: 'Beer',
          totalQuantity: 1,
          packing: '',
          unit: 'Cases',
          pricePerCaseUSD: 0,
          dutyPercentage: 110,
          presentDutyBalance: 0
        });
      };

      const removeConsignmentItem = (idx) => {
        consignmentForm.value.items.splice(idx, 1);
      };

      const openCreateConsignmentModal = () => {
        consignmentForm.value = {
          companyId: currentUser.value?.role === 'admin' ? '' : (currentUser.value?.companyId || ''),
          purchaseType: 'BE',
          purchaseNumber: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          bondNumber: '',
          bondDate: new Date().toISOString().split('T')[0],
          items: [
            {
              commodityName: '',
              commodityType: 'Beer',
              totalQuantity: 1,
              packing: '',
              unit: 'Cases',
              pricePerCaseUSD: 0,
              dutyPercentage: 110,
              presentDutyBalance: 0
            }
          ]
        };
        showConsignmentModal.value = true;
      };

      const submitConsignment = async () => {
        if (!consignmentForm.value.items.length) {
          alert('Please add at least one stock item.');
          return;
        }
        try {
          const res = await fetch(getApiUrl('/api/stock/consignment'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(consignmentForm.value)
          });
          if (res.ok) {
            alert('Consignment stock registered successfully!');
            showConsignmentModal.value = false;
            fetchStock();
          } else {
            const err = await res.json();
            alert(err.error || 'Failed to save consignment.');
          }
        } catch (e) {
          alert('Network error while saving consignment.');
        }
      };

      const openFinalizeGrModal = () => {
        customGrNumberInput.value = '';
        showFinalizeGrModal.value = true;
      };

      const submitFinalizeGr = async (force = false) => {
        if (!customGrNumberInput.value.trim()) {
          alert('Customs Allotted GR Number is required.');
          return;
        }
        const id = selectedGRDoc.value?.transaction?.id;
        if (!id) return;
        const url = `/api/gr-docs/${id}/generate${force ? '?force=true' : ''}`;
        const res = await fetch(getApiUrl(url), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ customGrNumber: customGrNumberInput.value.trim(), force })
        });
        const data = await res.json();
        if (res.ok) {
          if (data.warning) {
            let warningMsg = 'WARNING: Stock or duty values have changed since this draft was saved:\n\n';
            data.changes.forEach(change => {
              warningMsg += `- ${change.item} (${change.field}): ${change.oldVal} -> ${change.newVal}\n`;
            });
            warningMsg += '\nDo you still want to proceed and finalize this document?';
            triggerConfirm('Values Changed - Confirm Finalization', warningMsg, () => {
              submitFinalizeGr(true);
            });
          } else {
            showFinalizeGrModal.value = false;
            fetchSingleGRDoc(id);
          }
        } else {
          alert(data.error || 'Failed to finalize GR Document package.');
        }
      };

      const fetchOnboardingStatus = async () => {
        if (currentUser.value?.role === 'admin') return;
        try {
          const [bankRes, bgRes] = await Promise.all([
            fetch(getApiUrl('/api/bank/accounts'), { headers: getHeaders() }),
            fetch(getApiUrl('/api/bank/guarantees'), { headers: getHeaders() })
          ]);
          if (bankRes.ok && bgRes.ok) {
            const accounts = await bankRes.json();
            const guarantees = await bgRes.json();
            if (!accounts.length) {
              onboardingStep.value = 1;
              showOnboardingModal.value = true;
            } else if (!guarantees.length) {
              onboardingStep.value = 2;
              showOnboardingModal.value = true;
            }
          }
        } catch (e) {
          console.error('Failed to fetch onboarding status', e);
        }
      };

      const submitOnboardingBank = async () => {
        onboardingLoading.value = true;
        try {
          const res = await fetch(getApiUrl('/api/bank/accounts'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(onboardingBank.value)
          });
          if (res.ok) {
            onboardingStep.value = 2;
          } else {
            const err = await res.json();
            alert(err.error || 'Failed to save bank account.');
          }
        } finally {
          onboardingLoading.value = false;
        }
      };

      const submitOnboardingBG = async () => {
        onboardingLoading.value = true;
        try {
          const res = await fetch(getApiUrl('/api/bank/guarantees'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(onboardingBG.value)
          });
          if (res.ok) {
            onboardingStep.value = 3;
          } else {
            const err = await res.json();
            alert(err.error || 'Failed to save bank guarantee.');
          }
        } finally {
          onboardingLoading.value = false;
        }
      };

      const finishOnboarding = () => {
        showOnboardingModal.value = false;
      };

      const finishOnboardingAndAddStock = () => {
        showOnboardingModal.value = false;
        openCreateStockModal();
      };

      // Fetch APIs
      const fetchCompanies = async () => {
        const res = await fetch(getApiUrl('/api/companies'), { headers: getHeaders() });
        if (res.ok) allCompanies.value = await res.json();
      };

      const fetchUsers = async () => {
        const res = await fetch(getApiUrl('/api/users'), { headers: getHeaders() });
        if (res.ok) allUsers.value = await res.json();
      };

      const fetchParties = async () => {
        const res = await fetch(getApiUrl('/api/parties'), { headers: getHeaders() });
        if (res.ok) allParties.value = await res.json();
      };

      const fetchStock = async () => {
        const res = await fetch(getApiUrl('/api/stock'), { headers: getHeaders() });
        if (res.ok) allStock.value = await res.json();
      };

      const fetchRules = async () => {
        const res = await fetch(getApiUrl('/api/duty-rules'), { headers: getHeaders() });
        if (res.ok) allRules.value = await res.json();
      };

      const fetchGRDocs = async () => {
        const query = new URLSearchParams({
          search: grDocsFilter.value.search,
          status: grDocsFilter.value.status
        }).toString();
        const res = await fetch(getApiUrl(`/api/gr-docs?${query}`), { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          allGRDocs.value = data.transactions;
          grDocsMeta.value = { total: data.total };
        }
      };

      const fetchSingleGRDoc = async (id) => {
        const res = await fetch(getApiUrl(`/api/gr-docs/${id}`), { headers: getHeaders() });
        if (res.ok) {
          selectedGRDoc.value = await res.json();
          activePreviewDoc.value = 'gr-front';
          const tx = selectedGRDoc.value.transaction;
          if (tx) {
            const invD = tx.invoiceDate || tx.date;
            const dcD = tx.dcDate || tx.date;
            selectedInvoiceDate.value = invD ? new Date(invD).toISOString().substr(0, 10) : '';
            selectedDcDate.value = dcD ? new Date(dcD).toISOString().substr(0, 10) : '';
          }
        }
      };

      const updateDocumentDates = async () => {
        if (!selectedGRDoc.value?.transaction?.id) return;
        const res = await fetch(getApiUrl(`/api/gr-docs/${selectedGRDoc.value.transaction.id}/dates`), {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            invoiceDate: selectedInvoiceDate.value,
            dcDate: selectedDcDate.value
          })
        });
        if (res.ok) {
          const updated = await res.json();
          selectedGRDoc.value.transaction.invoiceDate = updated.invoiceDate;
          selectedGRDoc.value.transaction.dcDate = updated.dcDate;
        } else {
          alert('Failed to update document dates.');
        }
      };

      const fetchNextNumbers = async () => {
        const targetId = currentUser.value?.role === 'admin' ? grForm.value.companyId : currentUser.value?.companyId;
        if (!targetId) return;
        const res = await fetch(getApiUrl(`/api/gr-docs/next-numbers?companyId=${targetId}`), { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          grForm.value.invoiceNumber = data.nextInvoiceNumber;
          grForm.value.dcNumber = data.nextDcNumber;
        }
      };

      const fetchPresentDutyBalance = async () => {
        const targetId = currentUser.value?.role === 'admin' ? grForm.value.companyId : currentUser.value?.companyId;
        if (!targetId) return;
        const rate = grForm.value.exchangeRate || 84.5;
        const res = await fetch(getApiUrl(`/api/stock/present-duty-balance?exchangeRate=${rate}&companyId=${targetId}`), { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          grForm.value.presentDutyBalance = data.totalDutyBalanceINR;
        }
      };

      const fetchAuditLogs = async () => {
        const res = await fetch(getApiUrl('/api/audit-logs'), { headers: getHeaders() });
        if (res.ok) {
          allAuditLogs.value = await res.json();
        }
      };

      const parseChanges = (jsonStr) => {
        try {
          return JSON.parse(jsonStr || '[]');
        } catch (e) {
          return [];
        }
      };

      // Toggles for Admin
      const toggleCompanyStatus = (company) => {
        const nextStatus = company.status === 'active' ? 'disabled' : 'active';
        const actionLabel = nextStatus === 'disabled' ? 'DISABLE' : 'ENABLE';
        const warning = nextStatus === 'disabled'
          ? `Disabling "${company.displayName}" will immediately revoke access for all company user accounts without deleting any database records.`
          : `Enabling "${company.displayName}" will restore system access for company users.`;

        triggerPrompt({
          title: `Confirm Company Status: ${actionLabel}`,
          message: `${warning}\n\nPlease enter System Admin password to authorize:`,
          onConfirm: async (val, adminPassword) => {
            if (!adminPassword) return;
            const res = await fetch(getApiUrl(`/api/companies/${company.id}`), {
              method: 'PUT',
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              },
              body: JSON.stringify({ status: nextStatus })
            });
            if (res.ok) {
              fetchCompanies();
              fetchUsers();
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to update company status.');
            }
          }
        });
      };

      const toggleUserStatus = (user) => {
        const nextStatus = user.status === 'active' ? 'suspended' : 'active';
        triggerPrompt({
          title: `Confirm User Status: ${nextStatus.toUpperCase()}`,
          message: `Are you sure you want to set status of user "${user.name}" to ${nextStatus.toUpperCase()}? System Admin password required:`,
          onConfirm: async (val, adminPassword) => {
            if (!adminPassword) return;
            const res = await fetch(getApiUrl(`/api/users/${user.id}`), {
              method: 'PUT',
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              },
              body: JSON.stringify({ status: nextStatus })
            });
            if (res.ok) {
              fetchUsers();
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to update user status.');
            }
          }
        });
      };

      const toggleRuleStatus = (rule) => {
        const nextStatus = rule.status === 'active' ? 'inactive' : 'active';
        triggerPrompt({
          title: `Confirm Duty Rule Status: ${nextStatus.toUpperCase()}`,
          message: `Are you sure you want to set status of duty rule "${rule.name}" to ${nextStatus.toUpperCase()}? System Admin password required:`,
          onConfirm: async (val, adminPassword) => {
            if (!adminPassword) return;
            const res = await fetch(getApiUrl(`/api/duty-rules/${rule.id}`), {
              method: 'PUT',
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              },
              body: JSON.stringify({ status: nextStatus })
            });
            if (res.ok) {
              fetchRules();
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to update duty rule status.');
            }
          }
        });
      };

      const submitStockItem = async () => {
        const isEditing = !!editingStockId.value;
        const url = isEditing ? `/api/stock/${editingStockId.value}` : '/api/stock';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(getApiUrl(url), {
          method,
          headers: getHeaders(),
          body: JSON.stringify(stockForm.value)
        });
        if (res.ok) {
          showStockModal.value = false;
          editingStockId.value = null;
          fetchStock();
          stockForm.value = {
            companyId: '',
            commodityName: '',
            commodityType: 'Beer',
            pricePerCaseUSD: 0,
            purchaseType: 'BE',
            purchaseNumber: '',
            purchaseDate: new Date().toISOString().substr(0, 10),
            bondNumber: '',
            bondDate: new Date().toISOString().substr(0, 10),
            totalQuantity: 0,
            packing: '',
            unit: 'Cases',
            dutyPercentage: 110,
            presentDutyBalance: 0,
            bondExpiryDate: ''
          };
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to save stock item.');
        }
      };

      const submitParty = async () => {
        const isEditing = !!editingPartyId.value;
        const url = isEditing ? `/api/parties/${editingPartyId.value}` : '/api/parties';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(getApiUrl(url), {
          method,
          headers: getHeaders(),
          body: JSON.stringify(partyForm.value)
        });
        if (res.ok) {
          showPartyModal.value = false;
          editingPartyId.value = null;
          fetchParties();
        partyForm.value = { companyId: '', name: '', address: '', city: '', state: '', gstin: '', warehouseCode: '', phone: '', email: '', partyType: 'Both' };
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to register party.');
        }
      };

      const editStockItem = (item) => {
        editingStockId.value = item.id;
        stockForm.value = {
          companyId: item.companyId,
          commodityName: item.commodityName,
          commodityType: item.commodityType,
          pricePerCaseUSD: item.pricePerCaseUSD,
          purchaseType: item.purchaseType || 'BE',
          purchaseNumber: item.purchaseNumber || '',
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().substr(0, 10) : '',
          bondNumber: item.bondNumber || '',
          bondDate: item.bondDate ? new Date(item.bondDate).toISOString().substr(0, 10) : '',
          totalQuantity: item.totalQuantity,
          remainingQuantity: item.remainingQuantity,
          packing: item.packing,
          unit: item.unit || 'Cases',
          dutyPercentage: item.dutyPercentage,
          presentDutyBalance: item.presentDutyBalance,
          bondExpiryDate: item.bondExpiryDate ? new Date(item.bondExpiryDate).toISOString().substr(0, 10) : ''
        };
        showStockModal.value = true;
      };

      const openCreateStockModal = () => {
        editingStockId.value = null;
        stockForm.value = {
          companyId: '',
          commodityName: '',
          commodityType: 'Beer',
          pricePerCaseUSD: 0,
          purchaseType: 'BE',
          purchaseNumber: '',
          purchaseDate: new Date().toISOString().substr(0, 10),
          bondNumber: '',
          bondDate: new Date().toISOString().substr(0, 10),
          totalQuantity: 0,
          packing: '',
          unit: 'Cases',
          dutyPercentage: 110,
          presentDutyBalance: 0,
          bondExpiryDate: ''
        };
        showStockModal.value = true;
      };

      const editParty = (party) => {
        editingPartyId.value = party.id;
        partyForm.value = {
          companyId: party.companyId,
          name: party.name,
          address: party.address,
          city: party.city,
          state: party.state,
          gstin: party.gstin || '',
          warehouseCode: party.warehouseCode || '',
          phone: party.phone || '',
          email: party.email || ''
        };
        showPartyModal.value = true;
      };

      const openCreatePartyModal = () => {
        editingPartyId.value = null;
        partyForm.value = { companyId: '', name: '', address: '', city: '', state: '', gstin: '', warehouseCode: '', phone: '', email: '' };
        showPartyModal.value = true;
      };

      const submitRule = () => {
        const isEditing = !!editingRuleId.value;
        const msg = isEditing 
          ? 'Enter your system admin password to save changes for this duty rule:'
          : 'Enter your system admin password to authorize creating this duty rule:';
        
        triggerPrompt({
          title: isEditing ? 'Confirm Edit Rule' : 'Confirm Create Rule',
          message: msg,
          onConfirm: async (val, adminPassword) => {
            const url = isEditing ? `/api/duty-rules/${editingRuleId.value}` : '/api/duty-rules';
            const method = isEditing ? 'PUT' : 'POST';
            
            const res = await fetch(getApiUrl(url), {
              method,
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              },
              body: JSON.stringify(ruleForm.value)
            });
            if (res.ok) {
              showRuleModal.value = false;
              fetchRules();
              editingRuleId.value = null;
              ruleForm.value = { companyId: '', name: '', commodityType: '', dutyPercentage: 110, formula: '' };
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to save duty rule.');
            }
          }
        });
      };

      const submitCompany = () => {
        const isEditing = !!editingCompanyId.value;
        const msg = isEditing 
          ? 'Enter your system admin password to save changes for this company:'
          : 'Enter your system admin password to authorize creating this company:';
        
        triggerPrompt({
          title: isEditing ? 'Confirm Edit Company' : 'Confirm Create Company',
          message: msg,
          onConfirm: async (val, adminPassword) => {
            const url = isEditing ? `/api/companies/${editingCompanyId.value}` : '/api/companies';
            const method = isEditing ? 'PUT' : 'POST';
            
            const res = await fetch(getApiUrl(url), {
              method,
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              },
              body: JSON.stringify(companyForm.value)
            });
            if (res.ok) {
              showCompanyModal.value = false;
              fetchCompanies();
              editingCompanyId.value = null;
              companyForm.value = { displayName: '', legalName: '', subdomain: '', warehouseCode: '', gstin: '', iec: '', address: '', city: '', state: '', bankName: '', bankAccount: '', letterheadBase64: '' };
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to save company.');
            }
          }
        });
      };

      const submitUser = () => {
        const isEditing = !!editingUserId.value;
        const msg = isEditing 
          ? 'Enter your system admin password to save changes for this user:'
          : 'Enter your system admin password to authorize creating this user:';
        
        triggerPrompt({
          title: isEditing ? 'Confirm Edit User' : 'Confirm Create User',
          message: msg,
          onConfirm: async (val, adminPassword) => {
            const url = isEditing ? `/api/users/${editingUserId.value}` : '/api/users';
            const method = isEditing ? 'PUT' : 'POST';
            
            const res = await fetch(getApiUrl(url), {
              method,
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              },
              body: JSON.stringify(userForm.value)
            });
            if (res.ok) {
              showUserModal.value = false;
              fetchUsers();
              editingUserId.value = null;
              userForm.value = { name: '', email: '', password: '', companyId: '', role: 'operator' };
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to save user.');
            }
          }
        });
      };

      const editCompany = (comp) => {
        editingCompanyId.value = comp.id;
        companyForm.value = {
          displayName: comp.displayName,
          legalName: comp.legalName,
          subdomain: comp.subdomain,
          warehouseCode: comp.warehouseCode || '',
          gstin: comp.gstin || '',
          iec: comp.iec || '',
          address: comp.address || '',
          city: comp.city || '',
          state: comp.state || '',
          bankName: comp.bankName || '',
          bankAccount: comp.bankAccount || '',
          bgNumber: comp.bgNumber || '',
          bgBankName: comp.bgBankName || '',
          bgAmount: comp.bgAmount || null,
          commodityTypes: comp.commodityTypes || 'Beer,Whisky/Wine/Rum,Cigarette',
          letterheadBase64: comp.letterheadBase64 || ''
        };
        showCompanyModal.value = true;
      };

      const deleteCompany = (comp) => {
        companyToDelete.value = comp;
        deleteCheck1.value = false;
        deleteCheck2.value = false;
        deleteCheck3.value = false;
        deleteAdminPassword.value = '';
        deleteErrorMsg.value = '';
        isDeletingCompany.value = false;
        showDeleteCompanyModal.value = true;
      };

      const closeDeleteCompanyModal = () => {
        showDeleteCompanyModal.value = false;
        companyToDelete.value = null;
        deleteCheck1.value = false;
        deleteCheck2.value = false;
        deleteCheck3.value = false;
        deleteAdminPassword.value = '';
        deleteErrorMsg.value = '';
        isDeletingCompany.value = false;
      };

      const confirmDeleteCompany = async () => {
        if (!companyToDelete.value) return;
        if (!deleteCheck1.value || !deleteCheck2.value || !deleteCheck3.value) {
          deleteErrorMsg.value = 'Please complete all 3 verification check steps before deleting.';
          return;
        }
        if (!deleteAdminPassword.value) {
          deleteErrorMsg.value = 'System Admin Password is required to authorize deletion.';
          return;
        }

        isDeletingCompany.value = true;
        deleteErrorMsg.value = '';

        try {
          const res = await fetch(getApiUrl(`/api/companies/${companyToDelete.value.id}`), {
            method: 'DELETE',
            headers: {
              ...getHeaders(),
              'X-Admin-Password': deleteAdminPassword.value
            }
          });

          if (res.ok) {
            closeDeleteCompanyModal();
            fetchCompanies();
            fetchUsers();
          } else {
            const err = await res.json();
            deleteErrorMsg.value = err.error || 'Failed to delete company.';
          }
        } catch (error) {
          deleteErrorMsg.value = 'Network error while attempting to delete company.';
        } finally {
          isDeletingCompany.value = false;
        }
      };

      const disableCompanyOnly = async (comp) => {
        if (!comp || !deleteAdminPassword.value) {
          deleteErrorMsg.value = 'System Admin Password is required to disable the company.';
          return;
        }
        try {
          const res = await fetch(getApiUrl(`/api/companies/${comp.id}`), {
            method: 'PUT',
            headers: {
              ...getHeaders(),
              'X-Admin-Password': deleteAdminPassword.value
            },
            body: JSON.stringify({ status: 'disabled' })
          });
          if (res.ok) {
            closeDeleteCompanyModal();
            fetchCompanies();
            fetchUsers();
          } else {
            const err = await res.json();
            deleteErrorMsg.value = err.error || 'Failed to disable company.';
          }
        } catch (error) {
          deleteErrorMsg.value = 'Network error while updating company status.';
        }
      };

      const editUser = (u) => {
        editingUserId.value = u.id;
        userForm.value = {
          name: u.name,
          email: u.email,
          password: '',
          companyId: u.companyId || '',
          role: u.role
        };
        showUserModal.value = true;
      };

      const deleteUser = (u) => {
        triggerPrompt({
          title: 'Delete User Account',
          message: `Are you sure you want to permanently delete the user account for "${u.name}"? Please verify your system administrator password:`,
          onConfirm: async (val, adminPassword) => {
            const res = await fetch(getApiUrl(`/api/users/${u.id}`), {
              method: 'DELETE',
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              }
            });
            if (res.ok) {
              fetchUsers();
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to delete user account.');
            }
          }
        });
      };

      const adminResetUserPassword = (u) => {
        triggerPrompt({
          title: 'Reset User Password',
          message: `Enter a new password for user "${u.name}" and authorize with your admin password:`,
          showValueInput: true,
          valueLabel: 'New Password for User',
          valueInputType: 'text',
          onConfirm: async (newValue, adminPassword) => {
            if (!newValue) {
              alert('New password cannot be empty.');
              return;
            }
            const res = await fetch(getApiUrl(`/api/users/${u.id}`), {
              method: 'PUT',
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              },
              body: JSON.stringify({ password: newValue })
            });
            if (res.ok) {
              alert('Password reset successfully.');
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to reset password.');
            }
          }
        });
      };

      const editRule = (rule) => {
        editingRuleId.value = rule.id;
        ruleForm.value = {
          companyId: rule.companyId,
          name: rule.name,
          commodityType: rule.commodityType,
          dutyPercentage: rule.dutyPercentage,
          formula: rule.formula || ''
        };
        showRuleModal.value = true;
      };

      const deleteRule = (rule) => {
        triggerPrompt({
          title: 'Delete Duty Rule',
          message: `Are you sure you want to permanently delete duty calculation rule "${rule.name}"? Please verify your system administrator password:`,
          onConfirm: async (val, adminPassword) => {
            const res = await fetch(getApiUrl(`/api/duty-rules/${rule.id}`), {
              method: 'DELETE',
              headers: {
                ...getHeaders(),
                'X-Admin-Password': adminPassword
              }
            });
            if (res.ok) {
              fetchRules();
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to delete duty rule.');
            }
          }
        });
      };

      const openCreateCompanyModal = () => {
        editingCompanyId.value = null;
        companyForm.value = { displayName: '', legalName: '', subdomain: '', warehouseCode: '', gstin: '', iec: '', address: '', city: '', state: '', bankName: '', bankAccount: '', letterheadBase64: '' };
        showCompanyModal.value = true;
      };

      const openCreateUserModal = () => {
        editingUserId.value = null;
        userForm.value = { name: '', email: '', password: '', companyId: '', role: 'operator' };
        showUserModal.value = true;
      };

      const openCreateRuleModal = () => {
        editingRuleId.value = null;
        ruleForm.value = { companyId: '', name: '', commodityType: '', dutyPercentage: 110, formula: '' };
        showRuleModal.value = true;
      };

      const updateUserProfile = async () => {
        const payload = {
          name: profileForm.value.name,
          phone: profileForm.value.phone
        };
        if (profileForm.value.password) {
          payload.password = profileForm.value.password;
        }

        const res = await fetch(getApiUrl(`/api/users/${currentUser.value.id}`), {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Profile updated successfully.');
          const updatedUser = await res.json();
          currentUser.value.name = updatedUser.name;
          currentUser.value.phone = updatedUser.phone;
          profileForm.value.password = '';
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update profile settings.');
        }
      };

      const onLetterheadSelected = (event) => {
        const file = event.target.files[0];
        if (file) {
          if (file.type !== 'image/png') {
            alert('Only PNG images are supported for letterheads.');
            event.target.value = '';
            return;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            companyForm.value.letterheadBase64 = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      };

      // GR creation logic
      const addGRItemRow = () => {
        grForm.value.items.push({ stockItemId: '', qty: 1, type: '', pricePerCaseUSD: 0, remainingQuantity: 0 });
      };

      const removeGRItemRow = (idx) => {
        grForm.value.items.splice(idx, 1);
      };

      const onGRStockSelected = (idx) => {
        const row = grForm.value.items[idx];
        const stock = allStock.value.find(s => s.id === row.stockItemId);
        if (stock) {
          row.type = stock.commodityType;
          row.unit = stock.unit || 'Cases';
          row.pricePerCaseUSD = stock.pricePerCaseUSD;
          row.remainingQuantity = stock.remainingQuantity;
        }
      };

      const onAdminTargetCompanyChanged = () => {
        // clear items row and resets selected fields
        grForm.value.items = [{ stockItemId: '', qty: 1, type: '', unit: 'Cases', pricePerCaseUSD: 0, remainingQuantity: 0 }];
        grForm.value.partyId = '';
        fetchNextNumbers();
        fetchPresentDutyBalance();
      };

      const editDraftGRPackage = () => {
        if (!selectedGRDoc.value?.transaction) return;
        const tx = selectedGRDoc.value.transaction;
        if (tx.status !== 'draft') {
          alert('Only draft GR documents can be edited.');
          return;
        }

        editingGRDocId.value = tx.id;
        grForm.value = {
          companyId: tx.companyId,
          date: tx.date ? new Date(tx.date).toISOString().substr(0, 10) : new Date().toISOString().substr(0, 10),
          exchangeRate: tx.exchangeRate,
          invoiceNumber: tx.invoiceNumber,
          dcNumber: tx.dcNumber,
          presentDutyBalance: tx.presentDutyBalance,
          partyId: tx.partyId,
          items: tx.items.map(item => {
            const stock = allStock.value.find(s => s.id === item.stockItemId);
            return {
              stockItemId: item.stockItemId,
              qty: item.qty,
              type: item.commodityType,
              unit: item.unit || stock?.unit || 'Cases',
              pricePerCaseUSD: item.pricePerCaseUSD,
              remainingQuantity: stock ? stock.remainingQuantity : item.qty
            };
          })
        };

        navigate('#/gr-docs/create');
      };

      const submitGRForm = async () => {
        // Validate stock availability
        for (const item of grForm.value.items) {
          if (item.qty > item.remainingQuantity) {
            alert(`Insufficient stock. You requested ${item.qty} ${item.unit || 'Cases'}, but only ${item.remainingQuantity} are available.`);
            return;
          }
        }

        const isEditing = !!editingGRDocId.value;
        const url = isEditing ? `/api/gr-docs/${editingGRDocId.value}` : '/api/gr-docs';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(getApiUrl(url), {
          method,
          headers: getHeaders(),
          body: JSON.stringify(grForm.value)
        });
        const data = await res.json();
        if (res.ok) {
          editingGRDocId.value = null;
          navigate(`#/gr-docs/${data.transaction.id}`);
          grForm.value = { companyId: '', date: new Date().toISOString().substr(0, 10), exchangeRate: 84.50, invoiceNumber: '', dcNumber: '', presentDutyBalance: 1000000, partyId: '', items: [{ stockItemId: '', qty: 1, type: '', unit: 'Cases', pricePerCaseUSD: 0, remainingQuantity: 0 }] };
        } else {
          alert(data.error || 'Failed to save GR document package.');
        }
      };

      const finalizeGRDocumentPackage = (force = false) => {
        const id = selectedGRDoc.value.transaction.id;
        const confirmTitle = force ? 'Proceed with Finalization' : 'Finalize GR Document';
        const confirmMsg = force 
          ? 'Are you sure you want to proceed and finalize this GR Document with the updated values?'
          : 'Are you sure you want to finalize this GR Document? This will lock all calculations, deduct remaining warehouse stock and duty balance permanently, and mark documents as finalized.';

        triggerConfirm(
          confirmTitle,
          confirmMsg,
          async () => {
            const url = `/api/gr-docs/${id}/generate${force ? '?force=true' : ''}`;
            const res = await fetch(getApiUrl(url), {
              method: 'POST',
              headers: getHeaders()
            });
            const data = await res.json();
            
            if (res.ok) {
              if (data.warning) {
                // Show concurrent modification dialog/diff list
                let warningMsg = 'WARNING: Stock or duty values have changed since this draft was saved because another transaction was finalized in the meantime:\n\n';
                data.changes.forEach(change => {
                  warningMsg += `- ${change.item} (${change.field}): ${change.oldVal} -> ${change.newVal}\n`;
                });
                warningMsg += '\nDo you still want to proceed and finalize this document?';
                
                triggerConfirm(
                  'Values Changed - Confirm Finalization',
                  warningMsg,
                  () => {
                    finalizeGRDocumentPackage(true); // Call again with force=true
                  }
                );
              } else {
                fetchSingleGRDoc(id);
              }
            } else {
              alert(data.error || 'Failed to finalize GR Document package.');
            }
          }
        );
      };

      const canCancelGR = (tx) => {
        if (!tx) return false;
        if (currentUser.value?.role === 'admin') return true;
        const diffTime = Math.abs(new Date() - new Date(tx.createdAt));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      };

      const cancelGRDocumentPackage = () => {
        if (!selectedGRDoc.value?.transaction) return;
        const tx = selectedGRDoc.value.transaction;
        triggerConfirm(
          'Cancel GR Document Package',
          `Are you sure you want to cancel GR "${tx.grNumber}"? This will reverse all stock and duty balance deductions. This action is permanent but the record will remain in the history as CANCELLED.`,
          async () => {
            const res = await fetch(getApiUrl(`/api/gr-docs/${tx.id}/cancel`), {
              method: 'POST',
              headers: getHeaders()
            });
            const data = await res.json();
            if (res.ok) {
              fetchSingleGRDoc(tx.id);
            } else {
              alert(data.error || 'Failed to cancel GR Document package.');
            }
          }
        );
      };

      const printPreviewDoc = () => {
        const frame = document.getElementById('docPreviewFrame');
        if (frame) {
          frame.contentWindow.focus();
          frame.contentWindow.print();
        }
      };

      const getStatusBadgeClass = (status) => {
        if (status === 'draft') return 'badge-warning';
        if (status === 'generated') return 'badge-success';
        if (status === 'printed') return 'badge-info';
        return 'badge-danger';
      };

      onMounted(() => {
        detectSubdomain();
        
        window.addEventListener('hashchange', () => {
          currentRoute.value = window.location.hash || '#/dashboard';
          loadRouteData();
        });

        loadRouteData();
      });

</script>

<style>

    /* DESIGN SYSTEM: Colors & Layout (Slate / Charcoal / Muted Blue) */
    :root {
      --primary: #1e3a8a; /* Deep Navy */
      --primary-hover: #172554;
      --secondary: #0f172a; /* Slate 900 */
      --bg-main: #f8fafc; /* Slate 50 */
      --bg-card: #ffffff;
      --text-main: #1e293b; /* Slate 800 */
      --text-muted: #64748b; /* Slate 500 */
      --border: #e2e8f0; /* Slate 200 */
      --success: #10b981; /* Emerald 500 */
      --warning: #f59e0b; /* Amber 500 */
      --danger: #ef4444; /* Red 500 */
      --sidebar-width: 260px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-main);
      color: var(--text-main);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Common Components */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      gap: 6px;
      text-decoration: none;
    }
    .btn-primary {
      background-color: var(--primary);
      color: white;
    }
    .btn-primary:hover {
      background-color: var(--primary-hover);
    }
    .btn-secondary {
      background-color: white;
      color: var(--text-main);
      border-color: var(--border);
    }
    .btn-secondary:hover {
      background-color: #f1f5f9;
      border-color: #cbd5e1;
    }
    .btn-danger {
      background-color: var(--danger);
      color: white;
    }
    .btn-danger:hover {
      opacity: 0.9;
    }
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 4px;
    }

    /* Login Screen Layout */
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at top right, #1e3a8a 0%, #0f172a 100%);
      padding: 24px;
    }
    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      width: 100%;
      max-width: 440px;
      padding: 40px;
    }
    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .login-header h1 {
      font-size: 24px;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 8px;
    }
    .login-header p {
      font-size: 14px;
      color: var(--text-muted);
    }

    /* Main App Layout */
    .app-shell {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: var(--sidebar-width);
      background-color: var(--secondary);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 100;
    }
    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sidebar-logo {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #3b82f6;
    }
    .sidebar-nav {
      flex: 1;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      gap: 12px;
    }
    .nav-item:hover, .nav-item.active {
      color: white;
      background-color: #1e293b;
    }
    .nav-item.active {
      background-color: var(--primary);
    }
    .sidebar-footer {
      padding: 16px 24px;
      border-top: 1px solid #1e293b;
      font-size: 12px;
      color: #64748b;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .topbar {
      height: 70px;
      background-color: white;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
    }
    .topbar-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--secondary);
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #e2e8f0;
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .content-body {
      padding: 32px;
      flex: 1;
    }

    /* Forms */
    .form-group {
      margin-bottom: 20px;
    }
    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #334155;
    }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      border-radius: 6px;
      border: 1px solid var(--border);
      outline: none;
      transition: all 0.2s;
    }
    .form-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
    }
    .form-grid {
      display: grid;
      grid-template-cols: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    /* Cards */
    .card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--secondary);
    }

    /* Tables */
    .table-container {
      width: 100%;
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: white;
    }
    .table-main {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;
    }
    .table-main th {
      background-color: #f8fafc;
      padding: 12px 16px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid var(--border);
    }
    .table-main td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-main);
    }
    .table-main tr:last-child td {
      border-bottom: none;
    }
    .table-main tr:hover {
      background-color: #f8fafc;
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 12px;
      text-transform: uppercase;
    }
    .badge-success {
      background-color: #d1fae5;
      color: #065f46;
    }
    .badge-warning {
      background-color: #fef3c7;
      color: #92400e;
    }
    .badge-danger {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .badge-info {
      background-color: #e0f2fe;
      color: #075985;
    }

    /* Alerts */
    .alert {
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .alert-danger {
      background-color: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }
    .alert-success {
      background-color: #d1fae5;
      border: 1px solid #6ee7b7;
      color: #065f46;
    }

    /* Document Preview Window */
    .preview-shell {
      display: grid;
      grid-template-columns: 240px 1fr;
      height: calc(100vh - 70px);
      background-color: #cbd5e1;
    }
    .preview-sidebar {
      background-color: #475569;
      color: white;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
    }
    .preview-sidebar h4 {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      padding-left: 4px;
    }
    .preview-doc-btn {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }
    .preview-doc-btn:hover, .preview-doc-btn.active {
      background-color: #334155;
      color: white;
    }
    .preview-viewer {
      background-color: #f1f5f9;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .preview-toolbar {
      height: 50px;
      background-color: #ffffff;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
    }
    .preview-frame-container {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      justify-content: center;
      background-color: #f1f5f9;
    }
    .preview-frame {
      width: 100%;
      height: 100%;
      border: 1px solid #94a3b8;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      background-color: #ffffff !important;
    }

    /* Dashboard grids */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .stat-val {
      font-size: 28px;
      font-weight: 700;
      color: var(--secondary);
      margin-top: 4px;
    }
    .stat-label {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .stat-icon {
      font-size: 24px;
      color: var(--primary);
      opacity: 0.3;
    }

    /* Autocomplete/Search Select styling */
    .autocomplete-wrapper {
      position: relative;
    }
    .autocomplete-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid var(--border);
      border-top: none;
      border-radius: 0 0 6px 6px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    .autocomplete-item {
      padding: 10px 12px;
      font-size: 14px;
      cursor: pointer;
    }
    .autocomplete-item:hover {
      background-color: #f1f5f9;
    }
  
</style>
