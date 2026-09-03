import { PrismaClient, ActivityStatus, ActivityHelperStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus, AttachmentCategory } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType2(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const prod0 = ctx.products[0];
  const prod1 = ctx.products[1] || ctx.products[0];
  const helper0 = ctx.helperEmployees[0];

  // Plan 1: Multi-store + Multi-product + APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S021",
    title: "ติดตามผลการใช้สารบำรุงพืชและกำจัดเชื้อรา โซนเพชรบุรี",
    primaryWorkTypeCode: "TYPE_2",
    startDate: new Date("2026-08-12T09:00:00.000Z"),
    endDate: new Date("2026-08-12T17:00:00.000Z"),
    province: "เพชรบุรี",
    district: "ท่ายาง",
    location: "แปลงกล้วยไม้และไม้ผล ต.ท่ายาง อ.ท่ายาง จ.เพชรบุรี",
    objective: "ติดตามประสิทธิภาพหลังฉีดพ่น 14 วัน และเก็บตัวอย่างผลผลิต",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-05T09:00:00.000Z"),
    approvedAt: new Date("2026-08-06T14:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_2", storeId: store0.id, storeName: store0.name },
      { workTypeCode: "TYPE_2", storeId: store1.id, storeName: store1.name },
    ],
    products: [
      { workTypeCode: "TYPE_2", storeId: store0.id, productId: prod0.id, productName: prod0.name },
      { workTypeCode: "TYPE_2", storeId: store1.id, productId: prod1.id, productName: prod1.name },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-06T10:00:00.000Z") },
    ],
    items: [
      { workTypeCode: "TYPE_2", customerName: store0.name, followupProductName: prod0.name, detail: "ตรวจสอบการแตกตาดอกและใบคู่แรกหลังใช้" },
      { workTypeCode: "TYPE_2", customerName: store1.name, followupProductName: prod1.name, detail: "ประเมินการควบคุมโรคราใบไหม้" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, comment: "ขออนุมัติติดตามผลสินค้า", createdAt: new Date("2026-08-05T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, comment: "อนุมัติแผนติดตามผล", createdAt: new Date("2026-08-06T14:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-12T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-12T16:00:00.000Z"),
      actualAttendeesCount: 3,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "พืชมีการแตกรากและตาดอกสมบูรณ์ โรคราใบไหม้ลดลงกว่า 85%",
      discussionResult: "เกษตรกรยินดีเป็นแปลงตัวอย่างสำหรับการถ่ายทอดเทคโนโลยี",
      productAdvice: "ให้ฉีดพ่นซ้ำอีก 1 ครั้งหลังตัดแต่งกิ่ง",
      recordedById: ctx.adminUser.id,
      attachments: [
        { workTypeCode: "TYPE_2", storeId: store0.id, productId: prod0.id, category: AttachmentCategory.CROP, fileUrl: "/uploads/activity-plans-seed/crop-sample-1.svg", fileName: "crop-result-orchard.svg" },
      ],
    },
  });

  // Plan 2: PENDING_LINE_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S022",
    title: "ติดตามผลสารกำจัดแมลงในสวนส้ม กาญจนบุรี",
    primaryWorkTypeCode: "TYPE_2",
    startDate: new Date("2026-08-26T09:00:00.000Z"),
    endDate: new Date("2026-08-26T17:00:00.000Z"),
    province: "กาญจนบุรี",
    district: "ท่าม่วง",
    location: "สวนส้มโชกุน อ.ท่าม่วง จ.กาญจนบุรี",
    objective: "ตรวจเช็กอัตราการเข้าทำลายของเพลี้ยไฟ",
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-16T11:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_2", storeId: store1.id, storeName: store1.name },
    ],
    products: [
      { workTypeCode: "TYPE_2", storeId: store1.id, productId: prod0.id, productName: prod0.name },
    ],
    items: [
      { workTypeCode: "TYPE_2", customerName: store1.name, followupProductName: prod0.name, detail: "สุ่มตรวจยอดส้ม 50 ยอด" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, comment: "ส่งแผนงานขออนุมัติ", createdAt: new Date("2026-08-16T11:00:00.000Z") },
    ],
  });

  // Plan 3: DRAFT
  await upsertSeedPlan(prisma, {
    code: "TP2608S023",
    title: "ติดตามผลการใช้ปุ๋ยทางใบ ข้าวนาปี อยุธยา",
    primaryWorkTypeCode: "TYPE_2",
    startDate: new Date("2026-08-30T09:00:00.000Z"),
    endDate: new Date("2026-08-30T17:00:00.000Z"),
    province: "พระนครศรีอยุธยา",
    district: "บางปะหัน",
    location: "แปลงนาข้าว ต.บางปะหัน จ.พระนครศรีอยุธยา",
    objective: "เปรียบเทียบการแตกกอกับแปลงข้างเคียง",
    status: ActivityStatus.DRAFT,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    stores: [
      { workTypeCode: "TYPE_2", storeId: store0.id, storeName: store0.name },
    ],
    products: [
      { workTypeCode: "TYPE_2", storeId: store0.id, productId: prod1.id, productName: prod1.name },
    ],
    items: [
      { workTypeCode: "TYPE_2", customerName: store0.name, followupProductName: prod1.name, detail: "นับจำนวนต้นต่อกอและวัดความสูง" },
    ],
  });
}
