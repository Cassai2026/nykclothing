const { z } = require('zod');

// Define exactly what a checkout request should look like
const checkoutSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        name: z.string().min(1, "Item name is required"),
        price_cents: z.number().int().positive("Price must be a positive number"),
        quantity: z.number().int().positive("Quantity must be at least 1")
      })
    ).min(1, "Cart cannot be empty")
  })
});

// The Bouncer that checks the incoming data against the schema
const validateData = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    return res.status(400).json({ error: "Invalid data format", details: err.errors });
  }
};

module.exports = { validateData, checkoutSchema };
