import { PrismaClient, ActivityStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus, AttachmentCategory } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType6(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const prod0 = ctx.products[0];
  const prod1 = ctx.products[1] || ctx.products[0];

  // Plan 1: Product Issue + Resolution + ISSUE Attachment + APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S061",
    title: "ตรวจสอบและแก้ปัญหาผลิตภัณฑ์ตกตะกอน ร้านค้าตัวแทน นครนายก",
    primaryWorkTypeCode: "TYPE_6",
    startDate: new Date("2026-08-17T09:00:00.000Z"),
    endDate: new Date("2026-08-17T17:00:00.000Z"),
    province: "นครนายก",
    district: "บ้านนา",
    location: "ร้านค้าตัวแทนจำหน่าย อ.บ้านนา จ.นครนายก",
    objective: "เข้าตรวจสอบสินค้าที่มีการแจ้งปัญหาและดำเนินการเปลี่ยนสินค้าล็อตใหม่",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-10T09:00:00.000Z"),
    approvedAt: new Date("2026-08-11T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_6", storeId: store0.id, storeName: store0.name },
    ],
    products: [
      { workTypeCode: "TYPE_6", storeId: store0.id, productId: prod0.id, productName: prod0.name },
    ],
    items: [
      { workTypeCode: "TYPE_6", customerName: store0.name, issueType: "สินค้าตกตะกอน / แยกชั้น", detail: "เกษตรกรแจ้งพบตะกอนที่ก้นขวดในล็อตผลิต LOT2605" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-10T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-11T10:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-17T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-17T15:00:00.000Z"),
      actualAttendeesCount: 3,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "ตรวจสอบตัวอย่างสินค้า 3 ขวด พบการแยกชั้นจริง ได้นำสินค้าล็อตใหม่ LOT2607 มาเปลี่ยนทดแทนให้ร้านค้าครบจำนวน 1 ลัง",
      problemFound: "เกิดจากการเก็บสินค้าโดนแสงแดดโดยตรงในโกดังชั่วคราว",
      nextAction: "ส่งตัวอย่างให้ฝ่าย QA ตรวจสอบเพิ่มเติม และแนะนำการจัดเก็บในที่ร่มอุณหภูมิปกติ",
      recordedById: ctx.adminUser.id,
      attachments: [
        { workTypeCode: "TYPE_6", storeId: store0.id, productId: prod0.id, category: AttachmentCategory.ISSUE, fileUrl: "/uploads/activity-plans-seed/issue-sample-1.svg", fileName: "issue-evidence-sediment.svg" },
      ],
    },
  });

  // Plan 2: WAITING_FOR_CORRECTION
  await upsertSeedPlan(prisma, {
    code: "TP2608S062",
    title: "ตรวจสอบการรั่วซึมของฝาบรรจุภัณฑ์ ปราจีนบุรี",
    primaryWorkTypeCode: "TYPE_6",
    startDate: new Date("2026-08-27T09:00:00.000Z"),
    endDate: new Date("2026-08-27T17:00:00.000Z"),
    province: "ปราจีนบุรี",
    district: "กบินทร์บุรี",
    location: "ร้านค้าการเกษตร อ.กบินทร์บุรี จ.ปราจีนบุรี",
    objective: "เข้าตรวจเช็กการรั่วซึม",
    status: ActivityStatus.WAITING_FOR_CORRECTION,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-18T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_6", storeId: store1.id, storeName: store1.name },
    ],
    products: [
      { workTypeCode: "TYPE_6", storeId: store1.id, productId: prod1.id, productName: prod1.name },
    ],
    items: [
      { workTypeCode: "TYPE_6", customerName: store1.name, issueType: "ฝาบรรจุภัณฑ์หลวม / รั่วซึม", detail: "พบกล่องเปียกชื้น 2 กล่อง" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-18T10:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.REQUEST_CORRECTION, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.WAITING_FOR_CORRECTION, comment: "กรุณาระบุเลขล็อตสินค้าเพิ่มเติมในช่องรายละเอียด", createdAt: new Date("2026-08-19T11:00:00.000Z") },
    ],
  });

  // Plan 3: APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S063",
    title: "แก้ไขปัญหาอัตราผสมยากำจัดหญ้า สระแก้ว",
    primaryWorkTypeCode: "TYPE_6",
    startDate: new Date("2026-08-22T09:00:00.000Z"),
    endDate: new Date("2026-08-22T17:00:00.000Z"),
    province: "สระแก้ว",
    district: "วังน้ำเย็น",
    location: "แปลงเกษตรกร ต.วังน้ำเย็น จ.สระแก้ว",
    objective: "สาธิตอัตราการผสมยาที่ถูกต้อง",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-14T09:00:00.000Z"),
    approvedAt: new Date("2026-08-15T11:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_6", storeId: store0.id, storeName: store0.name },
    ],
    items: [
      { workTypeCode: "TYPE_6", customerName: store0.name, issueType: "ข้อสงสัยประสิทธิภาพผลิตภัณฑ์", detail: "เกษตรกรเข้าใจว่ายาไม่ตาย เนื่องจากใช้น้ำกร่อยผสม" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-14T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-15T11:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-22T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-22T14:30:00.000Z"),
      actualAttendeesCount: 2,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "สาธิตผสมด้วยน้ำสะอาด pH 6.5 ผลการทดสอบหญ้าเริ่มเหี่ยวเฉาภายใน 48 ชั่วโมง",
      problemFound: "เกษตรกรใช้น้ำบาดาลที่มีฤทธิ์เป็นด่างสูงในการผสมยา",
      nextAction: "จัดทำเอกสารคู่มือแนะนำคุณภาพน้ำในการผสมยาแจกจ่ายร้านค้า",
      recordedById: ctx.adminUser.id,
    },
  });
}
