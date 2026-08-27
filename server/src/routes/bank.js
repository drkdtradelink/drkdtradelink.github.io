const express = require('express');
const prisma = require('../db/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Helper to resolve company scope
function getTargetCompanyId(req) {
  if (req.company) return req.company.id;
  if (req.user.companyId) return req.user.companyId;
  return null;
}

// ----------------------------------------------------
// BANK ACCOUNTS ENDPOINTS
// ----------------------------------------------------

/**
 * @route GET /api/bank/accounts
 * @desc Get all bank accounts for company
 */
router.get('/accounts', async (req, res) => {
  try {
    const companyId = getTargetCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ error: 'Company context required.' });
    }

    const accounts = await prisma.bankAccount.findMany({
      where: { companyId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
    });

    res.json(accounts);
  } catch (error) {
    console.error('Fetch bank accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch bank accounts.' });
  }
});

/**
 * @route POST /api/bank/accounts
 * @desc Create new bank account
 */
router.post('/accounts', async (req, res) => {
  try {
    const companyId = getTargetCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ error: 'Company context required.' });
    }

    const { accountHolderName, bankName, accountNumber, ifscCode, branchName, isPrimary } = req.body;

    // Strict Validations
    if (!accountHolderName || !accountHolderName.trim()) {
      return res.status(400).json({ error: 'Account Holder Name is mandatory.' });
    }
    if (!bankName || !bankName.trim()) {
      return res.status(400).json({ error: 'Bank Name is mandatory.' });
    }
    if (!accountNumber || !/^\d+$/.test(accountNumber.trim())) {
      return res.status(400).json({ error: 'Account Number is mandatory and must contain strictly numeric digits.' });
    }
    if (!ifscCode || !ifscCode.trim()) {
      return res.status(400).json({ error: 'IFSC Code is mandatory.' });
    }
    if (!branchName || !branchName.trim()) {
      return res.status(400).json({ error: 'Branch Name is mandatory.' });
    }

    // Check existing accounts count
    const existingCount = await prisma.bankAccount.count({ where: { companyId } });
    const shouldBePrimary = isPrimary === true || existingCount === 0;

    if (shouldBePrimary) {
      await prisma.bankAccount.updateMany({
        where: { companyId },
        data: { isPrimary: false }
      });
    }

    const account = await prisma.bankAccount.create({
      data: {
        companyId,
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        branchName: branchName.trim(),
        isPrimary: shouldBePrimary
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Create bank account error:', error);
    res.status(500).json({ error: 'Failed to create bank account.' });
  }
});

/**
 * @route PUT /api/bank/accounts/:id
 * @desc Update bank account or set primary
 */
router.put('/accounts/:id', async (req, res) => {
  try {
    const companyId = getTargetCompanyId(req);
    const { id } = req.params;
    const { accountHolderName, bankName, accountNumber, ifscCode, branchName, isPrimary } = req.body;

    const existing = await prisma.bankAccount.findFirst({
      where: { id, companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    if (accountNumber !== undefined && (!accountNumber || !/^\d+$/.test(accountNumber.trim()))) {
      return res.status(400).json({ error: 'Account Number must contain strictly numeric digits.' });
    }

    if (isPrimary === true) {
      await prisma.bankAccount.updateMany({
        where: { companyId },
        data: { isPrimary: false }
      });
    }

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: {
        accountHolderName: accountHolderName !== undefined ? accountHolderName.trim() : existing.accountHolderName,
        bankName: bankName !== undefined ? bankName.trim() : existing.bankName,
        accountNumber: accountNumber !== undefined ? accountNumber.trim() : existing.accountNumber,
        ifscCode: ifscCode !== undefined ? ifscCode.trim().toUpperCase() : existing.ifscCode,
        branchName: branchName !== undefined ? branchName.trim() : existing.branchName,
        isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update bank account error:', error);
    res.status(500).json({ error: 'Failed to update bank account.' });
  }
});

/**
 * @route DELETE /api/bank/accounts/:id
 * @desc Delete bank account
 */
router.delete('/accounts/:id', async (req, res) => {
  try {
    const companyId = getTargetCompanyId(req);
    const { id } = req.params;

    const existing = await prisma.bankAccount.findFirst({
      where: { id, companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    await prisma.bankAccount.delete({ where: { id } });

    // If deleted account was primary, set another account as primary
    if (existing.isPrimary) {
      const remaining = await prisma.bankAccount.findFirst({
        where: { companyId },
        orderBy: { createdAt: 'desc' }
      });
      if (remaining) {
        await prisma.bankAccount.update({
          where: { id: remaining.id },
          data: { isPrimary: true }
        });
      }
    }

    res.json({ message: 'Bank account deleted successfully.' });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ error: 'Failed to delete bank account.' });
  }
});

// ----------------------------------------------------
// BANK GUARANTEES ENDPOINTS
// ----------------------------------------------------

/**
 * @route GET /api/bank/guarantees
 * @desc Get all bank guarantees for company
 */
router.get('/guarantees', async (req, res) => {
  try {
    const companyId = getTargetCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ error: 'Company context required.' });
    }

    const guarantees = await prisma.bankGuarantee.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(guarantees);
  } catch (error) {
    console.error('Fetch bank guarantees error:', error);
    res.status(500).json({ error: 'Failed to fetch bank guarantees.' });
  }
});

/**
 * @route POST /api/bank/guarantees
 * @desc Create new bank guarantee
 */
router.post('/guarantees', async (req, res) => {
  try {
    const companyId = getTargetCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ error: 'Company context required.' });
    }

    const { bgNumber, bankName, amount, expiryDate, remarks } = req.body;

    if (!bgNumber || !bgNumber.trim()) {
      return res.status(400).json({ error: 'BG Number is mandatory.' });
    }
    if (!bankName || !bankName.trim()) {
      return res.status(400).json({ error: 'Bank Name is mandatory.' });
    }
    if (amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Amount is mandatory and must be a valid number.' });
    }

    const guarantee = await prisma.bankGuarantee.create({
      data: {
        companyId,
        bgNumber: bgNumber.trim(),
        bankName: bankName.trim(),
        amount: parseFloat(amount),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        remarks: remarks ? remarks.trim() : null
      }
    });

    res.status(201).json(guarantee);
  } catch (error) {
    console.error('Create bank guarantee error:', error);
    res.status(500).json({ error: 'Failed to create bank guarantee.' });
  }
});

/**
 * @route PUT /api/bank/guarantees/:id
 * @desc Update bank guarantee
 */
router.put('/guarantees/:id', async (req, res) => {
  try {
    const companyId = getTargetCompanyId(req);
    const { id } = req.params;
    const { bgNumber, bankName, amount, expiryDate, remarks } = req.body;

    const existing = await prisma.bankGuarantee.findFirst({
      where: { id, companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Bank guarantee not found.' });
    }

    const updated = await prisma.bankGuarantee.update({
      where: { id },
      data: {
        bgNumber: bgNumber !== undefined ? bgNumber.trim() : existing.bgNumber,
        bankName: bankName !== undefined ? bankName.trim() : existing.bankName,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existing.expiryDate,
        remarks: remarks !== undefined ? (remarks ? remarks.trim() : null) : existing.remarks
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update bank guarantee error:', error);
    res.status(500).json({ error: 'Failed to update bank guarantee.' });
  }
});

/**
 * @route DELETE /api/bank/guarantees/:id
 * @desc Delete bank guarantee
 */
router.delete('/guarantees/:id', async (req, res) => {
  try {
    const companyId = getTargetCompanyId(req);
    const { id } = req.params;

    const existing = await prisma.bankGuarantee.findFirst({
      where: { id, companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Bank guarantee not found.' });
    }

    await prisma.bankGuarantee.delete({ where: { id } });

    res.json({ message: 'Bank guarantee deleted successfully.' });
  } catch (error) {
    console.error('Delete bank guarantee error:', error);
    res.status(500).json({ error: 'Failed to delete bank guarantee.' });
  }
});

module.exports = router;
