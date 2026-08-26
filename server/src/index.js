require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const userRoutes = require('./routes/users');
const partyRoutes = require('./routes/parties');
const stockRoutes = require('./routes/stock');
const dutyRuleRoutes = require('./routes/duty-rules');
const grDocRoutes = require('./routes/gr-docs');
const grPurchaseRoutes = require('./routes/gr-purchases');
const shippingBillRoutes = require('./routes/shipping-bills');
const auditLogRoutes = require('./routes/audit-logs');
const monthlyReturnRoutes = require('./routes/monthly-returns');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Production-safe dynamic CORS origin validator
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser clients (curl, Postman, server-to-server)
  
  // Allow localhost for dev
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;

  // Allow GitHub Pages frontend domain
  if (/^https:\/\/.*\.github\.io$/.test(origin)) return true;

  // Allow Render backend domains
  if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return true;
  
  // Allow all Vercel preview & production deployment origins for DRKD Tradelink
  if (/^https:\/\/drkdtradelink-[a-z0-9-]+-drkd\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Subdomain',
    'X-Tenant',
    'X-Admin-Password',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  maxAge: 86400 // Cache preflight response in browser for 24 hours
};

app.use(cors(corsOptions));

// Preflight OPTIONS middleware compatible with Express 5
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Subdomain, X-Tenant, X-Admin-Password, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// Health check endpoints
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/duty-rules', dutyRuleRoutes);
app.use('/api/gr-docs', grDocRoutes);
app.use('/api/gr-purchases', grPurchaseRoutes);
app.use('/api/shipping-bills', shippingBillRoutes);
app.use('/api/monthly-returns', monthlyReturnRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Serve static files for the portal frontend when running locally
const portalPath = path.join(__dirname, '../../portal');
app.use('/portal', express.static(portalPath));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong on the server.' });
});

// Export Express app for Vercel serverless function deployment
module.exports = app;

// Only listen on PORT when running directly in Node (e.g. node src/index.js or npm start)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Documents Portal frontend served at http://localhost:${PORT}/portal/`);
  });
}
