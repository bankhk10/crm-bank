import assert from "node:assert";
import {
  hydrateType12PlannedData,
  extractType12PlanTargets,
} from "@/modules/activity/features/type-12/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 12 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType12Target (Central Tour)
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Central Tour from dedicated type12Targets...");

  const planWithCentralTour = {
    id: "plan-t12-001",
    code: "TP26100120",
    title: "ทัวร์ดูงานแปลงวิจัยต่างประเทศ",
    status: "APPROVED",
    type12Targets: [
      {
        id: "t12-target-1",
        activityPlanId: "plan-t12-001",
        workTypeCode: "TYPE_12",
        tourType: "CENTRAL",
        tourSize: "LARGE",
        country: "ญี่ปุ่น",
        destination: "โตเกียวและฮอกไกโด",
        targetAttendeesCount: 35,
      },
    ],
  };

  const hydrated1 = hydrateType12PlannedData(planWithCentralTour, null);
  assert.strictEqual(hydrated1.tourType, "ทัวร์กลาง", "tourType should be mapped to Thai label");
  assert.strictEqual(hydrated1.tourSize, "ทัวร์ใหญ่", "tourSize should be mapped to Thai label");
  assert.strictEqual(hydrated1.country, "ญี่ปุ่น", "Country should match");
  assert.strictEqual(hydrated1.destination, "โตเกียวและฮอกไกโด", "Destination should match");

  const targetExtract1 = extractType12PlanTargets(planWithCentralTour);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.primary.tourType, "CENTRAL");
  assert.strictEqual(targetExtract1.primary.country, "ญี่ปุ่น");
  assert.strictEqual(targetExtract1.primary.targetAttendeesCount, 35);
  console.log("✓ Test 1 passed: Central Tour hydrated perfectly.");

  // -------------------------------------------------------------------------
  // Test 2: Hydrate Store Tour from dedicated table ActivityPlanType12Target
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Hydrating Store Tour from dedicated type12Targets...");

  const planWithStoreTour = {
    id: "plan-t12-002",
    code: "TP26100121",
    title: "พาลูกค้าตัวแทนจำหน่ายทัศนศึกษาดูงาน",
    status: "APPROVED",
    type12Targets: [
      {
        id: "t12-target-2",
        activityPlanId: "plan-t12-002",
        workTypeCode: "TYPE_12",
        tourType: "STORE",
        tourSize: "SMALL",
        country: "เวียดนาม",
        destination: "ดานังและฮอยอัน",
        storeId: "store-uuid-001",
        targetAttendeesCount: 15,
        store: {
          id: "store-uuid-001",
          name: "ร้านเจริญพาณิชย์การเกษตร",
          customerCode: "CUST-T12-01",
        },
      },
    ],
  };

  const hydrated2 = hydrateType12PlannedData(planWithStoreTour, null);
  assert.strictEqual(hydrated2.tourType, "ทัวร์ร้านค้า");
  assert.strictEqual(hydrated2.tourSize, "ทัวร์เล็ก");
  assert.strictEqual(hydrated2.country, "เวียดนาม");
  assert.strictEqual(hydrated2.destination, "ดานังและฮอยอัน");
  assert.strictEqual(hydrated2.store, "ร้านเจริญพาณิชย์การเกษตร");
  assert.strictEqual(hydrated2.storeId, "store-uuid-001");

  const targetExtract2 = extractType12PlanTargets(planWithStoreTour);
  assert.strictEqual(targetExtract2.primary.tourType, "STORE");
  assert.strictEqual(targetExtract2.primary.storeName, "ร้านเจริญพาณิชย์การเกษตร");
  console.log("✓ Test 2 passed: Store Tour hydrated perfectly.");

  console.log("\n All Type 12 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

