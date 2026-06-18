const express = require('express');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(express.json());

// API: Get all active products with their variants and real-time inventory
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      where: { is_active: true },
      include: {
        product_variants: {
          where: { is_active: true },
          include: {
            inventory: true
          }
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
  console.log(\Supercharged server running on port \\);
});
