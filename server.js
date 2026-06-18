const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// --- SECURITY GUARDS ---
app.use(helmet()); 
app.use(cors({ origin: 'https://nykclothing.com' })); 
app.use(express.json());

// Stop bots from spamming our API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP. Chill out and try again in 15 mins.'
});
app.use('/api/', apiLimiter);

// --- ROUTES ---
// Public Route: Get all active products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      where: { is_active: true },
      include: {
        product_variants: {
          where: { is_active: true },
          include: { inventory: true }
        }
      }
    });
    res.json(products);
  } catch (err) {
    console.error('Prisma Error:', err);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

app.listen(port, () => {
  console.log(\Vault locked. Supercharged server running on port \\);
});
