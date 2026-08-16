const express = require('express');
const prisma = require('../db/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['admin']));

/**
 * @route GET /api/audit-logs
 * @desc Get all user change audit logs for super admin inspection
 */
router.get('/', async (req, res) => {
  try {
    const { companyId, entityType, limit = 50 } = req.query;

    const whereClause = {};
    if (companyId) {
      whereClause.companyId = companyId;
    }
    if (entityType) {
      whereClause.entityType = entityType;
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        company: { select: { displayName: true } },
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(logs);
  } catch (error) {
    console.error('List audit logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

module.exports = router;
