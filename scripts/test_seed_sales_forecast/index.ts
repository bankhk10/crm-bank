import { config } from "dotenv";
config();
import { PrismaClient, SalesTargetChangeType } from "@prisma/client";
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
  console.log("⏳ Starting mock data generation for Sales Forecasts/Targets using DB data...");

  // 1. Get User for createdById
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found in DB. Please seed users first.");

  // 2. Get Sales Employees
  const salesEmployees = await prisma.employee.findMany({
    where: {
      OR: [
        { positionTitle: { contains: "ขาย" } },
        { position: { name: { contains: "ขาย" } } },
        { departmentName: { contains: "ขาย" } },
        { department: { name: { contains: "ขาย" } } }
      ]
    }
  });

  if (salesEmployees.length === 0) {
    throw new Error("No sales employees found in DB. Please make sure there are employees with 'ขาย' in their position or department.");
  }

  // 3. Get DEALER Customers
  const dealerCustomers = await prisma.customer.findMany({
    where: {
      customerType: "DEALER"
    }
  });

  if (dealerCustomers.length === 0) {
    throw new Error("No dealer customers found in DB. Please seed customers first.");
  }

  // 4. Get Products and ABC Types
  const products = await prisma.product.findMany({
    take: 5,
    include: { productGroup: true }
  });

  if (products.length === 0) {
    throw new Error("No products found in DB. Please seed products first.");
  }

  const abcTypes = await prisma.productABCTypes.findMany();
  const regions = ["ภาคเหนือ", "ภาคอีสาน", "ภาคกลาง", "ภาคตะวันออก", "ภาคตะวันตก", "ภาคใต้"];
  
  const currentYear = new Date().getFullYear();

  for (let month = 1; month <= 12; month++) {
    console.log(`\n📅 Generating targets for Year ${currentYear}, Month ${month}...`);

    // สุ่มยอดรวมต่างๆ ไม่ให้เท่ากันทุกเดือน
    const randomMonthlyTarget = 3000000 + Math.floor(Math.random() * 3000000); // 3M to 6M
    
    // ==========================================
    // 1. Month Overall Target
    // ==========================================
    await prisma.monthlySalesTarget.upsert({
      where: {
        year_month: { year: currentYear, month: month }
      },
      update: {
        targetAmount: randomMonthlyTarget,
        notes: "เป้าหมายรวมอัปเดตใหม่"
      },
      create: {
        year: currentYear,
        month: month,
        targetAmount: randomMonthlyTarget,
        notes: "เป้าหมายรวมประจำเดือน",
        createdById: user.id
      }
    });

    // ==========================================
    // 2. Region Sales Targets
    // ==========================================
    for (const region of regions) {
      const randomRegionTarget = 500000 + Math.floor(Math.random() * 500000);
      await prisma.regionSalesTarget.upsert({
        where: {
          region_year_month: { region, year: currentYear, month }
        },
        update: {
          targetAmount: randomRegionTarget,
          notes: "ปรับเป้ายอดขายรายภาค"
        },
        create: {
          region,
          year: currentYear,
          month,
          targetAmount: randomRegionTarget,
          notes: `เป้าหมายยอดขายประจำเดือน ${month} ภูมิภาค ${region}`,
          createdById: user.id
        }
      });
    }

    // ==========================================
    // 3. Product Group (ABC Type) Sales Targets
    // ==========================================
    for (const abc of abcTypes) {
      const randomGroupTarget = 300000 + Math.floor(Math.random() * 300000);
      await prisma.productGroupSalesTarget.upsert({
        where: {
          productGroup_year_month: { productGroup: abc.id, year: currentYear, month }
        },
        update: {
          targetAmount: randomGroupTarget
        },
        create: {
          productGroup: abc.id,
          year: currentYear,
          month,
          targetAmount: randomGroupTarget,
          notes: `เป้าหมายยอดขายประเภท (ABC Code) ${abc.name}`,
          createdById: user.id
        }
      });
    }

    // ==========================================
    // 4. Product Sales Targets
    // ==========================================
    for (const product of products) {
      const randomProductTarget = 50000 + Math.floor(Math.random() * 100000);
      await prisma.productSalesTarget.upsert({
        where: {
          productId_year_month: { productId: product.id, year: currentYear, month }
        },
        update: {
          targetAmount: randomProductTarget
        },
        create: {
          productId: product.id,
          year: currentYear,
          month,
          targetAmount: randomProductTarget,
          notes: `เป้าหมายยอดขายสินค้า ${product.name}`,
          createdById: user.id
        }
      });
    }

    // ==========================================
    // 5. Detailed Sales Targets (By Employee & Store)
    // ==========================================
    for (let empIndex = 0; empIndex < salesEmployees.length; empIndex++) {
      const employee = salesEmployees[empIndex];

      // Assign 2 dealers cyclically to this employee for the target
      const assignedCustomers = [
        dealerCustomers[(empIndex * 2) % dealerCustomers.length],
        dealerCustomers[((empIndex * 2) + 1) % dealerCustomers.length]
      ];

      // Use upsert to avoid Unique constraint conflicts
      let detailedTarget = await prisma.salesTarget.findUnique({
        where: {
          year_month_employeeId: {
            year: currentYear,
            month: month,
            employeeId: employee.id
          }
        }
      });

      if (detailedTarget) {
        // Clear old stores to recreate them
        await prisma.salesTargetStore.deleteMany({
          where: { salesTargetId: detailedTarget.id }
        });
      }

      detailedTarget = await prisma.salesTarget.upsert({
        where: {
          year_month_employeeId: {
            year: currentYear,
            month,
            employeeId: employee.id
          }
        },
        update: {
          createdById: user.id
        },
        create: {
          year: currentYear,
          month,
          employeeId: employee.id,
          createdById: user.id
        }
      });

      // Assign Stores and Items
      const snapshotStores = [];
      let summaryText = "";

      for (const customer of assignedCustomers) {
        // Skip duplicate customer if dealer list is too small
        const storeExists = await prisma.salesTargetStore.findUnique({
          where: {
            salesTargetId_customerId: {
              salesTargetId: detailedTarget.id,
              customerId: customer.id
            }
          }
        });

        if (storeExists) continue;

        const store = await prisma.salesTargetStore.create({
          data: {
            salesTargetId: detailedTarget.id,
            customerId: customer.id
          }
        });

        const storeItemsSnapshot = [];
        let storeTotal = 0;

        // Assign 2 products per store
        const itemsToCreate = [];
        for (let pIndex = 0; pIndex < Math.min(2, products.length); pIndex++) {
          const product = products[pIndex];
          const qtyPerBox = Number(product.packageSizePerBox) || 12;
          const pricePerBox = product.cartonPrice ? Number(product.cartonPrice) : (Number(product.price) || 100) * qtyPerBox;
          const targetBoxes = Math.floor(Math.random() * 15) + 5; // สุ่ม 5-19 ลัง
          const targetAmount = pricePerBox * targetBoxes;

          itemsToCreate.push({
            salesTargetStoreId: store.id,
            productId: product.id,
            pricePerBox: pricePerBox,
            qtyPerBox: qtyPerBox,
            targetAmount: targetAmount
          });

          storeItemsSnapshot.push({
            productId: product.id,
            productName: product.name,
            qtyPerBox,
            pricePerBox,
            targetAmount
          });

          storeTotal += targetAmount;
        }

        await prisma.salesTargetItem.createMany({
          data: itemsToCreate
        });

        snapshotStores.push({
          customerId: customer.id,
          customerName: customer.name,
          storeTotal,
          items: storeItemsSnapshot
        });
        
        summaryText += `${customer.name} (เป้า ${storeTotal}), `;
      }

      // Add History Record
      const snapshotContext = {
        employeeName: employee.name,
        targetMonth: `${currentYear}-${month.toString().padStart(2, '0')}`,
        stores: snapshotStores
      };

      await prisma.salesTargetHistory.create({
        data: {
          salesTargetId: detailedTarget.id,
          changeType: SalesTargetChangeType.CREATED,
          changedById: user.id,
          snapshotAfter: snapshotContext, // Save snapshot in JSON
          changeSummary: `ตั้งเป้าหมาย 2 ร้านค้า ยอดรวมจัดส่งสินค้าล่วงหน้า : ${summaryText}`
        }
      });
    }
  }

  console.log("\n=================================================");
  console.log("✅ Mock Full Data Generation for 'Sales Forecast / Targets' Completed Successfully!");
  console.log("=================================================");
}

main()
  .catch(e => {
    console.error("❌ Error generating mock data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
