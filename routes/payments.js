const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { validateData, checkoutSchema } = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/create-checkout-session', validateData(checkoutSchema), async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Payment provider is not configured' });
    }

    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const { items } = req.body;
    const variantIds = items.map((item) => item.product_variant_id);

    const variants = await prisma.product_variants.findMany({
      where: {
        product_variant_id: { in: variantIds },
        is_active: true,
        products: { is_active: true },
      },
      include: { products: true },
    });

    const variantMap = new Map(variants.map((variant) => [variant.product_variant_id, variant]));

    if (variantMap.size !== variantIds.length) {
      return res.status(400).json({ error: 'One or more items are invalid or unavailable' });
    }

    const line_items = items.map((item) => {
      const variant = variantMap.get(item.product_variant_id);

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: variant.products.product_name,
            description: `${variant.color_name} / ${variant.size_label}`,
          },
          unit_amount: variant.price_cents,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/success',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/cart',
    });

    return res.json({ url: session.url });
  } catch (error) {
    logger.error('Stripe checkout creation failed', { message: error.message });
    return res.status(500).json({ error: 'Payment gateway failed to initialize' });
  }
});

module.exports = router;
