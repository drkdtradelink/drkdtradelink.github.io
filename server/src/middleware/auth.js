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
      const isPlatformHost = /\.(vercel\.app|onrender\.com|github\.io|railway\.app|herokuapp\.com)$/i.test(host);
      
      if (!isPlatformHost) {
        const parts = host.split('.');
        if (parts.length > 2) {
          subdomain = parts[0];
        }
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

    if (!user) {
      return res.status(401).json({ error: 'User account does not exist.' });
    }

    req.user = user;

    // 5. Enforce Multi-tenant Subdomain & Company Access Controls
    if (user.role !== 'admin') {
      // Non-admin users MUST belong to an active, non-deleted company
      if (!user.companyId) {
        return res.status(403).json({ error: 'Access denied. Account is not assigned to a company.' });
      }

      const userCompany = user.company || await prisma.company.findUnique({
        where: { id: user.companyId }
      });

      if (!userCompany) {
        return res.status(403).json({ error: 'Your company account has been deleted. Access is revoked.' });
      }

      if (userCompany.status === 'disabled' || userCompany.status === 'inactive' || userCompany.status === 'suspended') {
        return res.status(403).json({ error: 'Your company account is disabled. Access has been revoked. Please contact system administrator.' });
      }

      if (user.status !== 'active') {
        return res.status(401).json({ error: 'User account is inactive or disabled.' });
      }

      // Check subdomain match if subdomain specified and not 'admin'
      if (req.subdomain && req.subdomain !== 'admin') {
        if (userCompany.subdomain !== req.subdomain.toLowerCase()) {
          return res.status(403).json({ error: 'Access denied. You do not belong to this company.' });
        }
      }

      req.company = userCompany;
    } else {
      if (user.status !== 'active') {
        return res.status(401).json({ error: 'User account is inactive or disabled.' });
      }

      // System Super Admin role
      if (req.subdomain === 'admin' || !req.subdomain) {
        req.company = null;
      } else {
        // Admin accessing specific company subdomain
        const company = await prisma.company.findUnique({
          where: { subdomain: req.subdomain }
        });
        req.company = company || null;
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
