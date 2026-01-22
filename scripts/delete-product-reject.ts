/**
 * Script to delete 'product.reject' permission
 * Run with: npx tsx scripts/delete-product-reject.ts
 */
import { prisma } from "../src/infrastructure/database";

async function main() {
  console.log("Deleting 'product.reject' permission...");
  try {
    const deleted = await prisma.permission.deleteMany({
      where: {
        key: "product.reject",
      },
    });
    console.log(`Deleted ${deleted.count} permission(s).`);
  } catch (error) {
    console.error("Error deleting permission:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
