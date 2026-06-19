const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.user_id;

    console.log(`Payment authorized for Session: ${session.id}. Launching ecosystem automation...`);

    try {
      // Extract our variant maps from metadata tokens
      const purchaseTasks = Object.keys(session.metadata)
        .filter(key => key.startsWith('item_'))
        .map(key => {
          const [variantId, quantityStr] = session.metadata[key].split(':');
          return { variantId, quantity: parseInt(quantityStr, 10) };
        });

      // Execute Isolated Database Multi-Write Transaction
      await prisma.$transaction(async (tx) => {
        for (const task of purchaseTasks) {
          
          // 1. Decrement Live Physical Stock Volume
          const currentInventory = await tx.inventory.findUnique({
            where: { variant_id: task.variantId }
          });

          if (!currentInventory || currentInventory.quantity < task.quantity) {
            throw new Error(`Inventory depletion fault: Variant ${task.variantId} out of stock.`);
          }

          await tx.inventory.update({
            where: { variant_id: task.variantId },
            data: { quantity: { decrement: task.quantity } }
          });

          // Fetch variant profile data for the Digital Twin passport name
          const variantInfo = await tx.productVariants.findUnique({
            where: { variant_id: task.variantId },
            include: { product: true }
          });

          // 2. Mint Digital Passport Twins for each physical item bought
          for (let i = 0; i < task.quantity; i++) {
            // Generate a secure, deterministic mock NFC hash structure for production staging
            const secureTagHash = crypto.createHash('sha256')
              .update(`${session.id}_${task.variantId}_${i}`)
              .digest('hex').substring(0, 24);

            await tx.digitalTwins.create({
              data: {
                user_id: userId !== "guest_checkout_placeholder" ? userId : null, // Handle fallback anonymous checkouts safely
                variant_name: `${variantInfo.product.product_name} - ${variantInfo.size} / ${variantInfo.color}`,
                nfc_secure_tag: `nyk_${secureTagHash}`,
                garment_status: "active"
              }
            });
          }
        }
      });

      console.log(`Fulfillment complete. Stock updated and digital twins successfully minted to User: ${userId}`);
    } catch (transactionError) {
      console.error(`Fulfillment Pipeline Aborted: ${transactionError.message}`);
      // Return a 500 so Stripe knows our internal server misfired and will retry sending the hook
      return res.status(500).json({ error: "Internal ledger processing failure" });
    }
  }

  res.json({ received: true });
});

module.exports = router;
