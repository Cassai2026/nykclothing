const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Fail Fast Environmental Verification
const REQUIRED_ENV = ['DATABASE_URL', 'STRIPE_SECRET_KEY', 'ALLOWED_ORIGINS', 'FRONTEND_URL'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`CRITICAL FAILURE: Environmental variable [${key}] is missing.`);
    process.exit(1);
  }
});

const paymentRoutes = require('./routes/payments'); 
const userRoutes = require('./routes/users');
const twinRoutes = require('./routes/twins');
const webhookRoutes = require('./routes/webhooks'); // 1. Imported Webhook Route

const app = express();
const port = process.env.PORT || 3000;

// --- HARDENED DEFENSE MIDDLEWARE ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.stripe.com"]
    }
  }
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy violation: Request origin blocked.'));
    }
  },
  credentials: true
}));

app.use(compression()); 

// --- STRIPE WEBHOOK LAYER ---
// Must sit ABOVE express.json() so the raw request body buffer is preserved for verification
app.use('/api/webhooks', webhookRoutes); 

app.use(express.json());
app.use(express.static(path.join(__dirname, 'storefront')));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Rate limit exceeded. Request vector paused for 15 mins.'
});
app.use('/api/', apiLimiter);

// --- API DOMAINS ---
app.use('/api/payments', paymentRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/twins', twinRoutes);

app.get('/api/health', (req, res) => res.status(200).json({ status: 'Operational' }));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Vault locked. Production server running on port ${port}`);
  });
}

module.exports = app;
