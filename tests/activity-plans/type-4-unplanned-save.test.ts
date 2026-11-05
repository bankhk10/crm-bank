import assert from "node:assert";
import { mapType4UnplannedToPayload, hydrateType4UnplannedData } from "@/modules/activity/features/type-4/unplanned/application/unplanned-mapper";
import { type4UnplannedStrategy } from "@/modules/activity/features/type-4/unplanned/infrastructure/type4-unplanned.strategy";
import type { Type4UnplannedItem } from "@/modules/activity/features/type-4/unplanned/types/unplanned.types";

async function runTests() {
  console.log("=== Running Type 4 Unplanned Multi-Store Save Tests ===");

  // -------------------------------------------------------------
  // Test 1: mapType4UnplannedToPayload with 2 Stores
  // -------------------------------------------------------------
  console.log("\n[Test 1] Verifying mapType4UnplannedToPayload preserves 2 stores...");

  const customers = [
    { id: "store-uuid-1", name: "ร้านรุ่งเรืองการเกษตร" },
    { id: "store-uuid-2", name: "ร้านสมบูรณ์พาณิชย์" },
  ];

  const items: any[] = [
    {
      id: "item-1",
      customerType: "EXISTING_STORE",
      storeId: "store-uuid-1",
      customer: "ร้านรุ่งเรืองการเกษตร",
      customerName: "ร้านรุ่งเรืองการเกษตร",
      targetAmount: 10000,
      receivedAmount: 10000,
      collectType: "COLLECT",
      orderNo: "INV-2026-001",
      billingStatus: "วางบิลสำเร็จ",
      billingDetail: "บิลรอบต้นเดือน",
      collectDetail: "โอนผ่านธนาคาร",
      notes: "ร้านค้าโอนชำระเรียบร้อย",
    },
    {
      id: "item-2",
      customerType: "NEW_STORE",
      storeId: undefined,
      customerName: "ร้าน ป.การเกษตร (นอกระบบ)",
      customer: "ร้าน ป.การเกษตร (นอกระบบ)",
      targetAmount: 5500,
      receivedAmount: 5500,
      collectType: "BILLING",
      orderNo: "INV-2026-002",
      billingStatus: "วางบิลสำเร็จ",
      billingDetail: "ส่งมอบบิลให้เจ้าของร้าน",
      collectDetail: "นัดชำระสิ้นเดือน",
      notes: "นัดเก็บเงินวันศุกร์",
    },
  ];

  const mapped = mapType4UnplannedToPayload(items, customers);

  // Targets
  assert.strictEqual(mapped.targets.length, 2, "mapped.targets must have 2 stores");
  assert.strictEqual(mapped.targets[0].storeId, "store-uuid-1");
  assert.strictEqual(mapped.targets[0].storeName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(mapped.targets[1].storeId, null);
  assert.strictEqual(mapped.targets[1].storeName, "ร้าน ป.การเกษตร (นอกระบบ)");

  // Items for actual billing & collection
  assert.strictEqual(mapped.items.length, 2, "mapped.items must have 2 stores");
  assert.strictEqual(mapped.items[0].storeId, "store-uuid-1");
  assert.strictEqual(mapped.items[0].companyName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(mapped.items[0].receivedAmount, 10000);
  assert.strictEqual(mapped.items[0].orderNo, "INV-2026-001");
  assert.strictEqual(mapped.items[0].collectType, "COLLECT");

  assert.strictEqual(mapped.items[1].storeId, null);
  assert.strictEqual(mapped.items[1].companyName, "ร้าน ป.การเกษตร (นอกระบบ)");
  assert.strictEqual(mapped.items[1].receivedAmount, 5500);
  assert.strictEqual(mapped.items[1].orderNo, "INV-2026-002");
  assert.strictEqual(mapped.items[1].collectType, "BILLING");

  // Summary result
  assert.strictEqual(mapped.result.receivedAmount, 15500, "Sum of received amount should be 15,500");
  assert.strictEqual(mapped.result.orderNo, "INV-2026-001, INV-2026-002");

  console.log("✓ Test 1 passed: 2 stores correctly mapped to targets and items payload.");

  // -------------------------------------------------------------
  // Test 2: type4UnplannedStrategy.savePlan persists 2 records to activityResultType4
  // -------------------------------------------------------------
  console.log("\n[Test 2] Verifying type4UnplannedStrategy.savePlan persists 2 rows into activityResultType4...");

  const mockCreatedResults: any[] = [];
  const mockCreatedTargets: any[] = [];
  let updatedResultAmount: number | null = null;

  const mockTx: any = {
    activityPlanStore: {
      deleteMany: async () => {},
      createMany: async () => {},
    },
    activityPlanType4Target: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        mockCreatedTargets.push(...args.data);
      },
    },
    activityResult: {
      findFirst: async () => ({ id: "res-123" }),
      update: async (args: any) => {
        updatedResultAmount = Number(args.data.collectResultAmount);
      },
    },
    activityResultType4: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        mockCreatedResults.push(...args.data);
      },
      create: async (args: any) => {
        mockCreatedResults.push(args.data);
      },
    },
    activityAttachment: {
      deleteMany: async () => {},
      createMany: async () => {},
    },
  };

  const planId = "test-plan-456";
  const planData = {
    planType: "UNPLANNED",
    startDate: new Date("2026-10-22T08:00:00Z"),
    endDate: new Date("2026-10-22T17:00:00Z"),
    type4Targets: mapped.targets,
    type4Items: mapped.items,
    type4Result: mapped.result,
    type4Results: mapped.items,
    items: mapped.items,
    actualData: {
      workTypeCode: "TYPE_4",
      type4Result: mapped.result,
      type4Results: mapped.items,
      items: mapped.items,
    },
  };

  await type4UnplannedStrategy.savePlan(mockTx, planId, planData);

  // Verify targets saved
  assert.strictEqual(mockCreatedTargets.length, 2, "activityPlanType4Target must receive 2 target rows");

  // Verify actual results saved (THE CORE FIX!)
  assert.strictEqual(
    mockCreatedResults.length,
    2,
    `activityResultType4 MUST receive 2 records, but received ${mockCreatedResults.length}!`,
  );

  assert.strictEqual(mockCreatedResults[0].activityPlanId, planId);
  assert.strictEqual(mockCreatedResults[0].storeId, "store-uuid-1");
  assert.strictEqual(mockCreatedResults[0].companyName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(Number(mockCreatedResults[0].receivedAmount), 10000);
  assert.strictEqual(mockCreatedResults[0].orderNo, "INV-2026-001");
  assert.strictEqual(mockCreatedResults[0].collectType, "COLLECT");

  assert.strictEqual(mockCreatedResults[1].activityPlanId, planId);
  assert.strictEqual(mockCreatedResults[1].storeId, null);
  assert.strictEqual(mockCreatedResults[1].companyName, "ร้าน ป.การเกษตร (นอกระบบ)");
  assert.strictEqual(Number(mockCreatedResults[1].receivedAmount), 5500);
  assert.strictEqual(mockCreatedResults[1].orderNo, "INV-2026-002");
  assert.strictEqual(mockCreatedResults[1].collectType, "BILLING");

  // Verify total collect amount updated
  assert.strictEqual(updatedResultAmount, 15500, "collectResultAmount must be 15,500");

  console.log("✓ Test 2 passed: Both stores saved into activityResultType4 without collapsing.");

  // -------------------------------------------------------------
  // Test 3: Hydration from plan with 2 stores in type4Results
  // -------------------------------------------------------------
  console.log("\n[Test 3] Verifying hydrateType4UnplannedData restores 2 stores...");

  const planFromDb = {
    id: planId,
    type4Targets: mockCreatedTargets,
    type4Results: mockCreatedResults,
    result: {
      collectResultAmount: 15500,
    },
  };

  const hydrated = hydrateType4UnplannedData(planFromDb);

  assert.strictEqual(hydrated.length, 2, "Hydrated items must contain 2 stores");
  assert.strictEqual(hydrated[0].storeId, "store-uuid-1");
  assert.strictEqual(hydrated[0].receivedAmount, 10000);

  assert.strictEqual(hydrated[1].customerName, "ร้าน ป.การเกษตร (นอกระบบ)");
  assert.strictEqual(hydrated[1].receivedAmount, 5500);

  console.log("✓ Test 3 passed: 2 stores correctly hydrated back into form state.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
