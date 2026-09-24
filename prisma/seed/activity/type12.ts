import { PrismaClient, ActivityStatus, ActivityApprovalAction, ActivityApprovalStep, TourType, TourSize } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType12(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];

  // Plan 1: Tour Central Large + APPROVED (NO ACTUAL RESULT)
  await upsertSeedPlan(prisma, {
    code: "TP2608S121",
    title: "โครงการทัวร์ทัศนศึกษาดูงานนวัตกรรมการเกษตร ประเทศญี่ปุ่น (ทัวร์ใหญ่)",
    primaryWorkTypeCode: "TYPE_12",
    startDate: new Date("2026-09-10T00:00:00.000Z"),
    endDate: new Date("2026-09-16T23:59:59.000Z"),
    province: "กรุงเทพมหานคร",
    district: "เขตดอนเมือง",
    location: "ท่าอากาศยานดอนเมือง - ประเทศญี่ปุ่น (โตเกียว, ฮอกไกโด)",
    objective: "พาลูกค้าตัวแทนจำหน่ายยอดเยี่ยมประจำปี 2568 ศึกษาดูงานแปลงเกษตรอัจฉริยะ",
    description: "ทัวร์ใหญ่สำหรับผู้ทำยอดขายทะลุเป้าประจำปี 20 ที่นั่ง",
    marketingBudgetRequested: 85000,
    marketingBudgetApproved: 85000,
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-01T09:00:00.000Z"),
    approvedAt: new Date("2026-08-05T14:00:00.000Z"),
    tour: {
      tourType: TourType.CENTRAL,
      tourSize: TourSize.LARGE,
      country: "ญี่ปุ่น",
      destination: "โตเกียว - ฮอกไกโด",
    },
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, comment: "เสนอขออนุมัติโครงการทัวร์ใหญ่ญี่ปุ่น", createdAt: new Date("2026-08-01T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.BUDGET_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, comment: "อนุมัติตามงบประมาณและรายชื่อตัวแทนยอดเยี่ยม", createdAt: new Date("2026-08-05T14:00:00.000Z") },
    ],
    // NO ACTUAL RESULT FOR TYPE_12
  });

  // Plan 2: Tour Central Small + PENDING_LINE_APPROVAL (NO ACTUAL RESULT)
  await upsertSeedPlan(prisma, {
    code: "TP2608S122",
    title: "โครงการทัวร์ทัศนศึกษาดูงาน ประเทศเวียดนาม (ทัวร์เล็ก)",
    primaryWorkTypeCode: "TYPE_12",
    startDate: new Date("2026-09-22T00:00:00.000Z"),
    endDate: new Date("2026-09-25T23:59:59.000Z"),
    province: "กรุงเทพมหานคร",
    district: "เขตบางพลี",
    location: "ท่าอากาศยานสุวรรณภูมิ - เมืองดานัง ประเทศเวียดนาม",
    objective: "พาตัวแทนจำหน่ายระดับภูมิภาคศึกษาดูงานตลาดส่งออกสินค้าเกษตร",
    marketingBudgetRequested: 35000,
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-18T10:00:00.000Z"),
    tour: {
      tourType: TourType.CENTRAL,
      tourSize: TourSize.SMALL,
      country: "เวียดนาม",
      destination: "ดานัง - ฮอยอัน",
    },
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-18T10:00:00.000Z") },
    ],
    // NO ACTUAL RESULT FOR TYPE_12
  });

  // Plan 3: Tour Store + APPROVED (NO ACTUAL RESULT)
  await upsertSeedPlan(prisma, {
    code: "TP2608S123",
    title: "ทัวร์ร้านค้าและศึกษาดูงานแปลงเกษตรต้นแบบภาคเหนือ (ทัวร์ร้านค้า)",
    primaryWorkTypeCode: "TYPE_12",
    startDate: new Date("2026-09-05T00:00:00.000Z"),
    endDate: new Date("2026-09-07T23:59:59.000Z"),
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
    location: "จ.เชียงใหม่ และ จ.เชียงราย",
    objective: "พาทีมงานและลูกค้าร้านค้าหลักสัมมนาและศึกษาดูงานแปลงไม้ผลโครงการหลวง",
    marketingBudgetRequested: 28000,
    marketingBudgetApproved: 28000,
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-07T09:00:00.000Z"),
    approvedAt: new Date("2026-08-09T14:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_12", storeId: store0.id, storeName: store0.name },
    ],
    tour: {
      tourType: TourType.STORE,
      storeId: store0.id,
      destination: "เชียงใหม่ - เชียงราย",
    },
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-07T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.BUDGET_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-09T14:00:00.000Z") },
    ],
    // NO ACTUAL RESULT FOR TYPE_12
  });
}
