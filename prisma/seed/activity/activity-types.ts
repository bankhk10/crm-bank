import { PrismaClient } from "@prisma/client";

const ACTIVITY_TYPES = [
  { code: "TYPE_1",  name: "เข้าพบร้านค้า / Key Farmer",                 shortName: "Visit",    sortOrder: 1 },
  { code: "TYPE_2",  name: "ติดตามผลการใช้สินค้า",                         shortName: "Followup", sortOrder: 2 },
  { code: "TYPE_3",  name: "เสนอขายสินค้า",                               shortName: "Sales",    sortOrder: 3 },
  { code: "TYPE_4",  name: "วางบิล / เก็บเงิน",                           shortName: "Collect",  sortOrder: 4 },
  { code: "TYPE_5",  name: "สำรวจตลาดของคู่แข่ง",                         shortName: "Survey",   sortOrder: 5 },
  { code: "TYPE_6",  name: "แก้ปัญหา / รับเรื่องร้องเรียน",               shortName: "Issue",    sortOrder: 6 },
  { code: "TYPE_7",  name: "ติดตามแปลงสาธิต / ทำแปลง",                   shortName: "Demo",     sortOrder: 7 },
  { code: "TYPE_8",  name: "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์", shortName: "Meeting",  sortOrder: 8 },
  { code: "TYPE_9",  name: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",           shortName: "Store",    sortOrder: 9 },
  { code: "TYPE_10", name: "จัดงาน Field Day",                             shortName: "FieldDay", sortOrder: 10 },
  { code: "TYPE_11", name: "ตรวจเช็กสต็อกหน้าร้าน",                       shortName: "Stock",    sortOrder: 11 },
];

export async function seedActivityTypes(prisma: PrismaClient) {
  console.log("Seeding ActivityTypes (11 types)...");
  for (const type of ACTIVITY_TYPES) {
    await prisma.activityType.upsert({
      where: { code: type.code },
      update: { name: type.name, shortName: type.shortName, sortOrder: type.sortOrder, isActive: true },
      create: { code: type.code, name: type.name, shortName: type.shortName, sortOrder: type.sortOrder, isActive: true },
    });
  }
  console.log("ActivityTypes seeded: " + ACTIVITY_TYPES.length + " types");
}
