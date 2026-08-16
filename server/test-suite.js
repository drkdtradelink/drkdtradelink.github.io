/**
 * Automated Test Suite for Documents Portal
 * Tests: Calculations, Authentication, Multi-tenant Isolation, Stock Deductions
 */
const bcrypt = require('bcryptjs');
const prisma = require('./src/db/client');
const { calculateItemDuty } = require('./src/services/dutyCalculation');

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING AUTOMATED TEST SUITE FOR DOCUMENTS PORTAL');
  console.log('==================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  const testCases = [
    {
      name: 'Duty Calculation: Beer Standard (110%)',
      fn: async () => {
        const result = calculateItemDuty({
          qty: 10,
          pricePerCaseUSD: 15.00,
          exchangeRate: 84.00,
          dutyPercentage: 110.0
        });

        assert(result.usdValue === 150.00, `USD value should be 150.00, got ${result.usdValue}`);
        assert(result.assessableValueInr === 12600.00, `Assessable INR should be 12600.00, got ${result.assessableValueInr}`);
        assert(result.dutyAmountInr === 13860.00, `Duty INR should be 13860.00, got ${result.dutyAmountInr}`);
      }
    },
    {
      name: 'Duty Calculation: Wine Standard (150%)',
      fn: async () => {
        const result = calculateItemDuty({
          qty: 5,
          pricePerCaseUSD: 100.00,
          exchangeRate: 85.00,
          dutyPercentage: 150.0
        });

        assert(result.usdValue === 500.00, `USD value should be 500.00, got ${result.usdValue}`);
        assert(result.assessableValueInr === 42500.00, `Assessable INR should be 42500.00, got ${result.assessableValueInr}`);
        assert(result.dutyAmountInr === 63750.00, `Duty INR should be 63750.00, got ${result.dutyAmountInr}`);
      }
    },
    {
      name: 'Database: Company Subdomain Lookup',
      fn: async () => {
        const company = await prisma.company.findUnique({
          where: { subdomain: 'drkd' }
        });

        assert(company !== null, 'Should find seeded company "drkd"');
        assert(company.legalName === 'DRKD TRADELINK LLP', `Expected legalName "DRKD TRADELINK LLP", got "${company.legalName}"`);
      }
    },
    {
      name: 'Authentication: User Password Verification',
      fn: async () => {
        const user = await prisma.user.findUnique({
          where: { email: 'manager@drkdtradelink.com' }
        });

        assert(user !== null, 'Seeded manager user should exist');
        const isMatch = await bcrypt.compare('DRKDManager#2026!', user.passwordHash);
        assert(isMatch === true, 'Stored password hash should match "DRKDManager#2026!"');
      }
    },
    {
      name: 'Multi-Tenant Isolation validation',
      fn: async () => {
        const companies = await prisma.company.findMany();
        assert(companies.length >= 1, 'Should have at least one seeded company');
        
        // If another company exists, check that queries are segregated.
        // Let's create a temporary secondary company to test isolation
        const secondaryCompany = await prisma.company.upsert({
          where: { subdomain: 'test-isolate' },
          update: {},
          create: {
            legalName: 'ISOLATION TEST CORP',
            displayName: 'Isolate Corp',
            address: '123 Test Lane',
            city: 'Test City',
            state: 'Gujarat',
            subdomain: 'test-isolate',
            status: 'active'
          }
        });

        // Add a party to secondary company
        const partyForSecondary = await prisma.party.create({
          data: {
            companyId: secondaryCompany.id,
            name: 'SECRET ENEMY BUYER',
            address: 'Enemy hideout',
            city: 'Hidden',
            state: 'Secret'
          }
        });

        // Query parties belonging to default DRKD company
        const drkdCompany = await prisma.company.findUnique({ where: { subdomain: 'drkd' } });
        const drkdParties = await prisma.party.findMany({
          where: { companyId: drkdCompany.id }
        });

        // Verify the secondary company's party is NOT present in DRKD company's query
        const containsSecretBuyer = drkdParties.some(p => p.id === partyForSecondary.id);
        assert(containsSecretBuyer === false, 'Tenant isolation query segregation failed. Company A fetched Company B data.');

        // Clean up isolation test records
        await prisma.party.delete({ where: { id: partyForSecondary.id } });
        await prisma.company.delete({ where: { id: secondaryCompany.id } });
      }
    },
    {
      name: 'Inventory: Stock Deduction Flow',
      fn: async () => {
        const drkdCompany = await prisma.company.findUnique({ where: { subdomain: 'drkd' } });
        const manager = await prisma.user.findFirst({ where: { email: 'manager@drkdtradelink.com' } });
        const party = await prisma.party.findFirst({ where: { companyId: drkdCompany.id } });

        // Create temporary stock item
        const stockItem = await prisma.stockItem.create({
          data: {
            companyId: drkdCompany.id,
            commodityName: 'Test Isolate Beer',
            commodityType: 'Beer',
            beDetails: 'BE/TEST/99',
            bondDetails: 'BOND/TEST/99',
            pricePerCaseUSD: 10.00,
            totalQuantity: 100,
            remainingQuantity: 100,
            packing: '24 Bottles',
            dutyPercentage: 110.0,
            presentDutyBalance: 50000.00
          }
        });

        // Create draft GR transaction drawing 5 cases
        const grTx = await prisma.gRTransaction.create({
          data: {
            grNumber: 'GR-TEST-DEDUCT',
            companyId: drkdCompany.id,
            userId: manager.id,
            partyId: party.id,
            date: new Date(),
            exchangeRate: 84.00,
            invoiceNumber: 'INV-TEST-D',
            dcNumber: 'DC-TEST-D',
            presentDutyBalance: 100000,
            status: 'draft',
            calculationSnapshot: '{}',
            items: {
              create: {
                stockItemId: stockItem.id,
                item: stockItem.commodityName,
                commodityType: stockItem.commodityType,
                qty: 5,
                packing: stockItem.packing,
                pricePerCaseUSD: stockItem.pricePerCaseUSD,
                beDetails: stockItem.beDetails,
                bondDetails: stockItem.bondDetails,
                balanceInBond: '100 Cases',
                usdValue: 50.0,
                assessableValueInr: 4200.0,
                dutyPercentage: 110.0,
                dutyAmountInr: 4620.0
              }
            }
          },
          include: {
            items: true
          }
        });

        // Deduct/Finalize transaction simulation
        await prisma.$transaction(async (tx) => {
          for (const item of grTx.items) {
            await tx.stockItem.update({
              where: { id: item.stockItemId },
              data: {
                remainingQuantity: {
                  decrement: item.qty
                }
              }
            });
          }
          await tx.gRTransaction.update({
            where: { id: grTx.id },
            data: { status: 'generated' }
          });
        });

        // Reload stock item to verify decrement
        const reloadedStock = await prisma.stockItem.findUnique({
          where: { id: stockItem.id }
        });

        assert(reloadedStock.remainingQuantity === 95, `Remaining stock quantity should be 95, got ${reloadedStock.remainingQuantity}`);

        // Clean up test records
        await prisma.gRTransactionItem.deleteMany({ where: { transactionId: grTx.id } });
        await prisma.gRTransaction.delete({ where: { id: grTx.id } });
        await prisma.stockItem.delete({ where: { id: stockItem.id } });
      }
    }
  ];

  for (const tc of testCases) {
    try {
      console.log(`[RUNNING] ${tc.name}...`);
      await tc.fn();
      console.log(`[PASSED] ${tc.name}\n`);
      passedTests++;
    } catch (err) {
      console.error(`[FAILED] ${tc.name}`);
      console.error(`Reason: ${err.message}\n`);
      failedTests++;
    }
  }

  console.log('==================================================');
  console.log('TEST SUITE EXECUTION SUMMARY');
  console.log('==================================================');
  console.log(`Total Tests Run: ${testCases.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('==================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
