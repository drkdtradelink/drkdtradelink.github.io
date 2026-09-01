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
    
    const transactions = await prisma.shippingBillTransaction.findMany({
      where: whereClause,
      include: {
        consignee: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ transactions });
  } catch (error) {
    console.error('List Shipping Bills error:', error);
    res.status(500).json({ error: 'Failed to retrieve Shipping Bills.' });
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
    const prefix = `PSB-${company?.subdomain?.toUpperCase() || 'TX'}-${new Date().getFullYear()}-`;

    const allTxs = await prisma.shippingBillTransaction.findMany({
      where: { companyId: targetCompanyId },
      select: { sbNumber: true }
    });

    let maxNum = 0;
    for (const tx of allTxs) {
      if (tx.sbNumber && tx.sbNumber.startsWith(prefix)) {
        const numPart = tx.sbNumber.replace(prefix, '');
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

    const transaction = await prisma.shippingBillTransaction.findFirst({
      where: whereClause,
      include: { 
        consignee: true, 
        items: {
          include: {
            stockItem: true
          }
        } 
      }
    });
    if (!transaction) return res.status(404).json({ error: 'Not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve Shipping Bill.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { sbNumber, date, consigneeId, portOfLoading, portOfDischarge,
            vesselName, rotationNo, invoiceNumber, exchangeRate, items,
            netWeight, grossWeight, ar4Number, qCertNumber, customHouseAgent,
            containerNos, marksAndNos, typeOfShipment, natureOfContract } = req.body;
    let targetCompanyId = req.company?.id || req.body.companyId || req.user?.companyId;

    if (!targetCompanyId) {
      const defaultCompany = await prisma.company.findFirst();
      if (!defaultCompany) {
        return res.status(400).json({ error: 'No company found in database.' });
      }
      targetCompanyId = defaultCompany.id;
    }

    const itemsList = items || [];

    // Validate stock quantities
    for (const item of itemsList) {
      const stockItem = await prisma.stockItem.findUnique({ where: { id: item.stockItemId } });
      if (!stockItem) return res.status(400).json({ error: `Stock item ${item.stockItemId} not found.` });
      if (parseInt(item.exportQty) > stockItem.remainingQuantity) {
        return res.status(400).json({ error: `Cannot export ${item.exportQty} units. Only ${stockItem.remainingQuantity} remain.` });
      }
    }

    const itemData = itemsList.map(item => ({
      stockItemId: item.stockItemId,
      exportQty: parseInt(item.exportQty) || 0,
      fobValue: parseFloat(item.fobValue) || 0
    }));

    const transaction = await prisma.shippingBillTransaction.create({
      data: {
        sbNumber,
        companyId: targetCompanyId,
        userId: req.user.id,
        consigneeId,
        date: new Date(date || Date.now()),
        portOfLoading: portOfLoading || 'AT KANDLA PORT',
        portOfDischarge: portOfDischarge || 'BOND STORES NOT TO BE LANDED',
        vesselName: vesselName || '',
        rotationNo: rotationNo || 'N.A.',
        invoiceNumber: invoiceNumber || '',
        ar4Number: ar4Number || 'N.A.',
        qCertNumber: qCertNumber || 'N.A.',
        customHouseAgent: customHouseAgent || 'SELF / LIC No. CHA/KDL',
        containerNos: containerNos || '',
        marksAndNos: marksAndNos || '',
        typeOfShipment: typeOfShipment || 'BONDED STORES',
        natureOfContract: natureOfContract || 'FOB',
        netWeight: parseFloat(netWeight) || 0,
        grossWeight: parseFloat(grossWeight) || 0,
        exchangeRate: parseFloat(exchangeRate) || 97.20,
        status: 'draft',
        items: { create: itemData }
      },
      include: { items: true }
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create Shipping Bill error:', error);
    res.status(500).json({ error: 'Failed to create Shipping Bill: ' + error.message });
  }
});

router.post('/:id/finalize', async (req, res) => {
  try {
    const { customSbNumber } = req.body;
    if (!customSbNumber) return res.status(400).json({ error: 'Custom SB Number is required to finalize.' });
    
    const whereClause = { id: req.params.id };
    if (req.company) whereClause.companyId = req.company.id;

    const tx = await prisma.shippingBillTransaction.findFirst({
      where: whereClause,
      include: { items: true }
    });

    if (!tx) return res.status(404).json({ error: 'Not found' });
    if (tx.status === 'finalized') return res.status(400).json({ error: 'Already finalized' });

    // Deduct stock
    for (const item of tx.items) {
      const stockItem = await prisma.stockItem.findUnique({ where: { id: item.stockItemId } });
      if (!stockItem || stockItem.remainingQuantity < item.exportQty) {
        return res.status(400).json({ error: `Insufficient stock for item ${item.stockItemId}.` });
      }
      
      await prisma.stockItem.update({
        where: { id: item.stockItemId },
        data: { remainingQuantity: { decrement: item.exportQty } }
      });
    }

    const updated = await prisma.shippingBillTransaction.update({
      where: { id: tx.id },
      data: { status: 'finalized', generatedAt: new Date(), customSbNumber }
    });

    res.json(updated);
  } catch (error) {
    console.error('Finalize Shipping Bill error:', error);
    res.status(500).json({ error: 'Failed to finalize Shipping Bill.' });
  }
});

const {
  renderPinkShippingBill, renderSBNotesheet, renderSBDutyCalculation,
  renderExportInvoice, renderDeliveryChallan, renderPackingList
} = require('../services/templates/shippingBillTemplates');

router.get('/:id/preview/:doc', async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.company) whereClause.companyId = req.company.id;

    const tx = await prisma.shippingBillTransaction.findFirst({
      where: whereClause,
      include: {
        consignee: true,
        company: {
          include: {
            bankAccounts: true
          }
        },
        items: {
          include: {
            stockItem: true
          }
        }
      }
    });

    if (!tx) return res.status(404).json({ error: 'Not found' });

    let html = '';
    const { doc } = req.params;
    if (doc === 'sb-customs') html = renderPinkShippingBill(tx, tx.company, tx.consignee, tx.items, 'ORIGINAL');
    else if (doc === 'sb-all' || doc === 'sb-4copies') html = renderPinkShippingBill(tx, tx.company, tx.consignee, tx.items, 'ALL');
    else if (doc === 'sb-exporter') html = renderPinkShippingBill(tx, tx.company, tx.consignee, tx.items, 'DUPLICATE');
    else if (doc === 'sb-transport') html = renderPinkShippingBill(tx, tx.company, tx.consignee, tx.items, 'TRIPLICATE');
    else if (doc === 'sb-extra') html = renderPinkShippingBill(tx, tx.company, tx.consignee, tx.items, 'EXTRA COPY');
    else if (doc === 'notesheet') html = renderSBNotesheet(tx, tx.company, tx.consignee, tx.items);
    else if (doc === 'duty-calculation') html = renderSBDutyCalculation(tx, tx.company, tx.consignee, tx.items);
    else if (doc === 'invoice') html = renderExportInvoice(tx, tx.company, tx.consignee, tx.items);
    else if (doc === 'delivery-challan') html = renderDeliveryChallan(tx, tx.company, tx.consignee, tx.items);
    else if (doc === 'packing-list') html = renderPackingList(tx, tx.company, tx.consignee, tx.items);
    else return res.status(400).json({ error: 'Unknown document type: ' + doc });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (error) {
    console.error('SB Preview error:', error);
    res.status(500).send('<h3>Failed to generate preview: ' + error.message + '</h3>');
  }
});

module.exports = router;
