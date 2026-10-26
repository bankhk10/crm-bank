import assert from "node:assert";
import {
  hydrateType11PlannedData,
  extractType11PlanTargets,
} from "@/modules/activity/features/type-11/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 11 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType11Target
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 11 from dedicated type11Targets...");

  const planWithStockCheck = {
    id: "plan-t11-001",
    code: "TP26100110",
    title: "ตรวจเช็คสต๊อกปุ๋ยและยาหน้าร้าน",
    status: "APPROVED",
    type11Targets: [
      {
        id: "t11-target-1",
        activityPlanId: "plan-t11-001",
        workTypeCode: "TYPE_11",
        storeId: "store-uuid-001",
        storeName: "ร้านถาวรการเกษตร",
        isUnregisteredStore: false,
        province: "เชียงใหม่",
        district: "สันทราย",
        notes: "ตรวจนับสต๊อกสิ้นเดือน ตรวจสอบวันหมดอายุ",
        store: {
          id: "store-uuid-001",
          name: "ร้านถาวรการเกษตร",
          customerCode: "CUST-T11-01",
          province: "เชียงใหม่",
          district: "สันทราย",
        },
        products: [
          {
            id: "t11-prod-1",
            targetId: "t11-target-1",
            productId: "prod-001",
            productName: "บิ๊กกิล",
          },
        ],
      },
    ],
  };

  const hydrated1 = hydrateType11PlannedData(planWithStockCheck);
  assert.strictEqual(hydrated1.length, 1, "Should hydrate 1 store item");
  assert.strictEqual(hydrated1[0].storeName, "ร้านถาวรการเกษตร", "Store name should match");
  assert.strictEqual(hydrated1[0].storeId, "store-uuid-001", "storeId should match");
  assert.strictEqual(hydrated1[0].isUnregisteredStore, false, "Should be registered store");
  assert.strictEqual(hydrated1[0].province, "เชียงใหม่", "Province should match");
  assert.strictEqual(hydrated1[0].notes, "ตรวจนับสต๊อกสิ้นเดือน ตรวจสอบวันหมดอายุ", "Notes should match");

  const targetExtract1 = extractType11PlanTargets(planWithStockCheck);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 1, "List should contain 1 target");
  assert.strictEqual(targetExtract1.primary.store, "ร้านถาวรการเกษตร");
  console.log("✓ Test 1 passed: Dedicated type11Targets hydrated perfectly.");

  // -------------------------------------------------------------------------
  // Test 2: Unregistered Store in Type 11
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Hydrating Unregistered Store in Type 11...");

  const planWithUnregStore = {
    id: "plan-t11-002",
    code: "TP26100111",
    title: "ตรวจเช็คสต๊อกร้านค้าย่อยนอกระบบ",
    status: "APPROVED",
    type11Targets: [
      {
        id: "t11-target-2",
        activityPlanId: "plan-t11-002",
        workTypeCode: "TYPE_11",
        storeId: null,
        storeName: "ร้านลุงปาน การเกษตร (นอกระบบ)",
        isUnregisteredStore: true,
        province: "ลำพูน",
        district: "ป่าซาง",
        dealerId: "dealer-001",
        dealerName: "หจก. ตัวแทนหลักภาคเหนือ",
        notes: "ตรวจสต๊อกยาฆ่าหญ้า",
      },
    ],
  };

  const hydrated2 = hydrateType11PlannedData(planWithUnregStore);
  assert.strictEqual(hydrated2.length, 1);
  assert.strictEqual(hydrated2[0].isUnregisteredStore, true);
  assert.strictEqual(hydrated2[0].storeName, "ร้านลุงปาน การเกษตร (นอกระบบ)");
  assert.strictEqual(hydrated2[0].dealerName, "หจก. ตัวแทนหลักภาคเหนือ");

  const targetExtract2 = extractType11PlanTargets(planWithUnregStore);
  assert.strictEqual(targetExtract2.primary.isUnregisteredStore, true);
  assert.strictEqual(targetExtract2.primary.store, "ร้านลุงปาน การเกษตร (นอกระบบ)");
  console.log("✓ Test 2 passed: Unregistered store hydrated perfectly.");

  // -------------------------------------------------------------------------
  // Test 3: Multiple stores with null storeId (verifying unique IDs & keys)
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Hydrating multiple stores with null storeId...");

  const planWithMultipleNullStoreIds = {
    id: "plan-t11-003",
    type11Targets: [
      {
        id: "target-cuid-1",
        storeId: null,
        storeName: "ร้าน A นอกระบบ",
      },
      {
        id: "target-cuid-2",
        storeId: null,
        storeName: "ร้าน B นอกระบบ",
      },
    ],
  };

  const hydrated3 = hydrateType11PlannedData(planWithMultipleNullStoreIds);
  assert.strictEqual(hydrated3.length, 2);
  assert.strictEqual(hydrated3[0].storeId, null);
  assert.strictEqual(hydrated3[1].storeId, null);
  assert.strictEqual(hydrated3[0].id, "target-cuid-1");
  assert.strictEqual(hydrated3[1].id, "target-cuid-2");
  assert.notStrictEqual(hydrated3[0].id, hydrated3[1].id, "Hydrated targets must have unique IDs");

  // Verify key resolution logic for Type11PlannedForm
  const keys = hydrated3.map((store, index) => {
    return (
      store.id ||
      store.targetId ||
      (store.storeId ? `store-${store.storeId}-${index}` : null) ||
      `store-idx-${index}-${store.storeName || "unnamed"}`
    );
  });
  assert.strictEqual(keys[0], "target-cuid-1");
  assert.strictEqual(keys[1], "target-cuid-2");
  assert.notStrictEqual(keys[0], keys[1], "Keys must be completely unique and non-null");
  console.log("✓ Test 3 passed: Multiple stores with null storeId produce unique non-null keys.");

  console.log("\n All Type 11 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
