const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const paymentRoutes = require('./routes/payments');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT) || 3000;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.tailwindcss.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
  })
);

app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'storefront')));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP. Try again in 15 minutes.',
});

app.use('/api/', apiLimiter);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Vault is secure and operational' });
});

app.get('/api/products', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [products, totalItems] = await prisma.$transaction([
      prisma.products.findMany({
        where: { is_active: true },
        skip,
        take: limit,
        include: {
          product_variants: {
            where: { is_active: true },
            include: { inventory: true },
          },
        },
      }),
      prisma.products.count({ where: { is_active: true } }),
    ]);

    res.json({
      data: products,
      meta: {
        totalItems,
        currentPage: page,
        totalPages: Math.max(Math.ceil(totalItems / limit), 1),
      },
    });
  } catch (err) {
    logger.error('Prisma query failed', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

app.use((err, req, res, next) => {
  if (err && err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  logger.error('Unhandled server error', { message: err?.message });
  return res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Vault locked. High-speed server running on port ${port}`);
  });
}

module.exports = app;
