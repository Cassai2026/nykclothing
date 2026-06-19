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
    const { items, user_id } = req.body; // Capture user_id from client state

    const metadataMap = {};
    const lineItems = await Promise.all(
      items.map(async (clientItem, index) => {
        const dbVariant = await prisma.productVariants.findUnique({
          where: { variant_id: clientItem.variant_id },
          include: { product: true }
        });

        if (!dbVariant || !dbVariant.is_active || !dbVariant.product.is_active) {
          throw new Error(`Product variant ${clientItem.variant_id} is unavailable.`);
        }

        // Map index to variant_id and quantity for webhook extraction
        metadataMap[`item_${index}`] = `${clientItem.variant_id}:${clientItem.quantity}`;

        return {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${dbVariant.product.product_name} - ${dbVariant.size} / ${dbVariant.color}`,
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
      metadata: {
        user_id: user_id || "guest_checkout_placeholder",
        ...metadataMap
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Secure Stripe Session Generation Failed:', error.message);
    res.status(500).json({ error: 'Payment gateway initialization aborted.' });
  }
});

module.exports = router;
