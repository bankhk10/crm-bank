import assert from "node:assert";
import {
  hydrateType13PlannedData,
  extractType13PlanTargets,
} from "@/modules/activity/features/type-13/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 13 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType13Target with Products
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 13 from dedicated type13Targets and type13Products...");

  const planWithType13 = {
    id: "plan-t13-001",
    code: "TP26100130",
    title: "ฉีดแปลงแฮตแทค แปลงทดสอบวัชพืช",
    status: "APPROVED",
    type13Targets: [
      {
        id: "t13-target-1",
        activityPlanId: "plan-t13-001",
        workTypeCode: "TYPE_13",
        plotName: "แปลงทดสอบแฮตแทค แปลง 1",
        storeId: "store-001",
        dealerName: "ร้านชัยเจริญพาณิชย์",
        ownerName: "นายทองดี สดใส",
        province: "สุรินทร์",
        district: "ปราสาท",
        subdistrict: "กังแอน",
        village: "บ้านด่าน",
        plannedPlotsCount: 3,
        store: {
          id: "store-001",
          name: "ร้านชัยเจริญพาณิชย์",
          customerCode: "CUST-T13-01",
        },
        products: [
          {
            id: "t13-prod-1",
            targetId: "t13-target-1",
            productId: "prod-h1",
            productName: "แฮตแทค สปีด",
            plannedRate: "50 ซีซี / น้ำ 20 ลิตร",
          },
        ],
      },
      {
        id: "t13-target-2",
        activityPlanId: "plan-t13-001",
        workTypeCode: "TYPE_13",
        plotName: "แปลงทดสอบแฮตแทค แปลง 2",
        storeId: "store-001",
        dealerName: "ร้านชัยเจริญพาณิชย์",
        ownerName: "นายบุญมี มั่งมี",
        province: "สุรินทร์",
        district: "ปราสาท",
        plannedPlotsCount: 2,
        products: [
          {
            id: "t13-prod-2",
            targetId: "t13-target-2",
            productId: "prod-h2",
            productName: "แฮตแทค แม็กซ์",
          },
        ],
      },
    ],
  };

  const hydrated1 = hydrateType13PlannedData(planWithType13);
  assert.strictEqual(hydrated1.length, 2, "Should hydrate 2 Type 13 plots");
  assert.strictEqual(hydrated1[0].name, "แปลงทดสอบแฮตแทค แปลง 1", "Plot 1 name should match");
  assert.strictEqual(hydrated1[0].dealerName, "ร้านชัยเจริญพาณิชย์", "Dealer name should match");
  assert.strictEqual(hydrated1[0].ownerName, "นายทองดี สดใส", "Owner name should match");
  assert.strictEqual(hydrated1[0].province, "สุรินทร์", "Province should match");
  assert.strictEqual(hydrated1[0].village, "บ้านด่าน", "Village should match");
  assert.strictEqual(hydrated1[0].plannedPlotsCount, 3, "Planned plots count should match");
  assert.strictEqual(hydrated1[0]?.products?.length, 1, "Should have 1 product");
  assert.strictEqual((hydrated1[0]?.products as any)?.[0]?.productName, "แฮตแทค สปีด");

  assert.strictEqual(hydrated1[1].name, "แปลงทดสอบแฮตแทค แปลง 2");
  assert.strictEqual(hydrated1[1].ownerName, "นายบุญมี มั่งมี");
  assert.strictEqual(hydrated1[1].plannedPlotsCount, 2);

  const targetExtract1 = extractType13PlanTargets(planWithType13);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 2, "List should contain 2 targets");
  assert.strictEqual(targetExtract1.primary.name, "แปลงทดสอบแฮตแทค แปลง 1");
  console.log("✓ Test 1 passed: Dedicated type13Targets and products hydrated perfectly.");

  console.log("\n All Type 13 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

