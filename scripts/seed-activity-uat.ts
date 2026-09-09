import "dotenv/config";
import { PrismaClient, Prisma, ActivityStatus, ActivityHelperStatus } from "@prisma/client";
import { db as prisma } from "../lib/db";
import { seedWorkflowTestUsers } from "../prisma/seed/activity/workflow-test-users";
import { seedActivityTypes } from "../prisma/seed/activity/activity-types";
import { seedPromotionalMaterials } from "../prisma/seed/activity/promotional-materials";

/**
 * Script for setting up UAT Test Data for Activity Workflow Scenarios (ACT-001 to ACT-010).
 * All test plans are created in DRAFT status with full ActivityPlanItems so users can
 * manually test the UI through the browser with rich initial values.
 * 
 * Safety Protection:
 * - Scenarios TEST-ACT-001, TEST-ACT-004, and TEST-ACT-005 are PROTECTED (Passed UAT).
 * - Full seed / cleanup will NEVER overwrite or delete protected scenarios.
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

export async function cleanupUatActivityPlans(db: PrismaClient = prisma, rawTargetCode?: string) {
  const targetCode = normalizeScenarioCode(rawTargetCode);
  console.log(`🧹 Cleaning up ${targetCode ? targetCode : "unprotected UAT Activity Plans ([TEST-ACT-*], [UAT-ACT-*])"}...`);

  let whereClause: Prisma.ActivityPlanWhereInput;

  if (targetCode) {
    if (PROTECTED_UAT_CODES.has(targetCode)) {
      console.warn(`🛡️ Target [${targetCode}] is a PROTECTED UAT scenario (passed UAT). Skipping cleanup to preserve test data.`);
      return 0;
    }
    whereClause = {
      OR: [
        { code: targetCode },
        { title: { startsWith: `[${targetCode}]` } },
      ],
    };
  } else {
    // Full cleanup: protect passed UAT scenarios
    whereClause = {
      AND: [
        {
          OR: [
            { code: { startsWith: "TEST-ACT-" } },
            { code: { startsWith: "UAT-ACT-" } },
            { title: { startsWith: "[TEST-ACT-" } },
            { title: { startsWith: "[UAT-ACT-" } },
          ],
        },
        {
          code: { notIn: Array.from(PROTECTED_UAT_CODES) },
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

  // 2. Delete child relations
  await db.activityApprovalLog.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityHelper.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanWorkType.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanStore.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanProduct.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityPlanItem.deleteMany({ where: { activityPlanId: { in: planIds } } });
  await db.activityAttachment.deleteMany({ where: { activityPlanId: { in: planIds } } });

  // 3. Delete the activity plans
  const deleteResult = await db.activityPlan.deleteMany({
    where: { id: { in: planIds } },
  });

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

  // Helper date generators for September 2026 UAT testing
  const makeDate = (day: number, hour: number = 9) => new Date(2026, 8, day, hour, 0, 0); // Month index 8 = September

  // 3. Define 10 UAT Scenarios with standardized TEST-ACT-* codes
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_1",
          customerName: "นายสุนทร เกตุกิตติสกุล(ต.การเกษตร)",
          visitTopic: "แจ้งข่าวสาร",
          detail: "เข้าพบร้านค้าตัวแทนจำหน่ายเพื่อแนะนำผลิตภัณฑ์และสร้างความสัมพันธ์",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_9",
          customerName: "หจก. สร้อยทอง รุ่งเรืองการเกษตร",
          storeProductName: "เทอรา-ซอร์บ : 12x1 ลิตร",
          storeQuantityCases: 10,
          storePricePerCase: new Prisma.Decimal(500),
          storeTotalAmount: new Prisma.Decimal(5000),
          detail: "จัดกิจกรรมส่งเสริมการขายร่วมกับร้านค้าเพื่อกระตุ้นยอดสั่งซื้อ",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_8",
          meetingTopic: "ประชุมสัมมนาชี้แจงทิศทางการตลาดและผลิตภัณฑ์ใหม่",
          meetingAttendeesCount: 30,
          meetingTargetProducts: "เทอรา-ซอร์บ, อัลเทอร่า แมกนีเซียม ซิงค์",
          detail: "จัดประชุมสัมมนาถ่ายทอดความรู้แก่กลุ่มเกษตรกรและดีลเลอร์ในพื้นที่",
        },
        {
          itemOrder: 2,
          visitTopic: "MARKETING_PRODUCT",
          plotCropCategory: "Banner",
          storeProductName: "ป้ายไวนิลประชาสัมพันธ์งานประชุม",
          storeQuantityCases: 4,
          plotCropName: "ผืน",
          storePricePerCase: new Prisma.Decimal(1000),
          storeTotalAmount: new Prisma.Decimal(4000),
          detail: "ป้ายไวนิลประชาสัมพันธ์งานประชุม 4 ผืน รวม 4,000 บาท",
        },
        {
          itemOrder: 3,
          visitTopic: "MARKETING_PRODUCT",
          plotCropCategory: "Leaflet",
          storeProductName: "สมุดฉีกและเอกสารคู่มือเกษตรกร",
          storeQuantityCases: 80,
          plotCropName: "เล่ม",
          storePricePerCase: new Prisma.Decimal(50),
          storeTotalAmount: new Prisma.Decimal(4000),
          detail: "สมุดฉีกและเอกสารคู่มือเกษตรกร 80 เล่ม รวม 4,000 บาท",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_10",
          plotOwnerName: "แปลงเรียนรู้การเกษตรดอนเจดีย์",
          plotCropName: "ข้าวสุพรรณบุรี 50",
          plotProductName: "เทอรา-ซอร์บ : 12x1 ลิตร",
          meetingAttendeesCount: 50,
          saleTotalPrice: new Prisma.Decimal(25000),
          detail: "จัดงาน Field Day แสดงนวัตกรรมและผลผลิตทางการเกษตรระดับแปลงใหญ่",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_5",
          customerName: "นายวุฒิชัย เกิดผล(ลาดหลุมแก้วพาณิชย์)",
          surveyStoreName: "นายวุฒิชัย เกิดผล(ลาดหลุมแก้วพาณิชย์)",
          surveyCompetitorProduct: "ปุ๋ยเคมีตราคู่แข่ง",
          detail: "ร่วมสำรวจราคาสินค้าคู่แข่งในพื้นที่",
        },
        {
          itemOrder: 2,
          workTypeCode: "TYPE_11",
          customerName: "นายวุฒิชัย เกิดผล(ลาดหลุมแก้วพาณิชย์)",
          detail: "ตรวจนับสต็อกสินค้าคงเหลือและเช็กความต้องการสั่งซื้อเพิ่ม",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_7",
          plotActivityType: "FOLLOW_UP",
          plotOwnerName: "นายวิรุธ รุจิวงศ์",
          plotProductName: "เทอรา-ซอร์บ : 12x1 ลิตร",
          plotCropCategory: "ไม้ผล",
          plotCropName: "ทุเรียนหมอนทอง",
          plotAreaRai: new Prisma.Decimal(5),
          plotTreeCount: 100,
          detail: "จัดกิจกรรมแปลงสาธิตและบันทึกภาพผลการเจริญเติบโตของพืชสำหรับจัดทำสื่อ",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_3",
          customerName: "นายสุนทร เกตุกิตติสกุล(ต.การเกษตร)",
          saleProductName: "อัคคาบัน : 12x1 กิโลกรัม",
          saleQuantity: 50,
          saleUnitPrice: new Prisma.Decimal(305),
          saleTotalPrice: new Prisma.Decimal(15250),
          detail: "เสนอขายสินค้าและโปรโมชั่นพิเศษแก่ร้านค้ารายใหม่ (เตรียมสำหรับการกด Reject)",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_6",
          customerName: "นายอนุวัฒน์ คำมันตรี(สำรวยบริการ)",
          issueType: "คุณภาพสินค้า",
          detail: "ลงพื้นที่ตรวจสอบข้อร้องเรียนคุณภาพสินค้า (เตรียมสำหรับการกด Request Correction)",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_2",
          customerName: "นายวิรุธ รุจิวงศ์",
          followupProductName: "อัลเทอร่า แมกนีเซียม ซิงค์ : 12x1 ลิตร",
          detail: "ติดตามผลการใช้ปุ๋ยและสารเสริมชีวภาพ (เตรียมสำหรับการแก้ไขและ Resubmit)",
        },
      ],
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
      items: [
        {
          itemOrder: 1,
          workTypeCode: "TYPE_1",
          customerName: "นายวุฒิชัย เกิดผล(ลาดหลุมแก้วพาณิชย์)",
          visitTopic: "แจ้งข่าวสาร",
          detail: "เข้าพบร้านค้าและตรวจเยี่ยมเกษตรกร (เตรียมสำหรับการทดสอบปฏิทินนัดหมาย)",
        },
      ],
    },
  ];

  console.log("📝 Upserting UAT Activity Plans in DRAFT status with Work Type Items...\n");

  const seededPlans = [];
  let totalItemsCreated = 0;

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
      await db.activityPlanItem.deleteMany({ where: { activityPlanId: plan.id } });
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
          salesPromotionBudgetRequested: s.spBudget > 0 ? new Prisma.Decimal(s.spBudget) : null,
          marketingBudgetRequested: s.mktBudget > 0 ? new Prisma.Decimal(s.mktBudget) : null,
          totalBudgetRequested: new Prisma.Decimal(totalBudget),
          status: ActivityStatus.DRAFT,
        },
      });
    }

    // Link Work Types
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

    // Create Activity Plan Items
    if (s.items && s.items.length > 0) {
      for (const item of s.items) {
        await db.activityPlanItem.create({
          data: {
            activityPlanId: plan.id,
            ...item,
          },
        });
        totalItemsCreated++;
      }
    }

    // Link Helpers (Status: PENDING)
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
      itemsCount: s.items?.length || 0,
      budget: totalBudget > 0 ? `${totalBudget.toLocaleString()} บาท (SP: ${s.spBudget}, MKT: ${s.mktBudget})` : "0 บาท",
      helpersCount: s.helpers.length,
      status: plan.status,
      expectedWorkflow: s.expectedWorkflow,
    });
  }

  // 4. Output Summary Table
  console.log("═════════════════════════════════════════════════════════════════════════════════════════════════════════════════");
  console.log(`📊 UAT TEST DATA SEEDING COMPLETE (${seededPlans.length} SCENARIOS PROCESSED, ${totalItemsCreated} ITEMS CREATED)`);
  console.log("═════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n");

  if (seededPlans.length > 0) {
    console.table(
      seededPlans.map((p) => ({
        ID: p.code,
        Creator: p.creator,
        "Work Types": p.workTypes,
        Items: p.itemsCount,
        Budget: p.budget,
        Helpers: p.helpersCount,
        Status: p.status,
      }))
    );
  }

  return { seededPlans, totalItemsCreated };
}

// Direct CLI execution handler
if (require.main === module) {
  const isCleanup = process.argv.includes("--cleanup");
  const codeArg = process.argv.find((arg) => arg.startsWith("--code="));
  const rawTargetCode = codeArg ? codeArg.split("=")[1] : undefined;

  if (isCleanup) {
    cleanupUatActivityPlans(prisma, rawTargetCode)
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
