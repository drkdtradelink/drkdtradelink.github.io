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

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // Allow all origins for simple integration
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Subdomain', 'X-Tenant', 'X-Admin-Password']
}));

app.use(express.json());

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
app.use('/api/audit-logs', auditLogRoutes);

// Serve static files for the portal frontend
// Root is drkdtradelink.github.io, so portal lives in ../portal relative to this file's folder (src)
const portalPath = path.join(__dirname, '../../portal');
app.use('/portal', express.static(portalPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

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
