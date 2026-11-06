import assert from "node:assert";
import {
  hydrateType5PlannedData,
  extractType5PlanTargets,
} from "@/modules/activity/features/type-5/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 5 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType5Target
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 5 from dedicated type5Targets...");

  const planWithSurvey = {
    id: "plan-t5-001",
    code: "TP26100050",
    title: "สำรวจราคาสารกำจัดหญ้าในตลาด",
    status: "APPROVED",
    type5Targets: [
      {
        id: "t5-target-1",
        activityPlanId: "plan-t5-001",
        workTypeCode: "TYPE_5",
        storeId: "store-001",
        productId: "prod-001",
        detail: "สำรวจโปรโมชั่นและราคาขายหน้าร้านของสารกลูโฟซิเนต",
        store: {
          id: "store-001",
          name: "ร้านเจริญเกษตรพาณิชย์",
          customerCode: "CUST-T5-01",
          province: "เพชรบูรณ์",
        },
        product: {
          id: "prod-001",
          name: "กลูโฟซิเนต ตราคู่แข่ง A",
          productCode: "GLU-01",
        },
      },
      {
        id: "t5-target-2",
        activityPlanId: "plan-t5-001",
        workTypeCode: "TYPE_5",
        storeId: "store-002",
        productId: "prod-002",
        detail: "สำรวจส่วนแบ่งการตลาดปุ๋ยเคมีสูตร 16-16-16",
        store: {
          id: "store-002",
          name: "ร้านเกษตรอินเตอร์",
          customerCode: "CUST-T5-02",
          province: "เพชรบูรณ์",
        },
        product: {
          id: "prod-002",
          name: "ปุ๋ยเคมี 16-16-16 ตราคู่แข่ง B",
          productCode: "FERT-B",
        },
      },
    ],
  };

  const hydrated1 = hydrateType5PlannedData(planWithSurvey);
  assert.strictEqual(hydrated1.length, 2, "Should hydrate 2 survey items");
  assert.strictEqual(hydrated1[0].storeName, "ร้านเจริญเกษตรพาณิชย์", "Store name should match");
  assert.strictEqual(hydrated1[0].comparedProduct, "กลูโฟซิเนต ตราคู่แข่ง A", "Compared product should match");
  assert.strictEqual(hydrated1[0].detail, "สำรวจโปรโมชั่นและราคาขายหน้าร้านของสารกลูโฟซิเนต", "Detail should match");
  assert.strictEqual(hydrated1[1].storeName, "ร้านเกษตรอินเตอร์", "Second store name should match");
  assert.strictEqual(hydrated1[1].comparedProduct, "ปุ๋ยเคมี 16-16-16 ตราคู่แข่ง B", "Second product should match");

  const targetExtract1 = extractType5PlanTargets(planWithSurvey);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 2, "List should contain 2 targets");
  assert.strictEqual(targetExtract1.list[0].store, "ร้านเจริญเกษตรพาณิชย์");
  assert.strictEqual(targetExtract1.list[0].product, "กลูโฟซิเนต ตราคู่แข่ง A");
  console.log("✓ Test 1 passed: Dedicated type5Targets hydrated perfectly.");

  console.log("\n All Type 5 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

