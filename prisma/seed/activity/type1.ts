import { PrismaClient, ActivityStatus, ActivityHelperStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus, AttachmentCategory } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType1(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const store2 = ctx.customers[2] || ctx.customers[0];
  const store3 = ctx.customers[3] || ctx.customers[0];

  const helper0 = ctx.helperEmployees[0];
  const helper1 = ctx.helperEmployees[1] || ctx.helperEmployees[0];

  // Plan 1: Multi-store + Multiple Helpers + APPROVED + Actual Result
  await upsertSeedPlan(prisma, {
    code: "TP2608S011",
    title: "เข้าพบร้านค้าตัวแทนและกลุ่มเกษตรกรแปลงใหญ่ โซนสุพรรณบุรี",
    primaryWorkTypeCode: "TYPE_1",
    startDate: new Date("2026-08-10T09:00:00.000Z"),
    endDate: new Date("2026-08-11T17:00:00.000Z"),
    province: "สุพรรณบุรี",
    district: "เมืองสุพรรณบุรี",
    location: "ร้านค้าตัวแทนจำหน่ายและแปลงเกษตรกร ต.ท่าพี่เลี้ยง อ.เมือง จ.สุพรรณบุรี",
    objective: "เข้าพบเพื่อชี้แจงโปรโมชั่นฤดูกาลใหม่และรับฟังความคิดเห็นเกษตรกร",
    description: "กระชับความสัมพันธ์กับร้านค้าและเกษตรกรชั้นนำในพื้นที่",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-01T08:30:00.000Z"),
    approvedAt: new Date("2026-08-03T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_1", storeId: store0.id, storeName: store0.name, remarks: "ร้านค้าหลักโซนในเมือง" },
      { workTypeCode: "TYPE_1", storeId: store1.id, storeName: store1.name, remarks: "ร้านค้าซับดีลเลอร์" },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-02T09:00:00.000Z") },
      { employeeId: helper1.id, departmentId: helper1.departmentId, departmentName: helper1.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-02T09:00:00.000Z") },
    ],
    items: [
      { workTypeCode: "TYPE_1", customerName: store0.name, visitTopic: "ชี้แจงแคมเปญส่งเสริมการขาย Q3", detail: "แนะนำรายการสะสมแต้มและโปรโมชั่นแถมสินค้า" },
      { workTypeCode: "TYPE_1", customerName: store1.name, visitTopic: "เข้าพบเกษตรกรแปลงใหญ่ สวนทุเรียน", detail: "สอบถามปัญหาการใช้สารกำจัดแมลงช่วงฝนตกชุก" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, comment: "ส่งขออนุมัติตามสายงาน", createdAt: new Date("2026-08-01T08:30:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, comment: "อนุมัติแผนงานเรียบร้อย", createdAt: new Date("2026-08-03T10:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-10T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-11T16:30:00.000Z"),
      actualAttendeesCount: 6,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "เข้าพบครบทั้ง 2 ร้านค้า เกษตรกรพึงพอใจในประสิทธิภาพสินค้าและโปรโมชั่นรอบใหม่",
      discussionResult: "ร้านค้าพร้อมผลักดันสินค้าตัวใหม่เข้าสู่ชั้นวางเพิ่ม 3 รายการ",
      productAdvice: "แนะนำให้ฉีดพ่นช่วงเช้าแดดอ่อนเพื่อลดการชะล้างจากน้ำฝน",
      salesOpportunity: "คาดว่ามียอดสั่งซื้อเปิดบิลใหม่ประมาณ 80,000 บาท",
      nextMeetingDate: new Date("2026-09-15T09:00:00.000Z"),
      recordedById: ctx.adminUser.id,
      attachments: [
        { workTypeCode: "TYPE_1", storeId: store0.id, category: AttachmentCategory.ATMOSPHERE, fileUrl: "/uploads/activity-plans-seed/meeting-sample-1.svg", fileName: "visit-atmosphere-01.svg" },
      ],
    },
  });

  // Plan 2: PENDING_LINE_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S012",
    title: "เข้าพบร้านค้าตรวจเยี่ยมนครปฐม",
    primaryWorkTypeCode: "TYPE_1",
    startDate: new Date("2026-08-25T09:00:00.000Z"),
    endDate: new Date("2026-08-25T17:00:00.000Z"),
    province: "นครปฐม",
    district: "กำแพงแสน",
    location: "ร้านค้าตัวแทน อ.กำแพงแสน จ.นครปฐม",
    objective: "ตรวจเยี่ยมและประสานงานขาย",
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-15T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_1", storeId: store2.id, storeName: store2.name },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.PENDING },
    ],
    items: [
      { workTypeCode: "TYPE_1", customerName: store2.name, visitTopic: "เจรจาแผนการกระจายสินค้า", detail: "เตรียมโปรโมชั่นก่อนฤดูเก็บเกี่ยว" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, comment: "ส่งแผนงานขออนุมัติ", createdAt: new Date("2026-08-15T10:00:00.000Z") },
    ],
  });

  // Plan 3: DRAFT
  await upsertSeedPlan(prisma, {
    code: "TP2608S013",
    title: "แผนเข้าพบเกษตรกรรายใหญ่ ราชบุรี (แบบร่าง)",
    primaryWorkTypeCode: "TYPE_1",
    startDate: new Date("2026-08-29T09:00:00.000Z"),
    endDate: new Date("2026-08-29T17:00:00.000Z"),
    province: "ราชบุรี",
    district: "โพธาราม",
    location: "สวนเกษตรอินทรีย์ อ.โพธาราม จ.ราชบุรี",
    objective: "สำรวจความต้องการใช้งานผลิตภัณฑ์",
    status: ActivityStatus.DRAFT,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    stores: [
      { workTypeCode: "TYPE_1", storeId: store3.id, storeName: store3.name },
    ],
    items: [
      { workTypeCode: "TYPE_1", customerName: store3.name, visitTopic: "แนะนำนวัตกรรมสารบำรุงพืช", detail: "ทดสอบการใช้สารบำรุงทางใบ" },
    ],
  });
}
