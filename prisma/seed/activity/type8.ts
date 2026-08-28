import { PrismaClient, ActivityStatus, ActivityHelperStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus, AttachmentCategory } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType8(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const store2 = ctx.customers[2] || ctx.customers[0];

  const helper0 = ctx.helperEmployees[0];
  const helper1 = ctx.helperEmployees[1] || ctx.helperEmployees[0];

  // Plan 1: Multiple Helpers + Budget + Meeting Attendees + APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S081",
    title: "จัดประชุมวิชาการเกษตรกรและตัวแทนจำหน่าย โซนสุพรรณบุรี-อ่างทอง",
    primaryWorkTypeCode: "TYPE_8",
    startDate: new Date("2026-08-18T09:00:00.000Z"),
    endDate: new Date("2026-08-18T17:00:00.000Z"),
    province: "สุพรรณบุรี",
    district: "ศรีประจันต์",
    location: "หอประชุมสหกรณ์การเกษตร อ.ศรีประจันต์ จ.สุพรรณบุรี",
    objective: "ถ่ายทอดเทคโนโลยีการจัดการโรคแมลงในนาข้าวและนำเสนอสินค้าไฮไลท์",
    description: "มีเกษตรกรกลุ่มเป้าหมายเข้าร่วม 50 ราย และตัวแทนจำหน่ายร่วมจัดบูธ",
    marketingBudgetRequested: 5000,
    marketingBudgetApproved: 5000,
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-08T09:00:00.000Z"),
    approvedAt: new Date("2026-08-10T15:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_8", storeId: store0.id, storeName: store0.name },
      { workTypeCode: "TYPE_8", storeId: store1.id, storeName: store1.name },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-09T10:00:00.000Z") },
      { employeeId: helper1.id, departmentId: helper1.departmentId, departmentName: helper1.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-09T10:00:00.000Z") },
    ],
    items: [
      {
        workTypeCode: "TYPE_8",
        customerName: store0.name,
        meetingTopic: "เทคนิคการจัดการเพลี้ยกระโดดสีน้ำตาลและหนอนห่อใบข้าว",
        meetingAttendeesCount: 50,
        meetingTargetProducts: "คอนซัลท์, พาเหรด 84",
        detail: "บรรยายวิชาการ 2 ชม. และสาธิตการใช้สารกำจัดแมลง",
      },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-08T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.BUDGET_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, comment: "อนุมัติงบประมาณและแผนการจัดประชุม", createdAt: new Date("2026-08-10T15:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-18T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-18T16:00:00.000Z"),
      actualAttendeesCount: 55,
      actualMarketingSpent: 4800,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "มีเกษตรกรเข้าร่วม 55 ราย (เกินเป้า 10%) มีการตอบข้อซักถามอย่างคึกคักและยอดจองสินค้าหน้าร้าน 40 ลัง",
      discussionResult: "เกษตรกรส่วนใหญ่ต้องการให้จัดอบรมต่อเนื่องช่วงก่อนเก็บเกี่ยว",
      recordedById: ctx.adminUser.id,
      attachments: [
        { workTypeCode: "TYPE_8", storeId: store0.id, category: AttachmentCategory.ATMOSPHERE, fileUrl: "/uploads/activity-plans-seed/meeting-sample-1.svg", fileName: "meeting-farmers-suphan.svg" },
      ],
    },
  });

  // Plan 2: PENDING_BUDGET_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S082",
    title: "ประชุมสัมมนาตัวแทนจำหน่ายย่อย นครสวรรค์",
    primaryWorkTypeCode: "TYPE_8",
    startDate: new Date("2026-08-28T09:00:00.000Z"),
    endDate: new Date("2026-08-28T17:00:00.000Z"),
    province: "นครสวรรค์",
    district: "เมืองนครสวรรค์",
    location: "โรงแรมไม้หอมรีสอร์ท อ.เมือง จ.นครสวรรค์",
    objective: "ชี้แจงเป้าหมายและแคมเปญส่งเสริมการขาย",
    marketingBudgetRequested: 8000,
    status: ActivityStatus.PENDING_BUDGET_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-18T14:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_8", storeId: store2.id, storeName: store2.name },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.PENDING },
    ],
    items: [
      { workTypeCode: "TYPE_8", customerName: store2.name, meetingTopic: "ประชุมสัมมนาคู่ค้ารายย่อยภาคเหนือตอนล่าง", meetingAttendeesCount: 30, detail: "สรุปผลงานครึ่งปีแรก" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-18T14:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.PENDING_BUDGET_APPROVAL, createdAt: new Date("2026-08-19T09:00:00.000Z") },
    ],
  });

  // Plan 3: APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S083",
    title: "ประชุมกลุ่มผู้ปลูกข้าวโพดเลี้ยงสัตว์ ลพบุรี",
    primaryWorkTypeCode: "TYPE_8",
    startDate: new Date("2026-08-23T09:00:00.000Z"),
    endDate: new Date("2026-08-23T17:00:00.000Z"),
    province: "ลพบุรี",
    district: "พัฒนานิคม",
    location: "ศาลาประชาคม ต.พัฒนานิคม จ.ลพบุรี",
    objective: "อบรมการป้องกันหนอนเจาะฝักข้าวโพด",
    marketingBudgetRequested: 3000,
    marketingBudgetApproved: 3000,
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-14T09:00:00.000Z"),
    approvedAt: new Date("2026-08-15T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_8", storeId: store0.id, storeName: store0.name },
    ],
    items: [
      { workTypeCode: "TYPE_8", customerName: store0.name, meetingTopic: "เทคนิคการพ่นสารเคมีในข้าวโพด", meetingAttendeesCount: 25 },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-14T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-15T10:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-23T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-23T15:00:00.000Z"),
      actualAttendeesCount: 28,
      actualMarketingSpent: 2900,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "การอบรมประสบความสำเร็จ มีเกษตรกรทดลองซื้อสินค้าตัวอย่างไปใช้ 15 ราย",
      recordedById: ctx.adminUser.id,
    },
  });
}
