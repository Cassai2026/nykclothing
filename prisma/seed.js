const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old catalog items...');
  await prisma.products.deleteMany({});

  console.log('Seeding NYK Clothing flagship inventory...');

  // Create the core product silhouette
  const hoodie = await prisma.products.create({
    data: {
      product_name: 'Sovereign Luxury Hoodie',
      product_description: 'Heavyweight 450gsm organic cotton. Drop shoulder boxy silhouette. Encrypted NFC life-cycle tag sewn into the left hem.',
      is_active: true,
    },
  });

  // Define variants with standard high-end retail pricing (£85.00 -> 8500 cents)
  const variantsData = [
    { size: 'S', color: 'Matte Black', price_cents: 8500 },
    { size: 'M', color: 'Matte Black', price_cents: 8500 },
    { size: 'L', color: 'Matte Black', price_cents: 8500 },
    { size: 'XL', color: 'Matte Black', price_cents: 8500 },
  ];

  for (const variant of variantsData) {
    const createdVariant = await prisma.productVariants.create({
      data: {
        product_id: hoodie.product_id,
        size: variant.size,
        color: variant.color,
        price_cents: variant.price_cents,
        is_active: true,
      },
    });

    // Initialize physical inventory counts for each size variant
    await prisma.inventory.create({
      data: {
        variant_id: createdVariant.variant_id,
        quantity: 50, // Starting drop volume per size
      },
    });
  }

  console.log('Database seeding completed successfully. Vault is packed.');
}

main()
  .catch((e) => {
    console.error('Seeding process aborted due to error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
