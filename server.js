const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const paymentRoutes = require('./routes/payments'); 
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// --- SECURITY & SPEED GUARDS ---
app.use(helmet({
  contentSecurityPolicy: false, // Allows our frontend CDN to load Tailwind smoothly
})); 
app.use(cors()); 
app.use(compression()); 
app.use(express.json());

// --- SERVE FRONTEND STOREFRONT ---
// This line automatically serves your index.html when someone visits the main domain
app.use(express.static(path.join(__dirname, 'storefront')));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP. Chill out and try again in 15 mins.'
});
app.use('/api/', apiLimiter);

// --- ROUTES ---
app.use('/api/payments', paymentRoutes); 

app.get('/api/health', (req, res) => res.status(200).json({ status: 'Vault is secure and operational' }));

app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [products, totalItems] = await prisma.\([
      prisma.products.findMany({
        where: { is_active: true },
        skip: skip,
        take: limit,
        include: {
          product_variants: {
            where: { is_active: true },
            include: { inventory: true }
          }
        }
      }),
      prisma.products.count({ where: { is_active: true } })
    ]);

    res.json({
      data: products,
      meta: { totalItems, currentPage: page, totalPages: Math.ceil(totalItems / limit) }
    });
  } catch (err) {
    console.error('Prisma Error:', err);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

app.listen(port, () => {
  console.log(\Vault locked. High-speed server running on port \\);
});
