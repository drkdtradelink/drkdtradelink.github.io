const express = require('express');
const prisma = require('../db/client');
const { authenticate, requireRole, requireAdminPassword } = require('../middleware/auth');

const router = express.Router();

// All company management routes require authentication and super admin role
router.use(authenticate);
router.use(requireRole(['admin']));

/**
 * @route GET /api/companies
 * @desc Get all companies
 */
router.get('/', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(companies);
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ error: 'Failed to retrieve companies.' });
  }
});

/**
 * @route POST /api/companies
 * @desc Create a new company
 */
router.post('/', async (req, res) => {
  try {
    const {
      legalName,
      displayName,
      address,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      gstin,
      iec,
      warehouseCode,
      bankName,
      bankAccount,
      bankIfsc,
      bankBranch,
      customStation,
      subdomain,
      letterheadBase64
    } = req.body;

    if (!legalName || !displayName || !subdomain) {
      return res.status(400).json({ error: 'legalName, displayName, and subdomain are required.' });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim();

    // Check if subdomain is reserved
    if (['admin', 'api', 'portal', 'www', 'mail', 'support'].includes(cleanSubdomain)) {
      return res.status(400).json({ error: 'This subdomain is reserved and cannot be used.' });
    }

    // Check if subdomain already exists
    const existing = await prisma.company.findUnique({
      where: { subdomain: cleanSubdomain }
    });

    if (existing) {
      return res.status(400).json({ error: 'Subdomain is already in use by another company.' });
    }

    const company = await prisma.company.create({
      data: {
        legalName,
        displayName,
        address: address || '',
        city: city || '',
        state: state || '',
        country: country || 'India',
        postalCode,
        phone,
        email,
        gstin,
        iec,
        warehouseCode,
        bankName,
        bankAccount,
        bankIfsc,
        bankBranch,
        customStation,
        subdomain: cleanSubdomain,
        status: 'active',
        letterheadBase64: letterheadBase64 || null
      }
    });

    // Also auto-seed default duty rules for the new company
    await prisma.dutyRule.createMany({
      data: [
        {
          companyId: company.id,
          name: 'Standard Beer Duty',
          commodityType: 'Beer',
          dutyPercentage: 110.0,
          status: 'active',
          version: 1
        },
        {
          companyId: company.id,
          name: 'Standard Alcohol/Wine Duty',
          commodityType: 'Alcohol/Wine',
          dutyPercentage: 150.0,
          status: 'active',
          version: 1
        }
      ]
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to create company.' });
  }
});

/**
 * @route GET /api/companies/:id
 * @desc Get company details
 */
router.get('/:id', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, status: true } },
        dutyRules: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to retrieve company details.' });
  }
});

/**
 * @route PUT /api/companies/:id
 * @desc Update company details
 */
router.put('/:id', requireAdminPassword, async (req, res) => {
  try {
    const {
      legalName,
      displayName,
      address,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      gstin,
      iec,
      warehouseCode,
      bankName,
      bankAccount,
      bankIfsc,
      bankBranch,
      customStation,
      status,
      letterheadBase64
    } = req.body;

    const existingCompany = await prisma.company.findUnique({
      where: { id: req.params.id }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const updated = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        legalName: legalName || existingCompany.legalName,
        displayName: displayName || existingCompany.displayName,
        address: address !== undefined ? address : existingCompany.address,
        city: city !== undefined ? city : existingCompany.city,
        state: state !== undefined ? state : existingCompany.state,
        country: country !== undefined ? country : existingCompany.country,
        postalCode: postalCode !== undefined ? postalCode : existingCompany.postalCode,
        phone: phone !== undefined ? phone : existingCompany.phone,
        email: email !== undefined ? email : existingCompany.email,
        gstin: gstin !== undefined ? gstin : existingCompany.gstin,
        iec: iec !== undefined ? iec : existingCompany.iec,
        warehouseCode: warehouseCode !== undefined ? warehouseCode : existingCompany.warehouseCode,
        bankName: bankName !== undefined ? bankName : existingCompany.bankName,
        bankAccount: bankAccount !== undefined ? bankAccount : existingCompany.bankAccount,
        bankIfsc: bankIfsc !== undefined ? bankIfsc : existingCompany.bankIfsc,
        bankBranch: bankBranch !== undefined ? bankBranch : existingCompany.bankBranch,
        customStation: customStation !== undefined ? customStation : existingCompany.customStation,
        status: status || existingCompany.status,
        letterheadBase64: letterheadBase64 !== undefined ? letterheadBase64 : existingCompany.letterheadBase64
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Failed to update company.' });
  }
});

/**
 * @route DELETE /api/companies/:id
 * @desc Delete a company and all related records
 */
router.delete('/:id', requireAdminPassword, async (req, res) => {
  try {
    const companyId = req.params.id;
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { companyId } }),
      prisma.dutyRule.deleteMany({ where: { companyId } }),
      prisma.stockItem.deleteMany({ where: { companyId } }),
      prisma.party.deleteMany({ where: { companyId } }),
      prisma.gRTransaction.deleteMany({ where: { companyId } }),
      prisma.company.delete({ where: { id: companyId } })
    ]);
    res.json({ message: 'Company and all associated records deleted successfully.' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company.' });
  }
});

module.exports = router;
