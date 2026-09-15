import assert from "assert";
import {
  planStoreInputSchema,
  activityResultSchema,
} from "../modules/activity-plans/application/validations";
import { normalizePlanInput } from "../modules/activity-plans/application/plan-mapper";
import {
  buildResultSummary,
  parseResultSummary,
} from "../modules/activity-plans/features/actual-view/utils";
import {
  WORK_TYPE_CONFIG,
  WORK_TYPES,
  getWorkTypeCode,
  getWorkTypeName,
} from "../modules/activity-plans/constants";
import { findFarmerCustomerOptions } from "../modules/activity-plans/infrastructure/activity-plan.repository";

async function runTests() {
  console.log("=== STARTING TYPE_1 AUTOMATED VERIFICATION ===\n");

  // 1. Constants & Work Type Names Regression Check
  console.log("▶ 1. Work Type Constants & Legacy Mapping Regression");
  assert.strictEqual(
    WORK_TYPE_CONFIG.TYPE_1.name,
    "เข้าพบเกษตรกร",
    "TYPE_1 config name should be 'เข้าพบเกษตรกร'",
  );
  assert.strictEqual(
    getWorkTypeCode("เข้าพบเกษตรกร"),
    "TYPE_1",
    "getWorkTypeCode('เข้าพบเกษตรกร') should be 'TYPE_1'",
  );
  assert.strictEqual(
    getWorkTypeCode("เข้าพบร้านค้า / Key Farmer"),
    "TYPE_1",
    "Legacy getWorkTypeCode('เข้าพบร้านค้า / Key Farmer') should resolve to 'TYPE_1'",
  );
  assert.strictEqual(
    getWorkTypeName("TYPE_1"),
    "เข้าพบเกษตรกร",
    "getWorkTypeName('TYPE_1') should be 'เข้าพบเกษตรกร'",
  );
  assert.strictEqual(
    getWorkTypeName("เข้าพบร้านค้า / Key Farmer"),
    "เข้าพบเกษตรกร",
    "Legacy name should resolve to 'เข้าพบเกษตรกร'",
  );

  // Check TYPE_2 to TYPE_12 are untouched
  for (let i = 2; i <= 12; i++) {
    const code = `TYPE_${i}`;
    assert(WORK_TYPE_CONFIG[code], `${code} must exist in WORK_TYPE_CONFIG`);
    assert(
      WORK_TYPES.includes(WORK_TYPE_CONFIG[code].name),
      `${code} name must be in WORK_TYPES`,
    );
  }
  console.log("  ✔ Constants & Legacy Work Type mappings PASS");

  // 2. Repository Farmer Options filtering by province
  console.log("\n▶ 2. Repository Farmer Options (province filtering)");
  const allFarmers = await findFarmerCustomerOptions();
  console.log(`  Found ${allFarmers.length} total active FARMER customers.`);
  allFarmers.forEach((f) => {
    assert.strictEqual(
      f.customerType,
      "FARMER",
      "Customer must strictly be CustomerType.FARMER",
    );
  });

  const suphanFarmers = await findFarmerCustomerOptions("สุพรรณบุรี");
  suphanFarmers.forEach((f) => {
    assert.strictEqual(
      f.province,
      "สุพรรณบุรี",
      "Filtered farmer must strictly match the province",
    );
    assert.strictEqual(
      f.customerType,
      "FARMER",
      "Filtered farmer must strictly be CustomerType.FARMER",
    );
  });
  console.log(`  ✔ findFarmerCustomerOptions('สุพรรณบุรี') found ${suphanFarmers.length} farmers in สุพรรณบุรี.`);

  // 3. Validation: Registered Farmer vs Unregistered Farmer
  console.log("\n▶ 3. Validation: Registered vs Unregistered Farmer");

  // Missing province -> FAIL
  const resMissingProvince = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    storeId: "cust-1",
  });
  assert(
    !resMissingProvince.success,
    "Missing province must fail validation for TYPE_1",
  );

  // Case A: Registered Farmer with storeId -> PASS
  const resRegisteredValid = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    province: "สุพรรณบุรี",
    storeId: "cust-1",
    isUnregisteredFarmer: false,
  });
  assert(
    resRegisteredValid.success,
    "Registered farmer with province and storeId must be valid",
  );

  // Case A: Registered Farmer without storeId -> FAIL
  const resRegisteredMissingStore = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    province: "สุพรรณบุรี",
    isUnregisteredFarmer: false,
  });
  assert(
    !resRegisteredMissingStore.success,
    "Registered farmer without storeId must fail validation",
  );

  // Case B: Unregistered Farmer with name and valid phone -> PASS
  const resUnregisteredValid = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    province: "สุพรรณบุรี",
    isUnregisteredFarmer: true,
    unregisteredFarmerName: "สมชาย ใจดี",
    unregisteredFarmerPhone: "0812345678",
  });
  assert(
    resUnregisteredValid.success,
    "Unregistered farmer with valid 10-digit phone must be valid",
  );

  // Case B: Unregistered Farmer with invalid phone -> FAIL
  const resUnregisteredBadPhone = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    province: "สุพรรณบุรี",
    isUnregisteredFarmer: true,
    unregisteredFarmerName: "สมชาย ใจดี",
    unregisteredFarmerPhone: "1234",
  });
  assert(
    !resUnregisteredBadPhone.success,
    "Unregistered farmer with invalid phone length must fail validation",
  );

  // Case B: Unregistered Farmer missing name -> FAIL
  const resUnregisteredMissingName = planStoreInputSchema.safeParse({
    workTypeCode: "TYPE_1",
    province: "สุพรรณบุรี",
    isUnregisteredFarmer: true,
    unregisteredFarmerPhone: "0812345678",
  });
  assert(
    !resUnregisteredMissingName.success,
    "Unregistered farmer missing name must fail validation",
  );
  console.log("  ✔ Plan store validation for TYPE_1 PASS");

  // 4. Plan Mapper Normalization
  console.log("\n▶ 4. Plan Mapper Normalization");
  const normalized = normalizePlanInput(
    {
      title: "เข้าพบเกษตรกร สุพรรณบุรี",
      startDate: new Date("2026-09-20T09:00:00Z"),
      endDate: new Date("2026-09-20T17:00:00Z"),
      activityTypeId: "TYPE_1",
      planStores: [
        {
          workTypeCode: "TYPE_1",
          province: "สุพรรณบุรี",
          isUnregisteredFarmer: true,
          unregisteredFarmerName: "นายทองดี มีชัย",
          unregisteredFarmerPhone: "0891234567",
        },
      ],
    },
  );
  assert.strictEqual(
    normalized.planStores[0].storeId,
    null,
    "Unregistered farmer must have storeId = null",
  );
  assert.strictEqual(
    normalized.planStores[0].isUnregisteredFarmer,
    true,
    "isUnregisteredFarmer must be true",
  );
  assert.strictEqual(
    normalized.planStores[0].unregisteredFarmerName,
    "นายทองดี มีชัย",
  );
  assert.strictEqual(
    normalized.planStores[0].unregisteredFarmerPhone,
    "0891234567",
  );
  assert.strictEqual(
    normalized.planStores[0].province,
    "สุพรรณบุรี",
  );
  console.log("  ✔ normalizePlanInput for unregistered farmer PASS");

  // 5. Actual Result Validation (Home Address, Lat, Lng, Attachments <= 5)
  console.log("\n▶ 5. Actual Result Schema Validation");
  const validActual = activityResultSchema.safeParse({
    actualStartDate: new Date(),
    actualEndDate: new Date(),
    resultStatus: "COMPLETED",
    farmerHomeAddress: "123 หมู่ 4 ต.บ้านกร่าง อ.เมือง จ.สุพรรณบุรี",
    plotLatitude: 14.5321567,
    plotLongitude: 100.1234567,
    attachments: [
      {
        workTypeCode: "TYPE_1",
        category: "PLOT",
        fileUrl: "https://example.com/plot1.jpg",
        fileName: "plot1.jpg",
      },
      {
        workTypeCode: "TYPE_1",
        category: "PLOT",
        fileUrl: "https://example.com/plot2.jpg",
        fileName: "plot2.jpg",
      },
    ],
  });
  assert(validActual.success, "Valid actual result with lat/lng and 2 plot photos must pass");

  // Latitude out of range -> FAIL
  const invalidLat = activityResultSchema.safeParse({
    actualStartDate: new Date(),
    actualEndDate: new Date(),
    resultStatus: "COMPLETED",
    plotLatitude: 95.0, // > 90
    plotLongitude: 100.0,
  });
  assert(!invalidLat.success, "Latitude > 90 must fail");

  // Longitude out of range -> FAIL
  const invalidLng = activityResultSchema.safeParse({
    actualStartDate: new Date(),
    actualEndDate: new Date(),
    resultStatus: "COMPLETED",
    plotLatitude: 14.0,
    plotLongitude: 195.0, // > 180
  });
  assert(!invalidLng.success, "Longitude > 180 must fail");

  // Attachments > 5 for TYPE_1 PLOT -> FAIL
  const tooManyPlotPhotos = activityResultSchema.safeParse({
    actualStartDate: new Date(),
    actualEndDate: new Date(),
    resultStatus: "COMPLETED",
    attachments: Array.from({ length: 6 }).map((_, idx) => ({
      workTypeCode: "TYPE_1",
      category: "PLOT",
      fileUrl: `https://example.com/plot${idx}.jpg`,
      fileName: `plot${idx}.jpg`,
    })),
  });
  assert(!tooManyPlotPhotos.success, "More than 5 plot attachments for TYPE_1 must fail");
  console.log("  ✔ Actual result schema validation PASS");

  // 6. Summary Builder & Parser for TYPE_1
  console.log("\n▶ 6. Summary Builder & Parser Roundtrip");
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
  assert.strictEqual(buildRes.payload.attachments[0].category, "PLOT");
  assert.strictEqual(buildRes.payload.attachments[0].workTypeCode, "TYPE_1");

  // Parser test from simulated DB record
  const parsedRes = parseResultSummary({
    resultStatus: "COMPLETED",
    farmerHomeAddress: buildRes.payload.farmerHomeAddress,
    plotLatitude: buildRes.payload.plotLatitude,
    plotLongitude: buildRes.payload.plotLongitude,
    resultSummary: buildRes.payload.resultSummary,
    attachments: [
      {
        id: "att-1",
        workTypeCode: "TYPE_1",
        category: "PLOT",
        fileUrl: "https://example.com/plot1.jpg",
        fileName: "plot1.jpg",
      },
    ],
  });

  assert.strictEqual(
    parsedRes.t1FarmerHomeAddress,
    "99 หมู่ 1 ต.ดอนเจดีย์ อ.ดอนเจดีย์",
  );
  assert.strictEqual(parsedRes.t1PlotLatitude, 14.654321);
  assert.strictEqual(parsedRes.t1PlotLongitude, 100.012345);
  assert.strictEqual(parsedRes.t1PlotImages?.length, 1);
  assert.strictEqual(parsedRes.t1PlotImages?.[0].url, "https://example.com/plot1.jpg");
  console.log("  ✔ Summary Builder and Parser roundtrip PASS");

  console.log("\n=== ALL TYPE_1 AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
