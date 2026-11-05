import assert from "node:assert";
import { extractPlotFollowUpTimeline } from "@/modules/activity/features/type-7a/planned/application/follow-up-mapper";

async function runTests() {
  console.log(
    "=== Running Type 7A Demo Plot Follow-Up Timeline Unit Tests ===",
  );

  // -------------------------------------------------------------------------
  // Test 1: Empty DemoPlot (No follow-up visits yet)
  // -------------------------------------------------------------------------
  console.log(
    "\n[Test 1] Testing with freshly created demo plot (no follow-ups yet)...",
  );

  const freshPlot = {
    id: "dp-fresh-001",
    code: "DP2610001",
    name: "แปลงสาธิตทุเรียนหมอนทอง นายสมชาย",
    status: "IN_PROGRESS",
    visits: [],
    type7bPlots: [],
    sprayRounds: [],
  };

  const freshResult = extractPlotFollowUpTimeline(freshPlot);
  assert.strictEqual(freshResult.plotId, "dp-fresh-001");
  assert.strictEqual(freshResult.plotName, "แปลงสาธิตทุเรียนหมอนทอง นายสมชาย");
  assert.strictEqual(freshResult.totalVisits, 0);
  assert.strictEqual(freshResult.totalPlans, 0);
  assert.strictEqual(freshResult.latestVisitDate, null);
  assert.strictEqual(freshResult.timeline.length, 0);
  assert.strictEqual(freshResult.closureStats, null);

  console.log(
    "✓ Test 1 passed: Fresh demo plot handled correctly with empty timeline.",
  );

  // -------------------------------------------------------------------------
  // Test 2: Multi-round Follow-up Journey with 7B Trip Plans, Spraying & Closure
  // -------------------------------------------------------------------------
  console.log(
    "\n[Test 2] Testing multi-round follow-up journey across multiple Trip Plans...",
  );

  const activePlot = {
    id: "dp-corn-999",
    code: "DP2610099",
    name: "แปลงสาธิตข้าวโพดหวาน คุณสมชาย",
    status: "COMPLETED",
    closedDate: new Date("2026-11-15"),
    finalHarvestDate: new Date("2026-11-14"),
    demoYieldKg: 4200,
    controlYieldKg: 3550,
    yieldIncreasePercent: 18.31,
    farmerSatisfaction: 5,
    commercialPotential: "สูง (เกษตรกรสั่งซื้อ 50 ลัง)",
    finalSummaryNotes:
      "พืชตอบสนองต่อเอ็กซอลและนูริชดีมาก ฝักเต็ม เมล็ดเรียงสม่ำเสมอ",
    visits: [
      {
        id: "visit-1",
        visitNumber: 1,
        visitDate: new Date("2026-10-14"),
        daysSinceStart: 14,
        activityPlanId: "plan-7b-001",
        cropCondition: "สมบูรณ์",
        growthStage: "ระยะต้นกล้า 4-5 ใบ",
        cropAgeValue: 14,
        cropAgeUnit: "วัน",
        productResponse: "พืชตอบสนองดี",
        sprayMethod: "SINGLE",
        sprayEquipment: "เป้สะพายหลัง",
        cropImageUrls: ["https://storage.example.com/corn-v1-1.jpg"],
        activityPlan: {
          id: "plan-7b-001",
          code: "TP26100010",
          title: "ติดตามแปลงสาธิต ครั้งที่ 1",
          status: "COMPLETED",
          employee: { id: "emp-1", name: "นายสมศักดิ์ ยอดขยัน" },
        },
      },
      {
        id: "visit-2",
        visitNumber: 2,
        visitDate: new Date("2026-10-28"),
        daysSinceStart: 28,
        activityPlanId: "plan-7b-002",
        cropCondition: "สมบูรณ์",
        growthStage: "ระยะออกฝักอ่อน",
        cropAgeValue: 28,
        cropAgeUnit: "วัน",
        productResponse: "พืชตอบสนองดี",
        sprayMethod: "TANK_MIXED",
        sprayEquipment: "เป้สะพายหลัง",
        cropImageUrls: ["https://storage.example.com/corn-v2-1.jpg"],
        plotImageUrls: ["https://storage.example.com/corn-v2-plot.jpg"],
        activityPlan: {
          id: "plan-7b-002",
          code: "TP26100025",
          title: "ติดตามแปลงสาธิต ครั้งที่ 2",
          status: "COMPLETED",
          employee: { id: "emp-1", name: "นายสมศักดิ์ ยอดขยัน" },
        },
      },
      {
        id: "visit-3",
        visitNumber: 3,
        visitDate: new Date("2026-11-15"),
        daysSinceStart: 45,
        activityPlanId: "plan-7b-003",
        cropCondition: "สมบูรณ์มาก พร้อมเก็บเกี่ยว",
        growthStage: "ระยะเก็บเกี่ยว",
        cropAgeValue: 45,
        cropAgeUnit: "วัน",
        productResponse: "ผลผลิตสูงกว่าแปลงควบคุมชัดเจน",
        activityPlan: {
          id: "plan-7b-003",
          code: "TP26110002",
          title: "ติดตามแปลงสาธิต ครั้งที่ 3 และประเมินผลปิดแปลง",
          status: "COMPLETED",
          employee: { id: "emp-2", name: "นายวิชัย ก้าวหน้า" },
        },
      },
    ],
    type7bPlots: [
      {
        id: "t7b-plot-1",
        demoPlotId: "dp-corn-999",
        type7b: {
          activityPlan: {
            id: "plan-7b-001",
            code: "TP26100010",
            title: "ติดตามแปลงสาธิต ครั้งที่ 1",
            status: "COMPLETED",
            employee: { id: "emp-1", name: "นายสมศักดิ์ ยอดขยัน" },
          },
        },
      },
      {
        id: "t7b-plot-2",
        demoPlotId: "dp-corn-999",
        type7b: {
          activityPlan: {
            id: "plan-7b-002",
            code: "TP26100025",
            title: "ติดตามแปลงสาธิต ครั้งที่ 2",
            status: "COMPLETED",
            employee: { id: "emp-1", name: "นายสมศักดิ์ ยอดขยัน" },
          },
        },
      },
      {
        id: "t7b-plot-3",
        demoPlotId: "dp-corn-999",
        type7b: {
          activityPlan: {
            id: "plan-7b-003",
            code: "TP26110002",
            title: "ติดตามแปลงสาธิต ครั้งที่ 3 และประเมินผลปิดแปลง",
            status: "COMPLETED",
            employee: { id: "emp-2", name: "นายวิชัย ก้าวหน้า" },
          },
        },
      },
    ],
    sprayRounds: [
      {
        id: "round-1",
        roundNumber: 1,
        sprayDate: new Date("2026-10-14"),
        sprayMethod: "SINGLE",
        activityResult: { activityPlanId: "plan-7b-001" },
        products: [
          {
            productName: "เอ็กซอล",
            quantityUsed: 2,
            unit: "ขวด",
            actualRate: "20 ซีซี/น้ำ 20 ลิตร",
            baselineRate: "20 ซีซี",
          },
        ],
      },
      {
        id: "round-2",
        roundNumber: 2,
        sprayDate: new Date("2026-10-28"),
        sprayMethod: "TANK_MIXED",
        activityResult: { activityPlanId: "plan-7b-002" },
        products: [
          {
            productName: "นูริชแคลเซียมโบรอน",
            quantityUsed: 3,
            unit: "ขวด",
            actualRate: "30 ซีซี/น้ำ 20 ลิตร",
            baselineRate: "30 ซีซี",
          },
        ],
        externalProducts: [
          {
            company: "บริษัท เคมีสยาม",
            productName: "ไตรอะโซฟอส 40%",
            formula: "EC",
            applicationRate: "25 ซีซี/น้ำ 20 ลิตร",
          },
        ],
      },
    ],
  };

  const result = extractPlotFollowUpTimeline(activePlot);

  assert.strictEqual(result.plotId, "dp-corn-999");
  assert.strictEqual(result.totalVisits, 3, "Total visits should be 3");
  assert.strictEqual(result.totalPlans, 3, "Total distinct plans should be 3");
  assert.strictEqual(result.plotStatus, "COMPLETED");

  // Verify Visit #1
  const v1 = result.timeline[0];
  assert.strictEqual(v1.visitNumber, 1);
  assert.strictEqual(v1.planCode, "TP26100010");
  assert.strictEqual(v1.employeeName, "นายสมศักดิ์ ยอดขยัน");
  assert.strictEqual(v1.daysSinceStart, 14);
  assert.strictEqual(v1.sprayProducts.length, 1);
  assert.strictEqual(v1.sprayProducts[0].name, "เอ็กซอล");
  assert.strictEqual(v1.photos.length, 1);

  // Verify Visit #2
  const v2 = result.timeline[1];
  assert.strictEqual(v2.visitNumber, 2);
  assert.strictEqual(v2.planCode, "TP26100025");
  assert.strictEqual(v2.sprayMethod, "TANK_MIXED");
  assert.strictEqual(v2.sprayProducts.length, 1);
  assert.strictEqual(v2.sprayProducts[0].name, "นูริชแคลเซียมโบรอน");
  assert.strictEqual(v2.externalProducts.length, 1);
  assert.strictEqual(v2.externalProducts[0].productName, "ไตรอะโซฟอส 40%");
  assert.strictEqual(v2.photos.length, 2);

  // Verify Visit #3 (Closure)
  const v3 = result.timeline[2];
  assert.strictEqual(v3.visitNumber, 3);
  assert.strictEqual(v3.planCode, "TP26110002");
  assert.strictEqual(v3.employeeName, "นายวิชัย ก้าวหน้า");
  assert.strictEqual(v3.isClosure, true);

  // Verify Closure Stats
  assert.ok(result.closureStats, "Closure stats should exist");
  assert.strictEqual(result.closureStats.demoYieldKg, 4200);
  assert.strictEqual(result.closureStats.controlYieldKg, 3550);
  assert.strictEqual(result.closureStats.yieldIncreasePercent, 18.31);
  assert.strictEqual(result.closureStats.farmerSatisfaction, 5);

  console.log(
    "✓ Test 2 passed: Multi-round journey with 3 Trip Plans, spray products, and closure stats synthesized successfully.",
  );

  // -------------------------------------------------------------------------
  // Test 3: Planned but not yet visited follow-up plan
  // -------------------------------------------------------------------------
  console.log(
    "\n[Test 3] Testing planned follow-up plan that has not yet had an actual visit...",
  );

  const plannedOnlyPlot = {
    id: "dp-planned-01",
    name: "แปลงข้าวหอมมะลิ",
    status: "IN_PROGRESS",
    visits: [],
    type7bPlots: [
      {
        id: "t7b-plot-p1",
        type7b: {
          activityPlan: {
            id: "plan-7b-future",
            code: "TP26100099",
            title: "นัดหมายติดตามแปลงรอบแรก",
            status: "APPROVED",
            startDate: new Date("2026-11-01"),
            employee: { name: "นางสาวศิริพร" },
          },
          products: [
            {
              productName: "นูริชพลัส",
              quantity: 2,
              unit: "แกลลอน",
            },
          ],
        },
      },
    ],
  };

  const pResult = extractPlotFollowUpTimeline(plannedOnlyPlot);
  assert.strictEqual(pResult.timeline.length, 1);
  assert.strictEqual(pResult.timeline[0].isPlannedOnly, true);
  assert.strictEqual(pResult.timeline[0].planCode, "TP26100099");
  assert.strictEqual(pResult.timeline[0].employeeName, "นางสาวศิริพร");
  assert.strictEqual(pResult.timeline[0].sprayProducts[0].name, "นูริชพลัส");

  console.log(
    "✓ Test 3 passed: Planned follow-up plan synthesized with isPlannedOnly=true.",
  );

  console.log("\n🎉 ALL DEMO PLOT FOLLOW-UP TIMELINE TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
