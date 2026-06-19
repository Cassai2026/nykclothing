const { z } = require('zod');

// Checkout Validation
const checkoutSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        variant_id: z.string().uuid("Invalid product token structure"),
        quantity: z.number().int().positive("Quantity must be 1 or higher")
      })
    ).min(1, "Purchase matrix cannot be empty")
  })
});

// Biometric Validation
const biometricSchema = z.object({
  body: z.object({
    user_id: z.string().uuid("Invalid user identification"),
    height_cm: z.number().positive(),
    chest_cm: z.number().positive(),
    waist_cm: z.number().positive(),
    hips_cm: z.number().positive()
  })
});

// NFC Passport Validation
const mintTwinSchema = z.object({
  body: z.object({
    user_id: z.string().uuid(),
    variant_name: z.string().min(1),
    nfc_secure_tag: z.string().min(12)
  })
});

// New Identity Registration Validation
const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid corporate or personal email structure"),
    password: z.string().min(8, "Security threshold requires minimum 8 characters")
  })
});

// Identity Verification Login Validation
const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Malformed credential parameters"),
    password: z.string().min(1, "Password parameter required")
  })
});

const validateData = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    return res.status(400).json({ error: "Data integrity verification failed", details: err.errors });
  }
};

module.exports = { validateData, checkoutSchema, biometricSchema, mintTwinSchema, registerSchema, loginSchema };
