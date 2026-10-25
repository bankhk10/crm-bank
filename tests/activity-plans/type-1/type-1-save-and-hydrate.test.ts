import assert from "node:assert";
import {
  hydrateType1PlannedData,
  extractType1PlanTargets,
  mapType1PlannedItemToDb,
} from "@/modules/activity/features/type-1/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 1 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType1Target (Registered Store)
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating registered store from dedicated type1Targets...");

  const planWithStore = {
    id: "plan-t1-001",
    code: "TP26100010",
    title: "เข้าพบร้านค้ารุ่งเรืองการเกษตร",
    status: "APPROVED",
    type1Targets: [
      {
        id: "t1-target-1",
        activityPlanId: "plan-t1-001",
        workTypeCode: "TYPE_1",
        visitPurpose: "STORE",
        storeId: "store-uuid-001",
        isUnregisteredFarmer: false,
        topic: "แนะนำสินค้าใหม่",
        notes: "พูดคุยเรื่องการสั่งซื้อปุ๋ยรอบใหม่",
        store: {
          id: "store-uuid-001",
          name: "ร้านรุ่งเรืองการเกษตร",
          customerCode: "CUST-001",
          province: "สระบุรี",
          district: "เมือง",
        },
      },
    ],
  };

  const hydrated1 = hydrateType1PlannedData(planWithStore);
  assert.strictEqual(hydrated1.length, 1, "Should hydrate 1 item");
  assert.strictEqual(hydrated1[0].visitPurpose, "STORE", "Purpose should be STORE");
  assert.strictEqual(hydrated1[0].customerName, "ร้านรุ่งเรืองการเกษตร", "Customer name should match store");
  assert.strictEqual(hydrated1[0].topic, "แนะนำสินค้าใหม่", "Topic should match");
  assert.strictEqual(hydrated1[0].notes, "พูดคุยเรื่องการสั่งซื้อปุ๋ยรอบใหม่", "Notes should match");
  assert.strictEqual(hydrated1[0].isUnregisteredFarmer, false, "Should not be unregistered farmer");

  const targetExtract1 = extractType1PlanTargets(planWithStore);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 1, "Target list should have 1 item");
  console.log("✓ Test 1 passed: Registered store hydrated successfully.");

  // -------------------------------------------------------------------------
  // Test 2: Hydrate Unregistered Key Farmer (isUnregisteredFarmer: true)
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Hydrating unregistered key farmer from dedicated type1Targets...");

  const planWithFarmer = {
    id: "plan-t1-002",
    code: "TP26100011",
    title: "เข้าพบเกษตรกรแปลงใหญ่",
    status: "APPROVED",
    type1Targets: [
      {
        id: "t1-target-2",
        activityPlanId: "plan-t1-002",
        workTypeCode: "TYPE_1",
        visitPurpose: "FARMER",
        storeId: null,
        isUnregisteredFarmer: true,
        unregisteredFarmerName: "นายสมศักดิ์ ข้าวหอม",
        unregisteredFarmerPhone: "081-999-8888",
        province: "ชัยนาท",
        topic: "สำรวจปัญหาเพลี้ยกระโดด",
        notes: "เข้าตรวจสอบแปลงนา 30 ไร่",
      },
    ],
  };

  const hydrated2 = hydrateType1PlannedData(planWithFarmer);
  assert.strictEqual(hydrated2.length, 1, "Should hydrate 1 item");
  assert.strictEqual(hydrated2[0].visitPurpose, "FARMER", "Purpose should be FARMER");
  assert.strictEqual(hydrated2[0].isUnregisteredFarmer, true, "Should be unregistered farmer");
  assert.strictEqual(hydrated2[0].unregisteredFarmerName, "นายสมศักดิ์ ข้าวหอม", "Farmer name should match");
  assert.strictEqual(hydrated2[0].unregisteredFarmerPhone, "081-999-8888", "Farmer phone should match");
  assert.strictEqual(hydrated2[0].province, "ชัยนาท", "Province should match");
  assert.strictEqual(hydrated2[0].notes, "เข้าตรวจสอบแปลงนา 30 ไร่", "Notes should match");
  console.log("✓ Test 2 passed: Unregistered key farmer hydrated successfully.");

  // -------------------------------------------------------------------------
  // Test 3: Multi-target hydration
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Hydrating multi-target items (Store + Farmer)...");

  const planMulti = {
    id: "plan-t1-003",
    type1Targets: [
      ...planWithStore.type1Targets,
      ...planWithFarmer.type1Targets,
    ],
  };

  const hydratedMulti = hydrateType1PlannedData(planMulti);
  assert.strictEqual(hydratedMulti.length, 2, "Should hydrate 2 targets");
  assert.strictEqual(hydratedMulti[0].customerName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(hydratedMulti[1].unregisteredFarmerName, "นายสมศักดิ์ ข้าวหอม");
  console.log("✓ Test 3 passed: Multi-target items hydrated successfully.");

  // -------------------------------------------------------------------------
  // Test 4: Mapping from UI item to DB payload
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Mapping UI items to DB payload...");

  const dbPayload = mapType1PlannedItemToDb(hydrated2[0]);
  assert.ok(dbPayload, "Payload should be generated");
  assert.strictEqual(dbPayload.workTypeCode, "TYPE_1");
  assert.strictEqual(dbPayload.isUnregisteredFarmer, true);
  assert.strictEqual(dbPayload.unregisteredFarmerName, "นายสมศักดิ์ ข้าวหอม");
  assert.strictEqual(dbPayload.province, "ชัยนาท");
  console.log("✓ Test 4 passed: mapType1PlannedItemToDb works correctly.");

  console.log("\n All Type 1 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

