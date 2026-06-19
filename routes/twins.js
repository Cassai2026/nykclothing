const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateData, mintTwinSchema } = require('../middleware/validate');

const prisma = new PrismaClient();

// MINT ENDPOINT: Physical to Digital Bonding
router.post('/mint', validateData(mintTwinSchema), async (req, res) => {
  try {
    const { user_id, variant_name, nfc_secure_tag } = req.body;

    const newTwin = await prisma.digitalTwins.create({
      data: {
        user_id,
        variant_name,
        nfc_secure_tag,
        garment_status: "active"
      }
    });

    res.status(201).json({
      status: "Garment successfully minted to circular lifecycle log",
      digital_twin: newTwin
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Security Alert: This physical NFC tag has already been minted." });
    }
    console.error('Minting engine system failure:', error.message);
    res.status(500).json({ error: "Circular asset creation failure" });
  }
});

// CLOSET ENDPOINT: Fetch All Authenticated Assets For a Specific Identity
router.get('/closet/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fast protective character structural sweep
    if (!user_id || user_id.length < 10) {
      return res.status(400).json({ error: "Invalid or malformed user identification token parameters" });
    }

    const closetAssets = await prisma.digitalTwins.findMany({
      where: { user_id: user_id },
      orderBy: { minted_at: 'desc' }
    });

    res.status(200).json({
      status: "Digital closet stream retrieved",
      total_assets: closetAssets.length,
      closet: closetAssets
    });
  } catch (error) {
    console.error('Closet retrieval system failure:', error.message);
    res.status(500).json({ error: "Internal ledger processing failure while fetching closet" });
  }
});

module.exports = router;
