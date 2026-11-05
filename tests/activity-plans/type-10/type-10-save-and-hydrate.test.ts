import assert from "node:assert";
import {
  hydrateType10PlannedData,
  extractType10PlanTargets,
} from "@/modules/activity/features/type-10/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 10 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType10Target
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 10 from dedicated type10Targets...");

  const planWithFieldDay = {
    id: "plan-t10-001",
    code: "TP26100100",
    title: "จัดงาน Field Day ข้าวโพดหวานพันธุ์ลูกผสม",
    status: "APPROVED",
    type10Targets: [
      {
        id: "t10-target-1",
        activityPlanId: "plan-t10-001",
        workTypeCode: "TYPE_10",
        demoPlotId: "plot-uuid-999",
        plotName: "แปลงสาธิตข้าวโพดหวาน คุณสมหมาย",
        location: "ตำบลหนองสาหร่าย อำเภอปากช่อง",
        cropName: "ข้าวโพดหวาน",
        cropCategory: "พืชไร่",
        showcaseProductName: "ปุ๋ยอินทรีย์เคมี ตราเพชร",
        targetAttendeesCount: 80,
        targetBookingSales: 250000,
        demoPlot: {
          id: "plot-uuid-999",
          name: "แปลงสาธิตข้าวโพดหวาน คุณสมหมาย",
          ownerName: "นายสมหมาย หมายมั่น",
          location: "ตำบลหนองสาหร่าย อำเภอปากช่อง",
          targetCrop: "ข้าวโพดหวาน",
          primaryProductName: "ปุ๋ยอินทรีย์เคมี ตราเพชร",
        },
        showcaseProduct: {
          id: "prod-t10-001",
          name: "ปุ๋ยอินทรีย์เคมี ตราเพชร",
        },
      },
    ],
  };

  const hydrated1 = hydrateType10PlannedData(planWithFieldDay);
  assert.strictEqual(hydrated1.demoPlotId, "plot-uuid-999", "demoPlotId should match");
  assert.strictEqual(hydrated1.location, "ตำบลหนองสาหร่าย อำเภอปากช่อง", "Location should match");
  assert.strictEqual(hydrated1.targetCrop, "ข้าวโพดหวาน", "Target crop should match");
  assert.strictEqual(hydrated1.showcase, "ปุ๋ยอินทรีย์เคมี ตราเพชร", "Showcase product should match");
  assert.strictEqual(hydrated1.attendees, 80, "Target attendees count should match");
  assert.strictEqual(hydrated1.bookingSales, 250000, "Booking sales should match");

  const targetExtract1 = extractType10PlanTargets(planWithFieldDay);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 1, "List should contain 1 target");
  assert.strictEqual(targetExtract1.primary.showcase, "ปุ๋ยอินทรีย์เคมี ตราเพชร");
  assert.strictEqual(targetExtract1.primary.targetAttendeesCount, 80);
  assert.strictEqual(targetExtract1.primary.targetBookingSales, 250000);
  console.log("✓ Test 1 passed: Dedicated type10Targets hydrated perfectly.");

  // -------------------------------------------------------------------------
  // Test 2: Hydrate from PostgreSQL DB structure where type7aTargetId is used (no demoPlotId)
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Hydrating Type 10 from real DB structure (type7aTargetId & type7aTarget)...");

  const planFromDb = {
    id: "plan-t10-002",
    code: "TP26100200",
    title: "จัดงาน Field Day ข้าวพันธุ์ กข85",
    type10Targets: [
      {
        id: "t10-target-db-1",
        activityPlanId: "plan-t10-002",
        type7aTargetId: "t7a-target-uuid-888",
        plotName: "แปลงสาธิตข้าว กข85 นครปฐม",
        location: "ตำบลทุ่งขวาง อำเภอกำแพงแสน จ.นครปฐม",
        cropName: "ข้าว กข85",
        showcaseProductName: "ยาป้องกันเชื้อรา สูตรเข้มข้น",
        targetAttendeesCount: 50,
        targetBookingSales: 100000,
        type7aTarget: {
          id: "t7a-target-uuid-888",
          activityPlanId: "plan-t7a-source-777",
          code: "DP26100088",
          plotName: "แปลงสาธิตข้าว กข85 นครปฐม",
        },
      },
    ],
  };

  const hydrated2 = hydrateType10PlannedData(planFromDb);
  assert.strictEqual(
    hydrated2.demoPlotId,
    "plan-t7a-source-777",
    "demoPlotId should resolve to source activity plan ID for edit form",
  );
  assert.strictEqual(hydrated2.location, "ตำบลทุ่งขวาง อำเภอกำแพงแสน จ.นครปฐม");
  assert.strictEqual(hydrated2.targetCrop, "ข้าว กข85");
  assert.strictEqual(hydrated2.showcase, "ยาป้องกันเชื้อรา สูตรเข้มข้น");
  assert.strictEqual(hydrated2.attendees, 50);
  assert.strictEqual(hydrated2.bookingSales, 100000);

  const targetExtract2 = extractType10PlanTargets(planFromDb);
  assert.ok(targetExtract2.primary);
  assert.strictEqual(targetExtract2.primary.demoPlotId, "plan-t7a-source-777");
  console.log("✓ Test 2 passed: DB type7aTargetId and type7aTarget hydrated successfully!");

  console.log("\n All Type 10 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

