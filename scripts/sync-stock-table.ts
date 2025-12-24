import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting ProductStock sync...");

  const products = await prisma.product.findMany({
    include: {
      stockLots: {
        where: { isUsed: false },
      },
      saleItems: {
        where: {
          sale: {
            status: {
              in: ["APPROVED", "AWAITING_PAYMENT", "AWAITING_DELIVERY"],
            },
            deletedAt: null,
          },
        },
      },
      stock: true, // Check if exists
    },
  });

  console.log(`Found ${products.length} products to sync.`);

  for (const product of products) {
    const availableQuantity = product.stockLots.reduce(
      (sum, lot) => sum + lot.quantity,
      0
    );

    const reservedQuantity = product.saleItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const physicalBalance = availableQuantity + reservedQuantity;

    console.log(
      `Syncing Product ${product.productCode}: Available=${availableQuantity}, Reserved=${reservedQuantity}, Physical=${physicalBalance}`
    );

    await prisma.productStock.upsert({
      where: { productId: product.id },
      create: {
        productId: product.id,
        physicalBalance,
        reservedQuantity,
        availableQuantity,
      },
      update: {
        physicalBalance,
        reservedQuantity,
        availableQuantity,
      },
    });
  }

  console.log("ProductStock sync completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
