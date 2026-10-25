import assert from "node:assert";
import {
  hydrateType14PlannedData,
  extractType14PlanTargets,
} from "@/modules/activity/features/type-14/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 14 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType14Target with Products
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 14 from dedicated type14Targets and type14Products...");

  const planWithType14 = {
    id: "plan-t14-001",
    code: "TP26100140",
    title: "ติดตามแปลงแฮตแทคหลังฉีดพ่น 14 วัน",
    status: "APPROVED",
    type14Targets: [
      {
        id: "t14-target-1",
        activityPlanId: "plan-t14-001",
        workTypeCode: "TYPE_14",
        sourceActivityPlanId: "plan-t13-source-001",
        demoPlotId: "plot-hattack-101",
        plotName: "แปลงแฮตแทค แปลงที่ 1 คุณสมคิด",
        mode: "EXISTING_PLOT",
        ownerName: "นายสมคิด ข้าวดี",
        province: "ร้อยเอ็ด",
        district: "เกษตรวิสัย",
        cropCategory: "ข้าว",
        cropName: "ข้าวหอมมะลิ 105",
        areaRai: 15,
        dealerName: "ร้านเกษตรเจริญ",
        store: {
          id: "store-001",
          name: "ร้านเกษตรเจริญ",
          customerCode: "CUST-T14-01",
        },
        products: [
          {
            id: "t14-prod-1",
            targetId: "t14-target-1",
            productId: "prod-h1",
            productName: "แฮตแทค สปีด",
            quantity: 2,
            unit: "ขวด",
          },
        ],
      },
    ],
    type14Products: [
      {
        id: "t14-prod-1",
        activityPlanId: "plan-t14-001",
        productId: "prod-h1",
        productName: "แฮตแทค สปีด",
        quantity: 2,
        unit: "ขวด",
      },
    ],
  };

  const hydrated1 = hydrateType14PlannedData(planWithType14);
  assert.strictEqual(hydrated1.selectedPlanId, "plan-t13-source-001", "Source plan ID should match");
  assert.strictEqual(hydrated1.demoPlotId, "plot-hattack-101", "demoPlotId should match");
  assert.strictEqual(hydrated1.name, "แปลงแฮตแทค แปลงที่ 1 คุณสมคิด", "Plot name should match");
  assert.strictEqual(hydrated1.ownerName, "นายสมคิด ข้าวดี", "Owner name should match");
  assert.strictEqual(hydrated1.province, "ร้อยเอ็ด", "Province should match");
  assert.strictEqual(hydrated1.district, "เกษตรวิสัย", "District should match");
  assert.strictEqual(hydrated1.cropCategory, "ข้าว", "Crop category should match");
  assert.strictEqual(hydrated1.cropName, "ข้าวหอมมะลิ 105", "Crop name should match");
  assert.strictEqual(hydrated1.plots?.length, 1, "Should have 1 plot in plots array");

  const targetExtract1 = extractType14PlanTargets(planWithType14);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 1, "List should contain 1 target");
  assert.strictEqual(targetExtract1.primary.name, "แปลงแฮตแทค แปลงที่ 1 คุณสมคิด");
  assert.strictEqual(targetExtract1.primary.areaRai, 15);
  console.log("✓ Test 1 passed: Dedicated type14Targets and products hydrated perfectly.");

  console.log("\n All Type 14 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

