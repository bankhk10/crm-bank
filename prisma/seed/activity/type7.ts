import { PrismaClient, Prisma, ActivityStatus, ActivityHelperStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus, AttachmentCategory, DemoPlotStatus } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType7(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const prod0 = ctx.products[0];
  const prod1 = ctx.products[1] || ctx.products[0];
  const helper0 = ctx.helperEmployees[0];

  // Plan 1: Demo Plot Creation + APPROVED + Actual
  const plan1Res = await upsertSeedPlan(prisma, {
    code: "TP2608S071",
    title: "ทำแปลงสาธิตบำรุงทุเรียนหมอนทอง จันทบุรี",
    primaryWorkTypeCode: "TYPE_7",
    startDate: new Date("2026-08-11T09:00:00.000Z"),
    endDate: new Date("2026-08-11T17:00:00.000Z"),
    province: "จันทบุรี",
    district: "ท่าใหม่",
    location: "สวนทุเรียนนายสมชาย อ.ท่าใหม่ จ.จันทบุรี",
    objective: "เริ่มต้นทำแปลงสาธิตและเก็บข้อมูลแปลงรอบที่ 1",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-03T09:00:00.000Z"),
    approvedAt: new Date("2026-08-04T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_7", storeId: store0.id, storeName: store0.name },
    ],
    products: [
      { workTypeCode: "TYPE_7", storeId: store0.id, productId: prod0.id, productName: prod0.name },
    ],
    helpers: [
      { employeeId: helper0.id, departmentId: helper0.departmentId, departmentName: helper0.departmentName, status: ActivityHelperStatus.APPROVED, approvedById: ctx.managerEmployee.id, approvedAt: new Date("2026-08-04T09:00:00.000Z") },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-03T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-04T10:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-11T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-11T16:00:00.000Z"),
      actualAttendeesCount: 3,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "พ่นสารบำรุงรอบที่ 1 เรียบร้อย ติดตั้งป้ายแปลงสาธิตและเก็บภาพสภาพแปลงก่อนฉีดพ่น",
      demoPlotsCreated: 1,
      demoPlotsFollowedUp: 0,
      discussionResult: "เกษตรกรให้ความร่วมมือดีมาก และบันทึกตารางการให้น้ำสม่ำเสมอ",
      recordedById: ctx.adminUser.id,
      attachments: [
        { workTypeCode: "TYPE_7", storeId: store0.id, productId: prod0.id, category: AttachmentCategory.PLOT, fileUrl: "/uploads/activity-plans-seed/plot-overview-1.svg", fileName: "demo-plot-overview.svg" },
        { workTypeCode: "TYPE_7", storeId: store0.id, productId: prod0.id, category: AttachmentCategory.CROP, fileUrl: "/uploads/activity-plans-seed/crop-sample-1.svg", fileName: "demo-durian-leaves.svg" },
      ],
    },
  });

  // Upsert Type 7A Target 1
  await prisma.activityPlanType7aTarget.upsert({
    where: { code: "DP2608S001" },
    update: {
      activityPlanId: plan1Res.planId,
      plotName: "แปลงสาธิตทุเรียนหมอนทอง สวนนายสมชาย",
      storeId: store0.id,
      dealerName: store0.name,
      cropCategory: "พืชสวน",
      cropName: "ทุเรียน",
      areaRai: new Prisma.Decimal(5.0),
      treeCount: 100,
      objective: "ทดสอบการส่งเสริมการแตกใบอ่อนและการสะสมอาหารก่อนออกดอก",
      status: DemoPlotStatus.IN_PROGRESS,
    },
    create: {
      code: "DP2608S001",
      activityPlanId: plan1Res.planId,
      plotName: "แปลงสาธิตทุเรียนหมอนทอง สวนนายสมชาย",
      storeId: store0.id,
      dealerName: store0.name,
      cropCategory: "พืชสวน",
      cropName: "ทุเรียน",
      areaRai: new Prisma.Decimal(5.0),
      treeCount: 100,
      objective: "ทดสอบการส่งเสริมการแตกใบอ่อนและการสะสมอาหารก่อนออกดอก",
      status: DemoPlotStatus.IN_PROGRESS,
    },
  });

  // Plan 2: Demo Plot Follow Up + Evaluation + APPROVED + Actual
  const plan2Res = await upsertSeedPlan(prisma, {
    code: "TP2608S072",
    title: "ตรวจประเมินผลผลิตและปิดแปลงสาธิตข้าว สุพรรณบุรี",
    primaryWorkTypeCode: "TYPE_7",
    startDate: new Date("2026-08-20T09:00:00.000Z"),
    endDate: new Date("2026-08-20T17:00:00.000Z"),
    province: "สุพรรณบุรี",
    district: "เดิมบางนางบวช",
    location: "แปลงนาข้าวนายวีระ อ.เดิมบางนางบวช จ.สุพรรณบุรี",
    objective: "ชั่งน้ำหนักผลผลิตเปรียบเทียบแปลงควบคุมและปิดแปลงสาธิต",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-12T09:00:00.000Z"),
    approvedAt: new Date("2026-08-13T11:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_7", storeId: store0.id, storeName: store0.name },
    ],
    products: [
      { workTypeCode: "TYPE_7", storeId: store0.id, productId: prod1.id, productName: prod1.name },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-12T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-13T11:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-20T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-20T16:00:00.000Z"),
      actualAttendeesCount: 4,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "ผลผลิตเฉลี่ยแปลงสาธิต 650 กก./ไร่ แปลงควบคุม 520 กก./ไร่ เพิ่มขึ้น 25%",
      demoPlotsCreated: 0,
      demoPlotsFollowedUp: 1,
      farmersCount: 4,
      recordedById: ctx.adminUser.id,
      attachments: [
        { workTypeCode: "TYPE_7", storeId: store0.id, productId: prod1.id, category: AttachmentCategory.CROP, fileUrl: "/uploads/activity-plans-seed/crop-sample-1.svg", fileName: "demo-rice-harvest.svg" },
      ],
    },
  });

  // Upsert Type 7A Target 2
  await prisma.activityPlanType7aTarget.upsert({
    where: { code: "DP2608S002" },
    update: {
      activityPlanId: plan2Res.planId,
      plotName: "แปลงสาธิตข้าวหอมมะลิ สวนนายวีระ",
      storeId: store0.id,
      dealerName: store0.name,
      cropCategory: "พืชไร่",
      cropName: "ข้าว",
      areaRai: new Prisma.Decimal(10.0),
      objective: "ทดสอบการเพิ่มผลผลิตและลดอัตราเมล็ดลีบ",
      status: DemoPlotStatus.COMPLETED,
      closedDate: new Date("2026-08-20T00:00:00.000Z"),
    },
    create: {
      code: "DP2608S002",
      activityPlanId: plan2Res.planId,
      plotName: "แปลงสาธิตข้าวหอมมะลิ สวนนายวีระ",
      storeId: store0.id,
      dealerName: store0.name,
      cropCategory: "พืชไร่",
      cropName: "ข้าว",
      areaRai: new Prisma.Decimal(10.0),
      objective: "ทดสอบการเพิ่มผลผลิตและลดอัตราเมล็ดลีบ",
      status: DemoPlotStatus.COMPLETED,
      closedDate: new Date("2026-08-20T00:00:00.000Z"),
    },
  });

  // Plan 3: PENDING_LINE_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S073",
    title: "แผนทำแปลงสาธิตข้าวโพดหวาน นครราชสีมา",
    primaryWorkTypeCode: "TYPE_7",
    startDate: new Date("2026-08-29T09:00:00.000Z"),
    endDate: new Date("2026-08-29T17:00:00.000Z"),
    province: "นครราชสีมา",
    district: "ปากช่อง",
    location: "แปลงเกษตรกร อ.ปากช่อง จ.นครราชสีมา",
    objective: "เตรียมทำแปลงสาธิตกำจัดหนอนกระทู้ข้าวโพดลายจุด",
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-22T09:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_7", storeId: store0.id, storeName: store0.name },
    ],
    products: [
      { workTypeCode: "TYPE_7", storeId: store0.id, productId: prod0.id, productName: prod0.name },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-22T09:00:00.000Z") },
    ],
  });
}
