const { z } = require('zod');

const checkoutSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          product_variant_id: z.number().int().positive('Variant id must be a positive integer'),
          quantity: z.number().int().positive('Quantity must be at least 1'),
        })
      )
      .min(1, 'Cart cannot be empty'),
  }),
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
    return res.status(400).json({
      error: 'Invalid data format',
      details: err.issues || err.errors || [],
    });
  }
};

module.exports = { validateData, checkoutSchema };
