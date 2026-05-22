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
  console.log("⏳ Starting mock data generation for Last Year Sales (2025)...");

  // 1. Get Employee and Customer
  const salesEmployees = await prisma.employee.findMany({
    where: {
      OR: [
        { positionTitle: { contains: "ขาย" } },
        { position: { name: { contains: "ขาย" } } },
        { departmentName: { contains: "ขาย" } },
        { department: { name: { contains: "ขาย" } } }
      ]
    },
    include: { user: true }
  });
  if (salesEmployees.length === 0) throw new Error("No sales employees found in DB.");

  const dealerCustomers = await prisma.customer.findMany({
    where: { customerType: "DEALER" },
    include: { addresses: true, contacts: true }
  });
  if (dealerCustomers.length === 0) throw new Error("No dealer customers found in DB.");

  const fallbackUser = await prisma.user.findFirst();
  if (!fallbackUser) throw new Error("No user found in DB.");

  const products = await prisma.product.findMany({
    take: 1, // Focus on 1 product to easily control exact total amount per month
    include: { category: true, tradeNameGroup: true, productGroup: true, stockLots: true }
  });
  if (products.length === 0) throw new Error("No products found in DB.");

  const pickupCompany = await prisma.company.findFirst();
  const shippingCompany = await prisma.shippingCompany.findFirst();

  const targetYear = 2025; // ปีที่แล้ว 2568

  const monthTargets = [
    500123, // ม.ค.
    678412, // ก.พ.
    236548, // มี.ค.
  ];

  for (let month = 0; month < 12; month++) {
    let targetAmount = 0;
    if (month < 3) {
      targetAmount = monthTargets[month];
    } else {
      targetAmount = 100000 + Math.floor(Math.random() * 400000); // เดือนอื่นๆ ให้สุ่มข้อมูล
    }

    console.log(`📅 Generating Sale for Year ${targetYear}, Month ${month + 1} | Total Amount: ${targetAmount}`);

    // หมุนวนใช้พนักงานและลูกค้าไปเรื่อยๆ ตามเดือน
    const employee = salesEmployees[month % salesEmployees.length];
    const customer = dealerCustomers[month % dealerCustomers.length];
    const user = employee.user || fallbackUser;
    
    // ตั้งวันที่เป็นวันที่ 15 ของทุกเดือนในปี 2025
    const saleDate = new Date(targetYear, month, 15, 10, 0, 0);

    // 2. สร้างบิลขาย 1 บิลที่มียอดรวมเท่ากับ targetAmount ของเดือนนั้นๆ เป๊ะๆ
    const sale = await prisma.sale.create({
      data: {
        saleNumber: `SALE-OLD-${targetYear}-${(month+1).toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
        customerId: customer.id,
        employeeId: employee.id,
        status: SaleStatus.COMPLETED,
        paymentTerm: PaymentTerm.CREDIT_90,
        
        creditDays: 90,
        creditDueDate: new Date(saleDate.getTime() + 90 * 24 * 60 * 60 * 1000),
        usePromotionalCredit: true,
        promotionalCreditUsed: 1000,

        saleDate: saleDate,
        requestedDeliveryDate: new Date(saleDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(saleDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        actualDeliveryDate: new Date(saleDate.getTime() + 4 * 24 * 60 * 60 * 1000),
        deliveryUpdateCount: 1,
        maxDeliveryUpdates: 3,
        isDeliveryLocked: true,
        orderExpiryDate: new Date(saleDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        lastDeliveryUpdate: saleDate,
        deliveryMethod: "SALES_DELIVERY",
        pickupCompanyId: pickupCompany?.id,
        shippingCompanyId: shippingCompany?.id,

        useCustomShipping: true,
        selectedAddressId: customer.addresses?.[0]?.id,

        subtotalAmount: targetAmount,
        shippingCost: 0,
        otherCosts: 0,
        otherCostsDescription: null,
        totalAmount: targetAmount,

        saleOrderRef: `PO-OLD-${targetYear}-${(month+1).toString().padStart(2, '0')}`,
        notes: `Seeded Old Data: Year ${targetYear} Month ${month+1}`,
        paymentDate: new Date(saleDate.getTime() + 90 * 24 * 60 * 60 * 1000),
        paymentNotes: "ชำระเงินเรียบร้อย (ประวัติเก่า)",
        deliveryNotes: "จัดส่งเรียบร้อย",

        approvedById: user.id,
        approvedAt: saleDate,
        rejectionReason: null,
        rejectedAt: null,

        preparedBySignatureDate: saleDate,
        preparedBySignatureImage: "signature-prep.png",
        checkedBySignatureDate: saleDate,
        checkedBySignatureImage: "signature-check.png",
        approvedBySignatureDate: saleDate,
        approvedBySignatureImage: "signature-appr.png",

        createdById: user.id,

        saleAddress: {
          create: {
            companyAddressId: pickupCompany?.id,
            billingCustomerAddressId: customer.addresses?.[0]?.id,
            shippingCustomerAddressId: customer.addresses?.[0]?.id,
            pickupCompanyAddressId: pickupCompany?.id,
            shippingCompanyAddressId: shippingCompany?.id,

            company_name: "บริษัท เลเกซี่ จำกัด",
            company_phone: "020000000",
            address_line: "123 ถ.สุขุมวิท",
            address_province: "กรุงเทพมหานคร",
            address_district: "ปทุมวัน",
            address_subdistrict: "สีลม",
            address_code: "10330",
            company_note: "สาขาเดิม",

            billing_address_line: "123 เก่า",
            billing_province: "กรุงเทพมหานคร",
            billing_district: "เขตบางรัก",
            billing_subdistrict: "บางรัก",
            billing_postal_code: "10500",
            billing_note: "-",

            shipping_address_line: "123 เก่า",
            shipping_province: "กรุงเทพมหานคร",
            shipping_district: "เขตบางรัก",
            shipping_subdistrict: "บางรัก",
            shipping_postal_code: "10500",
            shipping_note: "-",
          }
        },
        statusHistory: {
          create: [
            {
              status: SaleStatus.COMPLETED,
              notes: "ประวัติการขายรายเดือน (อดีต)",
              changedById: user.id,
              changedAt: saleDate,
            }
          ]
        }
      }
    });

    const product = products[0];
    const qty = 1;
    const unitPrice = targetAmount;
    
    // ตั้งราคาของ Item นี้ให้ตรงกับ Target Amount ของบิล จะได้ยอดที่ต้องการพอดี
    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productId: product.id,
        productCode: product.productCode,
        name: product.name,
        commonName: product.commonName || "Common Name",
        unit: product.unit || "Box",
        productGroupId: product.productGroupId,
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
        originalPrice: Number(product.price) || 1000,
        priceModified: true, // ทำเครื่องหมายว่าแก้ไขราคา เพื่อการันตียอดขายที่ต้องการ
        totalPrice: targetAmount,
        stockAtSale: 100,
      }
    });
  }

  console.log("\n=================================================");
  console.log("✅ Seed Last Year Sales (2025) Completed Successfully!");
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
