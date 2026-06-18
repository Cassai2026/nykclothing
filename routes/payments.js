const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { validateData, checkoutSchema } = require('../middleware/validate');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Notice the validateData(checkoutSchema) sitting right in the middle!
router.post('/create-checkout-session', validateData(checkoutSchema), async (req, res) => {
  try {
    const { items } = req.body; 

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: item.price_cents,
        },
        quantity: item.quantity,
      })),
      success_url: 'https://nykclothing.com/success',
      cancel_url: 'https://nykclothing.com/cart',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: 'Payment gateway failed to initialize' });
  }
});

module.exports = router;
