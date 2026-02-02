import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { subYears, startOfMonth, endOfMonth, addDays } from "date-fns";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Setup Prisma Client with Pg Adapter
// @ts-ignore
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ============================================
// CONFIGURATION
// ============================================
const LAST_YEAR_SALES_COUNT = 20; // จำนวน Sales ที่จะสร้างสำหรับปีที่แล้ว
const MIN_AMOUNT = 50000;
const MAX_AMOUNT = 500000;

// ============================================
// HELPERS
// ============================================
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSaleNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TEST-${timestamp}-${random}`;
}

// ============================================
// MAIN FUNCTION
// ============================================
async function seedLastYearTestData() {
  console.log("🧪 Starting Last Year Test Data Seeding...");
  console.log(`📅 Current date: ${new Date().toLocaleDateString("th-TH")}`);

  const now = new Date();
  const lastYearNow = subYears(now, 1);
  const lastYearMonthStart = startOfMonth(lastYearNow);
  const lastYearMonthEnd = endOfMonth(lastYearNow);

  console.log(
    `📅 Last year same month: ${lastYearMonthStart.toLocaleDateString("th-TH")} - ${lastYearMonthEnd.toLocaleDateString("th-TH")}`
  );

  try {
    // 1. Get required data
    console.log("\n📦 Fetching required data...");

    // Get customers
    const customers = await prisma.customer.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      take: 20,
    });

    if (customers.length === 0) {
      throw new Error("No customers found. Please run seed first.");
    }
    console.log(`   Found ${customers.length} customers`);

    // Get employees
    const employees = await prisma.employee.findMany({
      where: { deletedAt: null },
      take: 10,
    });

    if (employees.length === 0) {
      throw new Error("No employees found. Please run seed first.");
    }
    console.log(`   Found ${employees.length} employees`);

    // Get products
    const products = await prisma.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      take: 20,
    });

    if (products.length === 0) {
      throw new Error("No products found. Please run seed first.");
    }
    console.log(`   Found ${products.length} products`);

    // Get a user for createdById
    const user = await prisma.user.findFirst({
      where: { deletedAt: null },
    });

    if (!user) {
      throw new Error("No user found. Please run seed first.");
    }
    console.log(`   Found user: ${user.name}`);

    // 2. Create last year's sales
    console.log(`\n🛒 Creating ${LAST_YEAR_SALES_COUNT} sales for last year...`);

    const salesStatuses = [
      "COMPLETED",
      "DELIVERED",
      "DELIVERY_COMPLETED",
      "PAID",
      "PENDING",
      "PENDING_APPROVAL",
      "APPROVED",
      "AWAITING_PAYMENT",
      "AWAITING_DELIVERY",
    ];

    let salesNoteCount = 0;
    let invoiceCount = 0;
    let totalSalesNoteAmount = 0;
    let totalInvoiceAmount = 0;

    for (let i = 0; i < LAST_YEAR_SALES_COUNT; i++) {
      const customer = getRandomElement(customers);
      const employee = getRandomElement(employees);
      const status = getRandomElement(salesStatuses);

      // Generate random date within last year same month
      const daysInMonth = lastYearMonthEnd.getDate();
      const randomDay = getRandomNumber(1, daysInMonth);
      const saleDate = new Date(lastYearMonthStart);
      saleDate.setDate(randomDay);

      // Generate items
      const itemCount = getRandomNumber(1, 5);
      const items: {
        product: typeof products[0];
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }[] = [];

      let subtotalAmount = 0;
      for (let j = 0; j < itemCount; j++) {
        const product = getRandomElement(products);
        const quantity = getRandomNumber(1, 100);
        const unitPrice = Number(product.price) || getRandomNumber(100, 5000);
        const totalPrice = quantity * unitPrice;

        items.push({ product, quantity, unitPrice, totalPrice });
        subtotalAmount += totalPrice;
      }

      const totalAmount = subtotalAmount;

      // Create sale
      const sale = await prisma.sale.create({
        data: {
          saleNumber: generateSaleNumber(),
          customerId: customer.id,
          employeeId: employee.id,
          status: status as any,
          paymentTerm: "CREDIT_90",
          saleDate,
          subtotalAmount,
          totalAmount,
          createdById: user.id,
          items: {
            create: items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              originalPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
      });

      // Track statistics
      const isSalesNote = [
        "PENDING",
        "PENDING_APPROVAL",
        "WAITING_FOR_CORRECTION",
        "APPROVED",
        "AWAITING_PAYMENT",
        "AWAITING_DELIVERY",
      ].includes(status);

      const isInvoice = [
        "PAID",
        "DELIVERED",
        "DELIVERY_COMPLETED",
        "COMPLETED",
      ].includes(status);

      if (isSalesNote) {
        salesNoteCount++;
        totalSalesNoteAmount += totalAmount;
      } else if (isInvoice) {
        invoiceCount++;
        totalInvoiceAmount += totalAmount;
      }

      console.log(
        `   ✓ Sale ${i + 1}/${LAST_YEAR_SALES_COUNT}: ${sale.saleNumber} - ${status} - ${totalAmount.toLocaleString()} THB`
      );
    }

    // 3. Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY: Last Year Test Data");
    console.log("=".repeat(60));
    console.log(`📅 Period: ${lastYearMonthStart.toLocaleDateString("th-TH")} - ${lastYearMonthEnd.toLocaleDateString("th-TH")}`);
    console.log(`\n📈 Sales Notes (ปีที่แล้ว):`);
    console.log(`   Count: ${salesNoteCount}`);
    console.log(`   Total: ${totalSalesNoteAmount.toLocaleString()} THB`);
    console.log(`\n📄 Invoices (ปีที่แล้ว):`);
    console.log(`   Count: ${invoiceCount}`);
    console.log(`   Total: ${totalInvoiceAmount.toLocaleString()} THB`);
    console.log(`\n💰 Grand Total: ${(totalSalesNoteAmount + totalInvoiceAmount).toLocaleString()} THB`);
    console.log("=".repeat(60));

    console.log("\n✅ Last year test data seeded successfully!");
    console.log("\n💡 TIP: Refresh the dashboard to see the new 'ปีที่แล้ว' bars in the charts.");

  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// CLEANUP FUNCTION
// ============================================
async function cleanupLastYearTestData() {
  console.log("🧹 Cleaning up last year test data...");

  try {
    const deleted = await prisma.sale.deleteMany({
      where: {
        saleNumber: { startsWith: "TEST-" },
      },
    });

    console.log(`   Deleted ${deleted.count} test sales`);
    console.log("✅ Cleanup completed!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// CLI
// ============================================
const args = process.argv.slice(2);

if (args.includes("--cleanup") || args.includes("-c")) {
  cleanupLastYearTestData();
} else {
  seedLastYearTestData();
}
