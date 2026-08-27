const prisma = require('../src/db/client');
const bcrypt = require('bcryptjs');

const API_BASE = 'http://localhost:3000';
const ADMIN_PASSWORD = 'DRKDAdmin#2026!Secured';

async function testCompanyDeletionAndDisabling() {
  console.log('--- STARTING COMPANY DELETION & DISABLING VERIFICATION TEST ---');

  try {
    // 1. Create a test company
    const compSubdomain = 'test-del-' + Date.now();
    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    const testComp = await prisma.company.create({
      data: {
        legalName: 'TEST DELETE CORP',
        displayName: 'Test Delete Corp',
        address: '123 Test St',
        city: 'Testville',
        state: 'Gujarat',
        subdomain: compSubdomain,
        status: 'active'
      }
    });

    // 2. Create a test user for this company
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Company User',
        email: `user-${Date.now()}@testdelete.com`,
        passwordHash,
        companyId: testComp.id,
        role: 'operator',
        status: 'active'
      }
    });

    console.log(`[PASS] Created Test Company (${testComp.id}) and User (${testUser.id})`);

    // 3. Test Login for this active company user
    let res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'TestPass123!' })
    });

    const loginData = await res.json();
    if (res.status !== 200 || !loginData.token) {
      throw new Error(`Login failed for active company user: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    console.log('[PASS] Login successful for active company user.');

    // 4. Test API request with active token
    res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status !== 200) {
      throw new Error(`GET /api/auth/me failed for active token: ${res.status}`);
    }
    console.log('[PASS] API request authorized for active company user.');

    // 5. Test DISABLING the company
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    
    // Login as Super Admin
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.email, password: ADMIN_PASSWORD })
    });
    const adminLogin = await res.json();
    const adminToken = adminLogin.token;

    // Update status of testComp to 'disabled'
    res = await fetch(`${API_BASE}/api/companies/${testComp.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'X-Admin-Password': ADMIN_PASSWORD
      },
      body: JSON.stringify({ status: 'disabled' })
    });
    if (res.status !== 200) {
      const err = await res.json();
      throw new Error(`Disabling company failed (${res.status}): ${JSON.stringify(err)}`);
    }
    console.log('[PASS] Company status set to "disabled".');

    // 6. Verify User CANNOT login when company is disabled
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'TestPass123!' })
    });
    const disabledLoginRes = await res.json();
    if (res.status !== 403 || !disabledLoginRes.error.includes('disabled')) {
      throw new Error(`Disabled company login check failed. Expected 403 with disabled message, got ${res.status}: ${JSON.stringify(disabledLoginRes)}`);
    }
    console.log(`[PASS] Disabled company login blocked with message: "${disabledLoginRes.error}"`);

    // 7. Verify existing JWT token is REJECTED by auth middleware when company is disabled
    res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const disabledAuthRes = await res.json();
    if (res.status !== 403 || !disabledAuthRes.error.includes('disabled')) {
      throw new Error(`Disabled company API request check failed. Expected 403, got ${res.status}: ${JSON.stringify(disabledAuthRes)}`);
    }
    console.log(`[PASS] Disabled company active API token rejected with message: "${disabledAuthRes.error}"`);

    // 8. Test PERMANENT DELETION of Company
    res = await fetch(`${API_BASE}/api/companies/${testComp.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'X-Admin-Password': ADMIN_PASSWORD
      }
    });
    if (res.status !== 200) {
      const err = await res.json();
      throw new Error(`Delete company failed (${res.status}): ${JSON.stringify(err)}`);
    }
    console.log('[PASS] Company deletion API called successfully.');

    // 9. Verify company and user records are completely removed from DB
    const deletedCompInDb = await prisma.company.findUnique({ where: { id: testComp.id } });
    const deletedUserInDb = await prisma.user.findUnique({ where: { id: testUser.id } });
    if (deletedCompInDb !== null || deletedUserInDb !== null) {
      throw new Error('Database record verification failed! Company or user still exists in DB after delete.');
    }
    console.log('[PASS] Company and User records confirmed erased from DB.');

    // 10. Verify login attempt after deletion returns deleted company error
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'TestPass123!' })
    });
    const deletedLoginRes = await res.json();
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Deleted user login check failed. Expected 401/403, got ${res.status}: ${JSON.stringify(deletedLoginRes)}`);
    }
    console.log(`[PASS] Deleted user login attempt blocked with status ${res.status}: "${deletedLoginRes.error}"`);

    console.log('\n==================================================');
    console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCompanyDeletionAndDisabling();
