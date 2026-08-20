const express = require('express');
const prisma = require('../db/client');
const { authenticate } = require('../middleware/auth');
const { renderDocument } = require('../services/documentGenerator');

const router = express.Router();

router.use(authenticate);

// Enforce company context
router.use((req, res, next) => {
  if (!req.company && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Company context is required.' });
  }
  next();
});

router.get('/', async (req, res) => {
  try {
    const whereClause = {};
    if (req.company) whereClause.companyId = req.company.id;
    
    const transactions = await prisma.gRPurchaseTransaction.findMany({
      where: whereClause,
      include: {
        vendor: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ transactions });
  } catch (error) {
    console.error('List GR purchases error:', error);
    res.status(500).json({ error: 'Failed to retrieve GR purchases.' });
  }
});

router.get('/next-number', async (req, res) => {
  try {
    let targetCompanyId = req.company?.id || req.query.companyId || req.user?.companyId;
    if (!targetCompanyId) {
      const defaultCompany = await prisma.company.findFirst();
      targetCompanyId = defaultCompany?.id;
    }
    if (!targetCompanyId) return res.status(400).json({ error: 'companyId is required.' });

    const company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
    const prefix = `GRP-${company?.subdomain?.toUpperCase() || 'TX'}-${new Date().getFullYear()}-`;

    const allTxs = await prisma.gRPurchaseTransaction.findMany({
      where: { companyId: targetCompanyId },
      select: { grPurchaseNumber: true }
    });

    let maxNum = 0;
    for (const tx of allTxs) {
      if (tx.grPurchaseNumber && tx.grPurchaseNumber.startsWith(prefix)) {
        const numPart = tx.grPurchaseNumber.replace(prefix, '');
        const num = parseInt(numPart);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }

    const nextNumber = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
    res.json({ nextNumber });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate next number.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.company) whereClause.companyId = req.company.id;

    const transaction = await prisma.gRPurchaseTransaction.findFirst({
      where: whereClause,
      include: { vendor: true, items: true }
    });
    if (!transaction) return res.status(404).json({ error: 'Not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve GR purchase.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { grPurchaseNumber, date, vendorId, items, exchangeRate } = req.body;
    let targetCompanyId = req.company?.id || req.body.companyId || req.user?.companyId;

    if (!targetCompanyId) {
      const defaultCompany = await prisma.company.findFirst();
      if (!defaultCompany) {
        return res.status(400).json({ error: 'No company found in database.' });
      }
      targetCompanyId = defaultCompany.id;
    }
    
    let totalBondValue = 0;
    const company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
    const multiplier = company?.bondMultiplier || 3.0;

    const itemData = (items || []).map(item => {
      const dutyAmt = (item.assessableValueInr || 0) * ((item.dutyPercentage || 0) / 100);
      totalBondValue += dutyAmt * multiplier;
      return {
        commodityName: item.commodityName,
        commodityType: item.commodityType,
        qty: parseInt(item.qty) || 0,
        unit: item.unit || 'Cases',
        packing: item.packing || '',
        rate: parseFloat(item.rate) || 0,
        usdValue: parseFloat(item.usdValue) || 0,
        assessableValueInr: parseFloat(item.assessableValueInr) || 0,
        dutyPercentage: parseFloat(item.dutyPercentage) || 0,
        dutyAmountInr: dutyAmt
      };
    });

    const transaction = await prisma.gRPurchaseTransaction.create({
      data: {
        grPurchaseNumber,
        companyId: targetCompanyId,
        userId: req.user.id,
        vendorId,
        date: new Date(date || Date.now()),
        status: 'draft',
        bondValue: totalBondValue,
        items: { create: itemData }
      },
      include: { items: true }
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create GR purchase error:', error);
    res.status(500).json({ error: 'Failed to create GR purchase: ' + error.message });
  }
});

router.post('/:id/finalize', async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.company) whereClause.companyId = req.company.id;

    const tx = await prisma.gRPurchaseTransaction.findFirst({
      where: whereClause,
      include: { items: true }
    });

    if (!tx) return res.status(404).json({ error: 'Not found' });
    if (tx.status === 'finalized') return res.status(400).json({ error: 'Already finalized' });

    // Create Stock Items
    for (const item of tx.items) {
      await prisma.stockItem.create({
        data: {
          companyId: tx.companyId,
          commodityName: item.commodityName,
          commodityType: item.commodityType,
          purchaseType: 'GR',
          purchaseNumber: tx.grPurchaseNumber,
          purchaseDate: tx.date,
          bondNumber: `BOND-${tx.grPurchaseNumber}`,
          bondDate: tx.date,
          beDetails: `GR NO: ${tx.grPurchaseNumber} DT: ${tx.date.toISOString().split('T')[0]}`,
          bondDetails: `BOND NO: BOND-${tx.grPurchaseNumber} DT: ${tx.date.toISOString().split('T')[0]}`,
          pricePerCaseUSD: item.rate,
          totalQuantity: item.qty,
          remainingQuantity: item.qty,
          packing: item.packing || '',
          unit: item.unit,
          dutyPercentage: item.dutyPercentage,
          presentDutyBalance: item.dutyAmountInr,
          grPurchaseId: tx.id
        }
      });
    }

    const updated = await prisma.gRPurchaseTransaction.update({
      where: { id: tx.id },
      data: { status: 'finalized', generatedAt: new Date() }
    });

    res.json(updated);
  } catch (error) {
    console.error('Finalize GR purchase error:', error);
    res.status(500).json({ error: 'Failed to finalize GR purchase.' });
  }
});

const {
  renderTripleDutyBond, renderBondSubmissionLetter, renderNotesheet,
  renderDutyCalculation, renderStocklist, renderWarehousingBond,
  renderSpaceCertificate, renderCoveringLetter
} = require('../services/templates/grPurchaseTemplates');

router.get('/:id/preview/:doc', async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.company) whereClause.companyId = req.company.id;

    const tx = await prisma.gRPurchaseTransaction.findFirst({
      where: whereClause,
      include: { vendor: true, items: true, company: true }
    });

    if (!tx) return res.status(404).json({ error: 'Not found' });

    let html = '';
    const { doc } = req.params;
    // Parse optional snapshot data back into tx
    if (tx.calculationSnapshot) {
      try { Object.assign(tx, JSON.parse(tx.calculationSnapshot)); } catch(e) {}
    }

    if (doc === 'bond' || doc === 'triple-duty-bond') html = renderTripleDutyBond(tx, tx.company, tx.vendor, tx.items);
    else if (doc === 'submission-letter' || doc === 'covering-letter') html = renderBondSubmissionLetter(tx, tx.company, tx.vendor, tx.items);
    else if (doc === 'notesheet') html = renderNotesheet(tx, tx.company, tx.vendor, tx.items);
    else if (doc === 'duty-calculation') html = renderDutyCalculation(tx, tx.company, tx.vendor, tx.items);
    else if (doc === 'stocklist' || doc === 'space-certificate') html = renderStocklist(tx, tx.company, tx.vendor, tx.items);
    else return res.status(400).json({ error: 'Unknown document type: ' + doc });

    // Templates now return full self-contained HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('GR Preview error:', error);
    res.status(500).send('<h3>Failed to generate preview: ' + error.message + '</h3>');
  }
});

module.exports = router;
