import { PrismaClient } from "@prisma/client";

const ACTIVITY_TYPES = [
  { code: "TYPE_1",  name: "เข้าพบร้านค้า / Key Farmer",                 shortName: "Visit",    sortOrder: 1,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_2",  name: "ติดตามผลการใช้สินค้า",                         shortName: "Followup", sortOrder: 2,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_3",  name: "เสนอขายสินค้า",                               shortName: "Sales",    sortOrder: 3,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_4",  name: "วางบิล / เก็บเงิน",                           shortName: "Collect",  sortOrder: 4,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_5",  name: "สำรวจตลาดของคู่แข่ง",                         shortName: "Survey",   sortOrder: 5,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_6",  name: "แก้ปัญหา / รับเรื่องร้องเรียน",               shortName: "Issue",    sortOrder: 6,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_7",  name: "ติดตามแปลงสาธิต / ทำแปลง",                   shortName: "Demo",     sortOrder: 7,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_8",  name: "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์", shortName: "Meeting",  sortOrder: 8,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_9",  name: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",           shortName: "Store",    sortOrder: 9,  hasActual: true,  requiresApproval: true },
  { code: "TYPE_10", name: "จัดงาน Field Day",                             shortName: "FieldDay", sortOrder: 10, hasActual: true,  requiresApproval: true },
  { code: "TYPE_11", name: "ตรวจเช็กสต็อกหน้าร้าน",                       shortName: "Stock",    sortOrder: 11, hasActual: true,  requiresApproval: true },
  { code: "TYPE_12", name: "ทัวร์",                                       shortName: "Tour",     sortOrder: 12, hasActual: false, requiresApproval: true },
];

export async function seedActivityTypes(prisma: PrismaClient) {
  console.log("Seeding ActivityTypes (12 types)...");
  for (const type of ACTIVITY_TYPES) {
    await prisma.activityType.upsert({
      where: { code: type.code },
      update: {
        name: type.name,
        shortName: type.shortName,
        sortOrder: type.sortOrder,
        hasActual: type.hasActual,
        requiresApproval: type.requiresApproval,
        isActive: true,
      },
      create: {
        code: type.code,
        name: type.name,
        shortName: type.shortName,
        sortOrder: type.sortOrder,
        hasActual: type.hasActual,
        requiresApproval: type.requiresApproval,
        isActive: true,
      },
    });
  }
  console.log("ActivityTypes seeded: " + ACTIVITY_TYPES.length + " types");
}
