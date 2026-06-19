const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ADMIN ROLE PROMOTION ENDPOINT
router.put('/promote', async (req, res) => {
  try {
    const { admin_id, target_user_id, new_role } = req.body;

    // 1. Enforce strict parameter verification
    if (!admin_id || !target_user_id || !new_role) {
      return res.status(400).json({ error: "Missing required governance matrix parameters." });
    }

    // 2. Authenticate the requester's admin status
    const supervisor = await prisma.users.findUnique({
      where: { user_id: admin_id }
    });

    if (!supervisor || supervisor.role !== 'admin') {
      return res.status(403).json({ error: "Access Denied: Insufficient administrative clearance." });
    }

    // 3. Validate the targeted role is within scope
    const validRoles = ['customer', 'exclusive_vip', 'admin'];
    if (!validRoles.includes(new_role)) {
      return res.status(400).json({ error: "Invalid role definition target." });
    }

    // 4. Update the target user's identity matrix
    const updatedUser = await prisma.users.update({
      where: { user_id: target_user_id },
      data: { role: new_role },
      select: {
        user_id: true,
        email: true,
        role: true
      }
    });

    res.status(200).json({
      status: "Identity matrix successfully reconfigured",
      user: updatedUser
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Target user identity record not found in vault." });
    }
    console.error('Administrative promotion failure:', error.message);
    res.status(500).json({ error: "Internal ledger modification failure." });
  }
});

module.exports = router;
