const express = require('express');
const prisma = require('../db/client');
const { authenticate } = require('../middleware/auth');
const { calculateItemDuty } = require('../services/dutyCalculation');
const { renderDocument } = require('../services/documentGenerator');

const router = express.Router();

router.use(authenticate);

// Enforce company context (unless admin)
router.use((req, res, next) => {
  if (!req.company && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Company context is required for GR Documents operations.' });
  }
  next();
});

/**
 * Helper to compute totals from computed items
 */
function computeTotals(items, presentDutyBalance) {
  let cases = 0;
  let usd = 0;
  let assessable = 0;
  let duty = 0;

  items.forEach(item => {
    cases += Number(item.qty);
    usd += Number(item.usdValue);
    assessable += Number(item.assessableValueInr);
    duty += Number(item.dutyAmountInr);
  });

  const balanceDutyAmount = Number(presentDutyBalance) - duty;

  return {
    cases,
    usd,
    assessable,
    duty,
    balanceDutyAmount
  };
}

/**
 * @route GET /api/gr-docs
 * @desc Get list of GR transactions (with filters)
 */
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (req.company) {
      whereClause.companyId = req.company.id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { grNumber: { contains: search } },
        { invoiceNumber: { contains: search } },
        { dcNumber: { contains: search } },
        { party: { name: { contains: search } } }
      ];
    }

    const total = await prisma.gRTransaction.count({ where: whereClause });
    const transactions = await prisma.gRTransaction.findMany({
      where: whereClause,
      include: {
        party: { select: { name: true } },
        user: { select: { name: true } },
        company: { select: { displayName: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      transactions
    });
  } catch (error) {
    console.error('List GR docs error:', error);
    res.status(500).json({ error: 'Failed to retrieve GR documents.' });
  }
});

/**
 * @route GET /api/gr-docs/next-numbers
 * @desc Auto-fetches next incremental Invoice and DC numbers for a company
 */
router.get('/next-numbers', async (req, res) => {
  try {
    const { companyId } = req.query;
    let targetCompanyId = req.company?.id || req.user.companyId;
    if (req.user.role === 'admin' && companyId) {
      targetCompanyId = companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: 'companyId is required.' });
    }

    const allTxs = await prisma.gRTransaction.findMany({
      where: { companyId: targetCompanyId },
      select: { invoiceNumber: true, dcNumber: true }
    });

    let maxInvoiceNum = 0;
    let invoicePrefix = 'INV-';
    let invoicePadLen = 3;

    let maxDcNum = 0;
    let dcPrefix = 'DC-';
    let dcPadLen = 3;

    for (const tx of allTxs) {
      if (tx.invoiceNumber) {
        const invMatch = tx.invoiceNumber.match(/^([A-Za-z\-]+)?(\d+)$/);
        if (invMatch) {
          const num = parseInt(invMatch[2]);
          if (num > maxInvoiceNum) {
            maxInvoiceNum = num;
            invoicePrefix = invMatch[1] || 'INV-';
            invoicePadLen = invMatch[2].length;
          }
        } else {
          const num = parseInt(tx.invoiceNumber);
          if (!isNaN(num) && num > maxInvoiceNum) {
            maxInvoiceNum = num;
            invoicePrefix = '';
            invoicePadLen = 0;
          }
        }
      }

      if (tx.dcNumber) {
        const dcMatch = tx.dcNumber.match(/^([A-Za-z\-]+)?(\d+)$/);
        if (dcMatch) {
          const num = parseInt(dcMatch[2]);
          if (num > maxDcNum) {
            maxDcNum = num;
            dcPrefix = dcMatch[1] || 'DC-';
            dcPadLen = dcMatch[2].length;
          }
        } else {
          const num = parseInt(tx.dcNumber);
          if (!isNaN(num) && num > maxDcNum) {
            maxDcNum = num;
            dcPrefix = '';
            dcPadLen = 0;
          }
        }
      }
    }

    const nextInvoiceNumber = maxInvoiceNum > 0
      ? `${invoicePrefix}${String(maxInvoiceNum + 1).padStart(invoicePadLen, '0')}`
      : 'INV-001';

    const nextDcNumber = maxDcNum > 0
      ? `${dcPrefix}${String(maxDcNum + 1).padStart(dcPadLen, '0')}`
      : 'DC-001';

    res.json({ nextInvoiceNumber, nextDcNumber });
  } catch (error) {
    console.error('Get next numbers error:', error);
    res.status(500).json({ error: 'Failed to generate next sequence numbers.' });
  }
});

/**
 * @route GET /api/gr-docs/:id
 * @desc Get details of a single GR transaction
 */
router.get('/:id', async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.company) {
      whereClause.companyId = req.company.id;
    }

    const transaction = await prisma.gRTransaction.findFirst({
      where: whereClause,
      include: {
        party: true,
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            stockItem: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'GR document not found.' });
    }

    const calcSnapshot = JSON.parse(transaction.calculationSnapshot || '{}');

    res.json({
      transaction,
      totals: calcSnapshot.totals || null
    });
  } catch (error) {
    console.error('Get GR doc error:', error);
    res.status(500).json({ error: 'Failed to retrieve GR document details.' });
  }
});

/**
 * @route POST /api/gr-docs
 * @desc Create a new GR transaction (in draft status)
 */
router.post('/', async (req, res) => {
  try {
    const { date, invoiceDate, dcDate, exchangeRate, invoiceNumber, dcNumber, presentDutyBalance, partyId, items, companyId } = req.body;

    let targetCompanyId = req.company?.id || req.user.companyId;
    if (req.user.role === 'admin' && companyId) {
      targetCompanyId = companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: 'companyId is required for system administrator.' });
    }

    if (!date || !exchangeRate || !partyId || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required transaction details.' });
    }

    // Auto calculate next invoice and DC numbers if not supplied or empty
    let finalInvoiceNumber = invoiceNumber;
    let finalDcNumber = dcNumber;
    if (!finalInvoiceNumber || !finalDcNumber) {
      const lastTx = await prisma.gRTransaction.findFirst({
        where: { companyId: targetCompanyId },
        orderBy: { createdAt: 'desc' }
      });
      if (!finalInvoiceNumber) {
        if (lastTx) {
          const invMatch = lastTx.invoiceNumber.match(/^([A-Za-z\-]+)?(\d+)$/);
          if (invMatch) {
            const prefix = invMatch[1] || 'INV-';
            const num = parseInt(invMatch[2]) + 1;
            finalInvoiceNumber = `${prefix}${String(num).padStart(invMatch[2].length, '0')}`;
          } else {
            finalInvoiceNumber = String((parseInt(lastTx.invoiceNumber) || 0) + 1);
          }
        } else {
          finalInvoiceNumber = 'INV-001';
        }
      }
      if (!finalDcNumber) {
        if (lastTx) {
          const dcMatch = lastTx.dcNumber.match(/^([A-Za-z\-]+)?(\d+)$/);
          if (dcMatch) {
            const prefix = dcMatch[1] || 'DC-';
            const num = parseInt(dcMatch[2]) + 1;
            finalDcNumber = `${prefix}${String(num).padStart(dcMatch[2].length, '0')}`;
          } else {
            finalDcNumber = String((parseInt(lastTx.dcNumber) || 0) + 1);
          }
        } else {
          finalDcNumber = 'DC-001';
        }
      }
    }

    // Verify Party
    const party = await prisma.party.findFirst({
      where: { id: partyId, companyId: targetCompanyId }
    });
    if (!party) {
      return res.status(400).json({ error: 'Invalid party selected.' });
    }

    // 1. Generate unique GR number with company subdomain prefix (e.g., DRKD-GR-2026-001)
    const company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
    const subPrefix = company ? company.subdomain.toUpperCase() : 'DRKD';
    const year = new Date(date).getFullYear();
    let count = await prisma.gRTransaction.count({
      where: {
        companyId: targetCompanyId,
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      }
    });
    let grNumber = `${subPrefix}-GR-${year}-${String(count + 1).padStart(3, '0')}`;
    let grAttempts = 0;
    while (await prisma.gRTransaction.findUnique({ where: { grNumber } })) {
      count++;
      grNumber = `${subPrefix}-GR-${year}-${String(count + 1).padStart(3, '0')}`;
      grAttempts++;
      if (grAttempts > 100) break;
    }

    // 2. Compute calculations
    const computedItems = [];
    for (const rawItem of items) {
      const stock = await prisma.stockItem.findFirst({
        where: { id: rawItem.stockItemId, companyId: targetCompanyId }
      });
      if (!stock) {
        return res.status(400).json({ error: `Stock item not found for ID: ${rawItem.stockItemId}` });
      }

      const rule = await prisma.dutyRule.findFirst({
        where: {
          companyId: targetCompanyId,
          commodityType: stock.commodityType,
          status: 'active'
        }
      });

      const activePercentage = rule ? rule.dutyPercentage : stock.dutyPercentage;
      const activeFormula = rule ? rule.formula : null;
      const effectivePricePerCaseUSD = rawItem.pricePerCaseUSD !== undefined && rawItem.pricePerCaseUSD !== ''
        ? parseFloat(rawItem.pricePerCaseUSD)
        : stock.pricePerCaseUSD;
      const itemUnit = stock.unit || rawItem.unit || 'Cases';

      const dutyDetails = calculateItemDuty({
        qty: rawItem.qty,
        pricePerCaseUSD: effectivePricePerCaseUSD,
        exchangeRate,
        dutyPercentage: activePercentage,
        formula: activeFormula
      });

      computedItems.push({
        stockItemId: stock.id,
        item: stock.commodityName,
        commodityType: stock.commodityType,
        qty: parseInt(rawItem.qty),
        packing: stock.packing,
        unit: itemUnit,
        pricePerCaseUSD: effectivePricePerCaseUSD,
        beDetails: stock.beDetails,
        bondDetails: stock.bondDetails,
        balanceInBond: `${stock.remainingQuantity} ${itemUnit}`,
        usdValue: dutyDetails.usdValue,
        assessableValueInr: dutyDetails.assessableValueInr,
        dutyPercentage: dutyDetails.dutyPercentage,
        dutyAmountInr: dutyDetails.dutyAmountInr,
        dutyRuleId: rule ? rule.id : null,
        dutyRuleSnapshot: rule ? JSON.stringify(rule) : null
      });
    }

    const totals = computeTotals(computedItems, presentDutyBalance || 0);

    // Save draft
    const transaction = await prisma.gRTransaction.create({
      data: {
        grNumber,
        companyId: targetCompanyId,
        userId: req.user.id,
        partyId,
        date: new Date(date),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(date),
        dcDate: dcDate ? new Date(dcDate) : new Date(date),
        exchangeRate: parseFloat(exchangeRate),
        invoiceNumber: finalInvoiceNumber,
        dcNumber: finalDcNumber,
        presentDutyBalance: parseFloat(presentDutyBalance || 0),
        status: 'draft',
        calculationSnapshot: JSON.stringify({ items: computedItems, totals }),
        items: {
          create: computedItems.map(item => ({
            stockItemId: item.stockItemId,
            item: item.item,
            commodityType: item.commodityType,
            qty: item.qty,
            packing: item.packing,
            unit: item.unit,
            pricePerCaseUSD: item.pricePerCaseUSD,
            beDetails: item.beDetails,
            bondDetails: item.bondDetails,
            balanceInBond: item.balanceInBond,
            usdValue: item.usdValue,
            assessableValueInr: item.assessableValueInr,
            dutyPercentage: item.dutyPercentage,
            dutyAmountInr: item.dutyAmountInr
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json({ transaction, totals });
  } catch (error) {
    console.error('Create GR doc error:', error);
    res.status(500).json({ error: error.message || 'Failed to create GR document package.' });
  }
});

/**
 * @route PUT /api/gr-docs/:id
 * @desc Update an existing draft GR document package
 */
router.put('/:id', async (req, res) => {
  try {
    const { companyId, date, invoiceDate, dcDate, exchangeRate, partyId, items, presentDutyBalance } = req.body;
    let targetCompanyId = req.company?.id || req.user.companyId;
    if (req.user.role === 'admin' && companyId) {
      targetCompanyId = companyId;
    }

    const whereClause = { id: req.params.id };
    if (req.company) {
      whereClause.companyId = req.company.id;
    }

    const existingTx = await prisma.gRTransaction.findFirst({
      where: whereClause,
      include: { items: true }
    });

    if (!existingTx) {
      return res.status(404).json({ error: 'GR document not found.' });
    }

    if (existingTx.status === 'finalized') {
      return res.status(400).json({ error: 'Finalized GR documents cannot be edited.' });
    }

    if (!date || !exchangeRate || !partyId || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required transaction details.' });
    }

    // Verify Party
    const party = await prisma.party.findFirst({
      where: { id: partyId, companyId: targetCompanyId }
    });
    if (!party) {
      return res.status(400).json({ error: 'Invalid party selected.' });
    }

    // Re-compute calculations
    const computedItems = [];
    for (const rawItem of items) {
      const stock = await prisma.stockItem.findFirst({
        where: { id: rawItem.stockItemId, companyId: targetCompanyId }
      });
      if (!stock) {
        return res.status(400).json({ error: `Stock item not found for ID: ${rawItem.stockItemId}` });
      }

      const rule = await prisma.dutyRule.findFirst({
        where: {
          companyId: targetCompanyId,
          commodityType: stock.commodityType,
          status: 'active'
        }
      });

      const activePercentage = rule ? rule.dutyPercentage : stock.dutyPercentage;
      const activeFormula = rule ? rule.formula : null;
      const effectivePricePerCaseUSD = rawItem.pricePerCaseUSD !== undefined && rawItem.pricePerCaseUSD !== ''
        ? parseFloat(rawItem.pricePerCaseUSD)
        : stock.pricePerCaseUSD;
      const itemUnit = stock.unit || rawItem.unit || 'Cases';

      const dutyDetails = calculateItemDuty({
        qty: rawItem.qty,
        pricePerCaseUSD: effectivePricePerCaseUSD,
        exchangeRate,
        dutyPercentage: activePercentage,
        formula: activeFormula
      });

      computedItems.push({
        stockItemId: stock.id,
        item: stock.commodityName,
        commodityType: stock.commodityType,
        qty: parseInt(rawItem.qty),
        packing: stock.packing,
        unit: itemUnit,
        pricePerCaseUSD: effectivePricePerCaseUSD,
        beDetails: stock.beDetails,
        bondDetails: stock.bondDetails,
        balanceInBond: `${stock.remainingQuantity} ${itemUnit}`,
        usdValue: dutyDetails.usdValue,
        assessableValueInr: dutyDetails.assessableValueInr,
        dutyPercentage: dutyDetails.dutyPercentage,
        dutyAmountInr: dutyDetails.dutyAmountInr,
        dutyRuleId: rule ? rule.id : null,
        dutyRuleSnapshot: rule ? JSON.stringify(rule) : null
      });
    }

    const totals = computeTotals(computedItems, presentDutyBalance || existingTx.presentDutyBalance);

    // Delete existing transaction items and recreate
    await prisma.gRTransactionItem.deleteMany({
      where: { transactionId: existingTx.id }
    });

    const updated = await prisma.gRTransaction.update({
      where: { id: existingTx.id },
      data: {
        partyId,
        date: new Date(date),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : existingTx.invoiceDate,
        dcDate: dcDate ? new Date(dcDate) : existingTx.dcDate,
        exchangeRate: parseFloat(exchangeRate),
        presentDutyBalance: parseFloat(presentDutyBalance || existingTx.presentDutyBalance),
        calculationSnapshot: JSON.stringify({ items: computedItems, totals }),
        items: {
          create: computedItems.map(item => ({
            stockItemId: item.stockItemId,
            item: item.item,
            commodityType: item.commodityType,
            qty: item.qty,
            packing: item.packing,
            unit: item.unit,
            pricePerCaseUSD: item.pricePerCaseUSD,
            beDetails: item.beDetails,
            bondDetails: item.bondDetails,
            balanceInBond: item.balanceInBond,
            usdValue: item.usdValue,
            assessableValueInr: item.assessableValueInr,
            dutyPercentage: item.dutyPercentage,
            dutyAmountInr: item.dutyAmountInr
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.json({ transaction: updated, totals });
  } catch (error) {
    console.error('Update draft GR doc error:', error);
    res.status(500).json({ error: error.message || 'Failed to update draft GR document.' });
  }
});

/**
 * @route PUT /api/gr-docs/:id/dates
 * @desc Update Invoice Date and DC Date for a GR transaction
 */
router.put('/:id/dates', async (req, res) => {
  try {
    const { invoiceDate, dcDate } = req.body;
    const whereClause = { id: req.params.id };
    if (req.company) {
      whereClause.companyId = req.company.id;
    }

    const transaction = await prisma.gRTransaction.findFirst({ where: whereClause });
    if (!transaction) {
      return res.status(404).json({ error: 'GR document not found.' });
    }

    const updated = await prisma.gRTransaction.update({
      where: { id: req.params.id },
      data: {
        invoiceDate: invoiceDate ? new Date(invoiceDate) : transaction.invoiceDate,
        dcDate: dcDate ? new Date(dcDate) : transaction.dcDate
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update document dates error:', error);
    res.status(500).json({ error: 'Failed to update document dates.' });
  }
});

/**
 * @route PUT /api/gr-docs/:id
 * @desc Update a draft GR transaction
 */
router.put('/:id', async (req, res) => {
  try {
    const { date, exchangeRate, invoiceNumber, dcNumber, presentDutyBalance, partyId, items } = req.body;

    const whereClause = { id: req.params.id, status: 'draft' };
    if (req.company) {
      whereClause.companyId = req.company.id;
    }

    const existing = await prisma.gRTransaction.findFirst({
      where: whereClause
    });

    if (!existing) {
      return res.status(404).json({ error: 'Draft GR document not found or cannot be edited.' });
    }

    // Verify Party if updated
    if (partyId) {
      const party = await prisma.party.findFirst({
        where: { id: partyId, companyId: existing.companyId }
      });
      if (!party) return res.status(400).json({ error: 'Invalid party selected.' });
    }

    // Recompute items
    const computedItems = [];
    const finalExchangeRate = exchangeRate !== undefined ? parseFloat(exchangeRate) : existing.exchangeRate;
    const finalPresentDutyBalance = presentDutyBalance !== undefined ? parseFloat(presentDutyBalance) : existing.presentDutyBalance;

    if (items && items.length) {
      for (const rawItem of items) {
        const stock = await prisma.stockItem.findFirst({
          where: { id: rawItem.stockItemId, companyId: existing.companyId }
        });
        if (!stock) return res.status(400).json({ error: 'Stock item not found.' });

        const rule = await prisma.dutyRule.findFirst({
          where: {
            companyId: existing.companyId,
            commodityType: stock.commodityType,
            status: 'active'
          }
        });

        const activePercentage = rule ? rule.dutyPercentage : stock.dutyPercentage;
        const activeFormula = rule ? rule.formula : null;
        const effectivePricePerCaseUSD = rawItem.pricePerCaseUSD !== undefined && rawItem.pricePerCaseUSD !== ''
          ? parseFloat(rawItem.pricePerCaseUSD)
          : stock.pricePerCaseUSD;

        const dutyDetails = calculateItemDuty({
          qty: rawItem.qty,
          pricePerCaseUSD: effectivePricePerCaseUSD,
          exchangeRate: finalExchangeRate,
          dutyPercentage: activePercentage,
          formula: activeFormula
        });

        computedItems.push({
          stockItemId: stock.id,
          item: stock.commodityName,
          commodityType: stock.commodityType,
          qty: parseInt(rawItem.qty),
          packing: stock.packing,
          pricePerCaseUSD: effectivePricePerCaseUSD,
          beDetails: stock.beDetails,
          bondDetails: stock.bondDetails,
          balanceInBond: `${stock.remainingQuantity} Cases`,
          usdValue: dutyDetails.usdValue,
          assessableValueInr: dutyDetails.assessableValueInr,
          dutyPercentage: dutyDetails.dutyPercentage,
          dutyAmountInr: dutyDetails.dutyAmountInr,
          dutyRuleId: rule ? rule.id : null,
          dutyRuleSnapshot: rule ? JSON.stringify(rule) : null
        });
      }
    }

    const totals = computedItems.length ? computeTotals(computedItems, finalPresentDutyBalance) : null;

    // Transaction update
    await prisma.$transaction(async (tx) => {
      if (items && items.length) {
        await tx.gRTransactionItem.deleteMany({
          where: { transactionId: req.params.id }
        });
      }

      await tx.gRTransaction.update({
        where: { id: req.params.id },
        data: {
          partyId: partyId || existing.partyId,
          date: date ? new Date(date) : existing.date,
          invoiceDate: req.body.invoiceDate ? new Date(req.body.invoiceDate) : existing.invoiceDate,
          dcDate: req.body.dcDate ? new Date(req.body.dcDate) : existing.dcDate,
          exchangeRate: finalExchangeRate,
          invoiceNumber: invoiceNumber || existing.invoiceNumber,
          dcNumber: dcNumber || existing.dcNumber,
          presentDutyBalance: finalPresentDutyBalance,
          calculationSnapshot: computedItems.length ? JSON.stringify({ items: computedItems, totals }) : existing.calculationSnapshot,
          items: computedItems.length ? {
            create: computedItems.map(item => ({
              stockItemId: item.stockItemId,
              item: item.item,
              commodityType: item.commodityType,
              qty: item.qty,
              packing: item.packing,
              pricePerCaseUSD: item.pricePerCaseUSD,
              beDetails: item.beDetails,
              bondDetails: item.bondDetails,
              balanceInBond: item.balanceInBond,
              usdValue: item.usdValue,
              assessableValueInr: item.assessableValueInr,
              dutyPercentage: item.dutyPercentage,
              dutyAmountInr: item.dutyAmountInr
            }))
          } : undefined
        }
      });
    });

    const updatedTx = await prisma.gRTransaction.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    res.json(updatedTx);
  } catch (error) {
    console.error('Update GR doc error:', error);
    res.status(500).json({ error: 'Failed to update GR document.' });
  }
});

/**
 * @route POST /api/gr-docs/:id/generate
 * @desc Finalize and generate GR document (locks transaction, validates and deducts stock)
 */
router.post('/:id/generate', async (req, res) => {
  try {
    const { force, customGrNumber } = req.body;
    if (!customGrNumber) return res.status(400).json({ error: 'Custom GR Number is required to finalize.' });
    
    const whereClause = { id: req.params.id, status: 'draft' };
    if (req.company) {
      whereClause.companyId = req.company.id;
    }

    const transaction = await prisma.gRTransaction.findFirst({
      where: whereClause,
      include: { items: true }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Draft GR document not found or already finalized.' });
    }

    // 1. Detect Changes & Validate Stock quantities
    const changes = [];
    for (const item of transaction.items) {
      const stock = await prisma.stockItem.findFirst({
        where: { id: item.stockItemId, companyId: transaction.companyId }
      });

      if (!stock) {
        return res.status(400).json({ error: `Stock item not found: ${item.item}` });
      }

      if (stock.remainingQuantity < item.qty) {
        return res.status(400).json({
          error: `Insufficient stock for ${item.item}. Requested: ${item.qty}, Available: ${stock.remainingQuantity}`
        });
      }

      // Check if stock has changed since draft was saved
      const snapshot = JSON.parse(transaction.calculationSnapshot || '{}');
      const snapItem = snapshot.items?.find(i => i.stockItemId === item.stockItemId);
      if (snapItem) {
        const snapRemaining = parseInt(snapItem.balanceInBond); // extracts number
        if (!isNaN(snapRemaining) && stock.remainingQuantity !== snapRemaining) {
          changes.push({
            item: item.item,
            field: 'Available Quantity',
            oldVal: `${snapRemaining} ${stock.unit || 'Cases'}`,
            newVal: `${stock.remainingQuantity} ${stock.unit || 'Cases'}`
          });
        }
      }
    }

    // Also check if company present duty balance has changed
    const snapDutyBalance = parseFloat(transaction.presentDutyBalance);
    const liveStockItems = await prisma.stockItem.findMany({
      where: { companyId: transaction.companyId }
    });
    const liveDutyBalance = liveStockItems.reduce((sum, s) => sum + s.presentDutyBalance, 0);
    if (Math.abs(liveDutyBalance - snapDutyBalance) > 1.0) {
      changes.push({
        item: 'Company Duty Stock',
        field: 'Present Duty Balance (INR)',
        oldVal: `₹ ${snapDutyBalance.toFixed(2)}`,
        newVal: `₹ ${liveDutyBalance.toFixed(2)}`
      });
    }

    if (changes.length > 0 && force !== 'true') {
      return res.json({
        warning: true,
        message: 'Stock or duty balance values have changed since this draft was saved due to another finalized transaction.',
        changes
      });
    }

    // 2. Finalize stock (Deduct quantity AND present duty balance)
    await prisma.$transaction(async (tx) => {
      for (const item of transaction.items) {
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: {
            remainingQuantity: {
              decrement: item.qty
            },
            presentDutyBalance: {
              decrement: item.dutyAmountInr
            }
          }
        });
      }

      await tx.gRTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'generated',
          generatedAt: new Date(),
          customGrNumber
        }
      });
    });

    res.json({ message: 'GR document finalized and generated successfully.', grNumber: transaction.grNumber });
  } catch (error) {
    console.error('Finalize GR error:', error);
    res.status(500).json({ error: 'Failed to finalize GR document package.' });
  }
});

/**
 * @route POST /api/gr-docs/:id/cancel
 * @desc Cancel a finalized GR transaction (reverts stock/duty changes)
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const whereClause = { id: req.params.id, status: 'generated' };
    if (req.company) {
      whereClause.companyId = req.company.id;
    }

    const transaction = await prisma.gRTransaction.findFirst({
      where: whereClause,
      include: { items: true }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Finalized GR document not found or already cancelled.' });
    }

    // 1. Validate cancellation permissions and 30-day time limit
    if (req.user.role !== 'admin') {
      const diffTime = Math.abs(new Date() - new Date(transaction.createdAt));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        return res.status(400).json({ error: 'Non-admin users can only cancel documents within 30 days of creation.' });
      }
    }

    // 2. Revert stock and duty deductions
    await prisma.$transaction(async (tx) => {
      for (const item of transaction.items) {
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: {
            remainingQuantity: {
              increment: item.qty
            },
            presentDutyBalance: {
              increment: item.dutyAmountInr
            }
          }
        });
      }

      await tx.gRTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'cancelled'
        }
      });
    });

    res.json({ message: 'GR document cancelled successfully and stock/duty reversed.', grNumber: transaction.grNumber });
  } catch (error) {
    console.error('Cancel GR error:', error);
    res.status(500).json({ error: 'Failed to cancel GR document package.' });
  }
});

/**
 * @route GET /api/gr-docs/:id/preview/:doc
 * @desc Render HTML preview of specific document
 */
router.get('/:id/preview/:doc', async (req, res) => {
  try {
    const docType = req.params.doc;
    const whereClause = { id: req.params.id };
    if (req.company) {
      whereClause.companyId = req.company.id;
    }

    const transaction = await prisma.gRTransaction.findFirst({
      where: whereClause,
      include: {
        party: true,
        items: true
      }
    });

    if (!transaction) {
      return res.status(404).send('GR Document not found.');
    }

    // Fetch company info
    let company = req.company;
    if (!company || !company.bankAccounts) {
      company = await prisma.company.findUnique({
        where: { id: transaction.companyId },
        include: { bankAccounts: true }
      });
    }

    const party = transaction.party;
    const snap = JSON.parse(transaction.calculationSnapshot || '{}');
    let items = snap.items || transaction.items;
    
    if (docType === 'stock-list') {
      items = await prisma.stockItem.findMany({
        where: { companyId: transaction.companyId },
        orderBy: { commodityName: 'asc' }
      });
    }

    const totals = snap.totals || computeTotals(items, transaction.presentDutyBalance);

    const html = renderDocument(docType, transaction, company, party, items, totals);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (error) {
    console.error('Preview doc error:', error);
    res.status(500).send('Failed to render document preview.');
  }
});

module.exports = router;
