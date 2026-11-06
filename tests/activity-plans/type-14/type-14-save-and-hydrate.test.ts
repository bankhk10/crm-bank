import assert from "node:assert";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  hydrateType14PlannedData,
  extractType14PlanTargets,
} from "@/modules/activity/features/type-14/planned/application/planned-mapper";
import { findHattackFollowUpActivityPlans } from "@/modules/activity/features/type-14/planned/infrastructure/type14.repository";
import {
  findActivityPlanById,
  generateActivityPlanCode,
} from "@/modules/activity/infrastructure/activity-plan.repository";
import {
  saveStrategiesForPlan,
  saveStrategiesForActual,
  WORK_TYPE_STRATEGY_REGISTRY,
} from "@/modules/activity/infrastructure/strategy.registry";

async function runTests() {
  console.log("=== Running Type 14 Save & Hydration Unit + Integration Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType14Target with Products (In-memory)
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
  console.log("✓ Test 1 passed: In-memory hydration & target extraction verified.");

  // -------------------------------------------------------------------------
  // Test 2: Querying active Type 13 follow-up plans from database
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Querying active Type 13 follow-up plans from database...");
  const followUpPlans = await findHattackFollowUpActivityPlans();
  console.log(`Found ${followUpPlans.length} active Type 13 follow-up plans.`);
  assert(followUpPlans.length > 0, "Database must have active Type 13 plans for testing");

  const sourcePlan = followUpPlans[0];
  console.log(`Using Type 13 Plan: [${sourcePlan.planCode}] ${sourcePlan.planTitle} (${sourcePlan.plots.length} plots)`);

  const testEmployee = await db.employee.findFirst();
  const testUser = await db.user.findFirst();
  const type14ActivityType = await db.activityType.findFirst({
    where: { code: "TYPE_14" },
  });

  assert(testEmployee && testUser && type14ActivityType, "Required seed data missing");

  // -------------------------------------------------------------------------
  // Test 3: Simulating UI creation payload submission via saveStrategiesForPlan
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Simulating UI creation payload submission via saveStrategiesForPlan...");

  // Mimic exact payload emitted by planned-activity-form.tsx onSubmit + useType14PlannedForm
  const plotIds = sourcePlan.plots.map((p) => p.id);
  const plannedPlots = sourcePlan.plots.map((p) => ({
    id: p.id,
    demoPlotId: p.id,
    type13TargetId: p.id,
    name: p.name,
    plotName: p.name,
    storeId: p.dealerId || "",
    dealerName: p.dealerName || null,
    ownerName: p.ownerName || null,
    province: p.province || "",
    district: p.district || "",
    subdistrict: p.subdistrict || null,
    village: p.village || null,
    plannedPlotsCount: p.plannedPlotsCount || 1,
  }));

  const uiPayload = {
    planType: "PLANNED",
    title: "ทดสอบ แผนติดตามแปลงแฮตแทค Type 14 (Automated Test)",
    startDate: new Date(),
    endDate: new Date(),
    activityTypeId: type14ActivityType.id,
    workTypeCodes: ["TYPE_14"],
    province: sourcePlan.plots[0]?.province || "นครราชสีมา",
    district: sourcePlan.plots[0]?.district || "เมือง",
    location: "แปลงเกษตรกร",
    notes: "สร้างแผนผ่านระบบอัตโนมัติ",
    planStores: sourcePlan.plots[0]?.dealerId
      ? [
          {
            workTypeCode: "TYPE_14",
            visitPurpose: "STORE",
            storeId: sourcePlan.plots[0].dealerId,
            storeName: sourcePlan.plots[0].dealerName || "Dealer",
            province: sourcePlan.plots[0].province || null,
            remarks: "Dealer ติดตามแปลงแฮตแทค",
            notes: "แปลงแฮตแทค",
          },
        ]
      : [],
    planProducts: [],
    type14Data: {
      selectedPlanId: sourcePlan.planId,
      sourceActivityPlanId: sourcePlan.planId,
      mode: "EXISTING_PLOT" as const,
      selectedPlotIds: plotIds,
      type13TargetIds: plotIds,
      demoPlotIds: plotIds,
      name: sourcePlan.plots[0]?.name || sourcePlan.planTitle,
      dealerName: sourcePlan.plots[0]?.dealerName || null,
      ownerName: sourcePlan.plots[0]?.ownerName || null,
      province: sourcePlan.plots[0]?.province || "",
      district: sourcePlan.plots[0]?.district || "",
      hasProducts: false,
      hasProductWithdrawal: false,
      notes: "หมายเหตุเป้าหมาย Type 14",
      plots: plannedPlots,
      products: [],
      withdrawnProducts: [],
    },
    type14Plots: plannedPlots,
    type14Targets: plannedPlots,
  };

  // Verify WORK_TYPE_STRATEGY_REGISTRY recognizes TYPE_14
  assert(
    WORK_TYPE_STRATEGY_REGISTRY.TYPE_14.hasData(uiPayload),
    "Strategy registry must identify Type 14 data in payload",
  );

  // Execute database transaction to create ActivityPlan and run saveStrategiesForPlan
  const createdPlan = await db.$transaction(async (tx) => {
    const code = await generateActivityPlanCode(tx, uiPayload.startDate);
    const plan = await tx.activityPlan.create({
      data: {
        code,
        title: uiPayload.title,
        startDate: uiPayload.startDate,
        endDate: uiPayload.endDate,
        durationDays: 1,
        fiscalYear: 2026,
        fiscalMonth: 10,
        fiscalQuarter: 4,
        activityTypeId: uiPayload.activityTypeId,
        objective: "ติดตามแปลงแฮตแทคหลังฉีดพ่น",
        planType: "PLANNED",
        location: uiPayload.location,
        province: uiPayload.province,
        district: uiPayload.district,
        notes: uiPayload.notes,
        status: "DRAFT",
        employeeId: testEmployee.id,
        createdById: testUser.id,
      },
    });

    // Add ActivityPlanWorkType join record
    await tx.activityPlanWorkType.create({
      data: {
        activityPlanId: plan.id,
        activityTypeId: type14ActivityType.id,
      },
    });

    // Run Strategy Registry (Save targets into activity_type_14_targets)
    await saveStrategiesForPlan(tx, plan.id, uiPayload);

    return plan;
  });

  const createdPlanId = createdPlan.id;
  console.log(`✓ ActivityPlan created with ID: ${createdPlanId}`);

  // -------------------------------------------------------------------------
  // Test 4: Verify activity_type_14_targets has rows in the database
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Querying activity_type_14_targets table...");
  const targetsInDb = await db.activityPlanType14Target.findMany({
    where: { activityPlanId: createdPlanId },
  });

  console.log(`Found ${targetsInDb.length} rows in activity_type_14_targets table.`);
  assert(
    targetsInDb.length > 0,
    `activity_type_14_targets table MUST have rows! Found ${targetsInDb.length}`,
  );
  assert.strictEqual(
    targetsInDb.length,
    sourcePlan.plots.length,
    `Expected ${sourcePlan.plots.length} target rows, found ${targetsInDb.length}`,
  );

  targetsInDb.forEach((target, idx) => {
    console.log(`  Row ${idx + 1}: id=${target.id} | plotName=${target.plotName} | type13TargetId=${target.type13TargetId} | sourcePlanId=${target.sourceActivityPlanId}`);
    assert.strictEqual(target.sourceActivityPlanId, sourcePlan.planId, "sourceActivityPlanId must match");
    assert.ok(target.type13TargetId, "type13TargetId must be populated");
  });
  console.log("✓ Test 4 passed: activity_type_14_targets table successfully has all rows!");

  // -------------------------------------------------------------------------
  // Test 5: Verify Edit Page Loading (findActivityPlanById & hydrateType14PlannedData)
  // -------------------------------------------------------------------------
  console.log("\n[Test 5] Simulating entering edit page...");
  const loadedPlan = await findActivityPlanById(createdPlanId);
  assert(loadedPlan, "findActivityPlanById must return the created plan");

  const hydratedEditData = hydrateType14PlannedData(
    loadedPlan,
    loadedPlan.province || "",
    loadedPlan.district || "",
    followUpPlans,
  );

  assert.strictEqual(
    hydratedEditData.selectedPlanId,
    sourcePlan.planId,
    "selectedPlanId must be restored upon entering edit page",
  );
  assert.strictEqual(
    hydratedEditData.plots?.length,
    sourcePlan.plots.length,
    "plots count must match source plan plots",
  );
  console.log(`✓ Test 5 passed: Edit page correctly hydrates selectedPlanId=${hydratedEditData.selectedPlanId} and ${hydratedEditData.plots?.length} plots.`);

  // -------------------------------------------------------------------------
  // Test 6: Verify Update Plan via Strategy Registry
  // -------------------------------------------------------------------------
  console.log("\n[Test 6] Testing updating plan targets via saveStrategiesForPlan...");
  await db.$transaction(async (tx) => {
    await saveStrategiesForPlan(tx, createdPlanId, {
      ...uiPayload,
      type14Data: {
        ...uiPayload.type14Data,
        notes: "แก้ไขหมายเหตุเป้าหมาย Type 14 เรียบร้อยแล้ว",
      },
    });
  });

  const targetsAfterUpdate = await db.activityPlanType14Target.findMany({
    where: { activityPlanId: createdPlanId },
  });
  assert.strictEqual(targetsAfterUpdate.length, sourcePlan.plots.length);
  assert.strictEqual(targetsAfterUpdate[0].notes, "แก้ไขหมายเหตุเป้าหมาย Type 14 เรียบร้อยแล้ว");
  console.log("✓ Test 6 passed: Update persisted cleanly.");

  // -------------------------------------------------------------------------
  // Test 7: Verify Actual Outcome Recording (saveStrategiesForActual)
  // -------------------------------------------------------------------------
  console.log("\n[Test 7] Testing saveStrategiesForActual with actualPlotsCount...");
  const actualPlotsToSubmit = targetsAfterUpdate.map((t, idx) => ({
    id: t.id,
    type13TargetId: t.type13TargetId,
    plotName: t.plotName,
    plannedPlotsCount: 1,
    actualPlotsCount: (idx + 1) * 3, // 3, 6, etc.
  }));

  const actualData = {
    resultStatus: "COMPLETED",
    actualStartDate: new Date().toISOString().split("T")[0],
    actualEndDate: new Date().toISOString().split("T")[0],
    type14Actual: {
      plots: actualPlotsToSubmit,
      rounds: [
        {
          roundNumber: 1,
          actualVisitDate: new Date().toISOString().split("T")[0],
          daysAfterSpray: "14",
          trackingResult: "ปกติ ควบคุมแมลงได้ดี",
          productResponse: "พืชตอบสนองดี",
          additionalNotes: "บันทึกผลงานจริงผ่านการทดสอบ",
          afterSprayImages: [],
          products: [],
        },
      ],
    },
  };

  await db.$transaction(async (tx) => {
    await saveStrategiesForActual(tx, createdPlanId, actualData, ["TYPE_14"]);
  });

  const resultsInDb = await db.activityResultType14.findMany({
    where: { activityPlanId: createdPlanId },
  });
  assert.strictEqual(resultsInDb.length, 1, "Must have 1 tracking round result in activity_type_14_results");

  const target1AfterActual = await db.activityPlanType14Target.findUnique({
    where: { id: targetsAfterUpdate[0].id },
  });
  assert(
    target1AfterActual?.notes?.includes("[จำนวนแปลงจริง: 3]"),
    "Target notes must store actualPlotsCount",
  );
  console.log("✓ Test 7 passed: Actual result recorded and actualPlotsCount persisted!");

  // -------------------------------------------------------------------------
  // Clean Up Test Data
  // -------------------------------------------------------------------------
  console.log("\n[Cleanup] Deleting test plan...");
  await db.$transaction(async (tx) => {
    await tx.activityResultType14.deleteMany({ where: { activityPlanId: createdPlanId } });
    await tx.activityPlanType14Target.deleteMany({ where: { activityPlanId: createdPlanId } });
    await tx.activityPlanWorkType.deleteMany({ where: { activityPlanId: createdPlanId } });
    await tx.activityPlan.delete({ where: { id: createdPlanId } });
  });
  console.log("✓ Test plan cleaned up.");

  console.log("\n🎉 ALL TESTS IN tests/activity-plans/type-14 PASSED PERFECTLY! 🎉\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
