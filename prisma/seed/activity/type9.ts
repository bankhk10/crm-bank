import { PrismaClient, ActivityStatus, ActivityHelperStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus, AttachmentCategory } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType9(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const store2 = ctx.customers[2] || ctx.customers[0];

  const prod0 = ctx.products[0];
  const prod1 = ctx.products[1] || ctx.products[0];

  const price0 = Number(prod0.price) || 385;
  const price1 = Number(prod1.price) || 320;

  const helper0 = ctx.helperEmployees[0];
  const helper1 = ctx.helperEmployees[1] || ctx.helperEmployees[0];

  // Plan 1: Multi-store + Promotion Budget + Numeric Validations + APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S091",
    title: "จัดกิจกรรมส่งเสริมการขายและตั้งบูธหน้าร้าน สุพรรณบุรี-ชัยนาท",
    primaryWorkTypeCode: "TYPE_9",
    startDate: new Date("2026-08-19T08:30:00.000Z"),
    endDate: new Date("2026-08-20T17:00:00.000Z"),
    province: "สุพรรณบุรี",
    district: "เดิมบางนางบวช",
    location: "หน้าร้านค้าตัวแทนจำหน่าย อ.เดิมบางนางบวช จ.สุพรรณบุรี และ อ.สรรคบุรี จ.ชัยนาท",
    objective: "กระตุ้นยอดขายหน้าร้านโดยการจัดกิจกรรมหมุนวงล้อและแจกของสมนาคุณเมื่อซื้อสินค้าครบตามยอด",
    description: "มีเจ้าหน้าที่ไปช่วยจัดบูธ แนะนำสินค้า และจัดรายการนาทีทอง",
    salesPromotionBudgetRequested: 6000,
    salesPromotionBudgetApproved: 6000,
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-09T09:00:00.000Z"),
    approvedAt: new Date("2026-08-11T16:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_9", storeId: store0.id, storeName: store0.name, remarks: "กิจกรรมวันที่ 1" },
      { workTypeCode: "TYPE_9", storeId: store1.id, storeName: store1.name, remarks: "กิจกรรมวันที่ 2" },
    ],
    products: [
      { workTypeCode: "TYPE_9", storeId: store0.id, productId: prod0.id, productName: prod0.name, targetQuantity: 30, unitPrice: price0, targetAmount: 30 * price0 },
      { workTypeCode: "TYPE_9", storeId: store1.id, productId: prod1.id, productName: prod1.name, targetQuantity: 25, unitPrice: price1, targetAmount: 25 * price1 },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-10T11:00:00.000Z") },
      { employeeId: helper1.id, departmentId: helper1.departmentId, departmentName: helper1.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-10T11:00:00.000Z") },
    ],
    items: [
      {
        workTypeCode: "TYPE_9",
        customerName: store0.name,
        storeProductName: prod0.name,
        storeQuantityCases: 30,
        storePricePerCase: price0,
        storeTotalAmount: 30 * price0,
        detail: "จัดบูธหน้าร้าน แจกเสื้อยืดและคูปองส่วนลด",
      },
      {
        workTypeCode: "TYPE_9",
        customerName: store1.name,
        storeProductName: prod1.name,
        storeQuantityCases: 25,
        storePricePerCase: price1,
        storeTotalAmount: 25 * price1,
        detail: "กิจกรรมซื้อ 2 แถม 1 หน้าร้าน",
      },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-09T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.BUDGET_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, comment: "อนุมัติงบส่งเสริมการขาย", createdAt: new Date("2026-08-11T16:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-19T08:30:00.000Z"),
      actualEndDate: new Date("2026-08-20T16:30:00.000Z"),
      actualAttendeesCount: 80,
      actualSalesPromotionSpent: 5700,
      salesResultAmount: 28 * price0 + 25 * price1,
      salesOrdersCount: 18,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "กิจกรรมหน้าร้านได้รับความสนใจอย่างมาก มีเกษตรกรแวะร่วมกิจกรรมตลอดทั้งสองวัน ขายสินค้ารวม 53 ลัง",
      discussionResult: "ร้านค้าพอใจมากและต้องการให้จัดซ้ำทุกไตรมาส",
      recordedById: ctx.adminUser.id,
      saleResults: [
        { workTypeCode: "TYPE_9", storeId: store0.id, productId: prod0.id, productName: prod0.name, actualQuantity: 28, actualUnitPrice: price0, actualTotal: 28 * price0 },
        { workTypeCode: "TYPE_9", storeId: store1.id, productId: prod1.id, productName: prod1.name, actualQuantity: 25, actualUnitPrice: price1, actualTotal: 25 * price1 },
      ],
      attachments: [
        { workTypeCode: "TYPE_9", storeId: store0.id, category: AttachmentCategory.ATMOSPHERE, fileUrl: "/uploads/activity-plans-seed/meeting-sample-1.svg", fileName: "store-event-booth.svg" },
      ],
    },
  });

  // Plan 2: PENDING_BUDGET_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S092",
    title: "จัดกิจกรรมหน้าร้านเปิดสาขาใหม่ สิงห์บุรี",
    primaryWorkTypeCode: "TYPE_9",
    startDate: new Date("2026-08-29T09:00:00.000Z"),
    endDate: new Date("2026-08-29T17:00:00.000Z"),
    province: "สิงห์บุรี",
    district: "อินทร์บุรี",
    location: "ร้านค้าตัวแทน อ.อินทร์บุรี จ.สิงห์บุรี",
    objective: "จัดกิจกรรมฉลองเปิดสาขาใหม่",
    salesPromotionBudgetRequested: 4500,
    status: ActivityStatus.PENDING_BUDGET_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-20T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_9", storeId: store2.id, storeName: store2.name },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.PENDING },
    ],
    items: [
      { workTypeCode: "TYPE_9", customerName: store2.name, storeProductName: prod0.name, storeQuantityCases: 20, storePricePerCase: price0, storeTotalAmount: 20 * price0 },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-20T10:00:00.000Z") },
    ],
  });

  // Plan 3: APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S093",
    title: "กิจกรรมหน้าร้านโปรโมชั่นวันแม่ นครสวรรค์",
    primaryWorkTypeCode: "TYPE_9",
    startDate: new Date("2026-08-12T09:00:00.000Z"),
    endDate: new Date("2026-08-12T17:00:00.000Z"),
    province: "นครสวรรค์",
    district: "โกรกพระ",
    location: "ร้านค้าการเกษตร อ.โกรกพระ จ.นครสวรรค์",
    objective: "กระตุ้นยอดขายช่วงวันหยุด",
    salesPromotionBudgetRequested: 2500,
    salesPromotionBudgetApproved: 2500,
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-04T09:00:00.000Z"),
    approvedAt: new Date("2026-08-05T11:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_9", storeId: store0.id, storeName: store0.name },
    ],
    items: [
      { workTypeCode: "TYPE_9", customerName: store0.name, storeProductName: prod1.name, storeQuantityCases: 15, storePricePerCase: price1, storeTotalAmount: 15 * price1 },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-04T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-05T11:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-12T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-12T16:00:00.000Z"),
      actualAttendeesCount: 45,
      actualSalesPromotionSpent: 2400,
      salesResultAmount: 15 * price1,
      salesOrdersCount: 8,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "ขายหมดตามเป้า 15 ลัง เกษตรกรตอบรับดี",
      recordedById: ctx.adminUser.id,
      saleResults: [
        { workTypeCode: "TYPE_9", storeId: store0.id, productId: prod1.id, productName: prod1.name, actualQuantity: 15, actualUnitPrice: price1, actualTotal: 15 * price1 },
      ],
    },
  });
}
