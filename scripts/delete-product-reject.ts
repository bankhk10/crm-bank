import { PrismaClient } from "./prisma/generated/client";

const prisma = new PrismaClient();

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
