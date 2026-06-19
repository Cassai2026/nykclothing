const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// STANDARD CATALOG VIEW (Open to all visitors)
router.get('/standard', async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      where: {
        is_active: true,
        access_tier: 'standard' // Strictly isolates public inventory rows
      },
      include: {
        product_variants: {
          where: { is_active: true },
          include: { inventory: true }
        }
      }
    });
    res.json({ data: products });
  } catch (err) {
    console.error('Public catalog mapping failure:', err.message);
    res.status(500).json({ error: 'Failed to stream public catalog items.' });
  }
});

// GHOST VIP CATALOG VIEW (Identity & Role Layer Controlled)
router.get('/ghost-vault', async (req, res) => {
  try {
    const { requester_id } = req.query; // Capture user ID from query verification header

    if (!requester_id) {
      return res.status(403).json({ error: 'Access Denied: Unverified transaction signature.' });
    }

    // Lookup user role attributes directly from the database vault
    const account = await prisma.users.findUnique({
      where: { user_id: requester_id }
    });

    if (!account || (account.role !== 'exclusive_vip' && account.role !== 'admin')) {
      // Return a flat 404 instead of a 403 so malicious vectors don't even know the endpoint exists
      return res.status(404).json({ error: 'Requested collection endpoint not found.' });
    }

    // Exclusively query the hidden asset matrix rows
    const ghostProducts = await prisma.products.findMany({
      where: {
        is_active: true,
        access_tier: 'exclusive_vip'
      },
      include: {
        product_variants: {
          where: { is_active: true },
          include: { inventory: true }
        }
      }
    });

    res.status(200).json({
      status: 'Ghost vault database grid decrypted',
      data: ghostProducts
    });
  } catch (err) {
    console.error('Ghost vault reading error:', err.message);
    res.status(500).json({ error: 'Internal secure ledger decryption error.' });
  }
});

module.exports = router;
