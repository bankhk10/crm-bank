import "dotenv/config";
import { PrismaClient, SaleStatus, PaymentTerm } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Start seeding sales...");

  // ดึงข้อมูลพื้นฐานที่ต้องใช้เชื่อมความสัมพันธ์
  const customer = await prisma.customer.findFirst({
    where: { status: "ACTIVE" },
  });
  const employee = await prisma.employee.findFirst({
    where: { status: "ACTIVE" },
  });
  const product = await prisma.product.findFirst({
    where: { status: "ACTIVE" },
  });
  const shippingCompany = await prisma.shippingCompany.findFirst({
    where: { status: "ACTIVE" },
  });

  // หายูสเซอร์ที่เป็นเซลล์ หรือ แอดมิน มาเป็น createdById
  const creator = await prisma.user.findFirst();

  if (!customer || !employee || !product || !creator) {
    console.error(
      "❌ กรุณารันคำสั่ง Seed ของ Customer, Employee, Product และ ตรวจสอบว่ามี User ในระบบก่อนสร้างรายการขาย",
    );
    process.exit(1);
  }

  // วันเวลา
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(now.getDate() + 30);
  const deliveryDate = new Date();
  deliveryDate.setDate(now.getDate() + 3);

  const saleNumberMock = `SO-DEV-${now.getTime().toString().slice(-6)}`;

  // สร้างใบสั่งขายจำนวน 1 รายการ และผูกครบทุก Table รอบข้าง
  const sale = await prisma.sale.create({
    data: {
      saleNumber: saleNumberMock,
      customerId: customer.id,
      employeeId: employee.id,
      status: SaleStatus.APPROVED, // สมมติว่าใบนี้อนุมัติแล้ว
      paymentTerm: PaymentTerm.CREDIT_90,

      // Credit
      creditDays: 90,
      creditDueDate: nextMonth,
      usePromotionalCredit: true,
      promotionalCreditUsed: 500.0,

      // Dates
      saleDate: now,
      requestedDeliveryDate: deliveryDate,
      deliveryDate: deliveryDate,
      actualDeliveryDate: null,
      deliveryUpdateCount: 0,
      maxDeliveryUpdates: 3,
      isDeliveryLocked: true,
      orderExpiryDate: nextMonth,
      lastDeliveryUpdate: now,

      // Delivery
      deliveryMethod: "SHIPPING_COMPANY",
      shippingCompanyId: shippingCompany?.id, // ถ้ามีก็ผูกขนส่ง
      useCustomShipping: true,

      // Amounts
      subtotalAmount: 4000.0,
      shippingCost: 350.0,
      otherCosts: 150.0,
      otherCostsDescription: "ค่ากล่องโฟมพิเศษ",
      totalAmount: 4500.0,

      // Reference & Notes
      saleOrderRef: "PO-CUST-9998",
      notes: "ลูกค้าขอของแถมเป็นปฏิทินด้วย",
      paymentDate: null,
      paymentNotes: "รอชำระหลังรับบิล",
      deliveryNotes: "ระวังแตก ให้วางลังตั้งขึ้นเสมอ",

      // Audit & Approvals
      approvedById: creator.id,
      approvedAt: now,
      createdById: creator.id,

      // ความสัมพันธ์ (Relations)
      items: {
        create: [
          {
            productId: product.id,
            // Snapshot ของสินค้าขณะขาย
            productCode: product.productCode,
            name: product.name,
            commonName: product.commonName,
            unit: product.unit,
            productGroup: product.productGroup,
            brand: product.brand,
            packageSize: product.packageSize,
            packageSizePerBox: product.packageSizePerBox,
            totalPackageSizePerBox: product.totalPackageSizePerBox,
            price: product.price,
            cartonPrice: product.cartonPrice,
            promotionBudget: product.promotionBudget,
            pointPerUnit: product.pointPerUnit,

            quantity: 10,
            unitPrice: 400.0,
            originalPrice: 400.0,
            priceModified: false,
            totalPrice: 4000.0,
            stockAtSale: 100, // สมมติว่ามีใน Stock 100 ชิ้น
          },
        ],
      },
      saleAddress: {
        create: {
          // ข้อมูลที่อยู่วางบิล (Billing)
          billing_address_line: customer.billingAddressLine || "123 ทางหลัก",
          billing_province: customer.billingProvince || "กรุงเทพมหานคร",
          billing_district: customer.billingDistrict || "เขตดินแดง",
          billing_subdistrict: customer.billingSubdistrict || "ดินแดง",
          billing_postal_code: customer.billingPostalCode || "10400",
          billing_note: "ติดต่อคุณสมศรี ฝ่ายบัญชี",

          // ข้อมูลที่อยู่จัดส่ง (Shipping)
          shipping_address_line: customer.shippingAddressLine || "99/9 ซอยลึก",
          shipping_province: customer.shippingProvince || "ปทุมธานี",
          shipping_district: customer.shippingDistrict || "ธัญบุรี",
          shipping_subdistrict: customer.shippingSubdistrict || "รังสิต",
          shipping_postal_code: customer.shippingPostalCode || "12110",
          shipping_note: "จุดรับของอยู่ด้านหลังโรงงาน",

          // ข้อมูลผู้ส่ง/บริษัทเรา (Sender)
          sender_name: "บริษัท CRM-Bank สำนักงานใหญ่",
          sender_phone: "02-123-4567",
          sender_line: "ชั้น 5 อาคารบางยี่ขัน",
          sender_province: "กรุงเทพมหานคร",
          sender_postal_code: "10700",
        },
      },
      statusHistory: {
        create: [
          {
            status: SaleStatus.PENDING,
            notes: "สร้างเอกสารเข้าระบบ",
            changedById: creator.id,
            changedAt: new Date(now.getTime() - 60000), // ก่อนหน้านี้ 1 นาที
          },
          {
            status: SaleStatus.APPROVED,
            notes: "หัวหน้าฝ่ายอนุมัติเอกสารเรียบร้อย",
            changedById: creator.id,
            changedAt: now,
          },
        ],
      },
      // หมายเหตุ: DailySalesSummary มักถูกสร้างตอนปิดวัน หรือสร้างจาก Background job/Application layer
      // และ EmployeePointHistory มักจะ trigger ตอนได้แต้มจริง เลยละไว้เพื่อให้โค้ดไม่ซับซ้อนเกินไป
    },
  });

  console.log(
    `✅ Created Sale Order: ${sale.saleNumber} (Total: ${sale.totalAmount} THB)`,
  );
  console.log("🎉 Seeding sales finished.");
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
