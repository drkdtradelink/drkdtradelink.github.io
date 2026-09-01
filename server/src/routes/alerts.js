const express = require('express');
const prisma = require('../db/client');
const { authenticate } = require('../middleware/auth');

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
    const targetCompanyId = req.company?.id || req.user?.companyId;
    if (!targetCompanyId) {
      return res.status(400).json({ error: 'companyId is required.' });
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // 1. Expired Bonds (Stock items with expiryDate < today and remainingQuantity > 0)
    const expiredStock = await prisma.stockItem.findMany({
      where: {
        companyId: targetCompanyId,
        remainingQuantity: { gt: 0 },
        bondExpiryDate: { lt: today }
      }
    });

    // 2. Bonds expiring in a month (today <= expiryDate <= 30 days from now)
    const expiringStock = await prisma.stockItem.findMany({
      where: {
        companyId: targetCompanyId,
        remainingQuantity: { gt: 0 },
        bondExpiryDate: { gte: today, lte: thirtyDaysFromNow }
      }
    });

    // 3. Expiring / Expired BGs
    const bgs = await prisma.bankGuarantee.findMany({
      where: {
        companyId: targetCompanyId
      }
    });
    
    const expiringBGs = bgs.filter(bg => bg.expiryDate && new Date(bg.expiryDate) <= thirtyDaysFromNow && new Date(bg.expiryDate) >= today);
    const expiredBGs = bgs.filter(bg => bg.expiryDate && new Date(bg.expiryDate) < today);

    // 4. Pending Monthly Return (last month)
    let pendingReturn = null;
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthPeriod = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    
    const returnDoc = await prisma.monthlyReturn.findFirst({
      where: {
        companyId: targetCompanyId,
        period: lastMonthPeriod
      }
    });

    if (!returnDoc || returnDoc.status === 'draft') {
      pendingReturn = {
        period: lastMonthPeriod,
        message: 'Monthly return for last month is not submitted.'
      };
    }

    res.json({
      expiredStock,
      expiringStock,
      expiringBGs,
      expiredBGs,
      pendingReturn
    });

  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ error: 'Failed to retrieve alerts.' });
  }
});

module.exports = router;
