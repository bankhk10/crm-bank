import { PrismaClient, ActivityStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType11(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const store2 = ctx.customers[2] || ctx.customers[0];

  const prod0 = ctx.products[0];
  const prod1 = ctx.products[1] || ctx.products[0];
  const prod2 = ctx.products[2] || ctx.products[0];

  // Plan 1: Multi-store + Multi-product (3 products per store) + Normalized Stock Audit Results + APPROVED
  await upsertSeedPlan(prisma, {
    code: "TP2608S111",
    title: "ตรวจเช็กสต็อกสินค้าคงคลังหน้าร้านตัวแทนจำหน่าย สุพรรณบุรี",
    primaryWorkTypeCode: "TYPE_11",
    startDate: new Date("2026-08-22T09:00:00.000Z"),
    endDate: new Date("2026-08-22T17:00:00.000Z"),
    province: "สุพรรณบุรี",
    district: "สองพี่น้อง",
    location: "ร้านค้าตัวแทน อ.สองพี่น้อง จ.สุพรรณบุรี",
    objective: "นับสต็อกสินค้าคงเหลือ เช็กวันหมดอายุ และประเมินโอกาสการสั่งซื้อซ้ำ",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-15T09:00:00.000Z"),
    approvedAt: new Date("2026-08-16T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_11", storeId: store0.id, storeName: store0.name, remarks: "สาขาหลักตลาดสองพี่น้อง" },
      { workTypeCode: "TYPE_11", storeId: store1.id, storeName: store1.name, remarks: "สาขาริมคลอง" },
    ],
    products: [
      { workTypeCode: "TYPE_11", storeId: store0.id, productId: prod0.id, productName: prod0.name },
      { workTypeCode: "TYPE_11", storeId: store0.id, productId: prod1.id, productName: prod1.name },
      { workTypeCode: "TYPE_11", storeId: store0.id, productId: prod2.id, productName: prod2.name },
      { workTypeCode: "TYPE_11", storeId: store1.id, productId: prod0.id, productName: prod0.name },
      { workTypeCode: "TYPE_11", storeId: store1.id, productId: prod1.id, productName: prod1.name },
      { workTypeCode: "TYPE_11", storeId: store1.id, productId: prod2.id, productName: prod2.name },
    ],
    items: [
      { workTypeCode: "TYPE_11", customerName: store0.name, detail: "ตรวจนับสต็อกสินค้ากลุ่มบำรุงพืชและกำจัดแมลง" },
      { workTypeCode: "TYPE_11", customerName: store1.name, detail: "ตรวจสอบสภาพกล่องและวันหมดอายุสินค้าค้างสต็อก" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-15T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-16T10:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-22T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-22T16:00:00.000Z"),
      actualAttendeesCount: 3,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "ตรวจนับครบทั้ง 2 ร้านค้า สินค้าบางรายการของขาดเนื่องจากเกษตรกรเข้าซื้อช่วงฝนตกชุก แนะนำให้ร้านค้าสั่งเพิ่มด่วน",
      recordedById: ctx.adminUser.id,
      stockResults: [
        // Store 0 results
        { storeId: store0.id, productId: prod0.id, remainingQuantity: 18, stockStatus: "ปกติ", reorderOpportunity: "ต่ำ", remarks: "สต็อกเพียงพอสำหรับ 2 สัปดาห์" },
        { storeId: store0.id, productId: prod1.id, remainingQuantity: 3, stockStatus: "ใกล้หมด", reorderOpportunity: "สูง", remarks: "เหลือ 3 ลัง ร้านค้าเตรียมเปิดบิลสั่ง 20 ลัง" },
        { storeId: store0.id, productId: prod2.id, remainingQuantity: 0, stockStatus: "ของขาด", reorderOpportunity: "สูง", remarks: "ของหมดเกลี้ยง เกษตรกรมาถามหาทุกวัน" },
        // Store 1 results
        { storeId: store1.id, productId: prod0.id, remainingQuantity: 12, stockStatus: "ปกติ", reorderOpportunity: "ต่ำ", remarks: "หมุนเวียนได้ดี" },
        { storeId: store1.id, productId: prod1.id, remainingQuantity: 2, stockStatus: "ใกล้หมด", reorderOpportunity: "สูง", remarks: "เตรียมสั่งเติมสต็อก" },
        { storeId: store1.id, productId: prod2.id, remainingQuantity: 1, stockStatus: "ใกล้หมด", reorderOpportunity: "สูง", remarks: "เหลือกล่องสุดท้ายบนชั้นวาง" },
      ],
    },
  });

  // Plan 2: Store 2 Audit + APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S112",
    title: "เช็กสต็อกสินค้าคงคลัง ชัยนาท",
    primaryWorkTypeCode: "TYPE_11",
    startDate: new Date("2026-08-24T09:00:00.000Z"),
    endDate: new Date("2026-08-24T17:00:00.000Z"),
    province: "ชัยนาท",
    district: "หันคา",
    location: "ร้านค้าตัวแทน อ.หันคา จ.ชัยนาท",
    objective: "ตรวจสอบยอดสต็อกก่อนปิดรอบประจำเดือน",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-16T09:00:00.000Z"),
    approvedAt: new Date("2026-08-17T11:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_11", storeId: store2.id, storeName: store2.name },
    ],
    products: [
      { workTypeCode: "TYPE_11", storeId: store2.id, productId: prod0.id, productName: prod0.name },
      { workTypeCode: "TYPE_11", storeId: store2.id, productId: prod1.id, productName: prod1.name },
    ],
    items: [
      { workTypeCode: "TYPE_11", customerName: store2.name, detail: "นับสินค้าพร้อมตรวจสอบล็อตผลิต" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-16T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-17T11:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-24T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-24T15:00:00.000Z"),
      actualAttendeesCount: 2,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "ตรวจนับสต็อกตรงกับระบบบัญชีร้านค้า",
      recordedById: ctx.adminUser.id,
      stockResults: [
        { storeId: store2.id, productId: prod0.id, remainingQuantity: 15, stockStatus: "ปกติ", reorderOpportunity: "ต่ำ", remarks: "สภาพกล่องเรียบร้อย" },
        { storeId: store2.id, productId: prod1.id, remainingQuantity: 8, stockStatus: "ปกติ", reorderOpportunity: "ต่ำ", remarks: "สต็อกพร้อมขาย" },
      ],
    },
  });

  // Plan 3: PENDING_LINE_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S113",
    title: "แผนตรวจสต็อกรอบปลายเดือน ลพบุรี",
    primaryWorkTypeCode: "TYPE_11",
    startDate: new Date("2026-08-30T09:00:00.000Z"),
    endDate: new Date("2026-08-30T17:00:00.000Z"),
    province: "ลพบุรี",
    district: "เมืองลพบุรี",
    location: "ร้านค้าตัวแทน อ.เมือง จ.ลพบุรี",
    objective: "ตรวจนับสินค้าคงคลังและเช็กสต็อกสินค้าโปรโมชั่น",
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-22T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_11", storeId: store0.id, storeName: store0.name },
    ],
    products: [
      { workTypeCode: "TYPE_11", storeId: store0.id, productId: prod0.id, productName: prod0.name },
    ],
    items: [
      { workTypeCode: "TYPE_11", customerName: store0.name, detail: "นับสินค้า 10 รายการหลัก" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-22T10:00:00.000Z") },
    ],
  });
}
