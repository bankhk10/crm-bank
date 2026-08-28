import { PrismaClient, ActivityStatus, ActivityHelperStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus, AttachmentCategory } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType10(prisma: PrismaClient, ctx: SeedContext) {
  const helper0 = ctx.helperEmployees[0];
  const helper1 = ctx.helperEmployees[1] || ctx.helperEmployees[0];

  // Plan 1: Large Scale Event + Multiple Helpers + Budget + Farmers Count + APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S101",
    title: "จัดงานวันถ่ายทอดเทคโนโลยีการเกษตร (Field Day) นครราชสีมา",
    primaryWorkTypeCode: "TYPE_10",
    startDate: new Date("2026-08-21T08:00:00.000Z"),
    endDate: new Date("2026-08-21T17:00:00.000Z"),
    province: "นครราชสีมา",
    district: "พิมาย",
    location: "ศูนย์เรียนรู้การเพิ่มประสิทธิภาพการผลิตสินค้าเกษตร (ศพก.) อ.พิมาย จ.นครราชสีมา",
    objective: "สาธิตการใช้เทคโนโลยีอารักขาพืชและจัดนิทรรศการองค์ความรู้เกษตรแม่นยำ",
    description: "ร่วมมือกับเกษตรอำเภอและสหกรณ์ จัดฐานเรียนรู้ 4 ฐาน มีเกษตรกรเข้าร่วมกว่า 120 คน",
    marketingBudgetRequested: 15000,
    marketingBudgetApproved: 15000,
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-10T09:00:00.000Z"),
    approvedAt: new Date("2026-08-12T14:00:00.000Z"),
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-11T10:00:00.000Z") },
      { employeeId: helper1.id, departmentId: helper1.departmentId, departmentName: helper1.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-11T10:00:00.000Z") },
    ],
    items: [
      {
        workTypeCode: "TYPE_10",
        customerName: "เกษตรกรกลุ่มผู้ปลูกมันสำปะหลังและข้าว อ.พิมาย",
        meetingTopic: "งานวันฟิลด์เดย์ อารักขาพืชยุคใหม่สู้ภัยแล้ง",
        meetingAttendeesCount: 120,
        detail: "จัดฐานเรียนรู้โรคพืช ฐานการใช้ปุ๋ย และฐานสาธิตแปลงจริง",
      },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-10T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.BUDGET_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, comment: "อนุมัติงบจัดงาน Field Day", createdAt: new Date("2026-08-12T14:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-21T08:00:00.000Z"),
      actualEndDate: new Date("2026-08-21T16:30:00.000Z"),
      actualAttendeesCount: 135,
      farmersCount: 130,
      actualMarketingSpent: 14200,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "งานสำเร็จลุล่วงด้วยดี มีเกษตรกรและผู้นำชุมชนเข้าร่วม 135 คน ได้รับคำชื่นชมจากเกษตรอำเภอ",
      discussionResult: "เกษตรกรสนใจเทคโนโลยีสารเสริมประสิทธิภาพเป็นพิเศษ และขอให้จัดต่อเนื่องทุกปี",
      recordedById: ctx.adminUser.id,
      attachments: [
        { workTypeCode: "TYPE_10", category: AttachmentCategory.ATMOSPHERE, fileUrl: "/uploads/activity-plans-seed/meeting-sample-1.svg", fileName: "field-day-atmosphere.svg" },
      ],
    },
  });

  // Plan 2: PENDING_LINE_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S102",
    title: "จัดงานฟิลด์เดย์ ข้าวโพดแปลงใหญ่ เพชรบูรณ์",
    primaryWorkTypeCode: "TYPE_10",
    startDate: new Date("2026-08-31T08:30:00.000Z"),
    endDate: new Date("2026-08-31T17:00:00.000Z"),
    province: "เพชรบูรณ์",
    district: "หล่มสัก",
    location: "แปลงใหญ่ข้าวโพด ต.หล่มสัก อ.หล่มสัก จ.เพชรบูรณ์",
    objective: "สาธิตการใช้โดรนการเกษตรพ่นสารบำรุง",
    marketingBudgetRequested: 10000,
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-23T09:00:00.000Z"),
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.PENDING },
    ],
    items: [
      { workTypeCode: "TYPE_10", meetingTopic: "การใช้โดรนพ่นยาอย่างมีประสิทธิภาพและปลอดภัย", meetingAttendeesCount: 80, detail: "สาธิตบินโดรนแปลงจริง 10 ไร่" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-23T09:00:00.000Z") },
    ],
  });

  // Plan 3: APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S103",
    title: "งานฟิลด์เดย์แปลงสาธิตข้าว ขอนแก่น",
    primaryWorkTypeCode: "TYPE_10",
    startDate: new Date("2026-08-16T08:30:00.000Z"),
    endDate: new Date("2026-08-16T17:00:00.000Z"),
    province: "ขอนแก่น",
    district: "น้ำพอง",
    location: "ศพก. อ.น้ำพอง จ.ขอนแก่น",
    objective: "สรุปผลแปลงสาธิตข้าว",
    marketingBudgetRequested: 7000,
    marketingBudgetApproved: 7000,
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-06T09:00:00.000Z"),
    approvedAt: new Date("2026-08-07T11:00:00.000Z"),
    items: [
      { workTypeCode: "TYPE_10", meetingTopic: "สรุปผลแปลงสาธิตพันธุ์ข้าวและสารอาหารพืช", meetingAttendeesCount: 60 },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-06T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-07T11:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-16T08:30:00.000Z"),
      actualEndDate: new Date("2026-08-16T16:00:00.000Z"),
      actualAttendeesCount: 68,
      farmersCount: 65,
      actualMarketingSpent: 6800,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "มีเกษตรกรเข้าร่วม 68 คน ชมนิทรรศการและแปลงทดลองจริงอย่างสนใจ",
      recordedById: ctx.adminUser.id,
    },
  });
}
