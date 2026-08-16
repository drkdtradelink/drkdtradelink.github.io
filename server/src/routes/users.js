const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db/client');
const { authenticate, requireRole, requireAdminPassword } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * @route GET /api/users
 * @desc Get list of users (scoped by role/company)
 */
router.get('/', async (req, res) => {
  try {
    let users;
    if (req.user.role === 'admin') {
      // Super admin can see all users
      users = await prisma.user.findMany({
        include: { company: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user.role === 'manager') {
      // Company manager can only see their company's users
      users = await prisma.user.findMany({
        where: { companyId: req.user.companyId },
        orderBy: { name: 'asc' }
      });
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Don't return password hashes
    const sanitized = users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    res.json(sanitized);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

/**
 * @route POST /api/users
 * @desc Create a new user
 */
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { name, email, password, phone, role, companyId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }

    // Determine target companyId and role based on creator's role
    let finalCompanyId = null;
    let finalRole = role || 'operator';

    if (req.user.role === 'admin') {
      // Super admin can assign any company
      finalCompanyId = companyId || null;
    } else {
      // Manager can only create users in their own company
      finalCompanyId = req.user.companyId;
      // Manager cannot create a super admin, only manager or operator
      if (finalRole === 'admin') {
        finalRole = 'manager';
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role: finalRole,
        companyId: finalCompanyId,
        status: 'active'
      }
    });

    const { passwordHash, ...sanitized } = user;
    res.status(201).json(sanitized);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

/**
 * @route PUT /api/users/:id
 * @desc Update user details
 */
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { name, email, password, phone, role, status, companyId } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && existingUser.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied. You can only update users within your company.' });
    }

    // Require admin password if system admin is editing another user
    if (req.user.role === 'admin' && req.user.id !== req.params.id) {
      const adminPassword = req.headers['x-admin-password'];
      if (!adminPassword) {
        return res.status(400).json({ error: 'Admin password is required to authorize this action.' });
      }
      const isMatch = await bcrypt.compare(adminPassword, req.user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid admin password. Authorization failed.' });
      }
    }

    const data = {};
    if (name) data.name = name;
    if (email) {
      // Check duplicate email
      const emailDup = await prisma.user.findFirst({
        where: { email, NOT: { id: req.params.id } }
      });
      if (emailDup) {
        return res.status(400).json({ error: 'Email address is already in use by another user.' });
      }
      data.email = email;
    }
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    if (phone !== undefined) data.phone = phone;
    if (status) {
      if (req.user.id === req.params.id && (status === 'suspended' || status === 'inactive')) {
        return res.status(400).json({ error: 'You cannot suspend or deactivate your own account.' });
      }
      data.status = status;
    }

    // Scoped role/company assignments
    if (req.user.role === 'admin') {
      if (role) data.role = role;
      if (companyId !== undefined) data.companyId = companyId;
    } else {
      // Manager can change role to manager/operator but not super admin
      if (role && role !== 'admin') data.role = role;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data
    });

    const { passwordHash, ...sanitized } = updated;
    res.json(sanitized);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

/**
 * @route DELETE /api/users/:id
 * @desc Delete user account
 */
router.delete('/:id', requireAdminPassword, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'User account deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

module.exports = router;
