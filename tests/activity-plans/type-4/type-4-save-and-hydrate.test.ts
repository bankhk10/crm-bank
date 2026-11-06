import assert from "node:assert";
import {
  hydrateType4PlannedData,
  extractType4PlanTargets,
} from "@/modules/activity/features/type-4/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 4 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType4Target (BILLING & COLLECT)
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 4 from dedicated type4Targets...");

  const planWithBillingCollect = {
    id: "plan-t4-001",
    code: "TP26100040",
    title: "วางบิลและเก็บเงินประจำรอบเดือน",
    status: "APPROVED",
    type4Targets: [
      {
        id: "t4-target-1",
        activityPlanId: "plan-t4-001",
        workTypeCode: "TYPE_4",
        storeId: "store-001",
        collectType: "BILLING",
        invoiceNo: "INV-2026-001",
        targetAmount: 150000,
        notes: "นำส่งใบแจ้งหนี้รอบ 30 วัน",
        store: {
          id: "store-001",
          name: "ร้านเจริญทรัพย์เกษตร",
          customerCode: "CUST-T4-01",
          province: "อยุธยา",
        },
      },
      {
        id: "t4-target-2",
        activityPlanId: "plan-t4-001",
        workTypeCode: "TYPE_4",
        storeId: "store-002",
        collectType: "COLLECT",
        invoiceNo: "INV-2026-002",
        targetAmount: 85000,
        notes: "รับเช็คเงินสด",
        store: {
          id: "store-002",
          name: "ร้านเกษตรไทยเจริญ",
          customerCode: "CUST-T4-02",
          province: "อยุธยา",
        },
      },
    ],
  };

  const hydrated1 = hydrateType4PlannedData(planWithBillingCollect);
  assert.strictEqual(hydrated1.length, 2, "Should hydrate 2 Type 4 items");
  assert.strictEqual(hydrated1[0].collectType, "BILLING", "First item should be BILLING");
  assert.strictEqual(hydrated1[0].customerName, "ร้านเจริญทรัพย์เกษตร", "First customer name should match");
  assert.strictEqual(hydrated1[0].invoiceNo, "INV-2026-001", "First invoiceNo should match");
  assert.strictEqual(hydrated1[0].collectAmount, 150000, "First collectAmount should match");
  assert.strictEqual(hydrated1[1].collectType, "COLLECT", "Second item should be COLLECT");
  assert.strictEqual(hydrated1[1].customerName, "ร้านเกษตรไทยเจริญ", "Second customer name should match");
  assert.strictEqual(hydrated1[1].collectAmount, 85000, "Second collectAmount should match");

  const targetExtract1 = extractType4PlanTargets(planWithBillingCollect);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 2, "List should contain 2 targets");
  assert.strictEqual(targetExtract1.list[0].collectType, "BILLING");
  assert.strictEqual(targetExtract1.list[1].collectType, "COLLECT");
  assert.strictEqual(targetExtract1.list[0].targetAmountNum, 150000);
  assert.strictEqual(targetExtract1.list[1].targetAmountNum, 85000);
  console.log("✓ Test 1 passed: Dedicated type4Targets hydrated perfectly for BILLING & COLLECT.");

  console.log("\n All Type 4 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

