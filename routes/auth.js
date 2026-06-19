const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { validateData, registerSchema, loginSchema } = require('../middleware/validate');

const prisma = new PrismaClient();

// Helper: Hash password using native crypto scrypt implementation
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

// Helper: Verify password matches stored database cryptographic hash
function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
}

// REGISTER ENDPOINT
router.post('/register', validateData(registerSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Identity conflict: Email vector already registered." });
    }

    const secureHash = hashPassword(password);

    const newUser = await prisma.users.create({
      data: {
        email,
        password_hash: secureHash,
        role: "customer"
      }
    });

    res.status(201).json({
      status: "Identity successfully provisioned",
      user_id: newUser.user_id,
      email: newUser.email
    });
  } catch (error) {
    console.error('Registration processing fault:', error.message);
    res.status(500).json({ error: "Internal security registration failure" });
  }
});

// LOGIN ENDPOINT
router.post('/login', validateData(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Access Denied: Invalid security credentials." });
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Access Denied: Invalid security credentials." });
    }

    // Generate a stateless cryptographic session handle token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    res.status(200).json({
      status: "Authentication authorized",
      token: sessionToken,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Authentication module fault:', error.message);
    res.status(500).json({ error: "Internal authentication gateway failure" });
  }
});

module.exports = router;
