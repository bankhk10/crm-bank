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
  console.log("⏳ Starting mock data generation for Sales (DB Data, Multiple Employees & Dealers)...");

  // 1. Get Employees who are Sales Employees (พนักงานฝ่ายขาย)
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

  if (salesEmployees.length === 0) {
    throw new Error("No sales employees found in DB. Please make sure there are employees with 'ขาย' in their position or department.");
  }

  // 2. Get DEALER Customers (ลูกค้าตัวแทนจำหน่าย)
  const dealerCustomers = await prisma.customer.findMany({
    where: {
      customerType: "DEALER"
    },
    include: {
      addresses: true,
      contacts: true
    }
  });

  if (dealerCustomers.length === 0) {
    throw new Error("No dealer customers found in DB. Please seed customers first.");
  }

  // Fallback User (admin or system) just in case an employee doesn't have a linked user
  const fallbackUser = await prisma.user.findFirst();
  if (!fallbackUser) throw new Error("No user found in DB. Please seed users first.");

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

  const currentYear = new Date().getFullYear();

  // We pair Employees and Customers so that EVERY Sales Employee and EVERY Dealer Customer gets used at least once.
  const maxPairs = Math.max(salesEmployees.length, dealerCustomers.length);

  console.log(`📌 Found ${salesEmployees.length} Sales Employees and ${dealerCustomers.length} Dealer Customers.`);
  console.log(`📌 Generating ${maxPairs} target pairs for 12 months...`);

  for (let i = 0; i < maxPairs; i++) {
    const employee = salesEmployees[i % salesEmployees.length];
    const customer = dealerCustomers[i % dealerCustomers.length];
    const user = employee.user || fallbackUser;

    console.log(`\n=================================================`);
    console.log(`💼 Pair ${i + 1}/${maxPairs}: Emp '${employee.name}' <-> Cust '${customer.name}'`);
    console.log(`=================================================`);

    for (let month = 0; month < 12; month++) {
      console.log(`  📅 Generating data for Year ${currentYear}, Month ${month + 1}...`);
      
      // Generate 2 PENDING_APPROVAL and 1 COMPLETED 
      const salesToCreate = [
        SaleStatus.PENDING_APPROVAL,
        SaleStatus.PENDING_APPROVAL,
        SaleStatus.COMPLETED
      ];

      for (const [index, status] of salesToCreate.entries()) {
        const subtotalAmount = 50000 + (Math.random() * 10000);
        const shippingCost = 1000;
        const otherCosts = 500;
        const totalAmount = subtotalAmount + shippingCost + otherCosts;

        // Day 10, Day 15, Day 20
        const day = index === 0 ? 10 : index === 1 ? 15 : 20; 
        const saleDate = new Date(currentYear, month, day, 10, 0, 0);
        const now = saleDate;

        const sale = await prisma.sale.create({
          data: {
            saleNumber: `SALE-${currentYear}-${(month+1).toString().padStart(2, '0')}-${employee.id.slice(-4)}-${Date.now().toString().slice(-4)}-${index}`,
            customerId: customer.id,
            employeeId: employee.id,
            status: status,
            paymentTerm: PaymentTerm.CREDIT_90,
            
            creditDays: 90,
            creditDueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
            usePromotionalCredit: true,
            promotionalCreditUsed: 10000,

            saleDate: saleDate,
            requestedDeliveryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
            deliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            actualDeliveryDate: status === SaleStatus.COMPLETED ? new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000) : null,
            deliveryUpdateCount: 1,
            maxDeliveryUpdates: 3,
            isDeliveryLocked: status === SaleStatus.COMPLETED,
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

            saleOrderRef: `PO-REF-${currentYear}-${(month+1).toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
            notes: `Internal note: seeded data (Month ${month + 1}, ${status}) by Sales Employee`,
            paymentDate: status === SaleStatus.COMPLETED ? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) : null,
            paymentNotes: status === SaleStatus.COMPLETED ? "โอนเงินผ่านระบบธนาคารเรียบร้อย" : null,
            deliveryNotes: "ส่งสินค้าที่โกดังด้านหลัง",

            approvedById: status === SaleStatus.COMPLETED ? user.id : null,
            approvedAt: status === SaleStatus.COMPLETED ? now : null,
            rejectionReason: null,
            rejectedAt: null,

            preparedBySignatureDate: now,
            preparedBySignatureImage: "signature-prep.png",
            checkedBySignatureDate: now,
            checkedBySignatureImage: "signature-check.png",
            approvedBySignatureDate: status === SaleStatus.COMPLETED ? now : null,
            approvedBySignatureImage: status === SaleStatus.COMPLETED ? "signature-appr.png" : null,

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
                ...(status === SaleStatus.COMPLETED ? [
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
                ] : [
                  {
                    status: SaleStatus.PENDING_APPROVAL,
                    notes: "ส่งเรื่องขออนุมัติ",
                    changedById: user.id,
                    changedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
                  }
                ])
              ]
            }
          }
        });

        // 3. Create SaleItems mapping to real products
        for (const product of products) {
          const qty = Math.floor(Math.random() * 20) + 5; // 5 to 24
          const unitPrice = Number(product.price) || 1000;
          const itemStockLot = product.stockLots?.[0];
          
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

        }

        // 4. Seed EmployeePointHistory
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
      }
    }
  }

  console.log("\n=================================================");
  console.log("✅ Mock Full Data Generation Completed Successfully!");
  console.log(`📌 Generated logic across ${salesEmployees.length} Sales Employees and ${dealerCustomers.length} Dealer Customers!`);
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
