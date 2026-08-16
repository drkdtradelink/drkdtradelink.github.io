const express = require('express');
const prisma = require('../db/client');
const bcrypt = require('bcryptjs');
const { authenticate, requireRole, requireAdminPassword } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Middleware to ensure company context (unless super admin)
router.use((req, res, next) => {
  if (!req.company && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Company context is required for managing duty rules.' });
  }
  next();
});

/**
 * @route GET /api/duty-rules
 * @desc Get all duty rules for the company (or all rules if super admin)
 */
router.get('/', async (req, res) => {
  try {
    const whereClause = {};
    if (req.company) {
      whereClause.companyId = req.company.id;
    }
    const rules = await prisma.dutyRule.findMany({
      where: whereClause,
      include: { company: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rules);
  } catch (error) {
    console.error('List rules error:', error);
    res.status(500).json({ error: 'Failed to retrieve duty rules.' });
  }
});

/**
 * @route POST /api/duty-rules
 * @desc Create a new duty rule
 */
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { name, commodityType, dutyPercentage, status, companyId, formula } = req.body;

    if (!name || !commodityType || dutyPercentage === undefined) {
      return res.status(400).json({ error: 'Name, commodityType, and dutyPercentage are required.' });
    }

    let targetCompanyId = req.company?.id;
    if (req.user.role === 'admin' && companyId) {
      targetCompanyId = companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: 'companyId is required for system administrator.' });
    }

    const rule = await prisma.dutyRule.create({
      data: {
        companyId: targetCompanyId,
        name,
        commodityType,
        dutyPercentage: parseFloat(dutyPercentage),
        status: status || 'active',
        formula: formula !== undefined ? formula : undefined,
        version: 1
      }
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({ error: 'Failed to create duty rule.' });
  }
});

/**
 * @route PUT /api/duty-rules/:id
 * @desc Update a duty rule
 */
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { name, commodityType, dutyPercentage, status, formula } = req.body;

    const existing = req.user.role === 'admin'
      ? await prisma.dutyRule.findUnique({ where: { id: req.params.id } })
      : await prisma.dutyRule.findFirst({ where: { id: req.params.id, companyId: req.company.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Duty rule not found.' });
    }

    // Require admin password if system admin is editing a duty rule
    if (req.user.role === 'admin') {
      const adminPassword = req.headers['x-admin-password'];
      if (!adminPassword) {
        return res.status(400).json({ error: 'Admin password is required to authorize this action.' });
      }
      const isMatch = await bcrypt.compare(adminPassword, req.user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid admin password. Authorization failed.' });
      }
    }

    // Determine versioning: if the rate changes, increment version
    let nextVersion = existing.version;
    if (dutyPercentage !== undefined && parseFloat(dutyPercentage) !== existing.dutyPercentage) {
      nextVersion += 1;
    }

    const updated = await prisma.dutyRule.update({
      where: { id: req.params.id },
      data: {
        name: name || existing.name,
        commodityType: commodityType || existing.commodityType,
        dutyPercentage: dutyPercentage !== undefined ? parseFloat(dutyPercentage) : existing.dutyPercentage,
        status: status || existing.status,
        formula: formula !== undefined ? formula : existing.formula,
        version: nextVersion
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({ error: 'Failed to update duty rule.' });
  }
});

/**
 * @route DELETE /api/duty-rules/:id
 * @desc Delete a duty rule
 */
router.delete('/:id', requireAdminPassword, async (req, res) => {
  try {
    await prisma.dutyRule.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Duty rule deleted successfully.' });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({ error: 'Failed to delete duty rule.' });
  }
});

module.exports = router;
