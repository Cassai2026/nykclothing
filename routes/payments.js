const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// We will add the real secret key to .env later, using a dummy one for the blueprint
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Generate a secure checkout link
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body; // What the customer is buying

    // Tell Stripe what to charge them
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
