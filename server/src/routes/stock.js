const express = require('express');
const prisma = require('../db/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Middleware to ensure company context (unless admin)
router.use((req, res, next) => {
  if (!req.company && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Company context is required for managing stock.' });
  }
  next();
});

/**
 * @route GET /api/stock
 * @desc Get all stock items for the company (or all stock items if admin)
 */
router.get('/', async (req, res) => {
  try {
    const whereClause = {};
    if (req.company) {
      whereClause.companyId = req.company.id;
    }
    const stockItems = await prisma.stockItem.findMany({
      where: whereClause,
      include: { company: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(stockItems);
  } catch (error) {
    console.error('List stock error:', error);
    res.status(500).json({ error: 'Failed to retrieve stock items.' });
  }
});

/**
 * @route POST /api/stock
 * @desc Create a new stock item
 */
router.post('/', async (req, res) => {
  try {
    const {
      commodityName,
      commodityType,
      beDetails,
      bondDetails,
      bondExpiryDate,
      pricePerCaseUSD,
      totalQuantity,
      packing,
      unit,
      dutyPercentage,
      presentDutyBalance,
      companyId
    } = req.body;

    if (!commodityName || !commodityType || !beDetails || !bondDetails || pricePerCaseUSD === undefined || totalQuantity === undefined || dutyPercentage === undefined) {
      return res.status(400).json({ error: 'commodityName, commodityType, beDetails, bondDetails, pricePerCaseUSD, totalQuantity, and dutyPercentage are required.' });
    }

    let targetCompanyId = req.company?.id;
    if (req.user.role === 'admin' && companyId) {
      targetCompanyId = companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: 'companyId is required for system administrator.' });
    }

    const item = await prisma.stockItem.create({
      data: {
        companyId: targetCompanyId,
        commodityName,
        commodityType,
        beDetails,
        bondDetails,
        bondExpiryDate: bondExpiryDate ? new Date(bondExpiryDate) : null,
        pricePerCaseUSD: parseFloat(pricePerCaseUSD),
        totalQuantity: parseInt(totalQuantity),
        remainingQuantity: parseInt(totalQuantity), // starts as equal
        packing: packing || '',
        unit: unit || 'Cases',
        dutyPercentage: parseFloat(dutyPercentage),
        presentDutyBalance: parseFloat(presentDutyBalance || 0)
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create stock item error:', error);
    res.status(500).json({ error: 'Failed to create stock item.' });
  }
});

/**
 * @route PUT /api/stock/:id
 * @desc Update a stock item
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      commodityName,
      commodityType,
      beDetails,
      bondDetails,
      bondExpiryDate,
      pricePerCaseUSD,
      totalQuantity,
      remainingQuantity,
      packing,
      unit,
      dutyPercentage,
      presentDutyBalance
    } = req.body;

    const existing = req.user.role === 'admin'
      ? await prisma.stockItem.findUnique({ where: { id: req.params.id } })
      : await prisma.stockItem.findFirst({ where: { id: req.params.id, companyId: req.company.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Stock item not found.' });
    }

    const updated = await prisma.stockItem.update({
      where: { id: req.params.id },
      data: {
        commodityName: commodityName || existing.commodityName,
        commodityType: commodityType || existing.commodityType,
        beDetails: beDetails || existing.beDetails,
        bondDetails: bondDetails || existing.bondDetails,
        bondExpiryDate: bondExpiryDate ? new Date(bondExpiryDate) : existing.bondExpiryDate,
        pricePerCaseUSD: pricePerCaseUSD !== undefined ? parseFloat(pricePerCaseUSD) : existing.pricePerCaseUSD,
        totalQuantity: totalQuantity !== undefined ? parseInt(totalQuantity) : existing.totalQuantity,
        remainingQuantity: remainingQuantity !== undefined ? parseInt(remainingQuantity) : existing.remainingQuantity,
        packing: packing !== undefined ? packing : existing.packing,
        unit: unit || existing.unit,
        dutyPercentage: dutyPercentage !== undefined ? parseFloat(dutyPercentage) : existing.dutyPercentage,
        presentDutyBalance: presentDutyBalance !== undefined ? parseFloat(presentDutyBalance) : existing.presentDutyBalance
      }
    });

    // Audit log tracking
    const changes = [];
    const fieldsToTrack = ['commodityName', 'commodityType', 'beDetails', 'bondDetails', 'pricePerCaseUSD', 'totalQuantity', 'remainingQuantity', 'packing', 'unit', 'dutyPercentage', 'presentDutyBalance'];
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined && String(req.body[field]) !== String(existing[field] !== null && existing[field] !== undefined ? existing[field] : '')) {
        changes.push({
          field,
          oldVal: String(existing[field] !== null && existing[field] !== undefined ? existing[field] : ''),
          newVal: String(req.body[field])
        });
      }
    });

    if (changes.length > 0) {
      await prisma.auditLog.create({
        data: {
          companyId: existing.companyId,
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          entityType: 'StockItem',
          entityId: existing.id,
          entityName: updated.commodityName,
          action: 'UPDATE',
          changes: JSON.stringify(changes)
        }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update stock item error:', error);
    res.status(500).json({ error: 'Failed to update stock item.' });
  }
});

/**
 * @route GET /api/stock/present-duty-balance
 * @desc Calculate sum of remaining duty balances across active stock items for the company
 */
router.get('/present-duty-balance', async (req, res) => {
  try {
    const { exchangeRate = 84.5, companyId } = req.query;
    let targetCompanyId = req.company?.id;
    if (req.user.role === 'admin' && companyId) {
      targetCompanyId = companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: 'companyId is required.' });
    }

    const items = await prisma.stockItem.findMany({
      where: {
        companyId: targetCompanyId,
        remainingQuantity: { gt: 0 }
      }
    });

    let totalDutyBalanceINR = 0;
    const rate = parseFloat(exchangeRate) || 84.5;

    for (const item of items) {
      const usdVal = item.remainingQuantity * item.pricePerCaseUSD;
      const assessableINR = usdVal * rate;
      const dutyINR = assessableINR * (item.dutyPercentage / 100);
      totalDutyBalanceINR += dutyINR;
    }

    res.json({
      companyId: targetCompanyId,
      exchangeRate: rate,
      totalDutyBalanceINR: Math.round(totalDutyBalanceINR * 100) / 100
    });
  } catch (error) {
    console.error('Calculate present duty balance error:', error);
    res.status(500).json({ error: 'Failed to calculate present duty balance.' });
  }
});

module.exports = router;
