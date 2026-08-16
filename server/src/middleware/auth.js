const jwt = require('jsonwebtoken');
const prisma = require('../db/client');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-drkd-tradelink-12345!';

/**
 * Authentication & Subdomain-aware Multi-tenancy Middleware
 */
async function authenticate(req, res, next) {
  try {
    // 1. Extract subdomain from request
    // Support header 'x-subdomain' for easy development/testing, otherwise parse from hostname
    let subdomain = req.headers['x-subdomain'] || req.headers['x-tenant'];
    
    if (!subdomain) {
      const host = req.headers.host || ''; // e.g. "drkd.localhost:3000" or "drkd.drkdtradelink.com"
      const parts = host.split('.');
      if (parts.length > 2) {
        // If host is companya.drkdtradelink.com -> parts = ['companya', 'drkdtradelink', 'com'] -> parts[0]
        // If host is companya.localhost:3000 -> parts = ['companya', 'localhost:3000'] -> parts[0]
        subdomain = parts[0];
      }
    }

    req.subdomain = subdomain ? subdomain.toLowerCase() : null;

    // 2. Extract JWT token
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    // 3. Verify Token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    // 4. Fetch User from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { company: true }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User is inactive or does not exist.' });
    }

    req.user = user;

    // 5. Enforce Multi-tenant Subdomain Access
    if (req.subdomain === 'admin') {
      // Accessing admin subdomain requires super admin role
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin portal requires administrator privileges.' });
      }
      req.company = null; // System admins operate at system level
    } else if (req.subdomain) {
      // Accessing a company subdomain (e.g. drkd, companya)
      const company = await prisma.company.findUnique({
        where: { subdomain: req.subdomain }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found.' });
      }

      if (user.role !== 'admin' && company.status !== 'active') {
        return res.status(403).json({ error: 'Company is suspended or inactive.' });
      }

      // Check if user belongs to this company (or is super admin who has cross-company privileges)
      if (user.role !== 'admin' && user.companyId !== company.id) {
        return res.status(403).json({ error: 'Access denied. You do not belong to this company.' });
      }

      req.company = company;
    } else {
      // No subdomain specified. If user is super admin, let them proceed without company scope.
      // If user is regular company user, default to their own company.
      if (user.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: user.companyId }
        });
        
        if (user.role !== 'admin' && (!company || company.status !== 'active')) {
          return res.status(403).json({ error: 'Your company is suspended or inactive.' });
        }
        
        req.company = company;
      } else {
        req.company = null;
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

/**
 * Role checking helper middleware
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    
    next();
  };
}

/**
 * Middleware to verify admin password for critical operations
 */
async function requireAdminPassword(req, res, next) {
  const bcrypt = require('bcryptjs');
  const prisma = require('../db/client');

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. System Administrator privilege required.' });
  }

  const adminPassword = req.headers['x-admin-password'];
  if (!adminPassword) {
    return res.status(400).json({ error: 'Admin password is required to authorize this action.' });
  }

  const isMatch = await bcrypt.compare(adminPassword, req.user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid admin password. Authorization failed.' });
  }

  next();
}

module.exports = {
  authenticate,
  requireRole,
  requireAdminPassword
};
