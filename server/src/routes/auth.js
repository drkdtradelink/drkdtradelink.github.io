const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-drkd-tradelink-12345!';

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, subdomain } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Regular non-admin users: verify company assignment, existence, and status
    if (user.role !== 'admin') {
      if (!user.companyId) {
        return res.status(403).json({ error: 'Your user account is not associated with any active company.' });
      }

      const userCompany = user.company || await prisma.company.findUnique({
        where: { id: user.companyId }
      });

      if (!userCompany) {
        return res.status(403).json({ error: 'Your company account has been deleted. Access is revoked.' });
      }

      if (userCompany.status === 'disabled' || userCompany.status === 'inactive' || userCompany.status === 'suspended') {
        return res.status(403).json({ error: 'Your company is disabled. Access is revoked, which is why you cannot log in. Please contact the administrator.' });
      }

      if (user.status !== 'active') {
        return res.status(401).json({ error: 'Your user account is disabled or inactive. Please contact system administration.' });
      }

      // If logging in through a specific company subdomain, verify match
      if (subdomain && subdomain !== 'admin') {
        if (userCompany.subdomain !== subdomain.toLowerCase()) {
          return res.status(403).json({ error: 'You do not have access to this company portal.' });
        }
      }
    } else {
      if (user.status !== 'active') {
        return res.status(401).json({ error: 'Your user account is disabled or inactive. Please contact system administration.' });
      }
    }

    // If logging in through admin subdomain, must be super admin
    if (subdomain === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin portal access restricted to system administrators.' });
    }

    // Sign Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company ? user.company.displayName : 'System Admin'
      }
    });

  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user details
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      companyId: req.user.companyId,
      status: req.user.status
    },
    company: req.company ? {
      id: req.company.id,
      legalName: req.company.legalName,
      displayName: req.company.displayName,
      address: req.company.address,
      city: req.company.city,
      state: req.company.state,
      country: req.company.country,
      gstin: req.company.gstin,
      iec: req.company.iec,
      warehouseCode: req.company.warehouseCode,
      bankName: req.company.bankName,
      bankAccount: req.company.bankAccount,
      bankIfsc: req.company.bankIfsc,
      bankBranch: req.company.bankBranch,
      customStation: req.company.customStation,
      subdomain: req.company.subdomain
    } : null
  });
});

module.exports = router;
