import { config } from "dotenv";
config(); // loads .env by default
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be defined in .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('⏳ Starting mock data generation for Sales Target (sales_forecast_test)...');

  // 1. Get an existing User & Employee
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found in DB. Please seed the database first.');

  let employee = await prisma.employee.findFirst({ where: { userId: user.id } });
  if (!employee) {
    employee = await prisma.employee.findFirst();
  }
  if (!employee) throw new Error('No employee found in DB.');

  // 2. Get some Customers and Products
  const customers = await prisma.customer.findMany({ take: 3 });
  if (customers.length === 0) throw new Error('No customers found in DB. Please seed customers.');

  const products = await prisma.product.findMany({ take: 5 });
  if (products.length === 0) throw new Error('No products found in DB. Please seed products.');

  const currentYear = new Date().getFullYear();

  console.log(`👤 Using Employee: ${employee.name} (${employee.id})`);
  console.log(`🛒 Target Customers: ${customers.length}, Target Products: ${products.length}`);

  // 3. Generate Target for each month
  for (let month = 1; month <= 12; month++) {
    console.log(`📅 Processing Month ${month}/${currentYear}...`);

    // Check if target exists
    const existingTarget = await prisma.salesTarget.findUnique({
      where: {
        year_month_employeeId: {
          year: currentYear,
          month: month,
          employeeId: employee.id
        }
      }
    });

    if (existingTarget) {
      console.log(`   - Target exists for month ${month}. Deleting old target...`);
      await prisma.salesTarget.delete({
        where: { id: existingTarget.id }
      });
    }

    // Create New Target
    const newTarget = await prisma.salesTarget.create({
      data: {
        year: currentYear,
        month: month,
        employeeId: employee.id,
        region: customers[0]?.region ?? null,
        createdById: user.id,
      }
    });

    // Generate Stores & Items
    for (const customer of customers) {
      const store = await prisma.salesTargetStore.create({
        data: {
          salesTargetId: newTarget.id,
          customerId: customer.id,
        }
      });

      // Select random products for this store
      const numProducts = Math.floor(Math.random() * 3) + 1; // 1 to 3 products
      const selectedProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, numProducts);

      for (const product of selectedProducts) {
        const qtyBox = Math.floor(Math.random() * 50) + 10;
        const boxPrice = product.cartonPrice ? Number(product.cartonPrice) : (Math.floor(Math.random() * 500) + 500);
        const amount = qtyBox * boxPrice;

        await prisma.salesTargetItem.create({
          data: {
            salesTargetStoreId: store.id,
            productId: product.id,
            pricePerBox: boxPrice,
            qtyPerBox: qtyBox,
            targetAmount: amount
          }
        });
      }
    }

    // Add History
    await prisma.salesTargetHistory.create({
      data: {
        salesTargetId: newTarget.id,
        changeType: 'CREATED',
        changedById: user.id,
        changeSummary: `Mock seed created target for ${customers.length} stores.`,
        snapshotAfter: { status: "MOCK_SEED_SUCCESS", itemsCount: customers.length }
      }
    });
  }

  console.log('✅ Mock data generation completed successfully!');
  console.log('================================================');
  console.log('You can now check the new Sales Target data on UI.');
}

main()
  .catch(e => {
    console.error('❌ Error generating mock data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
