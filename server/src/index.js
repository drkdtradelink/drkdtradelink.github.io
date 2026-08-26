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

const app = express();
const PORT = process.env.PORT || 3000;

// Completely permissive CORS middleware allowing all origins, methods, headers, and preflights
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   res.header('Access-Control-Allow-Origin', origin || '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
//   res.header('Access-Control-Allow-Headers', '*');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }
//   next();
// });
// app.use(cors());

app.use(cors({
  origin: "*"
  // origin: true,
  // credentials: true,
  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json());

// API Routes
const monthlyReturnRoutes = require('./routes/monthly-returns');

const healthRoutes = require('./routes/health');

app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
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

// Serve static files for the portal frontend
// Root is drkdtradelink.github.io, so portal lives in ../portal relative to this file's folder (src)
const portalPath = path.join(__dirname, '../../portal');
app.use('/portal', express.static(portalPath));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Documents Portal frontend served at http://localhost:${PORT}/portal/`);
});
