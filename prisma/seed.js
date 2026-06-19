const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Helper: Generate a secure scrypt hash for test credentials
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  console.log('Resetting ecosystem database tables...');
  await prisma.inventory.deleteMany({});
  await prisma.productVariants.deleteMany({});
  await prisma.products.deleteMany({});
  await prisma.users.deleteMany({});

  console.log('Seeding simulated identity matrices...');
  const masterPassword = hashPassword('NykTestPass123!');

  // 1. Provision Test Profiles for All Tiers
  const standardUser = await prisma.users.create({
    data: { email: 'buyer@nyk.local', password_hash: masterPassword, role: 'customer' }
  });

  const vipUser = await prisma.users.create({
    data: { email: 'vip@nyk.local', password_hash: masterPassword, role: 'exclusive_vip' }
  });

  const adminUser = await prisma.users.create({
    data: { email: 'admin@nyk.local', password_hash: masterPassword, role: 'admin' }
  });

  console.log('Seeding public and ghost vault product lines...');

  // 2. Insert Standard Catalog Product
  const publicHoodie = await prisma.products.create({
    data: {
      product_name: 'Sovereign Luxury Hoodie',
      product_description: 'Heavyweight 450gsm organic cotton. Drop shoulder boxy silhouette.',
      access_tier: 'standard',
      is_active: true,
    },
  });

  // 3. Insert Ghost Vault Secret Product
  const ghostJacket = await prisma.products.create({
    data: {
      product_name: 'Ghost Camo Matrix Shell',
      product_description: '[CLASSIFIED] Ultra-limited technical outerwear with integrated dynamic thermal masking.',
      access_tier: 'exclusive_vip',
      is_active: true,
    },
  });

  // 4. Map Variants and Stock Levels
  const sizes = ['S', 'M', 'L', 'XL'];

  // Public Hoodie Variants
  for (const size of sizes) {
    const variant = await prisma.productVariants.create({
      data: {
        product_id: publicHoodie.product_id,
        size,
        color: 'Matte Black',
        price_cents: 8500,
      },
    });
    await prisma.inventory.create({ data: { variant_id: variant.variant_id, quantity: 100 } });
  }

  // Ghost Jacket Variants
  for (const size of sizes) {
    const variant = await prisma.productVariants.create({
      data: {
        product_id: ghostJacket.product_id,
        size,
        color: 'Phantom Stealth',
        price_cents: 25000, // Premium tier pricing
      },
    });
    await prisma.inventory.create({ data: { variant_id: variant.variant_id, quantity: 10 } });
  }

  console.log('\n=== VAULT INFRASTRUCTURE SEEDED ===');
  console.log(`Standard Tester ID [${standardUser.user_id}] -> buyer@nyk.local`);
  console.log(`VIP Tester ID      [${vipUser.user_id}] -> vip@nyk.local`);
  console.log(`Admin Tester ID    [${adminUser.user_id}] -> admin@nyk.local`);
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error('Seeding halted:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
