import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting backfill for isStockDeducted...');

  const result = await prisma.sale.updateMany({
    where: {
      status: {
        in: ['DELIVERED', 'DELIVERY_COMPLETED', 'COMPLETED']
      }
    },
    data: {
      isStockDeducted: true
    }
  });

  console.log(`Updated ${result.count} sales.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
