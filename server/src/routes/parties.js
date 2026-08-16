const express = require('express');
const prisma = require('../db/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Middleware to ensure the request is bound to a company (unless admin)
router.use((req, res, next) => {
  if (!req.company && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Company context is required for managing parties.' });
  }
  next();
});

/**
 * @route GET /api/parties
 * @desc Get all parties for the company (or all parties if admin)
 */
router.get('/', async (req, res) => {
  try {
    const whereClause = {};
    if (req.company) {
      whereClause.companyId = req.company.id;
    }
    const parties = await prisma.party.findMany({
      where: whereClause,
      include: { company: { select: { displayName: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(parties);
  } catch (error) {
    console.error('List parties error:', error);
    res.status(500).json({ error: 'Failed to retrieve parties.' });
  }
});

/**
 * @route POST /api/parties
 * @desc Create a party
 */
router.post('/', async (req, res) => {
  try {
    const { name, address, city, state, gstin, warehouseCode, phone, email, companyId } = req.body;

    if (!name || !address || !city || !state) {
      return res.status(400).json({ error: 'Name, address, city, and state are required.' });
    }

    let targetCompanyId = req.company?.id;
    if (req.user.role === 'admin' && companyId) {
      targetCompanyId = companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: 'companyId is required for system administrator.' });
    }

    const party = await prisma.party.create({
      data: {
        companyId: targetCompanyId,
        name,
        address,
        city,
        state,
        gstin,
        warehouseCode,
        phone,
        email,
        status: 'active'
      }
    });

    res.status(201).json(party);
  } catch (error) {
    console.error('Create party error:', error);
    res.status(500).json({ error: 'Failed to create party.' });
  }
});

/**
 * @route PUT /api/parties/:id
 * @desc Update a party
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, address, city, state, gstin, warehouseCode, phone, email, status } = req.body;

    const existing = req.user.role === 'admin'
      ? await prisma.party.findUnique({ where: { id: req.params.id } })
      : await prisma.party.findFirst({ where: { id: req.params.id, companyId: req.company.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Party not found.' });
    }

    const updated = await prisma.party.update({
      where: { id: req.params.id },
      data: {
        name: name || existing.name,
        address: address || existing.address,
        city: city || existing.city,
        state: state || existing.state,
        gstin: gstin !== undefined ? gstin : existing.gstin,
        warehouseCode: warehouseCode !== undefined ? warehouseCode : existing.warehouseCode,
        phone: phone !== undefined ? phone : existing.phone,
        email: email !== undefined ? email : existing.email,
        status: status || existing.status
      }
    });

    // Audit log tracking
    const changes = [];
    const fieldsToTrack = ['name', 'address', 'city', 'state', 'gstin', 'warehouseCode', 'phone', 'email', 'status'];
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined && String(req.body[field]) !== String(existing[field] || '')) {
        changes.push({
          field,
          oldVal: existing[field] || '',
          newVal: req.body[field] || ''
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
          entityType: 'Party',
          entityId: existing.id,
          entityName: updated.name,
          action: 'UPDATE',
          changes: JSON.stringify(changes)
        }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update party error:', error);
    res.status(500).json({ error: 'Failed to update party.' });
  }
});

/**
 * @route DELETE /api/parties/:id
 * @desc Deactivate or delete a party
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = req.user.role === 'admin'
      ? await prisma.party.findUnique({ where: { id: req.params.id } })
      : await prisma.party.findFirst({ where: { id: req.params.id, companyId: req.company.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Party not found.' });
    }

    // Check if party is used in any transactions
    const count = await prisma.gRTransaction.count({
      where: { partyId: req.params.id }
    });

    if (count > 0) {
      const updated = await prisma.party.update({
        where: { id: req.params.id },
        data: { status: 'inactive' }
      });
      return res.json({ message: 'Party has transaction history, marked as inactive.', party: updated });
    }

    await prisma.party.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Party deleted successfully.' });
  } catch (error) {
    console.error('Delete party error:', error);
    res.status(500).json({ error: 'Failed to delete party.' });
  }
});

module.exports = router;
