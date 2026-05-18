import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Start seeding sales targets...");

  // ค้นหาข้อมูลสำหรับสร้างเป้าหมาย (ควรรัน seed ของ พนักงาน, ลูกค้า, สินค้า ก่อน)
  const employee = await prisma.employee.findFirst({
    where: { status: "ACTIVE" },
  });
  const customer1 = await prisma.customer.findFirst({ skip: 0 });
  const customer2 = (await prisma.customer.findFirst({ skip: 1 })) || customer1;
  const product1 = await prisma.product.findFirst({ skip: 0 });
  const product2 = (await prisma.product.findFirst({ skip: 1 })) || product1;

  if (!employee || !customer1 || !product1) {
    console.error(
      "❌ หาข้อมูลพื้นฐานไม่พบ! กรุณารันคำสั่ง seed ของ Employees, Customers, Products ก่อนหน้านี้",
    );
    process.exit(1);
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  // เคลียร์เป้าหมายของพนักงานคนนี้ของเดือน/ปี ปัจจุบันทิ้งไปก่อนเพื่อไม่ให้เกิดเป้าหมายของร้าน/สินค้าซ้ำซ้อน
  await prisma.salesTarget.deleteMany({
    where: {
      year: currentYear,
      month: currentMonth,
      employeeId: employee.id,
    },
  });

  // สร้างเป้าหมายการขาย 1 ตัว พร้อมเป้าหมายแยกย่อยตามร้านค้า (SalesTargetStore) และสินค้ารายร้านค้า (SalesTargetItem)
  const target = await prisma.salesTarget.create({
    data: {
      year: currentYear,
      month: currentMonth,
      employeeId: employee.id,
      region: customer1.region,
      createdById: employee.id,
      stores: {
        create: [
          {
            customerId: customer1.id,
            items: {
              create: [
                {
                  productId: product1.id,
                  pricePerBox: 4000.0,
                  qtyPerBox: 50,
                  targetAmount: 200000.0, // ราคา * ยกกล่อง
                },
                // ถ้าระบบเจอสินค้าชนิดที่ 2 จะช่วยสร้าง Target ให้อีกชิ้นด้วย
                ...(product2 && product2.id !== product1.id
                  ? [
                      {
                        productId: product2.id,
                        pricePerBox: 7000.0,
                        qtyPerBox: 30,
                        targetAmount: 210000.0,
                      },
                    ]
                  : []),
              ],
            },
          },
          // ถ้าระบบเจอลูกค้ารายที่ 2 ก็จำลองข้อมูลเป้าหมายให้อีก 1 รายการ
          ...(customer2 && customer2.id !== customer1.id
            ? [
                {
                  customerId: customer2.id,
                  items: {
                    create: [
                      {
                        productId: product1.id,
                        pricePerBox: 4000.0,
                        qtyPerBox: 20,
                        targetAmount: 80000.0,
                      },
                    ],
                  },
                },
              ]
            : []),
        ],
      },
    },
  });

  console.log(
    `✅ Created Sales Target for Employee: ${employee.name} (Year: ${currentYear}, Month: ${currentMonth})`,
  );
  console.log(`-> Target ID: ${target.id}`);
  console.log("🎉 Seeding sales targets finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
