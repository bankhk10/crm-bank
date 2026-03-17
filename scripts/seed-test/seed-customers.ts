import "dotenv/config";
import { PrismaClient, CustomerType, CustomerStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const customersToSeed = [
  {
    customerCode: "CUST-DL-001",
    customerType: CustomerType.DEALER,
    name: "บริษัท เอส.พี. การเกษตร จำกัด",
    prefix: "บริษัท",
    firstName: "เอส.พี. การเกษตร",
    lastName: "จำกัด",
    taxId: "0105560001234",
    phone: "0214569853",
    email: "sp.agri@example.com",
    addressLine: "100/1 ถนนมิตรภาพ",
    province: "นครราชสีมา",
    district: "เมืองนครราชสีมา",
    subdistrict: "ในเมือง",
    postalCode: "30000",
    region: "ภาคตะวันออกเฉียงเหนือ",
    status: CustomerStatus.ACTIVE,
    contactPerson: "คุณสมพงษ์",
    contactPhone: "0812365845",
    contactEmail: "sompong.sp@example.com",
    billingAddressLine: "100/1 ถนนมิตรภาพ",
    billingProvince: "นครราชสีมา",
    billingDistrict: "เมืองนครราชสีมา",
    billingSubdistrict: "ในเมือง",
    billingPostalCode: "30000",
    shippingAddressLine: "100/1 ถนนมิตรภาพ",
    shippingProvince: "นครราชสีมา",
    shippingDistrict: "เมืองนครราชสีมา",
    shippingSubdistrict: "ในเมือง",
    shippingPostalCode: "30000",
    relationshipScore: 85,
  },
  {
    customerCode: "CUST-DL-002",
    customerType: CustomerType.DEALER,
    name: "หจก. รวมชัยเกษตรไทย",
    prefix: "หจก.",
    firstName: "รวมชัยเกษตรไทย",
    lastName: "",
    taxId: "0203340005678",
    phone: "0214569745",
    email: "ruamchai@example.com",
    addressLine: "45/2 หมู่ 3",
    province: "สุพรรณบุรี",
    district: "ศรีประจันต์",
    subdistrict: "ศรีประจันต์",
    postalCode: "72140",
    region: "ภาคกลาง",
    status: CustomerStatus.ACTIVE,
    contactPerson: "เจ๊ไหม",
    contactPhone: "0956549876",
    contactEmail: "mai.ruamchai@example.com",
    billingAddressLine: "45/2 หมู่ 3",
    billingProvince: "สุพรรณบุรี",
    billingDistrict: "ศรีประจันต์",
    billingSubdistrict: "ศรีประจันต์",
    billingPostalCode: "72140",
    shippingAddressLine: "45/2 หมู่ 3",
    shippingProvince: "สุพรรณบุรี",
    shippingDistrict: "ศรีประจันต์",
    shippingSubdistrict: "ศรีประจันต์",
    shippingPostalCode: "72140",
    relationshipScore: 90,
  }
];

async function main() {
  console.log("🚀 Start seeding customers (DEALER only)...");

  // 1. Fetch an existing employee to link as responsibleEmployee
  const employee = await prisma.employee.findFirst({
    where: { deletedAt: null }
  });
  const responsibleEmployeeId = employee?.id || null;

  if (!responsibleEmployeeId) {
    console.warn("⚠️ Warning: No active employee found. Customers will be seeded without a responsible employee.");
  } else {
    console.log(`👤 Using Employee: ${employee?.name} as the responsible employee for new customers.`);
  }

  // 2. Loop through customers to seed
  for (const c of customersToSeed) {
    const customer = await prisma.customer.upsert({
      where: { customerCode: c.customerCode },
      update: {
        ...c,
        responsibleEmployeeId,
      },
      create: {
        ...c,
        responsibleEmployeeId,
      },
    });

    console.log(`✅ Upserted Customer: ${customer.name} (Code: ${customer.customerCode}, Type: ${customer.customerType})`);
  }

  console.log("🎉 Seeding customers finished successfully.");
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
