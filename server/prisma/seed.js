const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user (super admin - companyId null)
  const adminPasswordHash = await bcrypt.hash('DRKDAdmin#2026!Secured', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@drkdtradelink.com' },
    update: {},
    create: {
      name: 'DRKD System Administrator',
      email: 'admin@drkdtradelink.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'active'
    }
  });
  console.log('Super admin created: admin@drkdtradelink.com');

  // Create default company: DRKD TRADELINK LLP
  const drkdCompany = await prisma.company.upsert({
    where: { subdomain: 'drkd' },
    update: {},
    create: {
      legalName: 'DRKD TRADELINK LLP',
      displayName: 'DRKD Tradelink',
      address: 'Shop No. 12, Ground Floor, Sector 8, Gandhidham, Gujarat',
      city: 'Gandhidham',
      state: 'Gujarat',
      country: 'India',
      postalCode: '370201',
      phone: '+91 2836 220000',
      email: 'docs@drkdtradelink.com',
      gstin: '24AAXFD9284E1ZW',
      iec: 'AAXFD9284E',
      warehouseCode: 'IXYS021',
      bankName: 'ICICI BANK',
      bankAccount: '244205001549',
      bankIfsc: 'ICIC0002442',
      bankBranch: 'Adipur Branch',
      customStation: 'BOND C.H.KANDLA',
      subdomain: 'drkd',
      status: 'active'
    }
  });
  console.log('Default company created: DRKD TRADELINK LLP (subdomain: drkd)');

  // Create users for DRKD Tradelink
  const managerPasswordHash = await bcrypt.hash('DRKDManager#2026!', 10);
  const operatorPasswordHash = await bcrypt.hash('DRKDOperator#2026!', 10);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@drkdtradelink.com' },
    update: {},
    create: {
      name: 'DRKD Manager',
      email: 'manager@drkdtradelink.com',
      passwordHash: managerPasswordHash,
      role: 'manager',
      companyId: drkdCompany.id,
      status: 'active'
    }
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@drkdtradelink.com' },
    update: {},
    create: {
      name: 'DRKD Operator',
      email: 'operator@drkdtradelink.com',
      passwordHash: operatorPasswordHash,
      role: 'operator',
      companyId: drkdCompany.id,
      status: 'active'
    }
  });
  console.log('DRKD Users created: manager@drkdtradelink.com, operator@drkdtradelink.com');

  // Create default duty rules for DRKD Tradelink
  await prisma.dutyRule.upsert({
    where: { id: 'beer-rule-default' }, // we can use uuid, but let's upsert by unique key combination or we can create if none exist
    update: {},
    create: {
      id: 'beer-rule-default',
      companyId: drkdCompany.id,
      name: 'Standard Beer Duty',
      commodityType: 'Beer',
      dutyPercentage: 110.0,
      status: 'active',
      version: 1
    }
  });

  await prisma.dutyRule.upsert({
    where: { id: 'alcohol-rule-default' },
    update: {},
    create: {
      id: 'alcohol-rule-default',
      companyId: drkdCompany.id,
      name: 'Standard Alcohol/Wine Duty',
      commodityType: 'Alcohol/Wine',
      dutyPercentage: 150.0,
      status: 'active',
      version: 1
    }
  });
  console.log('Default Duty Rules seeded');

  // Create default Parties (Buyers/Consignees) for DRKD
  const rubyShipping = await prisma.party.create({
    data: {
      companyId: drkdCompany.id,
      name: 'M/S RUBY SHIPPING',
      address: 'PLOT NO. 45, GIDC SECTOR 3, ADIPUR (KUTCH), GUJARAT',
      city: 'Adipur',
      state: 'Gujarat',
      gstin: '24AAACR1234F1Z0',
      warehouseCode: 'IXY1S004',
      phone: '+91 98765 43210',
      email: 'ruby.shipping@gmail.com',
      status: 'active'
    }
  });

  const genericBuyer = await prisma.party.create({
    data: {
      companyId: drkdCompany.id,
      name: 'M/S SAPPHIRE LOGISTICS',
      address: 'SURVEY NO. 112/A, OPP. CUSTOM HOUSE, KANDLA (KUTCH), GUJARAT',
      city: 'Kandla',
      state: 'Gujarat',
      gstin: '24AABCS5678D1Z2',
      warehouseCode: 'IXY2S009',
      phone: '+91 99999 88888',
      email: 'sapphire.logistics@hotmail.com',
      status: 'active'
    }
  });
  console.log('Default Parties created');

  // Create default Stock Items for DRKD
  await prisma.stockItem.create({
    data: {
      companyId: drkdCompany.id,
      commodityName: 'Carlsberg Elephant Premium Beer',
      commodityType: 'Beer',
      beDetails: 'BE/9827461/12-04-2026',
      bondDetails: 'BOND/2026/089',
      bondExpiryDate: new Date('2027-04-12'),
      pricePerCaseUSD: 14.50,
      totalQuantity: 500,
      remainingQuantity: 350,
      packing: '24 Cans x 500ml',
      dutyPercentage: 110.0,
      presentDutyBalance: 850000.00
    }
  });

  await prisma.stockItem.create({
    data: {
      companyId: drkdCompany.id,
      commodityName: 'Chivas Regal 12 Years Blended Scotch Whisky',
      commodityType: 'Alcohol/Wine',
      beDetails: 'BE/9811234/20-03-2026',
      bondDetails: 'BOND/2026/045',
      bondExpiryDate: new Date('2027-03-20'),
      pricePerCaseUSD: 168.00,
      totalQuantity: 100,
      remainingQuantity: 64,
      packing: '12 Bottles x 750ml',
      dutyPercentage: 150.0,
      presentDutyBalance: 1200000.00
    }
  });
  console.log('Default Stock Items created');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
