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
 * @route GET /api/stock/available
 * @desc Get all stock items with remaining quantity > 0
 */
router.get('/available', async (req, res) => {
  try {
    const whereClause = {
      remainingQuantity: { gt: 0 }
    };
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
    console.error('List available stock error:', error);
    res.status(500).json({ error: 'Failed to retrieve available stock items.' });
  }
});

function formatDateString(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * @route POST /api/stock
 * @desc Create a new stock item
 */
router.post('/', async (req, res) => {
  try {
    const {
      commodityName,
      commodityType,
      purchaseType,
      purchaseNumber,
      purchaseDate,
      bondNumber,
      bondDate,
      bondExpiryDate,
      pricePerCaseUSD,
      totalQuantity,
      packing,
      unit,
      dutyPercentage,
      presentDutyBalance,
      companyId
    } = req.body;

    // Validate empty/missing inputs
    if (!commodityName || !commodityType || !purchaseType || !purchaseNumber || !purchaseDate || !bondNumber || !bondDate || pricePerCaseUSD === undefined || totalQuantity === undefined || dutyPercentage === undefined) {
      return res.status(400).json({ error: 'commodityName, commodityType, purchaseType, purchaseNumber, purchaseDate, bondNumber, bondDate, pricePerCaseUSD, totalQuantity, and dutyPercentage are required.' });
    }

    if (String(commodityName).trim() === '' || String(commodityType).trim() === '' || String(purchaseNumber).trim() === '' || String(bondNumber).trim() === '') {
      return res.status(400).json({ error: 'Required text fields cannot be empty.' });
    }

    // Validate non-negative numbers
    const parsedPrice = parseFloat(pricePerCaseUSD);
    const parsedQty = parseInt(totalQuantity);
    const parsedDuty = parseFloat(dutyPercentage);
    const parsedPresentDuty = parseFloat(presentDutyBalance || 0);

    if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Price per Case (USD) cannot be negative or empty.' });
    if (isNaN(parsedQty) || parsedQty < 0) return res.status(400).json({ error: 'Total Quantity cannot be negative or empty.' });
    if (isNaN(parsedDuty) || parsedDuty < 0) return res.status(400).json({ error: 'Duty Percentage (%) cannot be negative or empty.' });
    if (isNaN(parsedPresentDuty) || parsedPresentDuty < 0) return res.status(400).json({ error: 'Present Duty Balance (INR) cannot be negative.' });

    let targetCompanyId = req.company?.id;
    if (req.user.role === 'admin' && companyId) {
      targetCompanyId = companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: 'companyId is required for system administrator.' });
    }

    // Concatenate beDetails and bondDetails
    const finalBeDetails = `${purchaseType} NO: ${purchaseNumber} DT: ${formatDateString(purchaseDate)}`;
    const finalBondDetails = `BOND NO: ${bondNumber} DT: ${formatDateString(bondDate)}`;

    const item = await prisma.stockItem.create({
      data: {
        companyId: targetCompanyId,
        commodityName,
        commodityType,
        purchaseType,
        purchaseNumber,
        purchaseDate: new Date(purchaseDate),
        bondNumber,
        bondDate: new Date(bondDate),
        beDetails: finalBeDetails,
        bondDetails: finalBondDetails,
        bondExpiryDate: bondExpiryDate ? new Date(bondExpiryDate) : null,
        pricePerCaseUSD: parsedPrice,
        totalQuantity: parsedQty,
        remainingQuantity: parsedQty, // starts as equal
        packing: packing || '',
        unit: unit || 'Cases',
        dutyPercentage: parsedDuty,
        presentDutyBalance: parsedPresentDuty
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create stock item error:', error);
    res.status(500).json({ error: error.message || 'Failed to create stock item.' });
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
      purchaseType,
      purchaseNumber,
      purchaseDate,
      bondNumber,
      bondDate,
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

    // Validate non-negative numbers if supplied
    if (pricePerCaseUSD !== undefined && (isNaN(parseFloat(pricePerCaseUSD)) || parseFloat(pricePerCaseUSD) < 0)) {
      return res.status(400).json({ error: 'Price per Case (USD) cannot be negative.' });
    }
    if (totalQuantity !== undefined && (isNaN(parseInt(totalQuantity)) || parseInt(totalQuantity) < 0)) {
      return res.status(400).json({ error: 'Total Quantity cannot be negative.' });
    }
    if (remainingQuantity !== undefined && (isNaN(parseInt(remainingQuantity)) || parseInt(remainingQuantity) < 0)) {
      return res.status(400).json({ error: 'Remaining Quantity cannot be negative.' });
    }
    if (dutyPercentage !== undefined && (isNaN(parseFloat(dutyPercentage)) || parseFloat(dutyPercentage) < 0)) {
      return res.status(400).json({ error: 'Duty Percentage (%) cannot be negative.' });
    }
    if (presentDutyBalance !== undefined && (isNaN(parseFloat(presentDutyBalance)) || parseFloat(presentDutyBalance) < 0)) {
      return res.status(400).json({ error: 'Present Duty Balance (INR) cannot be negative.' });
    }

    // Prepare updated fields
    const data = {};
    if (commodityName) data.commodityName = commodityName;
    if (commodityType) data.commodityType = commodityType;
    if (purchaseType) data.purchaseType = purchaseType;
    if (purchaseNumber) data.purchaseNumber = purchaseNumber;
    if (purchaseDate) data.purchaseDate = new Date(purchaseDate);
    if (bondNumber) data.bondNumber = bondNumber;
    if (bondDate) data.bondDate = new Date(bondDate);
    if (bondExpiryDate !== undefined) data.bondExpiryDate = bondExpiryDate ? new Date(bondExpiryDate) : null;
    if (pricePerCaseUSD !== undefined) data.pricePerCaseUSD = parseFloat(pricePerCaseUSD);
    if (totalQuantity !== undefined) data.totalQuantity = parseInt(totalQuantity);
    if (remainingQuantity !== undefined) data.remainingQuantity = parseInt(remainingQuantity);
    if (packing !== undefined) data.packing = packing;
    if (unit) data.unit = unit;
    if (dutyPercentage !== undefined) data.dutyPercentage = parseFloat(dutyPercentage);
    if (presentDutyBalance !== undefined) data.presentDutyBalance = parseFloat(presentDutyBalance);

    // Compute beDetails and bondDetails if any relevant fields changed
    const finalPurchaseType = purchaseType || existing.purchaseType;
    const finalPurchaseNumber = purchaseNumber || existing.purchaseNumber;
    const finalPurchaseDate = purchaseDate ? new Date(purchaseDate) : existing.purchaseDate;
    const finalBondNumber = bondNumber || existing.bondNumber;
    const finalBondDate = bondDate ? new Date(bondDate) : existing.bondDate;

    data.beDetails = `${finalPurchaseType} NO: ${finalPurchaseNumber} DT: ${formatDateString(finalPurchaseDate)}`;
    data.bondDetails = `BOND NO: ${finalBondNumber} DT: ${formatDateString(finalBondDate)}`;

    const updated = await prisma.stockItem.update({
      where: { id: req.params.id },
      data
    });

    // Audit log tracking
    const changes = [];
    const fieldsToTrack = [
      'commodityName', 'commodityType', 'purchaseType', 'purchaseNumber', 'purchaseDate',
      'bondNumber', 'bondDate', 'pricePerCaseUSD', 'totalQuantity', 'remainingQuantity',
      'packing', 'unit', 'dutyPercentage', 'presentDutyBalance'
    ];
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined) {
        let oldVal = existing[field];
        let newVal = req.body[field];
        if (field === 'purchaseDate' || field === 'bondDate') {
          oldVal = oldVal ? oldVal.toISOString().substr(0,10) : '';
          newVal = newVal ? new Date(newVal).toISOString().substr(0,10) : '';
        }
        if (String(oldVal) !== String(newVal)) {
          changes.push({
            field,
            oldVal: String(oldVal !== null && oldVal !== undefined ? oldVal : ''),
            newVal: String(newVal)
          });
        }
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
    res.status(500).json({ error: error.message || 'Failed to update stock item.' });
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
