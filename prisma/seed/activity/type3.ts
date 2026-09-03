import { PrismaClient, ActivityStatus, ActivityHelperStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType3(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const store2 = ctx.customers[2] || ctx.customers[0];

  const prod0 = ctx.products[0];
  const prod1 = ctx.products[1] || ctx.products[0];
  const prod2 = ctx.products[2] || ctx.products[0];

  const price0 = Number(prod0.price) || 385;
  const price1 = Number(prod1.price) || 320;
  const price2 = Number(prod2.price) || 305;

  const helper0 = ctx.helperEmployees[0];

  // Plan 1: Multi-store + Multi-product (3 products) + Target vs Actual + APPROVED
  await upsertSeedPlan(prisma, {
    code: "TP2608S031",
    title: "เสนอขายสินค้าเปิดฤดูกาลเพาะปลูก ร้านค้าตัวแทนหลัก สระบุรี-ลพบุรี",
    primaryWorkTypeCode: "TYPE_3",
    startDate: new Date("2026-08-14T09:00:00.000Z"),
    endDate: new Date("2026-08-15T17:00:00.000Z"),
    province: "สระบุรี",
    district: "เมืองสระบุรี",
    location: "ร้านค้าตัวแทนจำหน่าย อ.เมือง จ.สระบุรี และ อ.เมือง จ.ลพบุรี",
    objective: "ผลักดันยอดขายกลุ่มสารกำจัดแมลงและปุ๋ยธาตุอาหารรองเข้าสต็อกร้านค้า",
    description: "จัดโปรโมชั่นซื้อครบ 20 ลังแถม 1 ลัง เพื่อกระตุ้นยอดขายต้นฤดู",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-05T10:00:00.000Z"),
    approvedAt: new Date("2026-08-07T11:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_3", storeId: store0.id, storeName: store0.name, remarks: "สาขาสระบุรี" },
      { workTypeCode: "TYPE_3", storeId: store1.id, storeName: store1.name, remarks: "สาขาลพบุรี" },
    ],
    products: [
      { workTypeCode: "TYPE_3", storeId: store0.id, productId: prod0.id, productName: prod0.name, targetQuantity: 20, unitPrice: price0, targetAmount: 20 * price0 },
      { workTypeCode: "TYPE_3", storeId: store0.id, productId: prod1.id, productName: prod1.name, targetQuantity: 30, unitPrice: price1, targetAmount: 30 * price1 },
      { workTypeCode: "TYPE_3", storeId: store1.id, productId: prod2.id, productName: prod2.name, targetQuantity: 15, unitPrice: price2, targetAmount: 15 * price2 },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-06T14:00:00.000Z") },
    ],
    items: [
      { workTypeCode: "TYPE_3", customerName: store0.name, saleProductName: prod0.name, saleQuantity: 20, saleUnitPrice: price0, saleTotalPrice: 20 * price0, detail: "เป้าหมายเปิดบิลสินค้าล็อตแรก" },
      { workTypeCode: "TYPE_3", customerName: store0.name, saleProductName: prod1.name, saleQuantity: 30, saleUnitPrice: price1, saleTotalPrice: 30 * price1, detail: "โปรโมชั่นแพ็กเกจคู่" },
      { workTypeCode: "TYPE_3", customerName: store1.name, saleProductName: prod2.name, saleQuantity: 15, saleUnitPrice: price2, saleTotalPrice: 15 * price2, detail: "สั่งซื้อสต็อกสำรอง" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, comment: "ส่งแผนขออนุมัติยอดขาย", createdAt: new Date("2026-08-05T10:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, comment: "อนุมัติแผนงานขาย", createdAt: new Date("2026-08-07T11:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-14T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-15T16:00:00.000Z"),
      actualAttendeesCount: 5,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "ปิดการขายได้ตามเป้าหมาย ร้านค้าสั่งซื้อเพิ่มจากรายการส่งเสริมการขาย",
      salesResultAmount: 22 * price0 + 30 * price1 + 15 * price2,
      salesOrdersCount: 2,
      discussionResult: "ร้านค้าให้ความมั่นใจว่าจะระบายสินค้าได้หมดภายใน 1 เดือน",
      salesOpportunity: "มีโอกาสสั่งเพิ่มรอบที่ 2 ช่วงกลางเดือนกันยายน",
      recordedById: ctx.adminUser.id,
      saleResults: [
        { workTypeCode: "TYPE_3", storeId: store0.id, productId: prod0.id, productName: prod0.name, actualQuantity: 22, actualUnitPrice: price0, actualTotal: 22 * price0 },
        { workTypeCode: "TYPE_3", storeId: store0.id, productId: prod1.id, productName: prod1.name, actualQuantity: 30, actualUnitPrice: price1, actualTotal: 30 * price1 },
        { workTypeCode: "TYPE_3", storeId: store1.id, productId: prod2.id, productName: prod2.name, actualQuantity: 15, actualUnitPrice: price2, actualTotal: 15 * price2 },
      ],
    },
  });

  // Plan 2: Target vs Actual Variance + APPROVED
  await upsertSeedPlan(prisma, {
    code: "TP2608S032",
    title: "เสนอขายสินค้ากระตุ้นสต็อก อ่างทอง",
    primaryWorkTypeCode: "TYPE_3",
    startDate: new Date("2026-08-18T09:00:00.000Z"),
    endDate: new Date("2026-08-18T17:00:00.000Z"),
    province: "อ่างทอง",
    district: "โพธิ์ทอง",
    location: "ร้านค้าตัวแทน อ.โพธิ์ทอง จ.อ่างทอง",
    objective: "เสนอขายสินค้าปุ๋ยทางใบ",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-08T09:00:00.000Z"),
    approvedAt: new Date("2026-08-09T15:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_3", storeId: store2.id, storeName: store2.name },
    ],
    products: [
      { workTypeCode: "TYPE_3", storeId: store2.id, productId: prod0.id, productName: prod0.name, targetQuantity: 40, unitPrice: price0, targetAmount: 40 * price0 },
      { workTypeCode: "TYPE_3", storeId: store2.id, productId: prod1.id, productName: prod1.name, targetQuantity: 20, unitPrice: price1, targetAmount: 20 * price1 },
    ],
    items: [
      { workTypeCode: "TYPE_3", customerName: store2.name, saleProductName: prod0.name, saleQuantity: 40, saleUnitPrice: price0, saleTotalPrice: 40 * price0 },
      { workTypeCode: "TYPE_3", customerName: store2.name, saleProductName: prod1.name, saleQuantity: 20, saleUnitPrice: price1, saleTotalPrice: 20 * price1 },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-08T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-09T15:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-18T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-18T16:00:00.000Z"),
      actualAttendeesCount: 2,
      resultStatus: ActivityResultStatus.PARTIAL,
      resultSummary: "ปิดการขายได้ 35 ลังสำหรับสินค้าหลัก เนื่องจากสต็อกเดิมยังมีคงเหลือบางส่วน",
      salesResultAmount: 35 * price0 + 20 * price1,
      salesOrdersCount: 1,
      recordedById: ctx.adminUser.id,
      saleResults: [
        { workTypeCode: "TYPE_3", storeId: store2.id, productId: prod0.id, productName: prod0.name, actualQuantity: 35, actualUnitPrice: price0, actualTotal: 35 * price0, unclosedReason: "ร้านค้าขอลดจำนวน 5 ลังเนื่องจากเนื้อที่เก็บในโกดังเต็ม" },
        { workTypeCode: "TYPE_3", storeId: store2.id, productId: prod1.id, productName: prod1.name, actualQuantity: 20, actualUnitPrice: price1, actualTotal: 20 * price1 },
      ],
    },
  });

  // Plan 3: PENDING_LINE_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S033",
    title: "เสนอขายสินค้าตัวใหม่ นนทบุรี",
    primaryWorkTypeCode: "TYPE_3",
    startDate: new Date("2026-08-28T09:00:00.000Z"),
    endDate: new Date("2026-08-28T17:00:00.000Z"),
    province: "นนทบุรี",
    district: "บางบัวทอง",
    location: "ร้านค้าตัวแทน อ.บางบัวทอง จ.นนทบุรี",
    objective: "เสนอขายสินค้ารอบพิเศษ",
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-20T09:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_3", storeId: store0.id, storeName: store0.name },
    ],
    products: [
      { workTypeCode: "TYPE_3", storeId: store0.id, productId: prod0.id, productName: prod0.name, targetQuantity: 15, unitPrice: price0, targetAmount: 15 * price0 },
    ],
    items: [
      { workTypeCode: "TYPE_3", customerName: store0.name, saleProductName: prod0.name, saleQuantity: 15, saleUnitPrice: price0, saleTotalPrice: 15 * price0 },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-20T09:00:00.000Z") },
    ],
  });
}
