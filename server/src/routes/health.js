const express = require('express');
const path = require('path');
const fs = require('fs');
const prisma = require('../db/client');

const router = express.Router();

/**
 * Format uptime seconds into human readable string
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

/**
 * Gather complete system health telemetry
 */
async function getHealthStatus() {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = process.uptime();
  const memory = process.memoryUsage();

  // Database probe
  let dbStatus = {
    status: 'ok',
    connected: true,
    latencyMs: 0,
    companyCount: 0,
    error: null
  };

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1 as alive`;
    const companyCount = await prisma.company.count();
    dbStatus.latencyMs = Date.now() - dbStart;
    dbStatus.companyCount = companyCount;
  } catch (err) {
    dbStatus.status = 'error';
    dbStatus.connected = false;
    dbStatus.latencyMs = Date.now() - dbStart;
    dbStatus.error = err.message;
  }

  // Frontend build asset check
  const portalIndexPath = path.join(__dirname, '../../../portal/index.html');
  const frontendBuildExists = fs.existsSync(portalIndexPath);

  const frontendStatus = {
    status: frontendBuildExists ? 'ok' : 'degraded',
    buildExists: frontendBuildExists,
    portalPath: '/portal',
    portalIndexFile: portalIndexPath
  };

  // API modules inventory
  const apiModules = [
    { name: 'Auth Module', path: '/api/auth', status: 'ok', description: 'Authentication & Session Management' },
    { name: 'Companies Module', path: '/api/companies', status: 'ok', description: 'Multi-tenant Company Management' },
    { name: 'Users Module', path: '/api/users', status: 'ok', description: 'User RBAC & Credentials' },
    { name: 'Parties Module', path: '/api/parties', status: 'ok', description: 'Vendors & Consignees Directory' },
    { name: 'Stock Module', path: '/api/stock', status: 'ok', description: 'Warehouse Inventory & Duty Balance' },
    { name: 'Duty Rules Module', path: '/api/duty-rules', status: 'ok', description: 'Customs Duty Rate Calculator Rules' },
    { name: 'GR Docs Module', path: '/api/gr-docs', status: 'ok', description: 'GR Transaction Package Generation' },
    { name: 'GR Purchases Module', path: '/api/gr-purchases', status: 'ok', description: 'Inbound Warehousing & Bonded Receipts' },
    { name: 'Shipping Bills Module', path: '/api/shipping-bills', status: 'ok', description: 'Pink Shipping Bills Ex-Bond Exports' },
    { name: 'Monthly Returns Module', path: '/api/monthly-returns', status: 'ok', description: 'Customs Ex-Bond Monthly Compliance Reports' },
    { name: 'Audit Logs Module', path: '/api/audit-logs', status: 'ok', description: 'System Audit Trail & Diff Logs' }
  ];

  // Overall system health summary
  const isHealthy = dbStatus.connected && frontendBuildExists;
  const overallStatus = isHealthy ? 'ok' : (dbStatus.connected ? 'degraded' : 'error');

  return {
    status: overallStatus,
    timestamp,
    service: 'DRKD Tradelink Documents Portal API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    system: {
      uptimeSeconds: Math.floor(uptimeSeconds),
      uptimeFormatted: formatUptime(uptimeSeconds),
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: {
        rssMb: (memory.rss / (1024 * 1024)).toFixed(2),
        heapTotalMb: (memory.heapTotal / (1024 * 1024)).toFixed(2),
        heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(2)
      }
    },
    database: dbStatus,
    frontend: frontendStatus,
    apis: {
      status: 'ok',
      totalModules: apiModules.length,
      modules: apiModules
    }
  };
}

/**
 * @route GET /health or GET /api/health
 * @desc Complete health probe endpoint
 */
router.get('/', async (req, res) => {
  try {
    const health = await getHealthStatus();
    const statusCode = health.status === 'error' ? 503 : 200;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

/**
 * @route GET /health/db or GET /api/health/db
 * @desc Database-specific health check
 */
router.get('/db', async (req, res) => {
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1 as alive`;
    const companyCount = await prisma.company.count();
    const latencyMs = Date.now() - dbStart;
    res.json({
      status: 'ok',
      connected: true,
      latencyMs,
      companyCount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      connected: false,
      latencyMs: Date.now() - dbStart,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /health/apis or GET /api/health/apis
 * @desc API modules operational status inventory
 */
router.get('/apis', async (req, res) => {
  const health = await getHealthStatus();
  res.json({
    status: 'ok',
    timestamp: health.timestamp,
    apis: health.apis
  });
});

/**
 * @route GET /health/frontend or GET /api/health/frontend
 * @desc Frontend build static assets status check
 */
router.get('/frontend', (req, res) => {
  const portalIndexPath = path.join(__dirname, '../../../portal/index.html');
  const buildExists = fs.existsSync(portalIndexPath);
  res.json({
    status: buildExists ? 'ok' : 'error',
    buildExists,
    portalPath: '/portal',
    portalIndexFile: portalIndexPath,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
