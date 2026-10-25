import assert from "node:assert";
import {
  hydrateType9PlannedData,
  extractType9PlanTargets,
} from "@/modules/activity/features/type-9/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 9 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType9Target with Products
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 9 from dedicated type9Targets and type9Products...");

  const planWithType9 = {
    id: "plan-t9-001",
    code: "TP26100090",
    title: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน วันเกษตรแฟร์",
    status: "APPROVED",
    province: "ขอนแก่น",
    district: "เมือง",
    type9Targets: [
      {
        id: "t9-target-1",
        activityPlanId: "plan-t9-001",
        workTypeCode: "TYPE_9",
        dealerId: "dealer-001",
        dealerName: "หจก. ขอนแก่นการเกษตร (Dealer)",
        subdealerId: "subdealer-001",
        subdealerName: "ร้าน ป. เกษตรยนต์ (Subdealer)",
        isUnregisteredSubdealer: false,
        subDealerStore: "",
        province: "ขอนแก่น",
        district: "เมือง",
        targetSales: 120000,
        dealer: {
          id: "dealer-001",
          name: "หจก. ขอนแก่นการเกษตร (Dealer)",
        },
        subdealer: {
          id: "subdealer-001",
          name: "ร้าน ป. เกษตรยนต์ (Subdealer)",
        },
        products: [
          {
            id: "t9-prod-1",
            targetId: "t9-target-1",
            productId: "prod-t9-101",
            productName: "บิ๊กกิล 1 ลิตร",
            targetQuantity: 20,
            targetUnitPrice: 3000,
            targetAmount: 60000,
            productRole: "TARGET",
            product: {
              id: "prod-t9-101",
              name: "บิ๊กกิล 1 ลิตร",
            },
          },
          {
            id: "t9-prod-2",
            targetId: "t9-target-1",
            productId: "prod-t9-102",
            productName: "โปรคลาม 500 กรัม",
            targetQuantity: 15,
            targetUnitPrice: 4000,
            targetAmount: 60000,
            productRole: "TARGET",
            product: {
              id: "prod-t9-102",
              name: "โปรคลาม 500 กรัม",
            },
          },
        ],
      },
    ],
  };

  const hydrated1 = hydrateType9PlannedData(planWithType9);
  assert.strictEqual(hydrated1.parentDealerName, "หจก. ขอนแก่นการเกษตร (Dealer)", "Parent dealer name should match");
  assert.strictEqual(hydrated1.subdealerName, "ร้าน ป. เกษตรยนต์ (Subdealer)", "Subdealer name should match");
  assert.strictEqual(hydrated1.isUnregisteredSubdealer, false, "Should not be unregistered subdealer");
  assert.strictEqual(hydrated1.type9Sales, 120000, "Target sales should match");
  assert.strictEqual(hydrated1.type9ProductItems?.length, 2, "Should hydrate 2 products");
  assert.strictEqual(hydrated1.type9ProductItems?.[0].productName, "บิ๊กกิล 1 ลิตร");
  assert.strictEqual(hydrated1.type9ProductItems?.[0].quantityCases, 20);
  assert.strictEqual(hydrated1.type9ProductItems?.[0].pricePerCase, 3000);
  assert.strictEqual(hydrated1.type9ProductItems?.[1].productName, "โปรคลาม 500 กรัม");

  const targetExtract1 = extractType9PlanTargets(planWithType9);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 1, "List should contain 1 target");
  assert.strictEqual(targetExtract1.primary.store, "ร้าน ป. เกษตรยนต์ (Subdealer)");
  assert.strictEqual(targetExtract1.primary.items?.length, 2, "Items should have 2 products");
  console.log("✓ Test 1 passed: Dedicated type9Targets and products hydrated perfectly.");

  // -------------------------------------------------------------------------
  // Test 2: Unregistered Subdealer in Type 9
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Hydrating Unregistered Subdealer in Type 9...");

  const planWithUnregSub = {
    id: "plan-t9-002",
    code: "TP26100091",
    title: "จัดกิจกรรมหน้าร้านค้าย่อยนอกระบบ",
    status: "APPROVED",
    type9Targets: [
      {
        id: "t9-target-2",
        activityPlanId: "plan-t9-002",
        workTypeCode: "TYPE_9",
        dealerId: "dealer-001",
        dealerName: "หจก. ขอนแก่นการเกษตร (Dealer)",
        subdealerId: null,
        subdealerName: null,
        isUnregisteredSubdealer: true,
        subDealerStore: "ร้าน อุดมการเกษตร (นอกระบบ)",
        targetSales: 50000,
        products: [
          {
            id: "t9-prod-3",
            targetId: "t9-target-2",
            productId: "prod-t9-101",
            productName: "บิ๊กกิล 1 ลิตร",
            targetQuantity: 10,
            targetUnitPrice: 5000,
            targetAmount: 50000,
            productRole: "TARGET",
          },
        ],
      },
    ],
  };

  const hydrated2 = hydrateType9PlannedData(planWithUnregSub);
  assert.strictEqual(hydrated2.isUnregisteredSubdealer, true, "isUnregisteredSubdealer should be true");
  assert.strictEqual(hydrated2.subDealerStore, "ร้าน อุดมการเกษตร (นอกระบบ)", "subDealerStore should match");
  assert.strictEqual(hydrated2.type9Sales, 50000);

  const targetExtract2 = extractType9PlanTargets(planWithUnregSub);
  assert.strictEqual(targetExtract2.primary.isSubDealer, true);
  assert.strictEqual(targetExtract2.primary.subDealerStore, "ร้าน อุดมการเกษตร (นอกระบบ)");
  console.log("✓ Test 2 passed: Unregistered subdealer target hydrated perfectly.");

  console.log("\n All Type 9 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

