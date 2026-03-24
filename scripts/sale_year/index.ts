import { config } from "dotenv";
config(); // loads .env by default
import { PrismaClient, SaleStatus, PaymentTerm, CustomerType } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be defined in .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const regions = [
  { name: 'ภาคเหนือ', province: 'เชียงใหม่' },
  { name: 'ภาคตะวันออกเฉียงเหนือ', province: 'ขอนแก่น' },
  { name: 'ภาคตะวันออก', province: 'ชลบุรี' },
  { name: 'ภาคตะวันตก', province: 'ราชบุรี' },
  { name: 'ภาคกลาง', province: 'กรุงเทพมหานคร' },
  { name: 'ภาคใต้', province: 'ภูเก็ต' },
];

async function main() {
  console.log('⏳ Starting mock data generation for Region Sales (12 months)...');

  // 1. Get an existing User & Employee
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found in DB. Please seed the database first.');

  let employee = await prisma.employee.findFirst({ where: { userId: user.id } });
  if (!employee) {
    employee = await prisma.employee.findFirst();
  }
  if (!employee) throw new Error('No employee found in DB.');

  const currentYear = new Date().getFullYear();

  // 2. Create target data & customers & sales setup
  for (const r of regions) {
    console.log(`📍 Processing ${r.name}...`);

    // Create a dummy customer for this region
    const customerCode = `TEST-REGION-${r.province}`;
    let customer = await prisma.customer.findUnique({ where: { customerCode } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          customerCode,
          name: `ร้านทดสอบ ${r.name}`,
          customerType: CustomerType.DEALER,
          province: r.province,
          region: r.name,
          phone: '0800000000',
        }
      });
    } else {
      // Ensure province is correct if already exists
      await prisma.customer.update({
        where: { id: customer.id },
        data: { province: r.province, region: r.name }
      });
    }

    // Generate 12 months data
    for (let month = 1; month <= 12; month++) {
      // 1. Create RegionSalesTarget
      const targetAmount = Math.floor(Math.random() * 500000) + 100000; // 100k - 600k
      
      const existingTarget = await prisma.regionSalesTarget.findFirst({
        where: {
          region: r.name,
          year: currentYear,
          month: month
        }
      });

      if (existingTarget) {
        await prisma.regionSalesTarget.update({
          where: { id: existingTarget.id },
          data: { targetAmount }
        });
      } else {
        await prisma.regionSalesTarget.create({
          data: {
            region: r.name,
            year: currentYear,
            month: month,
            targetAmount,
            createdById: user.id,
          }
        });
      }

      // 2. Generate random sales data
      const saleDate1 = new Date(currentYear, month - 1, 10, 10, 0, 0); // Day 10
      const saleDate2 = new Date(currentYear, month - 1, 20, 14, 0, 0); // Day 20

      const invoiceAmount = Math.floor(Math.random() * 300000) + 50000; // 50k - 350k
      const salesNoteAmount = Math.floor(Math.random() * 200000) + 20000; // 20k - 220k

      // Mock COMPLETED sale (Invoice)
      await prisma.sale.create({
        data: {
          saleNumber: `TSALE-INV-${r.province}-${month}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
          customerId: customer.id,
          employeeId: employee.id,
          createdById: user.id,
          saleDate: saleDate1,
          status: SaleStatus.COMPLETED,
          paymentTerm: PaymentTerm.CASH_7,
          subtotalAmount: invoiceAmount,
          totalAmount: invoiceAmount,
        }
      });

      // Mock PENDING_APPROVAL sale (Sales Note)
      await prisma.sale.create({
        data: {
          saleNumber: `TSALE-NOTE-${r.province}-${month}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
          customerId: customer.id,
          employeeId: employee.id,
          createdById: user.id,
          saleDate: saleDate2,
          status: SaleStatus.PENDING_APPROVAL,
          paymentTerm: PaymentTerm.CREDIT_90,
          subtotalAmount: salesNoteAmount,
          totalAmount: salesNoteAmount,
        }
      });
    }
  }

  console.log('✅ Mock data generation completed successfully!');
  console.log('================================================');
  console.log('You can now test the Region Sales Dashboard for all 12 months.');
}

main()
  .catch(e => {
    console.error('❌ Error generating mock data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
