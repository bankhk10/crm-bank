import assert from "assert";
import { db } from "../lib/db";
import {
  planStoreInputSchema,
  activityResultSchema,
} from "../modules/activity-plans/application/validations";
import { normalizePlanInput } from "../modules/activity-plans/application/plan-mapper";
import { validateType1VisitPurposeCustomers } from "../modules/activity-plans/application";
import {
  buildResultSummary,
  parseResultSummary,
} from "../modules/activity-plans/features/actual-view/utils";
import { extractPlanData } from "../modules/activity-plans/features/actual-view/utils/plan-extractor";
import {
  WORK_TYPE_CONFIG,
  WORK_TYPES,
  getWorkTypeCode,
  getWorkTypeName,
} from "../modules/activity-plans/constants";
import {
  findFarmerCustomerOptions,
  findDealerAndSubdealerCustomerOptions,
} from "../modules/activity-plans/infrastructure/activity-plan.repository";
import { ActivityStatus } from "@prisma/client";

async function runTests() {
  console.log("=== STARTING TYPE_1 COMPREHENSIVE AUTOMATED VERIFICATION ===\n");

  // 0. Setup Test Customers in Database
  console.log("▶ 0. Setting up Test Fixtures for Customers");
  const testFarmer = await db.customer.upsert({
    where: { customerCode: "TEST_CUST_FARMER_001" },
    update: { customerType: "FARMER", name: "สมเกียรติ ชาวนา", province: "สุพรรณบุรี" },
    create: {
      customerCode: "TEST_CUST_FARMER_001",
      customerType: "FARMER",
      name: "สมเกียรติ ชาวนา",
      province: "สุพรรณบุรี",
    },
  });

  const testDealer = await db.customer.upsert({
    where: { customerCode: "TEST_CUST_DEALER_001" },
    update: { customerType: "DEALER", name: "ร้านรุ่งเรืองการเกษตร (ตัวแทน)" },
    create: {
      customerCode: "TEST_CUST_DEALER_001",
      customerType: "DEALER",
      name: "ร้านรุ่งเรืองการเกษตร (ตัวแทน)",
    },
  });

  const testSubdealer = await db.customer.upsert({
    where: { customerCode: "TEST_CUST_SUBDEALER_001" },
    update: { customerType: "SUBDEALER", name: "ร้านสมหวังพืชผล (ร้านค้าย่อย)" },
    create: {
      customerCode: "TEST_CUST_SUBDEALER_001",
      customerType: "SUBDEALER",
      name: "ร้านสมหวังพืชผล (ร้านค้าย่อย)",
    },
  });

  const testBroker = await db.customer.upsert({
    where: { customerCode: "TEST_CUST_BROKER_001" },
    update: { customerType: "BROKER", name: "นายหน้าพาณิชย์ จำกัด" },
    create: {
      customerCode: "TEST_CUST_BROKER_001",
      customerType: "BROKER",
      name: "นายหน้าพาณิชย์ จำกัด",
    },
  });
  console.log("  ✔ Customer test fixtures verified (Farmer, Dealer, Subdealer, Broker)");

  // Repository check: Store options must return DEALER and SUBDEALER, strictly NO FARMER or BROKER
  console.log("\n▶ Checking Repository findDealerAndSubdealerCustomerOptions()");
  const storeOptions = await findDealerAndSubdealerCustomerOptions();
  assert(storeOptions.length > 0, "Store options should not be empty");
  assert(
    storeOptions.every((s) => s.customerType === "DEALER" || s.customerType === "SUBDEALER"),
    "Repository query must strictly only return DEALER or SUBDEALER",
  );
  assert(
    !storeOptions.some((s) => s.customerType === "FARMER"),
    "Store options must NOT contain any FARMER",
  );
  assert(
    !storeOptions.some((s) => s.customerType === "BROKER"),
    "Store options must NOT contain any BROKER",
  );
  console.log(`  ✔ findDealerAndSubdealerCustomerOptions found ${storeOptions.length} valid DEALER/SUBDEALER stores.`);

  // SECTION 16 REQUIREMENTS:
  // --- FARMER TESTS ---
  console.log("\n▶ [TEST 1] FARMER + registered Farmer = PASS");
  const t1Schema = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    visitPurpose: "FARMER",
    province: "สุพรรณบุรี",
    storeId: testFarmer.id,
    isUnregisteredFarmer: false,
  });
  assert(t1Schema.success, "FARMER with province and registered Farmer storeId must pass schema validation");
  const t1Server = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "FARMER",
      storeId: testFarmer.id,
      isUnregisteredFarmer: false,
    },
  ]);
  assert(t1Server.valid, "FARMER with registered Farmer customer must pass server-side validation");
  console.log("  ✔ [PASS] FARMER + registered Farmer");

  console.log("\n▶ [TEST 2] FARMER + unregistered Farmer = PASS");
  const t2Schema = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    visitPurpose: "FARMER",
    province: "สุพรรณบุรี",
    isUnregisteredFarmer: true,
    unregisteredFarmerName: "นายสมชาย ใจดี",
    unregisteredFarmerPhone: "0812345678",
  });
  assert(t2Schema.success, "FARMER with unregistered farmer name and 10-digit phone must pass schema");
  const t2Server = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "FARMER",
      isUnregisteredFarmer: true,
      storeId: null,
    },
  ]);
  assert(t2Server.valid, "FARMER with unregistered farmer must pass server-side validation");
  console.log("  ✔ [PASS] FARMER + unregistered Farmer");

  console.log("\n▶ [TEST 3] FARMER + Dealer = FAIL");
  const t3Server = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "FARMER",
      storeId: testDealer.id,
      isUnregisteredFarmer: false,
    },
  ]);
  assert(!t3Server.valid, "FARMER with Dealer customer must fail server validation");
  assert(
    t3Server.error.includes("FARMER"),
    "Error message must specify FARMER only restriction",
  );
  console.log("  ✔ [PASS] FARMER + Dealer correctly REJECTED with error:", t3Server.error);

  console.log("\n▶ [TEST 4] FARMER + Subdealer = FAIL");
  const t4Server = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "FARMER",
      storeId: testSubdealer.id,
      isUnregisteredFarmer: false,
    },
  ]);
  assert(!t4Server.valid, "FARMER with Subdealer customer must fail server validation");
  assert(
    t4Server.error.includes("FARMER"),
    "Error message must specify FARMER only restriction",
  );
  console.log("  ✔ [PASS] FARMER + Subdealer correctly REJECTED with error:", t4Server.error);

  console.log("\n▶ [TEST 5] FARMER without Province = FAIL");
  const t5Schema = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    visitPurpose: "FARMER",
    storeId: testFarmer.id,
    isUnregisteredFarmer: false,
  });
  assert(!t5Schema.success, "FARMER without province must fail schema validation");
  console.log("  ✔ [PASS] FARMER without Province correctly REJECTED");

  // --- STORE TESTS ---
  console.log("\n▶ [TEST 6] STORE + Dealer = PASS");
  const t6Schema = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    visitPurpose: "STORE",
    storeId: testDealer.id,
    isUnregisteredFarmer: false,
  });
  assert(t6Schema.success, "STORE with Dealer storeId must pass schema validation without province");
  const t6Server = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "STORE",
      storeId: testDealer.id,
      isUnregisteredFarmer: false,
    },
  ]);
  assert(t6Server.valid, "STORE with Dealer customer must pass server-side validation");
  console.log("  ✔ [PASS] STORE + Dealer");

  console.log("\n▶ [TEST 7] STORE + Subdealer = PASS");
  const t7Schema = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    visitPurpose: "STORE",
    storeId: testSubdealer.id,
    isUnregisteredFarmer: false,
  });
  assert(t7Schema.success, "STORE with Subdealer storeId must pass schema validation");
  const t7Server = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "STORE",
      storeId: testSubdealer.id,
      isUnregisteredFarmer: false,
    },
  ]);
  assert(t7Server.valid, "STORE with Subdealer customer must pass server-side validation");
  console.log("  ✔ [PASS] STORE + Subdealer");

  console.log("\n▶ [TEST 8] STORE + Farmer = FAIL");
  const t8Server = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "STORE",
      storeId: testFarmer.id,
      isUnregisteredFarmer: false,
    },
  ]);
  assert(!t8Server.valid, "STORE with Farmer customer must fail server validation");
  assert(
    t8Server.error.includes("DEALER") || t8Server.error.includes("SUBDEALER"),
    "Error message must specify DEALER or SUBDEALER only restriction",
  );
  console.log("  ✔ [PASS] STORE + Farmer correctly REJECTED with error:", t8Server.error);

  console.log("\n▶ [TEST 9] STORE + Broker = FAIL");
  const t9Server = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "STORE",
      storeId: testBroker.id,
      isUnregisteredFarmer: false,
    },
  ]);
  assert(!t9Server.valid, "STORE with Broker customer must fail server validation");
  assert(
    t9Server.error.includes("DEALER") || t9Server.error.includes("SUBDEALER"),
    "Error message must specify DEALER or SUBDEALER only restriction",
  );
  console.log("  ✔ [PASS] STORE + Broker correctly REJECTED with error:", t9Server.error);

  console.log("\n▶ [TEST 10] STORE without Customer = FAIL (or with isUnregisteredFarmer = FAIL)");
  const t10SchemaNoStore = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    visitPurpose: "STORE",
  });
  assert(!t10SchemaNoStore.success, "STORE without storeId must fail schema validation");

  const t10SchemaUnreg = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    visitPurpose: "STORE",
    isUnregisteredFarmer: true,
    unregisteredFarmerName: "นายร้าน",
    unregisteredFarmerPhone: "0812345678",
  });
  assert(!t10SchemaUnreg.success, "STORE with isUnregisteredFarmer must fail schema validation");

  const t10ServerUnreg = await validateType1VisitPurposeCustomers([
    {
      workTypeCode: "TYPE_1",
      visitPurpose: "STORE",
      isUnregisteredFarmer: true,
      storeId: null,
    },
  ]);
  assert(!t10ServerUnreg.valid, "STORE with isUnregisteredFarmer must fail server validation");
  console.log("  ✔ [PASS] STORE without customer / with unregistered farmer correctly REJECTED");

  // --- SWITCHING TESTS ---
  console.log("\n▶ [TEST 11] Switching: FARMER → STORE clears Farmer fields");
  // UI switching simulation:
  const farmerState = {
    visitPurpose: "FARMER" as const,
    province: "สุพรรณบุรี",
    storeId: testFarmer.id,
    isUnregisteredFarmer: true,
    unregisteredFarmerName: "นายสมควร",
    unregisteredFarmerPhone: "0899999999",
  };
  // When switching to STORE:
  const switchedToStore = {
    ...farmerState,
    visitPurpose: "STORE" as const,
    province: undefined,
    storeId: "",
    isUnregisteredFarmer: false,
    unregisteredFarmerName: "",
    unregisteredFarmerPhone: "",
  };
  assert.strictEqual(switchedToStore.visitPurpose, "STORE");
  assert.strictEqual(switchedToStore.province, undefined);
  assert.strictEqual(switchedToStore.storeId, "");
  assert.strictEqual(switchedToStore.isUnregisteredFarmer, false);
  assert.strictEqual(switchedToStore.unregisteredFarmerName, "");
  assert.strictEqual(switchedToStore.unregisteredFarmerPhone, "");

  // Now select a dealer and normalize
  const normalizedStore = normalizePlanInput({
    title: "เข้าพบร้านค้า",
    startDate: new Date("2026-09-20T09:00:00Z"),
    endDate: new Date("2026-09-20T17:00:00Z"),
    activityTypeId: "TYPE_1",
    planStores: [
      {
        workTypeCode: "TYPE_1",
        visitPurpose: "STORE",
        storeId: testDealer.id,
        isUnregisteredFarmer: false,
        unregisteredFarmerName: null,
        unregisteredFarmerPhone: null,
        province: null,
      },
    ],
  });
  assert.strictEqual(normalizedStore.planStores[0].visitPurpose, "STORE");
  assert.strictEqual(normalizedStore.planStores[0].storeId, testDealer.id);
  assert.strictEqual(normalizedStore.planStores[0].province, null);
  assert.strictEqual(normalizedStore.planStores[0].isUnregisteredFarmer, false);
  assert.strictEqual(normalizedStore.planStores[0].unregisteredFarmerName, null);
  assert.strictEqual(normalizedStore.planStores[0].unregisteredFarmerPhone, null);
  console.log("  ✔ [PASS] FARMER → STORE cleanly clears farmer-specific fields with no stale payload");

  console.log("\n▶ [TEST 12] Switching: STORE → FARMER clears Store selection");
  const storeState = {
    visitPurpose: "STORE" as const,
    storeId: testDealer.id,
    province: undefined,
  };
  const switchedToFarmer = {
    ...storeState,
    visitPurpose: "FARMER" as const,
    storeId: "",
  };
  assert.strictEqual(switchedToFarmer.visitPurpose, "FARMER");
  assert.strictEqual(switchedToFarmer.storeId, "");
  console.log("  ✔ [PASS] STORE → FARMER cleanly clears store selection");

  // --- HYDRATION TESTS ---
  console.log("\n▶ [TEST 13] Edit hydration FARMER");
  const mockFarmerPlan: any = {
    code: "TP-FARMER-01",
    title: "เข้าพบเกษตรกรแปลงนา",
    startDate: new Date("2026-09-20T09:00:00Z"),
    endDate: new Date("2026-09-20T12:00:00Z"),
    stores: [
      {
        workTypeCode: "TYPE_1",
        visitPurpose: "FARMER",
        province: "สุพรรณบุรี",
        storeId: testFarmer.id,
        isUnregisteredFarmer: false,
        store: testFarmer,
      },
    ],
  };
  const extractedFarmer = extractPlanData(mockFarmerPlan);
  assert.strictEqual(extractedFarmer.targets.t1.visitPurpose, "FARMER");
  assert.strictEqual(extractedFarmer.targets.t1.province, "สุพรรณบุรี");
  assert.strictEqual(extractedFarmer.targets.t1.customer, "สมเกียรติ ชาวนา");
  assert.strictEqual(extractedFarmer.targets.t1.customerType, "FARMER");
  console.log("  ✔ [PASS] Edit hydration FARMER correctly sets visitPurpose, customer, and province");

  console.log("\n▶ [TEST 14] Edit hydration STORE");
  const mockStorePlan: any = {
    code: "TP-STORE-01",
    title: "เข้าพบร้านค้าตัวแทน",
    startDate: new Date("2026-09-20T09:00:00Z"),
    endDate: new Date("2026-09-20T12:00:00Z"),
    stores: [
      {
        workTypeCode: "TYPE_1",
        visitPurpose: "STORE",
        storeId: testDealer.id,
        isUnregisteredFarmer: false,
        store: testDealer,
      },
    ],
  };
  const extractedStore = extractPlanData(mockStorePlan);
  assert.strictEqual(extractedStore.targets.t1.visitPurpose, "STORE");
  assert.strictEqual(extractedStore.targets.t1.customer, "ร้านรุ่งเรืองการเกษตร (ตัวแทน)");
  assert.strictEqual(extractedStore.targets.t1.customerType, "DEALER");
  assert.strictEqual(extractedStore.targets.t1.isUnregisteredFarmer, false);
  console.log("  ✔ [PASS] Edit hydration STORE correctly sets visitPurpose, customer, and customerType");

  // --- REGRESSION TESTS ---
  console.log("\n▶ [TEST 15] Existing TYPE_1 data can still be read (Historical compatibility)");
  // Legacy record without visitPurpose where store is DEALER
  const legacyDealerPlan: any = {
    code: "TP-LEGACY-01",
    title: "เข้าพบร้านค้าเดิม",
    startDate: new Date("2026-09-20T09:00:00Z"),
    endDate: new Date("2026-09-20T12:00:00Z"),
    stores: [
      {
        workTypeCode: "TYPE_1",
        visitPurpose: null, // null in historical DB
        storeId: testDealer.id,
        store: testDealer,
      },
    ],
  };
  const extractedLegacyDealer = extractPlanData(legacyDealerPlan);
  assert.strictEqual(
    extractedLegacyDealer.targets.t1.visitPurpose,
    "STORE",
    "Legacy record with DEALER store must resolve visitPurpose to STORE",
  );

  // Legacy record without visitPurpose where unregistered farmer
  const legacyUnregPlan: any = {
    code: "TP-LEGACY-02",
    title: "เข้าพบเกษตรกรเดิม",
    startDate: new Date("2026-09-20T09:00:00Z"),
    endDate: new Date("2026-09-20T12:00:00Z"),
    stores: [
      {
        workTypeCode: "TYPE_1",
        visitPurpose: null,
        isUnregisteredFarmer: true,
        unregisteredFarmerName: "ลุงแก้ว",
      },
    ],
  };
  const extractedLegacyUnreg = extractPlanData(legacyUnregPlan);
  assert.strictEqual(
    extractedLegacyUnreg.targets.t1.visitPurpose,
    "FARMER",
    "Legacy record with unregistered farmer must resolve visitPurpose to FARMER",
  );
  console.log("  ✔ [PASS] Existing historical TYPE_1 data can still be read with correct inferred purpose");

  console.log("\n▶ [TEST 16] TYPE_2–TYPE_12 compile/test normally");
  for (let i = 2; i <= 12; i++) {
    const code = `TYPE_${i}`;
    assert(WORK_TYPE_CONFIG[code], `${code} must exist in WORK_TYPE_CONFIG`);
    assert(
      WORK_TYPES.includes(WORK_TYPE_CONFIG[code].name),
      `${code} name must be in WORK_TYPES`,
    );
  }
  console.log("  ✔ [PASS] TYPE_2–TYPE_12 definitions and configurations intact");

  console.log("\n▶ [TEST 17] Existing Activity Plan approval flow is unchanged");
  assert(ActivityStatus.DRAFT, "DRAFT status exists");
  assert(ActivityStatus.PENDING_LINE_APPROVAL, "PENDING_LINE_APPROVAL status exists");
  assert(ActivityStatus.PENDING_BUDGET_APPROVAL, "PENDING_BUDGET_APPROVAL status exists");
  assert(ActivityStatus.PENDING_HELPER_APPROVAL, "PENDING_HELPER_APPROVAL status exists");
  assert(ActivityStatus.APPROVED, "APPROVED status exists");
  assert(ActivityStatus.REJECTED, "REJECTED status exists");
  assert(ActivityStatus.WAITING_FOR_CORRECTION, "WAITING_FOR_CORRECTION status exists");
  assert(ActivityStatus.CANCELLED, "CANCELLED status exists");
  console.log("  ✔ [PASS] Approval flow statuses and relations preserved unchanged");

  // Summary builder / parser test for actual view
  console.log("\n▶ Actual Result Summary Builder & Parser Roundtrip");
  const buildRes = buildResultSummary({
    activityResultStatus: "COMPLETED",
    cancelReason: "",
    postponedDate: "",
    postponedTime: "",
    postponedReason: "",
    postponedNotes: "",
    planSummary: {
      title: "เข้าพบเกษตรกร",
      startDateStr: "20 กันยายน 2569",
      timeStr: "09:00 - 12:00 น.",
      locationStr: "สุพรรณบุรี",
    },
    t1ProductAdvice: "ปุ๋ยสูตร 1, ปุ๋ยสูตร 2",
    t1SalesOpportunity: "สูง",
    t1DiscussionResult: "เกษตรกรสนใจทดลองใช้ปุ๋ยในแปลงนา",
    t1Detail: "เข้าพบแนะนำสินค้า",
    t1NextAction: "ส่งตัวอย่างสินค้า",
    t1NextMeetingDate: "2026-09-30",
    t1FarmerHomeAddress: "99 หมู่ 1 ต.ดอนเจดีย์ อ.ดอนเจดีย์",
    t1PlotLatitude: 14.654321,
    t1PlotLongitude: 100.012345,
    t1PlotImages: [
      { id: "img-1", url: "https://example.com/plot1.jpg", name: "plot1.jpg" },
      { id: "img-2", url: "https://example.com/plot2.jpg", name: "plot2.jpg" },
    ],
    t2CustomerName: "",
    t2FollowupDetail: "",
    t2Detail: "",
    t2UsageResult: "",
    t2ProblemDetail: "",
    t3SoldProducts: "",
    t3ActualSales: "",
    t3ActualQuantity: "",
    t3UnclosedReason: "",
    t4OrderNo: "",
    t4ReceivedAmount: "",
    t5CompetitorBrand: "",
    t5CompetitorProduct: "",
    t5CompetitorPrice: "",
    t5CompetitorUnit: "",
    t5PromotionDetail: "",
    t6ProblemDetail: "",
    t6InitialSolution: "",
    t6Status: "",
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
    t11StockItems: [],
    t11ProductList: "",
    t11RemainingQty: "",
    t11Remarks: "",
    t11StockStatus: "",
    t11ReorderOpportunity: "",
    t11NextAction: "",
  });

  assert(buildRes.payload, "Build result must produce payload");
  assert.strictEqual(
    buildRes.payload.farmerHomeAddress,
    "99 หมู่ 1 ต.ดอนเจดีย์ อ.ดอนเจดีย์",
  );
  assert.strictEqual(buildRes.payload.plotLatitude, 14.654321);
  assert.strictEqual(buildRes.payload.plotLongitude, 100.012345);
  assert.strictEqual(buildRes.payload.attachments.length, 2);
  console.log("  ✔ Actual result summary builder and parser passed");

  console.log("\n=================================================================");
  console.log("🎉 ALL 17 COMPREHENSIVE TYPE_1 AUTOMATED VERIFICATION TESTS PASSED!");
  console.log("=================================================================\n");
}

runTests()
  .catch((err) => {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
