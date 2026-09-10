/**
 * Phase 3 UI Data Contract Verification Test Suite
 * 
 * Verifies:
 * 1. UI Form Payload Validation (All 12 Work Types)
 * 2. ID-First Rule: Entities use IDs as primary truth (storeId, productId, demoPlotId, employeeId)
 * 3. TYPE 3 Contract: Product lines, master price, unit price, isPriceOverridden, targetAmount
 * 4. TYPE 10 Contract: demoPlotId, targetAttendeesCount, independent targetBookingSales
 * 5. TYPE 11 Contract: Structured stores array (1 store = 1 row in ActivityPlanStore, zero comma strings)
 * 6. TYPE 12 Contract: ActivityPlanTour normalized model
 * 7. Budget Contract: Structured marketingItems and promotionItems
 * 8. Actual Contract: Normalized result payload (saleResults, stockResults, surveyResults, demoResults, attachments) & zero JSON in resultSummary
 * 9. Edit Flow Contract: Hydration from normalized DB relations -> Form State -> Update -> DB Persistence
 */

import { db } from "../lib/db";
import { ActivityStatus, TourType, TourSize } from "@prisma/client";
import { activityPlanSchema } from "../modules/activity-plans/application/validations";
import { normalizePlanInput } from "../modules/activity-plans/application/plan-mapper";
import {
  createActivityPlan,
  findActivityPlanById,
  updateActivityPlan,
  softDeleteActivityPlan,
} from "../modules/activity-plans/infrastructure/activity-plan.repository";
import { buildResultSummary } from "../modules/activity-plans/features/actual-view/utils/summary-builder";
import { parseResultSummary } from "../modules/activity-plans/features/actual-view/utils/summary-parser";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${name}${detail ? ` - ${detail}` : ""}`);
    failCount++;
  }
}

async function runPhase3Tests() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🚀 STARTING PHASE 3 UI DATA CONTRACT TEST SUITE");
  console.log("═════════════════════════════════════════════════════════════════\n");

  // Get test fixtures from existing database
  const employee = await db.employee.findFirst({ where: { status: "ACTIVE" } });
  const user = await db.user.findFirst();
  const stores = await db.customer.findMany({ take: 3 });
  const products = await db.product.findMany({ take: 3 });
  const demoPlot = await db.demoPlot.findFirst();

  if (!employee || !user || stores.length < 2 || products.length < 2) {
    throw new Error("Missing required seed data for testing (employee, user, stores, products).");
  }

  const storeA = stores[0];
  const storeB = stores[1];
  const prodA = products[0];
  const prodB = products[1];

  console.log(`Test fixtures: Employee ${employee.name}, User ${user.email}, Stores [${storeA.name}, ${storeB.name}], Products [${prodA.name}, ${prodB.name}]`);

  // ────────────────────────────────────────────────────────────
  // 1. VALIDATION TESTS: All 12 Work Types Form Payloads
  // ────────────────────────────────────────────────────────────
  console.log("\n--- 1. Validation & Payload Schema for TYPE 1-12 ---");

  const baseDate = new Date();
  const endDate = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours

  // 1.1 TYPE 1: Store Visit (ID-first)
  const t1Payload = {
    title: "เข้าพบร้านค้าประจำเดือน",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_1",
    workTypeCodes: ["TYPE_1"],
    objective: "เข้าพบเพื่อแจ้งข่าวสารโปรโมชั่น",
    planStores: [
      {
        workTypeCode: "TYPE_1",
        storeId: storeA.id,
        storeName: storeA.name,
        remarks: "แจ้งข่าวสาร",
        notes: "พูดคุยเรื่องเป้าหมายยอดขาย",
      },
    ],
  };
  const t1Validated = activityPlanSchema.safeParse(t1Payload);
  assert(t1Validated.success, "Payload 1.1: TYPE_1 payload validates successfully with storeId");

  // 1.2 TYPE 2: Product Followup
  const t2Payload = {
    title: "ติดตามผลการใช้สินค้าทดลอง",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_2",
    workTypeCodes: ["TYPE_2"],
    objective: "ติดตามผลสินค้า",
    planStores: [
      { workTypeCode: "TYPE_2", storeId: storeA.id, storeName: storeA.name, notes: "ผลการตอบรับดี" },
    ],
    planProducts: [
      { workTypeCode: "TYPE_2", storeId: storeA.id, productId: prodA.id, productName: prodA.name },
    ],
  };
  const t2Validated = activityPlanSchema.safeParse(t2Payload);
  assert(t2Validated.success, "Payload 1.2: TYPE_2 payload validates successfully with storeId and productId");

  // 1.3 TYPE 3: Sales Offering with Price Overridden
  const t3Payload = {
    title: "เสนอขายสินค้าช่วงโปรโมชั่น",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_3",
    workTypeCodes: ["TYPE_3"],
    objective: "เสนอขายสินค้าประจำฤดูกาล",
    planStores: [
      { workTypeCode: "TYPE_3", storeId: storeA.id, storeName: storeA.name },
    ],
    planProducts: [
      {
        workTypeCode: "TYPE_3",
        storeId: storeA.id,
        productId: prodA.id,
        productName: prodA.name,
        masterPrice: 1000,
        unitPrice: 950,
        isPriceOverridden: true,
        targetQuantity: 20,
        targetAmount: 19000,
      },
    ],
  };
  const t3Validated = activityPlanSchema.safeParse(t3Payload);
  assert(t3Validated.success, "Payload 1.3: TYPE_3 payload validates with masterPrice, unitPrice, isPriceOverridden, targetAmount");

  // 1.4 TYPE 4: Collection
  const t4Payload = {
    title: "วางบิลและเก็บเงินรอบกลางเดือน",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_4",
    workTypeCodes: ["TYPE_4"],
    objective: "เก็บเงินตามรอบบิล",
    planStores: [
      { workTypeCode: "TYPE_4", storeId: storeA.id, storeName: storeA.name, targetAmount: 45000 },
    ],
  };
  const t4Validated = activityPlanSchema.safeParse(t4Payload);
  assert(t4Validated.success, "Payload 1.4: TYPE_4 payload validates with targetAmount on store");

  // 1.5 TYPE 5: Competitor Survey
  const t5Payload = {
    title: "สำรวจตลาดและราคาคู่แข่ง",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_5",
    workTypeCodes: ["TYPE_5"],
    objective: "สำรวจโปรโมชั่นคู่แข่งในพื้นที่",
    planStores: [
      { workTypeCode: "TYPE_5", storeId: storeA.id, storeName: storeA.name, notes: "คู่แข่งจัดโปรลด 10%" },
    ],
    planProducts: [
      { workTypeCode: "TYPE_5", storeId: storeA.id, productId: prodA.id, productName: prodA.name },
    ],
  };
  const t5Validated = activityPlanSchema.safeParse(t5Payload);
  assert(t5Validated.success, "Payload 1.5: TYPE_5 payload validates without JSON business storage");

  // 1.6 TYPE 6: Issue & Claim
  const t6Payload = {
    title: "แก้ไขปัญหาสินค้าชำรุด",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_6",
    workTypeCodes: ["TYPE_6"],
    objective: "ตรวจสอบสินค้าเคลม",
    planStores: [
      { workTypeCode: "TYPE_6", storeId: storeA.id, storeName: storeA.name, remarks: "เคลมของ", notes: "ฝาปิดหลวม" },
    ],
  };
  const t6Validated = activityPlanSchema.safeParse(t6Payload);
  assert(t6Validated.success, "Payload 1.6: TYPE_6 payload validates with typed remarks and notes");

  // 1.7 TYPE 7: Demo Plot
  const t7Payload = {
    title: "ตรวจแปลงสาธิตระยะแตกใบอ่อน",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_7",
    workTypeCodes: ["TYPE_7"],
    objective: "ตรวจติดตามแปลงสาธิต",
    demoPlotId: demoPlot?.id || null,
    planProducts: [
      { workTypeCode: "TYPE_7", productId: prodA.id, productName: prodA.name },
    ],
  };
  const t7Validated = activityPlanSchema.safeParse(t7Payload);
  assert(t7Validated.success, "Payload 1.7: TYPE_7 payload validates with demoPlotId and productId");

  // 1.8 TYPE 8: Meeting & Target Products Array (No comma strings!)
  const t8Payload = {
    title: "ประชุมสัมมนาเกษตรกรชาวสวนทุเรียน",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_8",
    workTypeCodes: ["TYPE_8"],
    objective: "ถ่ายทอดความรู้การดูแลพืช",
    targetAttendeesCount: 50,
    location: "หอประชุมเทศบาล ต.เนินสูง",
    province: "จันทบุรี",
    district: "ท่าใหม่",
    planProducts: [
      { workTypeCode: "TYPE_8", productId: prodA.id, productName: prodA.name },
      { workTypeCode: "TYPE_8", productId: prodB.id, productName: prodB.name },
    ],
  };
  const t8Validated = activityPlanSchema.safeParse(t8Payload);
  assert(t8Validated.success, "Payload 1.8: TYPE_8 validates target products as array and targetAttendeesCount");

  // 1.9 TYPE 9: Store Promotion with Sub-dealer
  const t9Payload = {
    title: "จัดกิจกรรมกระตุ้นยอดขายหน้าร้าน",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_9",
    workTypeCodes: ["TYPE_9"],
    objective: "ส่งเสริมการขายหน้าร้าน",
    location: "หน้าร้านค้า",
    planStores: [
      {
        workTypeCode: "TYPE_9",
        storeId: storeA.id,
        storeName: storeA.name,
        subDealerStore: "ร้านซับดีลเลอร์ เจริญการเกษตร",
        targetAmount: 50000,
      },
    ],
    planProducts: [
      {
        workTypeCode: "TYPE_9",
        storeId: storeA.id,
        productId: prodA.id,
        productName: prodA.name,
        targetQuantity: 10,
        unitPrice: 5000,
        targetAmount: 50000,
      },
    ],
  };
  const t9Validated = activityPlanSchema.safeParse(t9Payload);
  assert(t9Validated.success, "Payload 1.9: TYPE_9 validates with subDealerStore and product target amounts");

  // 1.10 TYPE 10: Field Day (Independent booking sales metric)
  const t10Payload = {
    title: "จัดงานวันถ่ายทอดเทคโนโลยี Field Day",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_10",
    workTypeCodes: ["TYPE_10"],
    objective: "จัดงาน Field Day",
    location: "แปลงสาธิตสวนทุเรียน อ.แกลง",
    demoPlotId: demoPlot?.id || null,
    targetAttendeesCount: 120,
    targetBookingSales: 250000, // Independent metric!
  };
  const t10Validated = activityPlanSchema.safeParse(t10Payload);
  assert(t10Validated.success, "Payload 1.10: TYPE_10 validates with independent targetBookingSales metric");

  // 1.11 TYPE 11: Stock Check (Multi-store structured array, 1 row per store)
  const t11Payload = {
    title: "ตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้าน",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_11",
    workTypeCodes: ["TYPE_11"],
    objective: "ตรวจเช็กสต็อกหน้าร้าน",
    planStores: [
      { workTypeCode: "TYPE_11", storeId: storeA.id, storeName: storeA.name },
      { workTypeCode: "TYPE_11", storeId: storeB.id, storeName: storeB.name },
    ],
  };
  const t11Validated = activityPlanSchema.safeParse(t11Payload);
  assert(t11Validated.success, "Payload 1.11: TYPE_11 validates multi-store structured array (Zero comma string)");

  // 1.12 TYPE 12: Tour (STORE type)
  const t12Payload = {
    title: "พาลูกค้าทัวร์ดูงานเกษตร",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_12",
    workTypeCodes: ["TYPE_12"],
    objective: "ศึกษาดูงานเกษตรแปลงใหญ่",
    tourData: {
      tourType: "STORE" as const,
      storeId: storeA.id,
      destination: "ศูนย์วิจัยพืชสวนเชียงใหม่",
    },
  };
  const t12Validated = activityPlanSchema.safeParse(t12Payload);
  assert(t12Validated.success, "Payload 1.12: TYPE_12 validates normalized tourData object");

  // ────────────────────────────────────────────────────────────
  // 2. REPOSITORY PERSISTENCE & INTEGRATION TESTS
  // ────────────────────────────────────────────────────────────
  console.log("\n--- 2. Normalized Repository Persistence (Create, Read, Update) ---");

  // 2.1 CREATE Multi-Type Plan with TYPE 3, TYPE 10, TYPE 11, Budget & Tour
  const normalizedInput = normalizePlanInput({
    title: "แผนงานบูรณาการ Phase 3 Full Contract",
    startDate: baseDate,
    endDate: endDate,
    activityTypeId: "TYPE_3",
    workTypeCodes: ["TYPE_3", "TYPE_10", "TYPE_11", "TYPE_12"],
    objective: "ทดสอบการบันทึกข้อมูลแบบ Normalized ครบวงจร",
    location: "พื้นที่ทดสอบ",
    province: "ระยอง",
    district: "แกลง",
    demoPlotId: demoPlot?.id || null,
    targetAttendeesCount: 80,
    targetBookingSales: 150000,
    planStores: [
      { workTypeCode: "TYPE_3", storeId: storeA.id, storeName: storeA.name },
      { workTypeCode: "TYPE_11", storeId: storeA.id, storeName: storeA.name, notes: "สต็อกหน้าร้าน 1" },
      { workTypeCode: "TYPE_11", storeId: storeB.id, storeName: storeB.name, notes: "สต็อกหน้าร้าน 2" },
    ],
    planProducts: [
      {
        workTypeCode: "TYPE_3",
        storeId: storeA.id,
        productId: prodA.id,
        productName: prodA.name,
        masterPrice: 1000,
        unitPrice: 900,
        isPriceOverridden: true,
        targetQuantity: 50,
        targetAmount: 45000,
      },
    ],
    marketingItems: [
      { category: "ป้ายไวนิล", materialName: "ไวนิลโปรโมชั่น", unit: "ผืน", unitPrice: 400, quantity: 2, totalAmount: 800 },
    ],
    promotionItems: [
      { budgetType: "ของแถม", detail: "แถมหมวกตราปืนใหญ่ 10 ใบ", amount: 1000 },
    ],
    tourData: {
      tourType: "STORE",
      storeId: storeA.id,
      destination: "ไร่ชาฉุยฟง",
    },
  });

  const createdPlan = await createActivityPlan({
    ...normalizedInput,
    employeeId: employee.id,
    createdById: user.id,
    status: ActivityStatus.DRAFT,
  });

  assert(Boolean(createdPlan.id), "Repository 2.1: ActivityPlan successfully created");

  // 2.2 READ & VERIFY PERSISTENCE
  const fetchedPlan = await findActivityPlanById(createdPlan.id);
  assert(Boolean(fetchedPlan), "Repository 2.2: ActivityPlan retrieved by ID");

  // Check TYPE 11 Stores (1 store = 1 row!)
  const fetchedT11Stores = fetchedPlan?.stores.filter((s) => s.workTypeCode === "TYPE_11") || [];
  assert(
    fetchedT11Stores.length === 2,
    `Repository 2.3: TYPE_11 saved exactly 2 rows in ActivityPlanStore (found ${fetchedT11Stores.length})`
  );
  assert(
    fetchedT11Stores.some((s) => s.storeId === storeA.id) && fetchedT11Stores.some((s) => s.storeId === storeB.id),
    "Repository 2.4: TYPE_11 stored storeA and storeB IDs correctly (Zero comma string)"
  );

  // Check TYPE 3 Product Line
  const fetchedT3Products = fetchedPlan?.products.filter((p) => p.workTypeCode === "TYPE_3") || [];
  assert(fetchedT3Products.length === 1, "Repository 2.5: TYPE_3 saved product line in ActivityPlanProduct");
  assert(
    Number(fetchedT3Products[0]?.unitPrice) === 900 &&
    Number(fetchedT3Products[0]?.masterPrice) === 1000 &&
    fetchedT3Products[0]?.isPriceOverridden === true &&
    Number(fetchedT3Products[0]?.targetAmount) === 45000,
    "Repository 2.6: TYPE_3 persisted unitPrice, masterPrice, isPriceOverridden, and targetAmount"
  );

  // Check TYPE 10 Independent Metric
  assert(
    Number(fetchedPlan?.targetBookingSales) === 150000,
    "Repository 2.7: TYPE_10 targetBookingSales persisted as independent metric (150,000)"
  );
  assert(
    fetchedPlan?.targetAttendeesCount === 80,
    "Repository 2.8: TYPE_10 targetAttendeesCount persisted correctly (80)"
  );

  // Check Tour
  assert(
    fetchedPlan?.tour?.tourType === TourType.STORE &&
    fetchedPlan?.tour?.destination === "ไร่ชาฉุยฟง" &&
    fetchedPlan?.tour?.storeId === storeA.id,
    "Repository 2.9: TYPE_12 tour data persisted in ActivityPlanTour"
  );

  // Check Budgets
  assert(
    fetchedPlan?.marketingItems.length === 1 &&
    Number(fetchedPlan?.marketingItems[0].totalAmount) === 800,
    "Repository 2.10: Marketing budget item persisted in ActivityPlanMarketingItem"
  );
  assert(
    fetchedPlan?.promotionItems.length === 1 &&
    Number(fetchedPlan?.promotionItems[0].amount) === 1000,
    "Repository 2.11: Promotion budget item persisted in ActivityPlanPromotionItem"
  );
  assert(
    Number(fetchedPlan?.totalBudgetRequested) === 1800,
    "Repository 2.12: Total budget requested computed correctly (800 + 1000 = 1800)"
  );

  // ────────────────────────────────────────────────────────────
  // 3. EDIT FLOW TEST: Hydration -> Modification -> Persistence
  // ────────────────────────────────────────────────────────────
  console.log("\n--- 3. Edit Flow: Hydration, Update, and Sync ---");

  // Modify: Change TYPE 3 quantity to 100, add a 3rd store to TYPE 11, update booking sales
  const updatedStores = [
    ...fetchedPlan!.stores.map((s) => ({
      workTypeCode: s.workTypeCode,
      storeId: s.storeId,
      storeName: s.storeName,
      targetAmount: s.targetAmount ? Number(s.targetAmount) : null,
      subDealerStore: s.subDealerStore,
      remarks: s.remarks,
      notes: s.notes,
    })),
  ];

  const updatedProducts = [
    {
      workTypeCode: "TYPE_3",
      storeId: storeA.id,
      productId: prodA.id,
      productName: prodA.name,
      masterPrice: 1000,
      unitPrice: 850,
      isPriceOverridden: true,
      targetQuantity: 100,
      targetAmount: 85000,
    },
  ];

  await updateActivityPlan(createdPlan.id, {
    updatedUserId: user.id,
    title: "แผนงานบูรณาการ Phase 3 (แก้ไขแล้ว)",
    targetBookingSales: 200000,
    targetAttendeesCount: 95,
    planStores: updatedStores,
    planProducts: updatedProducts,
  });

  const reFetchedPlan = await findActivityPlanById(createdPlan.id);
  assert(reFetchedPlan?.title === "แผนงานบูรณาการ Phase 3 (แก้ไขแล้ว)", "Edit 3.1: Plan title successfully updated");
  assert(Number(reFetchedPlan?.targetBookingSales) === 200000, "Edit 3.2: Target booking sales updated to 200,000");
  assert(reFetchedPlan?.targetAttendeesCount === 95, "Edit 3.3: Target attendees updated to 95");

  const updatedT3Prod = reFetchedPlan?.products.find((p) => p.workTypeCode === "TYPE_3");
  assert(
    Number(updatedT3Prod?.targetQuantity) === 100 &&
    Number(updatedT3Prod?.unitPrice) === 850 &&
    Number(updatedT3Prod?.targetAmount) === 85000,
    "Edit 3.4: TYPE_3 product line updated (qty=100, price=850, amount=85000)"
  );

  // ────────────────────────────────────────────────────────────
  // 4. ACTUAL VIEW CONTRACT: summary-builder & summary-parser
  // ────────────────────────────────────────────────────────────
  console.log("\n--- 4. Actual View Contract: Normalized Arrays & Zero JSON ---");

  const buildResult = buildResultSummary({
    activityResultStatus: "COMPLETED",
    cancelReason: "",
    postponedDate: "",
    postponedTime: "",
    postponedReason: "",
    postponedNotes: "",
    planSummary: {
      title: "Test Plan",
      startDateStr: "2026-09-10",
      timeStr: "08:00 - 17:00",
      locationStr: "Test Location",
    },
    t1ProductAdvice: "",
    t1SalesOpportunity: "",
    t1DiscussionResult: "",
    t1Detail: "",
    t1NextAction: "",
    t1NextMeetingDate: "",
    t2CustomerName: "",
    t2FollowupDetail: "",
    t2Detail: "",
    t2UsageResult: "",
    t2ProblemDetail: "",
    t3SoldProducts: "",
    t3ActualSales: "43200",
    t3ActualQuantity: "48",
    t3UnclosedReason: "",
    t3ProductSalesDetails: [
      {
        productId: prodA.id,
        productName: prodA.name,
        targetQty: 50,
        actualQty: 48,
        unitPrice: 900,
        actualSales: 43200,
        unclosedReason: "",
      },
    ],
    t4OrderNo: "",
    t4ReceivedAmount: "",
    t5CompetitorBrand: "",
    t5CompetitorProduct: "",
    t5CompetitorPrice: "",
    t5CompetitorUnit: "",
    t5PromotionDetail: "",
    t5SurveyDetails: [
      {
        id: "s1",
        store: storeA.name,
        product: prodA.name,
        competitorBrand: "แบรนด์ X",
        competitorProduct: "ปุ๋ยสูตรคู่แข่ง",
        competitorPrice: "850",
        competitorUnit: "กระสอบ",
        promotionDetail: "ซื้อ 10 แถม 1",
      },
    ],
    t6ProblemDetail: "",
    t6InitialSolution: "",
    t6Status: "",
    t6Images: [
      {
        id: "img-1",
        url: "/uploads/activity/claim-1.jpg",
        name: "claim-1.jpg",
        size: 1024,
        type: "image/jpeg",
      },
    ],
    t7PlantingDate: "",
    t7PlantingAreaCondition: "",
    t7UsageMethod: "",
    t7CropAgeValue: "",
    t7CropAgeUnit: "",
    t7GrowthStage: "",
    t7CropCondition: "",
    t7CropProblemDescription: "",
    t7ProductResponse: "",
    t7ProblemDescription: "",
    t7PlotStatus: "IN_PROGRESS",
    t7NextFollowUpDate: "",
    t7FinalYieldKg: "",
    t7ControlYieldKg: "",
    t7YieldIncreasePercent: "",
    t7FarmerSatisfaction: 5,
    t7CommercialPotential: "",
    t7FinalSummaryNotes: "",
    t8ActualAttendees: "",
    t8FeedbackQnA: "",
    t8ProductSalesDetails: [],
    t9ActualSales: "",
    t9ProductSalesDetails: [],
    t9ActualAttendees: "",
    t10ActualAttendees: "",
    t10ActualSalesOrBooking: "",
    t10FarmerFeedback: "",
    t10TargetFarmersList: "",
    t11StockItems: [
      {
        storeId: storeA.id,
        storeName: storeA.name,
        productId: prodA.id,
        productName: prodA.name,
        remainingStockQty: 25,
        sellingSpeed: "FAST",
        orderRecommendation: "ควรเติมสินค้าเพิ่ม 50 กล่อง",
      },
    ],
    t11ProductList: "",
    t11RemainingQty: "",
    t11Remarks: "",
    t11StockStatus: "",
    t11ReorderOpportunity: "",
    t11NextAction: "",
  });

  const actualPayload = buildResult.payload;

  // Verify Zero JSON in resultSummary
  assert(
    !actualPayload.resultSummary.includes("{") && !actualPayload.resultSummary.includes("}"),
    "Actual 4.1: resultSummary is pure qualitative text (Zero JSON string)"
  );
  assert(
    actualPayload.resultSummary.includes("ยอดขายแยกสินค้า:"),
    "Actual 4.2: resultSummary includes human-readable qualitative sales summary"
  );

  // Verify Typed Collections in Payload
  assert(
    Array.isArray(actualPayload.saleResults) && actualPayload.saleResults.length === 1,
    "Actual 4.3: saleResults[] sent as direct structured array"
  );
  assert(
    actualPayload.saleResults[0].productId === prodA.id &&
    actualPayload.saleResults[0].actualQuantity === 48 &&
    actualPayload.saleResults[0].actualTotal === 43200,
    "Actual 4.4: saleResults[0] contains accurate product ID and metrics"
  );

  assert(
    Array.isArray(actualPayload.stockResults) && actualPayload.stockResults.length === 1,
    "Actual 4.5: stockResults[] sent as direct structured array"
  );
  assert(
    actualPayload.stockResults[0].storeId === storeA.id &&
    actualPayload.stockResults[0].remainingQuantity === 25,
    "Actual 4.6: stockResults[0] contains accurate store ID and stock quantity"
  );

  assert(
    Array.isArray(actualPayload.surveyResults) && actualPayload.surveyResults.length === 1,
    "Actual 4.7: surveyResults[] sent as direct structured array"
  );
  assert(
    actualPayload.surveyResults[0].competitorBrand === "แบรนด์ X",
    "Actual 4.8: surveyResults[0] contains competitor brand"
  );

  assert(
    Array.isArray(actualPayload.attachments) && actualPayload.attachments.length === 1,
    "Actual 4.9: attachments[] sent as direct structured array"
  );

  // Verify Parser Reads Directly from Normalized Relations
  const parsedBack = parseResultSummary({
    resultStatus: actualPayload.resultStatus,
    resultSummary: actualPayload.resultSummary,
    saleResults: actualPayload.saleResults,
    stockResults: actualPayload.stockResults,
    surveyResults: actualPayload.surveyResults,
    attachments: actualPayload.attachments,
  });

  assert(
    parsedBack.t3ProductSalesDetails?.length === 1 &&
    parsedBack.t3ProductSalesDetails[0].actualQty === 48,
    "Actual 4.10: parseResultSummary hydrates directly from normalized saleResults relation"
  );
  assert(
    parsedBack.t11StockItems?.length === 1 &&
    parsedBack.t11StockItems[0].remainingStockQty === 25,
    "Actual 4.11: parseResultSummary hydrates directly from normalized stockResults relation"
  );

  // ────────────────────────────────────────────────────────────
  // 5. CLEANUP
  // ────────────────────────────────────────────────────────────
  console.log("\n--- 5. Cleanup Test Artifacts ---");
  await softDeleteActivityPlan(createdPlan.id);
  const deletedPlan = await findActivityPlanById(createdPlan.id);
  assert(deletedPlan === null, "Cleanup 5.1: Test ActivityPlan soft-deleted successfully");

  // Summary
  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`🏁 PHASE 3 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("═════════════════════════════════════════════════════════════════");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase3Tests()
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
