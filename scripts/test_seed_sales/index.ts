import { config } from "dotenv";
config();
import { PrismaClient, SaleStatus, PaymentTerm } from "@prisma/client";
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
  console.log("⏳ Starting mock data generation for Sales (Full fields) using DB data...");

  // 1. Get real references from DB
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found in DB. Please seed users first.");

  const employee = await prisma.employee.findFirst({ where: { userId: user.id } }) || await prisma.employee.findFirst();
  if (!employee) throw new Error("No employee found in DB. Please seed employees first.");

  const customer = await prisma.customer.findFirst({
    include: {
      addresses: true,
      contacts: true
    }
  });
  if (!customer) throw new Error("No customer found in DB. Please seed customers first.");

  const products = await prisma.product.findMany({
    take: 3,
    include: {
      category: true,
      tradeNameGroup: true,
      productGroup: true,
      stockLots: true
    }
  });
  if (products.length === 0) throw new Error("No products found in DB. Please seed products first.");

  const pickupCompany = await prisma.company.findFirst();
  const shippingCompany = await prisma.shippingCompany.findFirst();

  const now = new Date();

  // 2. Create Sale with completely full fields
  const subtotalAmount = 50000;
  const shippingCost = 1000;
  const otherCosts = 500;
  const totalAmount = subtotalAmount + shippingCost + otherCosts;

  const saleDate = new Date();
  
  console.log("📝 Creating full-field Sale...");
  const sale = await prisma.sale.create({
    data: {
      saleNumber: `SALE-SEED-${Date.now().toString().slice(-6)}`,
      customerId: customer.id,
      employeeId: employee.id,
      status: SaleStatus.COMPLETED,
      paymentTerm: PaymentTerm.CREDIT_90,
      
      creditDays: 90,
      creditDueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      usePromotionalCredit: true,
      promotionalCreditUsed: 10000,

      saleDate: saleDate,
      requestedDeliveryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      actualDeliveryDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      deliveryUpdateCount: 1,
      maxDeliveryUpdates: 3,
      isDeliveryLocked: true,
      orderExpiryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      lastDeliveryUpdate: now,
      deliveryMethod: "SALES_DELIVERY",
      pickupCompanyId: pickupCompany?.id,
      shippingCompanyId: shippingCompany?.id,

      useCustomShipping: true,
      selectedAddressId: customer.addresses?.[0]?.id,

      subtotalAmount,
      shippingCost,
      otherCosts,
      otherCostsDescription: "ค่าธรรมเนียมการจัดการพิเศษ",
      totalAmount,

      saleOrderRef: `PO-REF-${Date.now().toString().slice(-6)}`,
      notes: "Internal note: seeded data (Full Fields)",
      paymentDate: now,
      paymentNotes: "โอนเงินผ่านระบบธนาคารเรียบร้อย",
      deliveryNotes: "ส่งสินค้าที่โกดังด้านหลัง",

      approvedById: user.id,
      approvedAt: now,
      rejectionReason: null,
      rejectedAt: null,

      preparedBySignatureDate: now,
      preparedBySignatureImage: "signature-prep.png",
      checkedBySignatureDate: now,
      checkedBySignatureImage: "signature-check.png",
      approvedBySignatureDate: now,
      approvedBySignatureImage: "signature-appr.png",

      createdById: user.id,

      saleAddress: {
        create: {
          companyAddressId: pickupCompany?.id,
          billingCustomerAddressId: customer.addresses?.[0]?.id,
          shippingCustomerAddressId: customer.addresses?.[0]?.id,
          pickupCompanyAddressId: pickupCompany?.id,
          shippingCompanyAddressId: shippingCompany?.id,

          company_name: pickupCompany?.name || "บริษัทหลักจำกัด",
          company_phone: pickupCompany?.phone || "020000000",
          address_line: pickupCompany?.addressLine || "เลขที่ 1 หมู่ 1",
          address_province: pickupCompany?.province || "กรุงเทพมหานคร",
          address_district: pickupCompany?.district || "พญาไท",
          address_subdistrict: pickupCompany?.subdistrict || "สามเสนใน",
          address_code: pickupCompany?.postalCode || "10400",
          company_note: "สำนักงานใหญ่",

          billing_address_line: customer.billingAddressLine || "1 Bill St",
          billing_province: customer.billingProvince || "กรุงเทพมหานคร",
          billing_district: customer.billingDistrict || "เขตบางรัก",
          billing_subdistrict: customer.billingSubdistrict || "สีลม",
          billing_postal_code: customer.billingPostalCode || "10500",
          billing_note: "ตึกส่วนหน้า",

          shipping_address_line: customer.shippingAddressLine || "1 Ship St",
          shipping_province: customer.shippingProvince || "กรุงเทพมหานคร",
          shipping_district: customer.shippingDistrict || "บางรัก",
          shipping_subdistrict: customer.shippingSubdistrict || "สีลม",
          shipping_postal_code: customer.shippingPostalCode || "10500",
          shipping_note: "ประตู 2 ด้านซ้าย",

          receiving_name: "ชื่อผู้รับสินค้า",
          receiving_phone: "0801112222",
          receiving_address_line: "1 Rec St",
          receiving_province: "กรุงเทพมหานคร",
          receiving_district: "ดอนเมือง",
          receiving_subdistrict: "สีกัน",
          receiving_postal_code: "10210",
          receiving_note: "ติดต่อยามก่อนเข้า",

          sender_name: "ชื่อผู้ส่งสินค้า",
          sender_phone: "0803334444",
          sender_line: "1 Send St",
          sender_province: "กรุงเทพมหานคร",
          sender_district: "วังทองหลาง",
          sender_subdistrict: "พลับพลา",
          sender_postal_code: "10310",
          sender_note: "โทรเช็คก่อนเข้ารับสินค้า",
        }
      },
      statusHistory: {
        create: [
          {
            status: SaleStatus.PENDING,
            notes: "สร้างรายการขาย",
            changedById: user.id,
            changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
          },
          {
            status: SaleStatus.APPROVED,
            notes: "อนุมัติรายการขายแล้วโดยหัวหน้าทีม",
            changedById: user.id,
            changedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
          },
          {
            status: SaleStatus.COMPLETED,
            notes: "ทำรายการเสร็จสิ้น",
            changedById: user.id,
            changedAt: now
          }
        ]
      }
    }
  });

  console.log(`✅ Sale created with ID: ${sale.id}`);

  // 3. Create SaleItems mapping to real products
  for (const product of products) {
    const qty = 10;
    const unitPrice = Number(product.price) || 1000;
    const itemStockLot = product.stockLots?.[0];
    
    console.log(`📝 Creating SaleItem for Product: ${product.name}`);
    
    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productId: product.id,

        // Snapshot details
        productCode: product.productCode,
        name: product.name,
        commonName: product.commonName || "Common Name",
        unit: product.unit || "Box",
        productGroup: product.productGroup?.name || "Product Group",
        brand: product.brand || "Mock Brand",
        packageSize: product.packageSize || 1,
        packageSizeUnit: product.packageSizeUnit || "L",
        packageSizePerBox: product.packageSizePerBox || 10,
        totalPackageSizePerBox: product.totalPackageSizePerBox || 10,
        price: product.price || 1000,
        cartonPrice: product.cartonPrice || 10000,
        promotionBudget: product.promotionBudget || 100,
        pointPerUnit: product.pointPerUnit || 10,
        productChain: "Chain Details",

        quantity: qty,
        unitPrice: unitPrice,
        originalPrice: unitPrice,
        priceModified: false,
        totalPrice: qty * unitPrice,
        stockAtSale: product.stockLots?.reduce((sum, lot) => sum + lot.quantity, 0) || 100,

        lotAllocations: itemStockLot ? {
          create: [{
            lotId: itemStockLot.id,
            quantity: qty
          }]
        } : undefined
      }
    });

    // Seed DailySalesSummary to make sure this sale counts towards real analytics
    console.log(`📊 Updating DailySalesSummary for Product: ${product.name}`);
    const normalizedDate = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
    
    await prisma.dailySalesSummary.upsert({
      where: {
        date_customerId_employeeId_productId: {
          date: normalizedDate,
          customerId: customer.id,
          employeeId: employee.id,
          productId: product.id,
        }
      },
      update: {
        quantity: { increment: qty },
        totalAmount: { increment: qty * unitPrice },
        orderCount: { increment: 1 },
        totalVolumeLiters: { increment: qty * Number(product.packageSize || 1) }
      },
      create: {
        date: normalizedDate,
        year: saleDate.getFullYear(),
        month: saleDate.getMonth() + 1,
        customerId: customer.id,
        employeeId: employee.id,
        productId: product.id,
        brand: product.brand,
        tradeNameGroupId: product.tradeNameGroup?.id,
        productGroupId: product.productGroup?.id,
        quantity: qty,
        totalAmount: qty * unitPrice,
        orderCount: 1,
        totalVolumeLiters: qty * Number(product.packageSize || 1)
      }
    });
  }

  // 4. Seed EmployeePointHistory
  console.log("🏆 Seeding EmployeePointHistory...");
  const saleItems = await prisma.saleItem.findMany({ where: { saleId: sale.id }});
  
  for (const item of saleItems) {
    if (item.pointPerUnit) {
      await prisma.employeePointHistory.create({
        data: {
          employeeId: employee.id,
          saleId: sale.id,
          saleItemId: item.id,
          productId: item.productId,
          quantity: item.quantity,
          pointPerUnit: item.pointPerUnit,
          totalPoints: item.quantity * item.pointPerUnit,
        }
      });
      
      // Update EmployeePointSummary
      await prisma.employeePointSummary.upsert({
        where: { employeeId: employee.id },
        update: { totalPoints: { increment: item.quantity * item.pointPerUnit } },
        create: { employeeId: employee.id, totalPoints: item.quantity * item.pointPerUnit }
      });
    }
  }

  console.log("=================================================");
  console.log("✅ Mock Full Data Generation Completed Successfully!");
  console.log(`📌 Customer ID: ${customer.id}`);
  console.log(`📌 Employee ID: ${employee.id}`);
  console.log(`📌 User ID: ${user.id}`);
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
