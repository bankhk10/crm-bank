import { PrismaClient, ActivityStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType4(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const store2 = ctx.customers[2] || ctx.customers[0];

  // Plan 1: Multi-store + Collect Amounts + APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S041",
    title: "วางบิลและติดตามเก็บเงินรอบประจำเดือน สิงหาคม นครปฐม",
    primaryWorkTypeCode: "TYPE_4",
    startDate: new Date("2026-08-15T09:00:00.000Z"),
    endDate: new Date("2026-08-15T17:00:00.000Z"),
    province: "นครปฐม",
    district: "เมืองนครปฐม",
    location: "ร้านค้าตัวแทนจำหน่าย อ.เมือง จ.นครปฐม",
    objective: "วางบิลรอบสิ้นงวดและรับเช็คชำระค่าสินค้า",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-08T09:00:00.000Z"),
    approvedAt: new Date("2026-08-09T11:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_4", storeId: store0.id, storeName: store0.name, remarks: "รอบบิลที่ 1" },
      { workTypeCode: "TYPE_4", storeId: store1.id, storeName: store1.name, remarks: "รอบบิลที่ 2" },
    ],
    items: [
      { workTypeCode: "TYPE_4", customerName: store0.name, collectAmount: 45000, detail: "วางบิลใบส่งของเลขที่ IV69012" },
      { workTypeCode: "TYPE_4", customerName: store1.name, collectAmount: 32500, detail: "รับเช็คชำระค่าสินค้าครบกำหนด" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-08T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-09T11:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-15T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-15T15:30:00.000Z"),
      actualAttendeesCount: 2,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "วางบิลและรับชำระเงินเรียบร้อยครบทั้ง 2 ร้านค้า เอกสารครบถ้วน",
      collectResultAmount: 77500,
      discussionResult: "ร้านค้าขอให้ส่งสำเนาใบเสร็จรับเงินทางอีเมลเพิ่มเติม",
      recordedById: ctx.adminUser.id,
    },
  });

  // Plan 2: PENDING_LINE_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S042",
    title: "เก็บเงินค่าสินค้าค้างชำระ สุพรรณบุรี",
    primaryWorkTypeCode: "TYPE_4",
    startDate: new Date("2026-08-27T09:00:00.000Z"),
    endDate: new Date("2026-08-27T17:00:00.000Z"),
    province: "สุพรรณบุรี",
    district: "อู่ทอง",
    location: "ร้านค้าตัวแทน อ.อู่ทอง จ.สุพรรณบุรี",
    objective: "ติดตามยอดชำระ",
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-18T09:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_4", storeId: store2.id, storeName: store2.name },
    ],
    items: [
      { workTypeCode: "TYPE_4", customerName: store2.name, collectAmount: 28000, detail: "เก็บเงินสดตามใบวางบิล" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-18T09:00:00.000Z") },
    ],
  });

  // Plan 3: DRAFT
  await upsertSeedPlan(prisma, {
    code: "TP2608S043",
    title: "วางบิลต้นเดือน กันยายน ปทุมธานี",
    primaryWorkTypeCode: "TYPE_4",
    startDate: new Date("2026-09-02T09:00:00.000Z"),
    endDate: new Date("2026-09-02T17:00:00.000Z"),
    province: "ปทุมธานี",
    district: "คลองหลวง",
    location: "ร้านค้าตัวแทน อ.คลองหลวง จ.ปทุมธานี",
    objective: "วางบิลตามรอบเครดิต",
    status: ActivityStatus.DRAFT,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    stores: [
      { workTypeCode: "TYPE_4", storeId: store0.id, storeName: store0.name },
    ],
    items: [
      { workTypeCode: "TYPE_4", customerName: store0.name, collectAmount: 52000, detail: "วางบิล 3 ใบแจ้งหนี้" },
    ],
  });
}
