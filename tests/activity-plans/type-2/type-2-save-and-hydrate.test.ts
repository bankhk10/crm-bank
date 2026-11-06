import assert from "node:assert";
import {
  hydrateType2PlannedData,
  extractType2PlanTargets,
} from "@/modules/activity/features/type-2/planned/application/planned-mapper";
import { parseType2ActualResult } from "@/modules/activity/features/type-2/planned/application/actual-mapper";
import { parseResultSummary } from "@/modules/activity/domain/summary/result-summary-parser";

async function runTests() {
  console.log("=== Running Type 2 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType2Target with Products
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 2 from dedicated type2Targets and type2Products...");

  const planWithStoreAndProducts = {
    id: "plan-t2-001",
    code: "TP26100020",
    title: "ติดตามผลการใช้ปุ๋ยและยา",
    status: "APPROVED",
    type2Targets: [
      {
        id: "t2-target-1",
        activityPlanId: "plan-t2-001",
        workTypeCode: "TYPE_2",
        visitPurpose: "STORE",
        storeId: "store-001",
        isUnregisteredFarmer: false,
        notes: "ติดตามผลการใช้ฮอร์โมนพืชหลังฝนตก",
        store: {
          id: "store-001",
          name: "ร้านเจริญการเกษตร",
          customerCode: "CUST-T2-01",
          province: "ลพบุรี",
          district: "พัฒนานิคม",
        },
        products: [
          {
            id: "t2-prod-1",
            targetId: "t2-target-1",
            productId: "prod-t2-101",
            notes: "อัตรา 20 ซีซี ต่อน้ำ 20 ลิตร",
            product: {
              id: "prod-t2-101",
              name: "เอ็กซอล",
              productCode: "EX001",
              unit: "ขวด",
            },
          },
          {
            id: "t2-prod-2",
            targetId: "t2-target-1",
            productId: "prod-t2-102",
            notes: "ฉีดพ่นทางใบช่วงเช้า",
            product: {
              id: "prod-t2-102",
              name: "นูริชแคลเซียมโบรอน",
              productCode: "NCB002",
              unit: "ขวด",
            },
          },
        ],
      },
    ],
  };

  const hydrated1 = hydrateType2PlannedData(planWithStoreAndProducts);
  assert.strictEqual(hydrated1.length, 1, "Should hydrate 1 Type 2 item");
  assert.strictEqual(hydrated1[0].customerName, "ร้านเจริญการเกษตร", "Customer name should match store");
  assert.strictEqual(hydrated1[0].storeId, "store-001", "storeId should match");
  assert.strictEqual(hydrated1[0].detail, "ติดตามผลการใช้ฮอร์โมนพืชหลังฝนตก", "Detail should match");
  assert.strictEqual(hydrated1[0]?.products?.length, 2, "Should hydrate 2 products");
  assert.strictEqual(hydrated1[0]?.products?.[0]?.productName, "เอ็กซอล", "First product name should match");
  assert.strictEqual(hydrated1[0]?.products?.[1]?.productName, "นูริชแคลเซียมโบรอน", "Second product name should match");

  const targetExtract1 = extractType2PlanTargets(planWithStoreAndProducts);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 1, "List should contain 1 target");
  assert.strictEqual(targetExtract1.primary.customer, "ร้านเจริญการเกษตร", "Customer in target should match");
  assert.strictEqual(targetExtract1.primary.items?.length, 2, "Items in target should contain 2 products");
  console.log("✓ Test 1 passed: Dedicated type2Targets and products hydrated perfectly.");

  // -------------------------------------------------------------------------
  // Test 2: Hydrate Unregistered Farmer in Type 2
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Hydrating Unregistered Farmer in Type 2...");

  const planWithUnregisteredFarmer = {
    id: "plan-t2-002",
    code: "TP26100021",
    title: "ติดตามผลแปลงแตงโม",
    status: "APPROVED",
    type2Targets: [
      {
        id: "t2-target-2",
        activityPlanId: "plan-t2-002",
        workTypeCode: "TYPE_2",
        visitPurpose: "FARMER",
        storeId: null,
        isUnregisteredFarmer: true,
        unregisteredFarmerName: "ลุงประสิทธิ์ นาดี",
        unregisteredFarmerPhone: "089-111-2222",
        province: "สุพรรณบุรี",
        notes: "ติดตามการติดผลของแตงโมหลังใช้ปุ๋ยเกล็ด",
        products: [
          {
            id: "t2-prod-3",
            targetId: "t2-target-2",
            productId: "prod-t2-103",
            notes: "ฉีดสัปดาห์ละ 1 ครั้ง",
            product: {
              id: "prod-t2-103",
              name: "ปุ๋ยเกล็ดสูตร 10-52-17",
              productCode: "FERT-01",
              unit: "ถุง",
            },
          },
        ],
      },
    ],
  };

  const hydrated2 = hydrateType2PlannedData(planWithUnregisteredFarmer);
  assert.strictEqual(hydrated2.length, 1, "Should hydrate 1 item");
  assert.strictEqual(hydrated2[0].isUnregisteredFarmer, true, "Should be unregistered farmer");
  assert.strictEqual(hydrated2[0].unregisteredFarmerName, "ลุงประสิทธิ์ นาดี", "Farmer name should match");
  assert.strictEqual(hydrated2[0].customerName, "ลุงประสิทธิ์ นาดี", "customerName should fallback to farmer name");
  assert.strictEqual(hydrated2[0].unregisteredFarmerPhone, "089-111-2222", "Farmer phone should match");

  const targetExtract2 = extractType2PlanTargets(planWithUnregisteredFarmer);
  assert.strictEqual(targetExtract2.primary.customer, "ลุงประสิทธิ์ นาดี", "Customer in target should match farmer name");
  console.log("✓ Test 2 passed: Unregistered farmer hydrated perfectly.");

  // -------------------------------------------------------------------------
  // Test 3: Multi-target and empty store fallback
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Testing multi-target hydration and safety when legacy stores is empty...");

  const planMulti = {
    id: "plan-t2-003",
    stores: [], // Notice: Empty legacy stores table!
    products: [],
    type2Targets: [
      ...planWithStoreAndProducts.type2Targets,
      ...planWithUnregisteredFarmer.type2Targets,
    ],
  };

  const targetExtractMulti = extractType2PlanTargets(planMulti);
  assert.strictEqual(targetExtractMulti.list.length, 2, "Must extract 2 targets even when stores is empty!");
  assert.strictEqual(targetExtractMulti.list[0].customer, "ร้านเจริญการเกษตร");
  assert.strictEqual(targetExtractMulti.list[1].customer, "ลุงประสิทธิ์ นาดี");
  console.log("✓ Test 3 passed: Multi-target extracted correctly even when legacy stores is empty.");

  // -------------------------------------------------------------------------
  // Test 4: Hydrate Actual Results where usageResult is "พบปัญหา"
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Testing Actual Hydration with 'พบปัญหา' in DB (activity_type_2_result)...");

  const planWithProblemResult = {
    id: "plan-t2-004",
    code: "TP26100022",
    status: "COMPLETED",
    type2Targets: [
      {
        id: "target-prob-1",
        activityPlanId: "plan-t2-004",
        visitPurpose: "FARMER",
        storeId: null,
        isUnregisteredFarmer: true,
        unregisteredFarmerName: "นายสมศักดิ์ ปลูกพริก",
        products: [
          {
            id: "t2-prod-prob-1",
            targetId: "target-prob-1",
            productId: "prod-prob-101",
            product: { id: "prod-prob-101", name: "ฮอร์โมนซุปเปอร์โกร" },
          },
        ],
        results: [
          {
            id: "t2-res-1",
            targetId: "target-prob-1",
            productId: "prod-prob-101",
            productName: "ฮอร์โมนซุปเปอร์โกร",
            usageResult: "พบปัญหา",
            problemDetail: "ใบพริกเหลืองและเกิดคราบไหม้หลังฉีดพ่น 2 วัน",
            followupDetail: null,
            isAdditional: false,
          },
        ],
      },
    ],
    type2Results: [
      {
        id: "t2-res-1",
        targetId: "target-prob-1",
        productId: "prod-prob-101",
        productName: "ฮอร์โมนซุปเปอร์โกร",
        usageResult: "พบปัญหา",
        problemDetail: "ใบพริกเหลืองและเกิดคราบไหม้หลังฉีดพ่น 2 วัน",
        followupDetail: null,
        isAdditional: false,
      },
    ],
    result: {
      id: "result-main-1",
      activityPlanId: "plan-t2-004",
      resultStatus: "COMPLETED",
    },
  };

  // 4.1 Check extractType2PlanTargets extracts "พบปัญหา" and problemDetail
  const extractedProblemTargets = extractType2PlanTargets(planWithProblemResult);
  assert.strictEqual(extractedProblemTargets.list.length, 1);
  const targetItem = extractedProblemTargets.list[0]?.items?.[0]!;
  assert.strictEqual(targetItem.usageResult, "พบปัญหา", "Target product usageResult must be 'พบปัญหา'");
  assert.strictEqual(targetItem.problemDetail, "ใบพริกเหลืองและเกิดคราบไหม้หลังฉีดพ่น 2 วัน", "problemDetail must match DB");

  // 4.2 Check parseType2ActualResult extracts "พบปัญหา"
  const parsedFromPlan = parseType2ActualResult({
    ...planWithProblemResult.result,
    type2Results: planWithProblemResult.type2Results,
    activityPlan: planWithProblemResult,
  });
  assert.strictEqual(parsedFromPlan.usageResult, "พบปัญหา", "parsed.usageResult must be 'พบปัญหา'");
  assert.strictEqual(parsedFromPlan.problemDetail, "ใบพริกเหลืองและเกิดคราบไหม้หลังฉีดพ่น 2 วัน");
  assert.strictEqual(parsedFromPlan.followupResults[0]?.usageResult, "พบปัญหา");

  // 4.3 Check parseResultSummary handles activityPlan.type2Results
  const summaryParsed = parseResultSummary({
    ...planWithProblemResult.result,
    activityPlan: planWithProblemResult,
  });
  assert.strictEqual(summaryParsed.t2UsageResult, "พบปัญหา", "summaryParsed.t2UsageResult must be 'พบปัญหา'");
  assert.strictEqual(summaryParsed.t2ProblemDetail, "ใบพริกเหลืองและเกิดคราบไหม้หลังฉีดพ่น 2 วัน");
  console.log("✓ Test 4 passed: 'พบปัญหา' in DB hydrated correctly into usageResult and problemDetail.");

  // -------------------------------------------------------------------------
  // Test 5: Fallback to plan.type2Results when target.results is empty or targetId is null
  // -------------------------------------------------------------------------
  console.log("\n[Test 5] Testing extractType2PlanTargets fallback to plan.type2Results when target.results is empty...");

  const planWithOrphanResults = {
    id: "plan-t2-005",
    type2Targets: [
      {
        id: "target-orphan-1",
        activityPlanId: "plan-t2-005",
        visitPurpose: "STORE",
        storeId: "store-002",
        products: [
          {
            id: "t2-prod-orp-1",
            targetId: "target-orphan-1",
            productId: "prod-orp-1",
            product: { id: "prod-orp-1", name: "ยาฆ่าแมลงเอฟ" },
          },
        ],
        results: [], // Empty results on target!
      },
    ],
    type2Results: [
      {
        id: "res-orp-1",
        activityPlanId: "plan-t2-005",
        targetId: null, // targetId is null in DB
        productId: "prod-orp-1",
        productName: "ยาฆ่าแมลงเอฟ",
        usageResult: "พบปัญหา",
        problemDetail: "แมลงไม่ตายและเกิดการดื้อยา",
        isAdditional: false,
      },
    ],
  };

  const extractedOrphanTargets = extractType2PlanTargets(planWithOrphanResults);
  const orphanItem = extractedOrphanTargets.list[0]?.items?.[0]!;
  assert.strictEqual(orphanItem.usageResult, "พบปัญหา", "Must fallback to plan.type2Results and get 'พบปัญหา'");
  assert.strictEqual(orphanItem.problemDetail, "แมลงไม่ตายและเกิดการดื้อยา");
  console.log("✓ Test 5 passed: Fallback to plan.type2Results succeeded.");

  console.log("\n All Type 2 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

