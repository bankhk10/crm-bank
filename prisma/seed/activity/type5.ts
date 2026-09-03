import { PrismaClient, ActivityStatus, ActivityApprovalAction, ActivityApprovalStep, ActivityResultStatus, AttachmentCategory } from "@prisma/client";
import { SeedContext, upsertSeedPlan } from "./seed-helpers";

export async function seedType5(prisma: PrismaClient, ctx: SeedContext) {
  const store0 = ctx.customers[0];
  const store1 = ctx.customers[1] || ctx.customers[0];
  const store2 = ctx.customers[2] || ctx.customers[0];

  const prod0 = ctx.products[0];
  const prod1 = ctx.products[1] || ctx.products[0];

  // Plan 1: Multi-store + Multi-product + Normalized Survey Results + Price Tag & Shelf Attachments + APPROVED
  await upsertSeedPlan(prisma, {
    code: "TP2608S051",
    title: "สำรวจราคาและโปรโมชั่นสินค้าคู่แข่งในตลาดร้านค้าตัวแทน ฉะเชิงเทรา-ชลบุรี",
    primaryWorkTypeCode: "TYPE_5",
    startDate: new Date("2026-08-16T09:00:00.000Z"),
    endDate: new Date("2026-08-17T17:00:00.000Z"),
    province: "ฉะเชิงเทรา",
    district: "บางคล้า",
    location: "ร้านค้าการเกษตร อ.บางคล้า จ.ฉะเชิงเทรา และ อ.พนัสนิคม จ.ชลบุรี",
    objective: "สำรวจราคาขายหน้าร้านของสินค้าคู่แข่งหลักและตรวจสอบการจัดเรียงสินค้าบนชั้นวาง",
    description: "รวบรวมข้อมูลราคา โปรโมชั่นแถม และส่วนลดเงินสดของคู่แข่ง",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-08T10:00:00.000Z"),
    approvedAt: new Date("2026-08-10T14:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_5", storeId: store0.id, storeName: store0.name, remarks: "ร้านค้าฉะเชิงเทรา" },
      { workTypeCode: "TYPE_5", storeId: store1.id, storeName: store1.name, remarks: "ร้านค้าชลบุรี" },
    ],
    products: [
      { workTypeCode: "TYPE_5", storeId: store0.id, productId: prod0.id, productName: prod0.name },
      { workTypeCode: "TYPE_5", storeId: store0.id, productId: prod1.id, productName: prod1.name },
      { workTypeCode: "TYPE_5", storeId: store1.id, productId: prod0.id, productName: prod0.name },
      { workTypeCode: "TYPE_5", storeId: store1.id, productId: prod1.id, productName: prod1.name },
    ],
    items: [
      { workTypeCode: "TYPE_5", customerName: store0.name, surveyStoreName: store0.name, surveyCompetitorProduct: "สารบำรุงพืช แบรนด์ A", detail: "สำรวจราคาขวด 1 ลิตร" },
      { workTypeCode: "TYPE_5", customerName: store0.name, surveyStoreName: store0.name, surveyCompetitorProduct: "สารป้องกันเชื้อรา แบรนด์ B", detail: "สำรวจโปรโมชั่นตัดราคา" },
      { workTypeCode: "TYPE_5", customerName: store1.name, surveyStoreName: store1.name, surveyCompetitorProduct: "สารบำรุงพืช แบรนด์ A", detail: "สำรวจส่วนลดซื้อยกลัง" },
      { workTypeCode: "TYPE_5", customerName: store1.name, surveyStoreName: store1.name, surveyCompetitorProduct: "สารป้องกันเชื้อรา แบรนด์ B", detail: "สำรวจของแถมหน้าร้าน" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-08T10:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-10T14:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-16T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-17T16:00:00.000Z"),
      actualAttendeesCount: 4,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "สำรวจครบ 2 ร้านค้า พบว่าคู่แข่งมีการปรับลดราคาลง 5% เพื่อเร่งระบายสต็อกก่อนหมดอายุ",
      discussionResult: "ร้านค้าแนะนำให้บริษัทจัดโปรโมชั่นแถมขวดเล็กสำหรับทดลองใช้",
      recordedById: ctx.adminUser.id,
      surveyResults: [
        // Store 0 - Product 0
        { storeId: store0.id, productId: prod0.id, competitorBrand: "เคมีเกษตรสยาม", competitorProduct: "ซุปเปอร์โกร 1 ลิตร", competitorPrice: 350, competitorUnit: "ขวด", promotionDetail: "ซื้อ 10 ขวดแถมเสื้อยืด 1 ตัว" },
        // Store 0 - Product 1
        { storeId: store0.id, productId: prod1.id, competitorBrand: "ไบโอฟาร์ม", competitorProduct: "ควิกการ์ด 1 ลิตร", competitorPrice: 295, competitorUnit: "ขวด", promotionDetail: "ลดทันที 15 บาทเมื่อซื้อเงินสด" },
        // Store 1 - Product 0
        { storeId: store1.id, productId: prod0.id, competitorBrand: "เคมีเกษตรสยาม", competitorProduct: "ซุปเปอร์โกร 1 ลิตร", competitorPrice: 345, competitorUnit: "ขวด", promotionDetail: "ซื้อยกลังลด 3%" },
        // Store 1 - Product 1
        { storeId: store1.id, productId: prod1.id, competitorBrand: "ไบโอฟาร์ม", competitorProduct: "ควิกการ์ด 1 ลิตร", competitorPrice: 290, competitorUnit: "ขวด", promotionDetail: "แถมหมวกปีกกว้าง" },
      ],
      attachments: [
        // Store 0 attachments
        { workTypeCode: "TYPE_5", storeId: store0.id, productId: prod0.id, category: AttachmentCategory.PRICE_TAG, fileUrl: "/uploads/activity-plans-seed/pricetag-sample-1.svg", fileName: "pricetag-store0-prod0.svg" },
        { workTypeCode: "TYPE_5", storeId: store0.id, productId: prod0.id, category: AttachmentCategory.SHELF, fileUrl: "/uploads/activity-plans-seed/shelf-sample-1.svg", fileName: "shelf-store0-prod0.svg" },
        { workTypeCode: "TYPE_5", storeId: store0.id, productId: prod1.id, category: AttachmentCategory.PRICE_TAG, fileUrl: "/uploads/activity-plans-seed/pricetag-sample-2.svg", fileName: "pricetag-store0-prod1.svg" },
        { workTypeCode: "TYPE_5", storeId: store0.id, productId: prod1.id, category: AttachmentCategory.SHELF, fileUrl: "/uploads/activity-plans-seed/shelf-sample-2.svg", fileName: "shelf-store0-prod1.svg" },
        // Store 1 attachments
        { workTypeCode: "TYPE_5", storeId: store1.id, productId: prod0.id, category: AttachmentCategory.PRICE_TAG, fileUrl: "/uploads/activity-plans-seed/pricetag-sample-1.svg", fileName: "pricetag-store1-prod0.svg" },
        { workTypeCode: "TYPE_5", storeId: store1.id, productId: prod0.id, category: AttachmentCategory.SHELF, fileUrl: "/uploads/activity-plans-seed/shelf-sample-1.svg", fileName: "shelf-store1-prod0.svg" },
      ],
    },
  });

  // Plan 2: 1 store + APPROVED + Actual
  await upsertSeedPlan(prisma, {
    code: "TP2608S052",
    title: "สำรวจราคาตลาดปุ๋ยเคมี ระยอง",
    primaryWorkTypeCode: "TYPE_5",
    startDate: new Date("2026-08-20T09:00:00.000Z"),
    endDate: new Date("2026-08-20T17:00:00.000Z"),
    province: "ระยอง",
    district: "แกลง",
    location: "ร้านค้า อ.แกลง จ.ระยอง",
    objective: "สำรวจราคาขายปลีกปุ๋ยเคมีนำเข้า",
    status: ActivityStatus.APPROVED,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-11T09:00:00.000Z"),
    approvedAt: new Date("2026-08-12T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_5", storeId: store2.id, storeName: store2.name },
    ],
    products: [
      { workTypeCode: "TYPE_5", storeId: store2.id, productId: prod0.id, productName: prod0.name },
    ],
    items: [
      { workTypeCode: "TYPE_5", customerName: store2.name, surveyStoreName: store2.name, surveyCompetitorProduct: "ปุ๋ยเกล็ดนำเข้า สูตร 20-20-20", detail: "สำรวจขนาด 1 กิโลกรัม" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-11T09:00:00.000Z") },
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.APPROVE, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.PENDING_LINE_APPROVAL, toStatus: ActivityStatus.APPROVED, createdAt: new Date("2026-08-12T10:00:00.000Z") },
    ],
    actualResult: {
      actualStartDate: new Date("2026-08-20T09:00:00.000Z"),
      actualEndDate: new Date("2026-08-20T16:00:00.000Z"),
      actualAttendeesCount: 2,
      resultStatus: ActivityResultStatus.COMPLETED,
      resultSummary: "ราคาปุ๋ยคู่แข่งคงที่ ไม่พบการจัดโปรโมชั่นพิเศษ",
      recordedById: ctx.adminUser.id,
      surveyResults: [
        { storeId: store2.id, productId: prod0.id, competitorBrand: "อินเตอร์เคม", competitorProduct: "ซุปเปอร์นิวทริ 1 กก.", competitorPrice: 180, competitorUnit: "ถุง", promotionDetail: "ไม่มีของแถม" },
      ],
      attachments: [
        { workTypeCode: "TYPE_5", storeId: store2.id, productId: prod0.id, category: AttachmentCategory.PRICE_TAG, fileUrl: "/uploads/activity-plans-seed/pricetag-sample-2.svg", fileName: "pricetag-store2.svg" },
      ],
    },
  });

  // Plan 3: PENDING_LINE_APPROVAL
  await upsertSeedPlan(prisma, {
    code: "TP2608S053",
    title: "สำรวจตลาดสารกำจัดวัชพืช จันทบุรี",
    primaryWorkTypeCode: "TYPE_5",
    startDate: new Date("2026-08-29T09:00:00.000Z"),
    endDate: new Date("2026-08-29T17:00:00.000Z"),
    province: "จันทบุรี",
    district: "ท่าใหม่",
    location: "ร้านค้า อ.ท่าใหม่ จ.จันทบุรี",
    objective: "สำรวจสต็อกและราคาคู่แข่ง",
    status: ActivityStatus.PENDING_LINE_APPROVAL,
    employeeId: ctx.primaryEmployee.id,
    createdById: ctx.adminUser.id,
    currentApproverEmployeeId: ctx.managerEmployee.id,
    submittedAt: new Date("2026-08-21T10:00:00.000Z"),
    stores: [
      { workTypeCode: "TYPE_5", storeId: store0.id, storeName: store0.name },
    ],
    items: [
      { workTypeCode: "TYPE_5", customerName: store0.name, surveyStoreName: store0.name, surveyCompetitorProduct: "ไกลโฟเซต ตรายอดนิยม", detail: "ตรวจสอบสต็อกในร้าน" },
    ],
    approvalLogs: [
      { userId: ctx.adminUser.id, action: ActivityApprovalAction.SUBMIT, step: ActivityApprovalStep.LINE_APPROVAL, fromStatus: ActivityStatus.DRAFT, toStatus: ActivityStatus.PENDING_LINE_APPROVAL, createdAt: new Date("2026-08-21T10:00:00.000Z") },
    ],
  });
}
