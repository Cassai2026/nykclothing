const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { validateData, checkoutSchema } = require('../middleware/validate');

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('CRITICAL CONFIGURATION ERROR: STRIPE_SECRET_KEY is undefined. Process terminating.');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', validateData(checkoutSchema), async (req, res) => {
  try {
    const { items } = req.body;

    const lineItems = await Promise.all(
      items.map(async (clientItem) => {
        const dbVariant = await prisma.productVariants.findUnique({
          where: { variant_id: clientItem.variant_id },
          include: { product: true }
        });

        if (!dbVariant || !dbVariant.is_active || !dbVariant.product.is_active) {
          throw new Error(\Product variant \ is unavailable or invalid.\);
        }

        return {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: \\ - \ / \\,
            },
            unit_amount: dbVariant.price_cents,
          },
          quantity: clientItem.quantity,
        };
      })
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: process.env.FRONTEND_URL + '/success.html',
      cancel_url: process.env.FRONTEND_URL + '/index.html',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Secure Stripe Session Generation Failed:', error.message);
    res.status(500).json({ error: 'Payment gateway initialization aborted.' });
  }
});

module.exports = router;
