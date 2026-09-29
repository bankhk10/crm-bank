import "dotenv/config";
import { PrismaClient, Prisma, ActivityStatus, ActivityHelperStatus, TourType, TourSize } from "@prisma/client";
import { db as prisma } from "../lib/db";
import { seedWorkflowTestUsers } from "../prisma/seed/activity/workflow-test-users";
import { seedActivityTypes } from "../prisma/seed/activity/activity-types";
import { seedPromotionalMaterials } from "../prisma/seed/activity/promotional-materials";

/**
 * Script for setting up UAT Test Data for Activity Workflow Scenarios (TEST-ACT-001 to TEST-ACT-010).
 * All test plans are created in DRAFT status with normalized Target Architecture sub-tables so users can
 * manually test the UI through the browser with rich initial values.
 * 
 * Safety Protection:
 * - Scenarios TEST-ACT-001, TEST-ACT-004, and TEST-ACT-005 are PROTECTED (Passed UAT).
 * - Full seed / cleanup will NEVER overwrite or delete protected scenarios unless explicitly targeted.
 * 
 * Usage:
 *   pnpm activity:uat:seed --code=TEST-ACT-006  # Seed / Reset specific scenario (006)
 *   pnpm activity:uat:seed                     # Seed unprotected scenarios (skips protected)
 *   pnpm activity:uat:cleanup                  # Clean up unprotected UAT plans
 */

export const PROTECTED_UAT_CODES = new Set([
  "TEST-ACT-001",
  "TEST-ACT-004",
  "TEST-ACT-005",
]);

/**
 * Normalizes scenario code input:
 * Supports "TEST-ACT-006", "UAT-ACT-006", "ACT-006", "006", or "6" -> "TEST-ACT-006"
 */
export function normalizeScenarioCode(rawCode?: string): string | undefined {
  if (!rawCode) return undefined;
  const trimmed = rawCode.trim().toUpperCase();
  const digitsMatch = trimmed.match(/\d+/);
  if (!digitsMatch) return trimmed;
  const num = parseInt(digitsMatch[0], 10);
  if (isNaN(num)) return trimmed;
  return `TEST-ACT-${String(num).padStart(3, "0")}`;
}

export interface CleanupUatOptions {
  targetCode?: string;
  cleanAll?: boolean;
  cleanNotifications?: boolean;
}

export async function cleanupUatActivityPlans(
  db: PrismaClient = prisma,
  rawTargetCodeOrOptions?: string | CleanupUatOptions
) {
  let targetCode: string | undefined;
  let cleanAll = false;
  let cleanNotifications = true;

  if (typeof rawTargetCodeOrOptions === "string") {
    targetCode = normalizeScenarioCode(rawTargetCodeOrOptions);
  } else if (rawTargetCodeOrOptions) {
    targetCode = normalizeScenarioCode(rawTargetCodeOrOptions.targetCode);
    cleanAll = !!rawTargetCodeOrOptions.cleanAll;
    if (rawTargetCodeOrOptions.cleanNotifications !== undefined) {
      cleanNotifications = rawTargetCodeOrOptions.cleanNotifications;
    }
  }

  console.log(`🧹 Cleaning up ${targetCode ? targetCode : "all UAT / Test Activity Plans"}...`);

  let whereClause: Prisma.ActivityPlanWhereInput;

  if (targetCode) {
    whereClause = {
      OR: [
        { code: targetCode },
        { title: { startsWith: `[${targetCode}]` } },
      ],
    };
  } else {
    // Full cleanup of all UAT and test activity plans
    whereClause = {
      OR: [
        { code: { startsWith: "TEST-ACT-" } },
        { code: { startsWith: "AUTO-ACT-" } },
        { code: { startsWith: "HELPER-TEST-" } },
        { code: { startsWith: "UAT-ACT-" } },
        { code: { startsWith: "TP2608S" } },
        { code: { startsWith: "TP2609" } },
        { code: { startsWith: "TP2610" } },
        { title: { startsWith: "[TEST-ACT-" } },
        { title: { startsWith: "[UAT-ACT-" } },
        { title: { startsWith: "Admin Test Plan Temporary" } },
        { title: { startsWith: "(สำเนา)" } },
        {
          employee: {
            email: {
              in: [
                "test.promoter@crm.local",
                "test.sales@crm.local",
                "test.areamgr@crm.local",
                "test.districtmgr@crm.local",
                "test.salesadmin@crm.local",
                "test.mktmgr@crm.local",
                "test.salesdir@crm.local",
                "test.mktstaff@crm.local",
              ],
            },
          },
        },
      ],
    };
  }

  const uatPlans = await db.activityPlan.findMany({
    where: whereClause,
    select: { id: true, code: true, title: true },
  });

  if (uatPlans.length === 0) {
    console.log("   No matching UAT activity plans found to clean up.");
    return 0;
  }

  console.log(`   Found ${uatPlans.length} UAT Activity Plans to clean up.`);
  const planIds = uatPlans.map((p) => p.id);

  // 1. Delete calendar attendees and events
  const calendarEvents = await db.activityCalendarEvent.findMany({
    where: { activityPlanId: { in: planIds } },
    select: { id: true },
  });
  const eventIds = calendarEvents.map((e) => e.id);

  if (eventIds.length > 0) {
    await db.activityCalendarAttendee.deleteMany({
      where: { calendarEventId: { in: eventIds } },
    });
    await db.activityCalendarEvent.deleteMany({
      where: { id: { in: eventIds } },
    });
  }

  // 2. Delete Activity Results and child results
  const results = await db.activityResult.findMany({
    where: { activityPlanId: { in: planIds } },
    select: { id: true },
  });
  const resultIds = results.map((r) => r.id);
  if (resultIds.length > 0) {
    await db.activityResultSaleItem.deleteMany({ where: { activityResultId: { in: resultIds } } });
    await db.activityResultStockItem.deleteMany({ where: { activityResultId: { in: resultIds } } });
    await db.activityResultSurveyItem.deleteMany({ where: { activityResultId: { in: resultIds } } });
    await db.activityResultDemoItem.deleteMany({ where: { activityResultId: { in: resultIds } } });
    await db.activityResult.deleteMany({ where: { id: { in: resultIds } } });
  }

  // 3. Delete normalized child relations (zero legacy ActivityPlanItem)
  await db.activityApprovalLog.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityHelper.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanWorkType.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanStore.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanProduct.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanMarketingItem.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanPromotionItem.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanTour.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityAttachment.deleteMany({ where: { activityPlanId: { in: planIds } } });

  // Disconnect DemoPlotVisits if any
  await db.demoPlotVisit.updateMany({
    where: { activityPlanId: { in: planIds } },
    data: { activityPlanId: null },
  });

  // 4. Delete the activity plans
  const deleteResult = await db.activityPlan.deleteMany({
    where: { id: { in: planIds } },
  });

  // 5. Clean up orphaned notifications for test users
  if (cleanNotifications) {
    const testUserEmails = [
      "test.promoter@crm.local",
      "test.sales@crm.local",
      "test.areamgr@crm.local",
      "test.districtmgr@crm.local",
      "test.salesadmin@crm.local",
      "test.mktmgr@crm.local",
      "test.salesdir@crm.local",
      "test.mktstaff@crm.local",
    ];
    const testUsers = await db.user.findMany({
      where: { email: { in: testUserEmails } },
      select: { id: true },
    });
    const testUserIds = testUsers.map((u) => u.id);
    if (testUserIds.length > 0) {
      const deletedNotifs = await db.notification.deleteMany({
        where: {
          userId: { in: testUserIds },
          link: { contains: "/activity-plans/" },
        },
      });
      if (deletedNotifs.count > 0) {
        console.log(`   🔔 Cleaned up ${deletedNotifs.count} workflow notifications for test users.`);
      }
    }
  }

  console.log(`   ✅ Successfully cleaned up ${deleteResult.count} UAT Activity Plans.`);
  return deleteResult.count;
}

export async function seedUatActivityPlans(
  db: PrismaClient = prisma,
  options?: { targetCode?: string }
) {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🌱 SEEDING UAT TEST DATA FOR ACTIVITY WORKFLOW (TEST-ACT-001 - 010)");
  console.log("═════════════════════════════════════════════════════════════════\n");

  const codeArg = process.argv.find((arg) => arg.startsWith("--code="));
  const rawTargetCode = options?.targetCode || (codeArg ? codeArg.split("=")[1] : undefined);
  const targetCode = normalizeScenarioCode(rawTargetCode);

  // 1. Ensure Workflow Test Users & Permissions exist
  const { users, employees } = await seedWorkflowTestUsers(db);

  // 2. Fetch Activity Types
  await seedActivityTypes(db);
  const activityTypes = await db.activityType.findMany();
  const typeMap = Object.fromEntries(activityTypes.map((t) => [t.code, t]));

  // 3. Ensure Promotional Materials Master Data exist
  await seedPromotionalMaterials(db);

  // 4. Resolve Master Customers (Strict Rule: No dummy creation, verify existence)
  const custSoonthorn = await db.customer.findFirst({ where: { name: { contains: "สุนทร" } } });
  const custSoithong = await db.customer.findFirst({ where: { name: { contains: "สร้อยทอง" } } });
  const custWutthichai = await db.customer.findFirst({ where: { name: { contains: "วุฒิชัย" } } });
  const custWirut = await db.customer.findFirst({ where: { name: { contains: "วิรุธ" } } });
  const custAnuwat = await db.customer.findFirst({ where: { name: { contains: "อนุวัฒน์" } } });

  if (!custSoonthorn || !custSoithong || !custWutthichai || !custWirut || !custAnuwat) {
    throw new Error(
      "Missing Master Data: Required Customer records not found in database. " +
      "Please run core seed first to populate Master Customers."
    );
  }

  // 5. Resolve Master Products (Strict Rule: No dummy creation, verify existence)
  const prodTeraSorb =
    (await db.product.findFirst({ where: { name: { contains: "เทอรา-ซอร์บ : 12x1" } } })) ||
    (await db.product.findFirst({ where: { name: { contains: "เทอรา-ซอร์บ" } } }));
  const prodAltera = await db.product.findFirst({ where: { name: { contains: "อัลเทอร่า" } } });
  const prodAccaban = await db.product.findFirst({ where: { name: { contains: "อัคคาบัน" } } });

  if (!prodTeraSorb || !prodAltera || !prodAccaban) {
    throw new Error(
      "Missing Master Data: Required Product records not found in database. " +
      "Please run core seed first to populate Master Products."
    );
  }

  // 6. Resolve DemoPlot (if available)
  const demoPlot = await db.demoPlot.findFirst({ where: { deletedAt: null } });

  // Helper date generators for September 2026 UAT testing
  const makeDate = (day: number, hour: number = 9) => new Date(2026, 8, day, hour, 0, 0); // Month index 8 = September

  // 7. Define 10 UAT Scenarios with Normalized Sub-Relations
  const uatScenarios = [
    {
      code: "TEST-ACT-001",
      title: "[TEST-ACT-001] เข้าพบร้านค้าเขตภาคกลาง (No Budget / No Helper)",
      creatorUser: users.uPromoter,
      creatorEmp: employees.empPromoter,
      primaryTypeCode: "TYPE_1",
      workTypeCodes: ["TYPE_1"],
      objective: "เข้าพบร้านค้าตัวแทนจำหน่ายเพื่อแนะนำผลิตภัณฑ์และสร้างความสัมพันธ์ (Line Approval 4 ขั้น)",
      description: "ไม่มีการของบประมาณ และไม่มีผู้ช่วยงาน เพื่อทดสอบสายอนุมัติ Promoter -> Sales -> Area Mgr -> Sales Admin Mgr",
      province: "จันทบุรี",
      district: "มะขาม",
      location: "อ.มะขาม จ.จันทบุรี",
      spBudget: 0,
      mktBudget: 0,
      helpers: [] as string[],
      startDate: makeDate(10, 9),
      endDate: makeDate(10, 17),
      expectedWorkflow: "Promoter -> Sales -> Area Manager -> Sales Admin Manager",
      stores: [
        {
          workTypeCode: "TYPE_1",
          storeId: custSoonthorn.id,
          storeName: custSoonthorn.name,
          remarks: "แจ้งข่าวสาร",
          notes: "เข้าพบร้านค้าตัวแทนจำหน่ายเพื่อแนะนำผลิตภัณฑ์และสร้างความสัมพันธ์",
        },
      ],
      products: [] as Array<any>,
      marketingItems: [] as Array<any>,
      promotionItems: [] as Array<any>,
      demoPlotId: null as string | null,
      targetAttendeesCount: null as number | null,
      targetBookingSales: null as number | null,
    },
    {
      code: "TEST-ACT-002",
      title: "[TEST-ACT-002] จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Sales Promotion Budget 5,000 บาท)",
      creatorUser: users.uSales,
      creatorEmp: employees.empSales,
      primaryTypeCode: "TYPE_9",
      workTypeCodes: ["TYPE_9"],
      objective: "จัดกิจกรรมส่งเสริมการขายร่วมกับร้านค้าเพื่อกระตุ้นยอดสั่งซื้อปุ๋ยและยา",
      description: "ของบประมาณส่งเสริมการขาย 5,000 บาท เพื่อทดสอบ Area Mgr -> Sales Admin Mgr (SP Budget) -> Sales Dir",
      province: "นครราชสีมา",
      district: "ขามทะเลสอ",
      location: "อ.ขามทะเลสอ จ.นครราชสีมา",
      spBudget: 5000,
      mktBudget: 0,
      helpers: [] as string[],
      startDate: makeDate(11, 9),
      endDate: makeDate(11, 17),
      expectedWorkflow: "Area Manager -> Sales Admin Manager (SP Budget) -> Sales Director",
      stores: [
        {
          workTypeCode: "TYPE_9",
          storeId: custSoithong.id,
          storeName: custSoithong.name,
          notes: "จัดกิจกรรมส่งเสริมการขายร่วมกับร้านค้าเพื่อกระตุ้นยอดสั่งซื้อ",
        },
      ],
      products: [
        {
          workTypeCode: "TYPE_9",
          storeId: custSoithong.id,
          productId: prodTeraSorb.id,
          productName: prodTeraSorb.name,
          targetQuantity: 10,
          masterPrice: 500,
          unitPrice: 500,
          targetAmount: 5000,
          isPriceOverridden: false,
        },
      ],
      marketingItems: [] as Array<any>,
      promotionItems: [
        {
          budgetType: "SALES_PROMOTION",
          detail: "งบส่งเสริมการขายและส่วนลดพิเศษหน้าร้าน",
          amount: 5000,
        },
      ],
      demoPlotId: null as string | null,
      targetAttendeesCount: null as number | null,
      targetBookingSales: null as number | null,
    },
    {
      code: "TEST-ACT-003",
      title: "[TEST-ACT-003] จัดประชุมการเกษตรและชี้แจงทิศทางการตลาด (Marketing Budget 8,000 บาท)",
      creatorUser: users.uAreaMgr,
      creatorEmp: employees.empAreaMgr,
      primaryTypeCode: "TYPE_8",
      workTypeCodes: ["TYPE_8"],
      objective: "จัดประชุมสัมมนาถ่ายทอดความรู้แก่กลุ่มเกษตรกรและดีลเลอร์ในพื้นที่",
      description: "ของบประมาณการตลาด 8,000 บาท เพื่อทดสอบ Sales Admin Mgr -> MKT Mgr (MKT Budget) -> Sales Dir",
      province: "นครราชสีมา",
      district: "เมืองนครราชสีมา",
      location: "โรงแรมเซ็นทรา โคราช",
      spBudget: 0,
      mktBudget: 8000,
      helpers: [] as string[],
      startDate: makeDate(12, 9),
      endDate: makeDate(12, 17),
      expectedWorkflow: "Sales Admin Manager -> MKT Manager (MKT Budget) -> Sales Director",
      stores: [
        {
          workTypeCode: "TYPE_8",
          storeId: custSoonthorn.id,
          storeName: custSoonthorn.name,
          notes: "ประชุมสัมมนาชี้แจงทิศทางการตลาดและผลิตภัณฑ์ใหม่",
        },
      ],
      products: [
        {
          workTypeCode: "TYPE_8",
          productId: prodTeraSorb.id,
          productName: prodTeraSorb.name,
        },
        {
          workTypeCode: "TYPE_8",
          productId: prodAltera.id,
          productName: prodAltera.name,
        },
      ],
      marketingItems: [
        {
          category: "ไวนิล",
          materialName: "ป้ายไวนิลประชาสัมพันธ์งานประชุม",
          unit: "ผืน",
          unitPrice: 1000,
          quantity: 4,
          totalAmount: 4000,
        },
        {
          category: "สื่อสิ่งพิมพ์",
          materialName: "สมุดฉีกและเอกสารคู่มือเกษตรกร",
          unit: "เล่ม",
          unitPrice: 50,
          quantity: 80,
          totalAmount: 4000,
        },
      ],
      promotionItems: [] as Array<any>,
      demoPlotId: null as string | null,
      targetAttendeesCount: 30,
      targetBookingSales: null as number | null,
    },
    {
      code: "TEST-ACT-004",
      title: "[TEST-ACT-004] จัดงาน Field Day ประจำปี (Parallel Budget SP 10,000 + MKT 15,000 = 25,000 บาท)",
      creatorUser: users.uPromoter,
      creatorEmp: employees.empPromoter,
      primaryTypeCode: "TYPE_10",
      workTypeCodes: ["TYPE_10"],
      objective: "จัดงาน Field Day แสดงนวัตกรรมและผลผลิตทางการเกษตรระดับแปลงใหญ่",
      description: "ของบคู่ขนาน SP 10,000 + MKT 15,000 เพื่อทดสอบ Parallel Budget Approval -> Sales Dir",
      province: "สุพรรณบุรี",
      district: "ดอนเจดีย์",
      location: "แปลงเรียนรู้การเกษตรดอนเจดีย์",
      spBudget: 10000,
      mktBudget: 15000,
      helpers: [
        employees.empSales.id,
        employees.empAreaMgr.id,
        employees.empMktStaff.id,
      ],
      startDate: makeDate(14, 9),
      endDate: makeDate(15, 17),
      expectedWorkflow: "Line Approval -> Parallel (Sales Admin Mgr + MKT Mgr) -> Sales Director",
      stores: [
        {
          workTypeCode: "TYPE_10",
          storeId: custSoonthorn.id,
          storeName: custSoonthorn.name,
          notes: "จัดงาน Field Day แสดงนวัตกรรมและผลผลิตทางการเกษตรระดับแปลงใหญ่",
        },
      ],
      products: [
        {
          workTypeCode: "TYPE_10",
          productId: prodTeraSorb.id,
          productName: prodTeraSorb.name,
        },
      ],
      marketingItems: [
        {
          category: "ป้ายและเวที",
          materialName: "อุปกรณ์เวทีและฉากนิทรรศการ Field Day",
          unit: "ชุด",
          unitPrice: 15000,
          quantity: 1,
          totalAmount: 15000,
        },
      ],
      promotionItems: [
        {
          budgetType: "SALES_PROMOTION",
          detail: "ค่าของสมนาคุณและรางวัลร่วมกิจกรรม Field Day",
          amount: 10000,
        },
      ],
      demoPlotId: demoPlot?.id ?? null,
      targetAttendeesCount: 50,
      targetBookingSales: 25000,
    },
    {
      code: "TEST-ACT-005",
      title: "[TEST-ACT-005] สำรวจตลาดและตรวจสต็อกสินค้า (ขอพนักงานขายช่วยงาน)",
      creatorUser: users.uPromoter,
      creatorEmp: employees.empPromoter,
      primaryTypeCode: "TYPE_5",
      workTypeCodes: ["TYPE_5", "TYPE_11"],
      objective: "ร่วมกับพนักงานขายลงพื้นที่สำรวจราคาคู่แข่งและตรวจนับสต็อกสินค้าคงเหลือ",
      description: "ขอพนักงานขาย (test.sales@crm.local) ไปช่วยงาน เพื่อทดสอบ Helper Approval โดย ผจก.แผนก SA",
      province: "ปทุมธานี",
      district: "ลาดหลุมแก้ว",
      location: "ตลาดกลางการเกษตรลาดหลุมแก้ว",
      spBudget: 0,
      mktBudget: 0,
      helpers: [employees.empSales.id],
      startDate: makeDate(16, 9),
      endDate: makeDate(16, 17),
      expectedWorkflow: "Line Approval -> Sales Admin Mgr (Helper Review) -> Approved -> Calendar (2 Attendees)",
      stores: [
        {
          workTypeCode: "TYPE_5",
          storeId: custWutthichai.id,
          storeName: custWutthichai.name,
          remarks: "สำรวจราคาสินค้าคู่แข่ง",
          notes: "ร่วมสำรวจราคาสินค้าคู่แข่งในพื้นที่",
        },
        {
          workTypeCode: "TYPE_11",
          storeId: custWutthichai.id,
          storeName: custWutthichai.name,
          remarks: "ตรวจนับสต็อก",
          notes: "ตรวจนับสต็อกสินค้าคงเหลือและเช็กความต้องการสั่งซื้อเพิ่ม",
        },
      ],
      products: [
        {
          workTypeCode: "TYPE_5",
          storeId: custWutthichai.id,
          productId: prodTeraSorb.id,
          productName: prodTeraSorb.name,
        },
        {
          workTypeCode: "TYPE_11",
          storeId: custWutthichai.id,
          productId: prodTeraSorb.id,
          productName: prodTeraSorb.name,
        },
      ],
      marketingItems: [] as Array<any>,
      promotionItems: [] as Array<any>,
      demoPlotId: null as string | null,
      targetAttendeesCount: null as number | null,
      targetBookingSales: null as number | null,
    },
    {
      code: "TEST-ACT-006",
      title: "[TEST-ACT-006] จัดกิจกรรมสาธิตแปลงทดลอง (ขอพนักงานการตลาดช่วยงาน)",
      creatorUser: users.uPromoter,
      creatorEmp: employees.empPromoter,
      primaryTypeCode: "TYPE_7",
      workTypeCodes: ["TYPE_7"],
      objective: "จัดกิจกรรมแปลงสาธิตและบันทึกภาพผลการเจริญเติบโตของพืชสำหรับจัดทำสื่อ",
      description: "ขอพนักงานการตลาด (test.mktstaff@crm.local) ไปช่วยงาน เพื่อทดสอบ Helper Approval โดย ผจก.แผนก MKT",
      province: "ระยอง",
      district: "แกลง",
      location: "แปลงสาธิตไม้ผลนายวิรุธ รุจิวงศ์",
      spBudget: 0,
      mktBudget: 0,
      helpers: [employees.empMktStaff.id],
      startDate: makeDate(17, 9),
      endDate: makeDate(17, 17),
      expectedWorkflow: "Line Approval -> MKT Manager (Helper Review) -> Approved -> Calendar (2 Attendees)",
      stores: [
        {
          workTypeCode: "TYPE_7",
          storeId: custWirut.id,
          storeName: custWirut.name,
          notes: "จัดกิจกรรมแปลงสาธิตและบันทึกภาพผลการเจริญเติบโตของพืชสำหรับจัดทำสื่อ",
        },
      ],
      products: [
        {
          workTypeCode: "TYPE_7",
          storeId: custWirut.id,
          productId: prodTeraSorb.id,
          productName: prodTeraSorb.name,
        },
      ],
      marketingItems: [] as Array<any>,
      promotionItems: [] as Array<any>,
      demoPlotId: demoPlot?.id ?? null,
      targetAttendeesCount: null as number | null,
      targetBookingSales: null as number | null,
    },
    {
      code: "TEST-ACT-007",
      title: "[TEST-ACT-007] ทดสอบการปฏิเสธแผนงาน (Reject Flow Testing)",
      creatorUser: users.uPromoter,
      creatorEmp: employees.empPromoter,
      primaryTypeCode: "TYPE_3",
      workTypeCodes: ["TYPE_3"],
      objective: "เสนอขายสินค้าและโปรโมชั่นพิเศษแก่ร้านค้ารายใหม่ (เตรียมสำหรับการกด Reject)",
      description: "แผนงานสำหรับให้ผู้ทดสอบใช้บัญชีผู้จัดการกด Reject ผ่าน UI และตรวจสอบสถานะ REJECTED",
      province: "จันทบุรี",
      district: "เมืองจันทบุรี",
      location: "อ.เมือง จ.จันทบุรี",
      spBudget: 0,
      mktBudget: 0,
      helpers: [] as string[],
      startDate: makeDate(18, 9),
      endDate: makeDate(18, 17),
      expectedWorkflow: "Promoter Submit -> Area Mgr Rejects in UI -> Status: REJECTED",
      stores: [
        {
          workTypeCode: "TYPE_3",
          storeId: custSoonthorn.id,
          storeName: custSoonthorn.name,
          notes: "เสนอขายสินค้าและโปรโมชั่นพิเศษแก่ร้านค้ารายใหม่ (เตรียมสำหรับการกด Reject)",
        },
      ],
      products: [
        {
          workTypeCode: "TYPE_3",
          storeId: custSoonthorn.id,
          productId: prodAccaban.id,
          productName: prodAccaban.name,
          targetQuantity: 50,
          masterPrice: 305,
          unitPrice: 305,
          targetAmount: 50 * 305,
          isPriceOverridden: false,
        },
      ],
      marketingItems: [] as Array<any>,
      promotionItems: [] as Array<any>,
      demoPlotId: null as string | null,
      targetAttendeesCount: null as number | null,
      targetBookingSales: null as number | null,
    },
    {
      code: "TEST-ACT-008",
      title: "[TEST-ACT-008] ทดสอบการส่งกลับแก้ไข (Request Correction Flow Testing)",
      creatorUser: users.uPromoter,
      creatorEmp: employees.empPromoter,
      primaryTypeCode: "TYPE_6",
      workTypeCodes: ["TYPE_6"],
      objective: "ลงพื้นที่ตรวจสอบข้อร้องเรียนคุณภาพสินค้า (เตรียมสำหรับการกด Request Correction)",
      description: "แผนงานสำหรับให้ผู้ทดสอบใช้บัญชีผู้จัดการกด 'ขอให้แก้ไข' (Request Correction) พร้อมระบุเหตุผล",
      province: "ราชบุรี",
      district: "บ้านโป่ง",
      location: "สหกรณ์การเกษตรบ้านโป่ง",
      spBudget: 0,
      mktBudget: 0,
      helpers: [] as string[],
      startDate: makeDate(21, 9),
      endDate: makeDate(21, 17),
      expectedWorkflow: "Promoter Submit -> Area Mgr Requests Correction in UI -> Status: WAITING_FOR_CORRECTION",
      stores: [
        {
          workTypeCode: "TYPE_6",
          storeId: custAnuwat.id,
          storeName: custAnuwat.name,
          remarks: "คุณภาพสินค้า",
          notes: "ลงพื้นที่ตรวจสอบข้อร้องเรียนคุณภาพสินค้า (เตรียมสำหรับการกด Request Correction)",
        },
      ],
      products: [
        {
          workTypeCode: "TYPE_6",
          storeId: custAnuwat.id,
          productId: prodTeraSorb.id,
          productName: prodTeraSorb.name,
        },
      ],
      marketingItems: [] as Array<any>,
      promotionItems: [] as Array<any>,
      demoPlotId: null as string | null,
      targetAttendeesCount: null as number | null,
      targetBookingSales: null as number | null,
    },
    {
      code: "TEST-ACT-009",
      title: "[TEST-ACT-009] ทดสอบการส่งแผนงานซ้ำหลังแก้ไข (Resubmit Flow Testing)",
      creatorUser: users.uPromoter,
      creatorEmp: employees.empPromoter,
      primaryTypeCode: "TYPE_2",
      workTypeCodes: ["TYPE_2"],
      objective: "ติดตามผลการใช้ปุ๋ยและสารเสริมชีวภาพ (เตรียมสำหรับการแก้ไขและ Resubmit)",
      description: "แผนงานสำหรับให้ผู้ทดสอบทดลองส่ง -> ขอแก้ไข -> แก้ไขข้อมูลใน Form -> Resubmit วนรอบใหม่",
      province: "สระบุรี",
      district: "แก่งคอย",
      location: "สวนเกษตรกรตัวอย่างแก่งคอย",
      spBudget: 0,
      mktBudget: 0,
      helpers: [] as string[],
      startDate: makeDate(22, 9),
      endDate: makeDate(22, 17),
      expectedWorkflow: "Correction -> Edit in Form -> Resubmit in UI -> Restarts Line Approval",
      stores: [
        {
          workTypeCode: "TYPE_2",
          storeId: custWirut.id,
          storeName: custWirut.name,
          notes: "ติดตามผลการใช้ปุ๋ยและสารเสริมชีวภาพ (เตรียมสำหรับการแก้ไขและ Resubmit)",
        },
      ],
      products: [
        {
          workTypeCode: "TYPE_2",
          storeId: custWirut.id,
          productId: prodAltera.id,
          productName: prodAltera.name,
        },
      ],
      marketingItems: [] as Array<any>,
      promotionItems: [] as Array<any>,
      demoPlotId: null as string | null,
      targetAttendeesCount: null as number | null,
      targetBookingSales: null as number | null,
    },
    {
      code: "TEST-ACT-010",
      title: "[TEST-ACT-010] ทดสอบวงจรปฏิทินกิจกรรม (Calendar Lifecycle Testing)",
      creatorUser: users.uPromoter,
      creatorEmp: employees.empPromoter,
      primaryTypeCode: "TYPE_1",
      workTypeCodes: ["TYPE_1"],
      objective: "เข้าพบร้านค้าและตรวจเยี่ยมเกษตรกร (เตรียมสำหรับการทดสอบปฏิทินนัดหมาย)",
      description: "แผนงานสำหรับทดสอบ: อนุมัติจนจบ -> ปรากฏบน Calendar -> ดูรายละเอียด / ตรวจสอบเวลา -> กดยกเลิก",
      province: "นครปฐม",
      district: "กำแพงแสน",
      location: "ศูนย์บริการการเกษตรกำแพงแสน",
      spBudget: 0,
      mktBudget: 0,
      helpers: [employees.empSales.id],
      startDate: makeDate(23, 9),
      endDate: makeDate(23, 17),
      expectedWorkflow: "Complete Approval -> Synced to Calendar -> View on Calendar -> Cancel",
      stores: [
        {
          workTypeCode: "TYPE_1",
          storeId: custWutthichai.id,
          storeName: custWutthichai.name,
          remarks: "แจ้งข่าวสาร",
          notes: "เข้าพบร้านค้าและตรวจเยี่ยมเกษตรกร (เตรียมสำหรับการทดสอบปฏิทินนัดหมาย)",
        },
      ],
      products: [] as Array<any>,
      marketingItems: [] as Array<any>,
      promotionItems: [] as Array<any>,
      demoPlotId: null as string | null,
      targetAttendeesCount: null as number | null,
      targetBookingSales: null as number | null,
    },
  ];

  console.log("📝 Upserting UAT Activity Plans in DRAFT status with normalized sub-tables...\n");

  const seededPlans = [];
  let totalSubRecordsCreated = 0;

  // Filter scenarios to seed with Safety Protection for Passed UAT Scenarios
  let scenariosToSeed: typeof uatScenarios;

  if (targetCode) {
    if (PROTECTED_UAT_CODES.has(targetCode)) {
      console.warn(`🛡️ Target [${targetCode}] is a PROTECTED UAT scenario (passed UAT). Operation blocked to preserve test records.`);
      return { seededPlans: [], totalItemsCreated: 0 };
    }
    scenariosToSeed = uatScenarios.filter((s) => s.code === targetCode);
    if (scenariosToSeed.length === 0) {
      console.warn(`⚠️ Warning: No scenario found matching code "${rawTargetCode}" (normalized: "${targetCode}").`);
      return { seededPlans: [], totalItemsCreated: 0 };
    }
  } else {
    // Full seed (no --code specified): Protect passed UAT scenarios!
    scenariosToSeed = uatScenarios.filter((s) => {
      if (PROTECTED_UAT_CODES.has(s.code)) {
        console.log(`🔒 Skipping protected UAT scenario [${s.code}] (already passed UAT, preserved)`);
        return false;
      }
      return true;
    });
  }

  for (const s of scenariosToSeed) {
    const primaryType = typeMap[s.primaryTypeCode];
    if (!primaryType) {
      throw new Error(`ActivityType ${s.primaryTypeCode} not found in database.`);
    }

    const totalBudget = s.spBudget + s.mktBudget;
    const durationDays = Math.max(1, Math.ceil((s.endDate.getTime() - s.startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Check if existing plan exists by code or legacy title prefix
    let plan = await db.activityPlan.findFirst({
      where: {
        OR: [
          { code: s.code },
          { title: { startsWith: `[${s.code}]` } },
        ],
      },
    });

    if (plan) {
      // 1. Reset child records for a clean DRAFT state
      await db.activityHelper.deleteMany({ where: { activityPlanId: plan.id } });
      await db.activityPlanWorkType.deleteMany({ where: { activityPlanId: plan.id } });
      await db.activityPlanStore.deleteMany({ where: { activityPlanId: plan.id } });
      await db.activityPlanProduct.deleteMany({ where: { activityPlanId: plan.id } });
      await db.activityPlanMarketingItem.deleteMany({ where: { activityPlanId: plan.id } });
      await db.activityPlanPromotionItem.deleteMany({ where: { activityPlanId: plan.id } });
      await db.activityPlanTour.deleteMany({ where: { activityPlanId: plan.id } });
      await db.activityApprovalLog.deleteMany({ where: { activityPlanId: plan.id } });
      await db.activityCalendarAttendee.deleteMany({
        where: { calendarEvent: { activityPlanId: plan.id } },
      });
      await db.activityCalendarEvent.deleteMany({ where: { activityPlanId: plan.id } });

      // 2. Update to clean DRAFT
      plan = await db.activityPlan.update({
        where: { id: plan.id },
        data: {
          code: s.code,
          title: s.title,
          objective: s.objective,
          description: s.description,
          employeeId: s.creatorEmp.id,
          createdById: s.creatorUser.id,
          activityTypeId: primaryType.id,
          startDate: s.startDate,
          endDate: s.endDate,
          durationDays,
          fiscalYear: 2026,
          fiscalMonth: 9,
          fiscalQuarter: 3,
          province: s.province,
          district: s.district,
          location: s.location,
          targetAttendeesCount: s.targetAttendeesCount ?? null,
          targetBookingSales: s.targetBookingSales != null ? new Prisma.Decimal(s.targetBookingSales) : null,
          salesPromotionBudgetRequested: s.spBudget > 0 ? new Prisma.Decimal(s.spBudget) : null,
          marketingBudgetRequested: s.mktBudget > 0 ? new Prisma.Decimal(s.mktBudget) : null,
          totalBudgetRequested: new Prisma.Decimal(totalBudget),
          salesPromotionBudgetApproved: null,
          marketingBudgetApproved: null,
          totalBudgetApproved: null,
          salesPromotionApproved: null,
          marketingApproved: null,
          salesManagerApproved: null,
          status: ActivityStatus.DRAFT,
          currentApproverEmployeeId: null,
          submittedAt: null,
          approvedAt: null,
          rejectedAt: null,
          cancelledAt: null,
          deletedAt: null,
        },
      });
    } else {
      // Create new plan in DRAFT status
      plan = await db.activityPlan.create({
        data: {
          code: s.code,
          title: s.title,
          objective: s.objective,
          description: s.description,
          employeeId: s.creatorEmp.id,
          createdById: s.creatorUser.id,
          activityTypeId: primaryType.id,
          startDate: s.startDate,
          endDate: s.endDate,
          durationDays,
          fiscalYear: 2026,
          fiscalMonth: 9,
          fiscalQuarter: 3,
          province: s.province,
          district: s.district,
          location: s.location,
          targetAttendeesCount: s.targetAttendeesCount ?? null,
          targetBookingSales: s.targetBookingSales != null ? new Prisma.Decimal(s.targetBookingSales) : null,
          salesPromotionBudgetRequested: s.spBudget > 0 ? new Prisma.Decimal(s.spBudget) : null,
          marketingBudgetRequested: s.mktBudget > 0 ? new Prisma.Decimal(s.mktBudget) : null,
          totalBudgetRequested: new Prisma.Decimal(totalBudget),
          status: ActivityStatus.DRAFT,
        },
      });
    }

    // 1. Link Work Types
    for (const wtCode of s.workTypeCodes) {
      const wt = typeMap[wtCode];
      if (wt) {
        await db.activityPlanWorkType.create({
          data: {
            activityPlanId: plan.id,
            activityTypeId: wt.id,
          },
        });
      }
    }

    // 2. Link Stores
    if (s.stores && s.stores.length > 0) {
      await db.activityPlanStore.createMany({
        data: s.stores.map((st: any) => ({
          activityPlanId: plan.id,
          workTypeCode: st.workTypeCode,
          storeId: st.storeId,
          storeName: st.storeName ?? null,
          remarks: st.remarks ?? null,
          notes: st.notes ?? null,
        })),
      });
      totalSubRecordsCreated += s.stores.length;
    }

    // 3. Link Products
    if (s.products && s.products.length > 0) {
      await db.activityPlanProduct.createMany({
        data: s.products.map((p) => {
          const qty = p.targetQuantity != null ? Number(p.targetQuantity) : null;
          const uPrice = p.unitPrice != null ? Number(p.unitPrice) : null;
          const mPrice = p.masterPrice != null ? Number(p.masterPrice) : uPrice;
          const totalAmt =
            p.targetAmount != null
              ? Number(p.targetAmount)
              : qty != null && uPrice != null
              ? qty * uPrice
              : null;
          const isOverridden =
            p.isPriceOverridden ??
            (mPrice != null && uPrice != null ? mPrice !== uPrice : false);
          return {
            activityPlanId: plan.id,
            workTypeCode: p.workTypeCode,
            storeId: p.storeId ?? null,
            productId: p.productId,
            productName: p.productName ?? null,
            targetQuantity: qty != null ? Math.round(qty) : null,
            masterPrice: mPrice != null ? new Prisma.Decimal(mPrice) : null,
            unitPrice: uPrice != null ? new Prisma.Decimal(uPrice) : null,
            targetAmount: totalAmt != null ? new Prisma.Decimal(totalAmt) : null,
            isPriceOverridden: isOverridden,
          };
        }),
      });
      totalSubRecordsCreated += s.products.length;
    }

    // 4. Link Marketing Items
    if (s.marketingItems && s.marketingItems.length > 0) {
      await db.activityPlanMarketingItem.createMany({
        data: s.marketingItems.map((m) => ({
          activityPlanId: plan.id,
          category: m.category || "สื่อส่งเสริมการขาย",
          materialName: m.materialName,
          unit: m.unit ?? "ชิ้น",
          unitPrice: new Prisma.Decimal(m.unitPrice ?? 0),
          quantity: m.quantity || 1,
          totalAmount: new Prisma.Decimal(m.totalAmount ?? (m.quantity || 1) * (m.unitPrice ?? 0)),
        })),
      });
      totalSubRecordsCreated += s.marketingItems.length;
    }

    // 5. Link Promotion Items
    if (s.promotionItems && s.promotionItems.length > 0) {
      await db.activityPlanPromotionItem.createMany({
        data: s.promotionItems.map((p) => ({
          activityPlanId: plan.id,
          budgetType: p.budgetType || "SALES_PROMOTION",
          detail: p.detail,
          amount: new Prisma.Decimal(p.amount),
        })),
      });
      totalSubRecordsCreated += s.promotionItems.length;
    }

    // 6. Link DemoPlotVisit (if demoPlotId provided)
    if (s.demoPlotId) {
      const existingVisit = await db.demoPlotVisit.findFirst({
        where: { activityPlanId: plan.id },
      });
      if (!existingVisit) {
        await db.demoPlotVisit.create({
          data: {
            demoPlotId: s.demoPlotId,
            activityPlanId: plan.id,
            visitNumber: 1,
            visitDate: s.startDate,
            notes: "เข้าตรวจและติดตามแปลงสาธิตตามแผนกิจกรรม UAT",
          },
        });
      }
    }

    // 7. Link Helpers (Status: PENDING)
    for (const helperEmpId of s.helpers) {
      const helperEmp = await db.employee.findUnique({
        where: { id: helperEmpId },
        include: { department: true },
      });
      await db.activityHelper.create({
        data: {
          activityPlanId: plan.id,
          employeeId: helperEmpId,
          departmentId: helperEmp?.departmentId ?? null,
          departmentName: helperEmp?.department?.name ?? null,
          status: ActivityHelperStatus.PENDING,
          respondedAt: null,
        },
      });
    }

    seededPlans.push({
      id: plan.id,
      code: plan.code,
      title: s.title,
      creator: s.creatorUser.email,
      workTypes: s.workTypeCodes.join(", "),
      storesCount: s.stores.length,
      productsCount: s.products.length,
      budget: totalBudget > 0 ? `${totalBudget.toLocaleString()} บาท (SP: ${s.spBudget}, MKT: ${s.mktBudget})` : "0 บาท",
      helpersCount: s.helpers.length,
      status: plan.status,
      expectedWorkflow: s.expectedWorkflow,
    });
  }

  // 8. Output Summary Table
  console.log("═════════════════════════════════════════════════════════════════════════════════════════════════════════════════");
  console.log(`📊 UAT TEST DATA SEEDING COMPLETE (${seededPlans.length} SCENARIOS PROCESSED, ${totalSubRecordsCreated} SUB-RECORDS CREATED)`);
  console.log("═════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n");

  if (seededPlans.length > 0) {
    console.table(
      seededPlans.map((p) => ({
        ID: p.code,
        Creator: p.creator,
        "Work Types": p.workTypes,
        Stores: p.storesCount,
        Products: p.productsCount,
        Budget: p.budget,
        Helpers: p.helpersCount,
        Status: p.status,
      }))
    );
  }

  return { seededPlans, totalItemsCreated: totalSubRecordsCreated };
}

// Direct CLI execution handler
if (require.main === module) {
  const isCleanup = process.argv.includes("--cleanup");
  const codeArg = process.argv.find((arg) => arg.startsWith("--code="));
  const rawTargetCode = codeArg ? codeArg.split("=")[1] : undefined;

  if (isCleanup) {
    const isAll = process.argv.includes("--all") || !rawTargetCode;
    cleanupUatActivityPlans(prisma, {
      targetCode: rawTargetCode,
      cleanAll: isAll,
      cleanNotifications: true,
    })
      .catch((err) => {
        console.error("❌ Cleanup failed:", err);
        process.exit(1);
      })
      .finally(() => prisma.$disconnect());
  } else {
    seedUatActivityPlans(prisma, { targetCode: rawTargetCode })
      .catch((err) => {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
      })
      .finally(() => prisma.$disconnect());
  }
}
