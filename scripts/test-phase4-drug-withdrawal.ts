import "dotenv/config";
import { db } from "@/lib/db";
import {
  createActivityPlanUseCase,
  updateActivityPlanUseCase,
  getActivityPlanDetailUseCase,
} from "../modules/activity-plans/application";
import {
  createActivityPlan,
  updateActivityPlan,
  findActivityPlanById,
} from "../modules/activity-plans/infrastructure/activity-plan.repository";
import { ActivityStatus, DrugWithdrawalStatus, Prisma } from "@prisma/client";

async function runTests() {
  console.log("==================================================");
  console.log("STARTING PHASE 4 VERIFICATION SUITE");
  console.log("==================================================\n");

  const createdPlanIds: string[] = [];

  try {
    // 0. Setup Fixtures
    const user = await db.user.findFirst();
    if (!user) throw new Error("No user found in database");

    const employee = await db.employee.findFirst({
      where: { userId: user.id },
    }) || await db.employee.findFirst();
    if (!employee) throw new Error("No employee found in database");

    const products = await db.product.findMany({
      where: { deletedAt: null },
      take: 5,
    });
    if (products.length < 3) throw new Error("Need at least 3 active products in database");

    const existingPlot = await db.demoPlot.findFirst();

    const type7b = await db.activityType.findFirst({ where: { code: "TYPE_7B" } });
    const type1 = await db.activityType.findFirst({ where: { code: "TYPE_1" } });

    console.log(`Using user: ${user.name || user.email} (${user.id})`);
    console.log(`Using employee: ${employee.name} (${employee.id})`);
    console.log(`Using products: ${products.map(p => `${p.name} (${p.id})`).join(", ")}`);
    console.log(`Using demoPlot: ${existingPlot ? `${existingPlot.name} (${existingPlot.id})` : "None"}\n`);

    // ──────────────────────────────────────────────────────────
    // Test A: Create without withdrawal
    // ──────────────────────────────────────────────────────────
    console.log("--- Test A: Create without withdrawal ---");
    const testAPayload = {
      title: "Test Plan A - No Withdrawal",
      startDate: new Date("2026-10-10T09:00:00Z"),
      endDate: new Date("2026-10-10T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing create without withdrawal",
      hasDrugWithdrawal: false,
      drugWithdrawal: {
        hasDrugWithdrawal: false,
        items: [],
      },
    };

    const resA = await createActivityPlanUseCase(user.id, testAPayload);
    if (!resA.success || !resA.plan) {
      throw new Error(`Test A failed: ${resA.error}`);
    }
    createdPlanIds.push(resA.plan.id);

    const dwCountA = await db.drugWithdrawal.count({
      where: { activityPlanId: resA.plan.id },
    });
    if (dwCountA !== 0) {
      throw new Error(`Test A failed: expected 0 DrugWithdrawal, got ${dwCountA}`);
    }
    console.log(`[PASS] Test A: Plan created without DrugWithdrawal (count = 0)\n`);

    // ──────────────────────────────────────────────────────────
    // Test B: Create with withdrawal (1 plot, 2 products)
    // ──────────────────────────────────────────────────────────
    console.log("--- Test B: Create with withdrawal (1 plot, 2 products) ---");
    const testBPayload = {
      title: "Test Plan B - 1 Plot 2 Products",
      startDate: new Date("2026-10-11T09:00:00Z"),
      endDate: new Date("2026-10-11T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing create with withdrawal",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        notes: "Test B withdrawal notes",
        items: [
          {
            plotIdentifier: "แปลงทดสอบ 1",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 2,
            unit: products[0].unit || "ขวด",
            sortOrder: 0,
          },
          {
            plotIdentifier: "แปลงทดสอบ 1",
            productId: products[1].id,
            productName: products[1].name,
            quantity: 4,
            unit: products[1].unit || "ขวด",
            sortOrder: 1,
          },
        ],
      },
    };

    const resB = await createActivityPlanUseCase(user.id, testBPayload);
    if (!resB.success || !resB.plan) {
      throw new Error(`Test B failed: ${resB.error}`);
    }
    createdPlanIds.push(resB.plan.id);

    const planBFromDb = await findActivityPlanById(resB.plan.id);
    if (!planBFromDb?.drugWithdrawal) {
      throw new Error("Test B failed: drugWithdrawal not found on plan");
    }
    if (planBFromDb.drugWithdrawal.status !== DrugWithdrawalStatus.DRAFT) {
      throw new Error(`Test B failed: expected status DRAFT, got ${planBFromDb.drugWithdrawal.status}`);
    }
    if (planBFromDb.drugWithdrawal.items.length !== 2) {
      throw new Error(`Test B failed: expected 2 items, got ${planBFromDb.drugWithdrawal.items.length}`);
    }
    console.log(`[PASS] Test B: Plan created with 1 DrugWithdrawal, status = DRAFT, 2 items\n`);

    // ──────────────────────────────────────────────────────────
    // Test C: Multiple plots (Plot A with 2 products, Plot B with 2 products)
    // ──────────────────────────────────────────────────────────
    console.log("--- Test C: Multiple plots (4 items total across 2 plots) ---");
    const testCPayload = {
      title: "Test Plan C - Multi Plots",
      startDate: new Date("2026-10-12T09:00:00Z"),
      endDate: new Date("2026-10-12T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing multiple plots",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot A",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 3,
            unit: products[0].unit,
            sortOrder: 0,
          },
          {
            plotIdentifier: "Plot A",
            productId: products[1].id,
            productName: products[1].name,
            quantity: 5,
            unit: products[1].unit,
            sortOrder: 1,
          },
          {
            plotIdentifier: "Plot B",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 1,
            unit: products[0].unit,
            sortOrder: 2,
          },
          {
            plotIdentifier: "Plot B",
            productId: products[2].id,
            productName: products[2].name,
            quantity: 7,
            unit: products[2].unit,
            sortOrder: 3,
          },
        ],
      },
    };

    const resC = await createActivityPlanUseCase(user.id, testCPayload);
    if (!resC.success || !resC.plan) {
      throw new Error(`Test C failed: ${resC.error}`);
    }
    createdPlanIds.push(resC.plan.id);

    const planCFromDb = await findActivityPlanById(resC.plan.id);
    if (!planCFromDb?.drugWithdrawal || planCFromDb.drugWithdrawal.items.length !== 4) {
      throw new Error(`Test C failed: expected 4 items across 2 plots, got ${planCFromDb?.drugWithdrawal?.items.length}`);
    }
    console.log(`[PASS] Test C: Multi-plot created successfully with 4 items across 2 plots\n`);

    // ──────────────────────────────────────────────────────────
    // Test D: Decimal quantities preservation
    // ──────────────────────────────────────────────────────────
    console.log("--- Test D: Decimal quantities preservation (5.5, 0.25, 12.75) ---");
    const testDPayload = {
      title: "Test Plan D - Decimals",
      startDate: new Date("2026-10-13T09:00:00Z"),
      endDate: new Date("2026-10-13T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing decimal quantities",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot Decimals",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 5.5,
            unit: products[0].unit,
            sortOrder: 0,
          },
          {
            plotIdentifier: "Plot Decimals",
            productId: products[1].id,
            productName: products[1].name,
            quantity: 0.25,
            unit: products[1].unit,
            sortOrder: 1,
          },
          {
            plotIdentifier: "Plot Decimals",
            productId: products[2].id,
            productName: products[2].name,
            quantity: 12.75,
            unit: products[2].unit,
            sortOrder: 2,
          },
        ],
      },
    };

    const resD = await createActivityPlanUseCase(user.id, testDPayload);
    if (!resD.success || !resD.plan) {
      throw new Error(`Test D failed: ${resD.error}`);
    }
    createdPlanIds.push(resD.plan.id);

    const planDFromDb = await findActivityPlanById(resD.plan.id);
    const dItems = planDFromDb?.drugWithdrawal?.items || [];
    const q0 = Number(dItems[0].quantity);
    const q1 = Number(dItems[1].quantity);
    const q2 = Number(dItems[2].quantity);
    if (q0 !== 5.5 || q1 !== 0.25 || q2 !== 12.75) {
      throw new Error(`Test D failed: expected [5.5, 0.25, 12.75], got [${q0}, ${q1}, ${q2}]`);
    }
    console.log(`[PASS] Test D: Decimal quantities accurately preserved: [${q0}, ${q1}, ${q2}]\n`);

    // ──────────────────────────────────────────────────────────
    // Test E: Product relation & Fake product rejection
    // ──────────────────────────────────────────────────────────
    console.log("--- Test E: Product relation & Fake product rejection ---");
    const testEInvalidPayload = {
      title: "Test Plan E - Fake Product",
      startDate: new Date("2026-10-14T09:00:00Z"),
      endDate: new Date("2026-10-14T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing fake product rejection",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot E",
            productId: "non-existent-fake-product-id-12345",
            productName: "Fake Product",
            quantity: 1,
            unit: "ขวด",
          },
        ],
      },
    };

    let fakeProductRejected = false;
    try {
      const resE = await createActivityPlanUseCase(user.id, testEInvalidPayload);
      if (!resE.success) {
        fakeProductRejected = true;
      }
    } catch (err) {
      fakeProductRejected = true;
    }
    if (!fakeProductRejected) {
      throw new Error("Test E failed: Fake product ID was not rejected!");
    }
    console.log(`[PASS] Test E: Fake productId correctly rejected by persistence layer\n`);

    // ──────────────────────────────────────────────────────────
    // Test F: Plot relation (points to DemoPlot when supplied)
    // ──────────────────────────────────────────────────────────
    console.log("--- Test F: Plot relation (points to DemoPlot when supplied) ---");
    if (existingPlot) {
      const testFPayload = {
        title: "Test Plan F - DemoPlot Relation",
        startDate: new Date("2026-10-15T09:00:00Z"),
        endDate: new Date("2026-10-15T17:00:00Z"),
        activityTypeId: type7b?.id || "TYPE_7B",
        workTypeCodes: ["TYPE_7B"],
        objective: "Testing DemoPlot relation",
        drugWithdrawal: {
          hasDrugWithdrawal: true,
          items: [
            {
              demoPlotId: existingPlot.id,
              plotIdentifier: existingPlot.name,
              productId: products[0].id,
              productName: products[0].name,
              quantity: 10,
              unit: products[0].unit,
            },
          ],
        },
      };

      const resF = await createActivityPlanUseCase(user.id, testFPayload);
      if (!resF.success || !resF.plan) {
        throw new Error(`Test F failed: ${resF.error}`);
      }
      createdPlanIds.push(resF.plan.id);

      const planFFromDb = await findActivityPlanById(resF.plan.id);
      const itemF = planFFromDb?.drugWithdrawal?.items[0];
      if (itemF?.demoPlotId !== existingPlot.id) {
        throw new Error(`Test F failed: expected demoPlotId ${existingPlot.id}, got ${itemF?.demoPlotId}`);
      }
      if (!itemF?.demoPlot || itemF.demoPlot.name !== existingPlot.name) {
        throw new Error(`Test F failed: demoPlot relation not populated properly`);
      }
      console.log(`[PASS] Test F: DemoPlot relation accurately points to ${existingPlot.name} (${existingPlot.id})\n`);
    } else {
      console.log("[SKIP] Test F: No DemoPlot available in database\n");
    }

    // ──────────────────────────────────────────────────────────
    // Test G: Edit (update items, change quantity, add and remove items)
    // ──────────────────────────────────────────────────────────
    console.log("--- Test G: Edit synchronization ---");
    // Start with Plan B (currently has 2 items: products[0] qty 2, products[1] qty 4)
    const editPayload = {
      title: "Test Plan B - Edited",
      startDate: new Date("2026-10-11T09:00:00Z"),
      endDate: new Date("2026-10-11T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing edit synchronization",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        notes: "Updated notes",
        items: [
          // Item 1: changed quantity to 9.5
          {
            plotIdentifier: "แปลงทดสอบ 1",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 9.5,
            unit: products[0].unit,
            sortOrder: 0,
          },
          // Item 2: replaced products[1] with products[2], qty 15
          {
            plotIdentifier: "แปลงทดสอบ ใหม่",
            productId: products[2].id,
            productName: products[2].name,
            quantity: 15,
            unit: products[2].unit,
            sortOrder: 1,
          },
        ],
      },
    };

    const resG = await updateActivityPlanUseCase(resB.plan.id, user.id, editPayload);
    if (!resG.success) {
      throw new Error(`Test G failed: ${resG.error}`);
    }

    const planGFromDb = await findActivityPlanById(resB.plan.id);
    const gItems = planGFromDb?.drugWithdrawal?.items || [];
    if (gItems.length !== 2) {
      throw new Error(`Test G failed: expected 2 items, got ${gItems.length}`);
    }
    if (Number(gItems[0].quantity) !== 9.5 || gItems[0].productId !== products[0].id) {
      throw new Error(`Test G failed: item 0 quantity expected 9.5, got ${gItems[0].quantity}`);
    }
    if (Number(gItems[1].quantity) !== 15 || gItems[1].productId !== products[2].id) {
      throw new Error(`Test G failed: item 1 expected product ${products[2].id}, qty 15`);
    }
    if (planGFromDb?.drugWithdrawal?.notes !== "Updated notes") {
      throw new Error(`Test G failed: notes not updated`);
    }
    console.log(`[PASS] Test G: Edit accurately synchronized items, quantities, and notes\n`);

    // ──────────────────────────────────────────────────────────
    // Test H: Status preservation
    // ──────────────────────────────────────────────────────────
    console.log("--- Test H: Status preservation (DRAFT stays DRAFT; RETURNED stays RETURNED) ---");
    // Verify DRAFT status preserved on save
    if (planGFromDb?.drugWithdrawal?.status !== DrugWithdrawalStatus.DRAFT) {
      throw new Error(`Test H1 failed: status changed from DRAFT to ${planGFromDb?.drugWithdrawal?.status}`);
    }
    console.log(`[PASS] Test H1: DRAFT -> Save -> DRAFT preserved`);

    // Now artificially set DrugWithdrawal status to RETURNED in DB
    await db.drugWithdrawal.update({
      where: { activityPlanId: resB.plan.id },
      data: { status: DrugWithdrawalStatus.RETURNED },
    });

    // Save edit again
    const resH2 = await updateActivityPlanUseCase(resB.plan.id, user.id, editPayload);
    if (!resH2.success) {
      throw new Error(`Test H2 failed: ${resH2.error}`);
    }

    const planH2FromDb = await findActivityPlanById(resB.plan.id);
    if (planH2FromDb?.drugWithdrawal?.status !== DrugWithdrawalStatus.RETURNED) {
      throw new Error(`Test H2 failed: expected status RETURNED to be preserved, but got ${planH2FromDb?.drugWithdrawal?.status}`);
    }
    console.log(`[PASS] Test H2: RETURNED -> Save -> RETURNED preserved (NEVER reset to DRAFT or PENDING_APPROVAL)\n`);

    // ──────────────────────────────────────────────────────────
    // Test I: Transaction rollback on failure
    // ──────────────────────────────────────────────────────────
    console.log("--- Test I: Transaction rollback on failure ---");
    const countPlansBefore = await db.activityPlan.count();
    const countDwBefore = await db.drugWithdrawal.count();
    const countItemsBefore = await db.drugWithdrawalItem.count();

    const testIPayload = {
      title: "Test Plan I - Will Fail",
      startDate: new Date("2026-10-16T09:00:00Z"),
      endDate: new Date("2026-10-16T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing transaction rollback",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Valid Plot",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 5,
            unit: products[0].unit,
          },
          {
            plotIdentifier: "Invalid Plot",
            productId: "completely-invalid-product-id",
            productName: "Non-existent",
            quantity: 5,
            unit: "ขวด",
          },
        ],
      },
    };

    let rollBackSuccess = false;
    try {
      await createActivityPlanUseCase(user.id, testIPayload);
    } catch {
      rollBackSuccess = true;
    }

    const countPlansAfter = await db.activityPlan.count();
    const countDwAfter = await db.drugWithdrawal.count();
    const countItemsAfter = await db.drugWithdrawalItem.count();

    if (countPlansBefore !== countPlansAfter || countDwBefore !== countDwAfter || countItemsBefore !== countItemsAfter) {
      throw new Error("Test I failed: Transaction failed to rollback! Partial records were persisted!");
    }
    console.log(`[PASS] Test I: Transaction rolled back completely; 0 orphan records persisted\n`);

    // ──────────────────────────────────────────────────────────
    // Test J: Unsupported TYPE rejection
    // ──────────────────────────────────────────────────────────
    console.log("--- Test J: Unsupported TYPE rejection (TYPE_1) ---");
    const testJPayload = {
      title: "Test Plan J - Unsupported Type",
      startDate: new Date("2026-10-17T09:00:00Z"),
      endDate: new Date("2026-10-17T17:00:00Z"),
      activityTypeId: type1?.id || "TYPE_1",
      workTypeCodes: ["TYPE_1"],
      objective: "Testing unsupported type rejection",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        workTypeCode: "TYPE_1",
        items: [
          {
            plotIdentifier: "Plot J",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 1,
            unit: products[0].unit,
          },
        ],
      },
    };

    const resJ = await createActivityPlanUseCase(user.id, testJPayload);
    if (resJ.success) {
      throw new Error("Test J failed: Drug withdrawal on TYPE_1 was unexpectedly accepted!");
    }
    console.log(`[PASS] Test J: Unsupported TYPE_1 rejected with message: "${resJ.error}"\n`);

    // ──────────────────────────────────────────────────────────
    // Test K: Existing Activity Plans without Drug Withdrawal
    // ──────────────────────────────────────────────────────────
    console.log("--- Test K: Existing plans without withdrawal remain unchanged ---");
    const existingOldPlan = await db.activityPlan.findFirst({
      where: {
        id: { notIn: createdPlanIds },
        deletedAt: null,
      },
    });

    if (existingOldPlan) {
      const loaded = await findActivityPlanById(existingOldPlan.id);
      console.log(`[PASS] Test K: Existing plan ${loaded?.id} loads cleanly, drugWithdrawal is ${loaded?.drugWithdrawal === null ? "null" : "populated"}\n`);
    } else {
      console.log("[SKIP] Test K: No other plans in database\n");
    }

    // ==========================================================
    // UNCHECK WITHDRAWAL LIFECYCLE TESTS (1 - 8)
    // ==========================================================
    console.log("==================================================");
    console.log("UNCHECK WITHDRAWAL LIFECYCLE TESTS");
    console.log("==================================================\n");

    // ── 1. DRAFT + uncheck ─────────────────────────────────────
    console.log("--- Test 1: DRAFT + uncheck -> deletes DrugWithdrawal and items ---");
    const test1Create = await createActivityPlanUseCase(user.id, {
      title: "Test 1 - DRAFT uncheck",
      startDate: new Date("2026-10-20T09:00:00Z"),
      endDate: new Date("2026-10-20T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing DRAFT uncheck",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 1",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 3,
            unit: products[0].unit,
          },
        ],
      },
    });
    if (!test1Create.success || !test1Create.plan) throw new Error("Test 1 create failed");
    createdPlanIds.push(test1Create.plan.id);

    const dw1Before = await db.drugWithdrawal.findUnique({
      where: { activityPlanId: test1Create.plan.id },
      include: { items: true },
    });
    if (!dw1Before || dw1Before.status !== DrugWithdrawalStatus.DRAFT || dw1Before.items.length !== 1) {
      throw new Error("Test 1 setup failed: withdrawal not created in DRAFT");
    }

    // Now uncheck withdrawal
    const test1Update = await updateActivityPlanUseCase(test1Create.plan.id, user.id, {
      title: "Test 1 - DRAFT uncheck (Updated)",
      startDate: new Date("2026-10-20T09:00:00Z"),
      endDate: new Date("2026-10-20T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing DRAFT uncheck",
      drugWithdrawal: {
        hasDrugWithdrawal: false,
        items: [],
      },
    });
    if (!test1Update.success) throw new Error(`Test 1 update failed: ${test1Update.error}`);

    const dw1After = await db.drugWithdrawal.findUnique({
      where: { activityPlanId: test1Create.plan.id },
    });
    const items1After = await db.drugWithdrawalItem.count({
      where: { drugWithdrawalId: dw1Before.id },
    });
    const plan1After = await db.activityPlan.findUnique({
      where: { id: test1Create.plan.id },
    });

    if (dw1After !== null) throw new Error("Test 1 failed: DrugWithdrawal was not deleted");
    if (items1After !== 0) throw new Error("Test 1 failed: DrugWithdrawalItems were not cascade deleted");
    if (!plan1After || plan1After.title !== "Test 1 - DRAFT uncheck (Updated)") {
      throw new Error("Test 1 failed: ActivityPlan was not preserved properly");
    }
    console.log("[PASS] Test 1: DRAFT + uncheck deleted DrugWithdrawal & all items; ActivityPlan preserved\n");

    // ── 2. RETURNED + uncheck ──────────────────────────────────
    console.log("--- Test 2: RETURNED + uncheck -> deletes DrugWithdrawal and items ---");
    const test2Create = await createActivityPlanUseCase(user.id, {
      title: "Test 2 - RETURNED uncheck",
      startDate: new Date("2026-10-21T09:00:00Z"),
      endDate: new Date("2026-10-21T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing RETURNED uncheck",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 2",
            productId: products[1].id,
            productName: products[1].name,
            quantity: 5,
            unit: products[1].unit,
          },
        ],
      },
    });
    if (!test2Create.success || !test2Create.plan) throw new Error("Test 2 create failed");
    createdPlanIds.push(test2Create.plan.id);

    // Set withdrawal status to RETURNED
    const dw2Record = await db.drugWithdrawal.update({
      where: { activityPlanId: test2Create.plan.id },
      data: { status: DrugWithdrawalStatus.RETURNED },
    });

    // Uncheck withdrawal
    const test2Update = await updateActivityPlanUseCase(test2Create.plan.id, user.id, {
      title: "Test 2 - RETURNED uncheck (Updated)",
      startDate: new Date("2026-10-21T09:00:00Z"),
      endDate: new Date("2026-10-21T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing RETURNED uncheck",
      drugWithdrawal: {
        hasDrugWithdrawal: false,
        items: [],
      },
    });
    if (!test2Update.success) throw new Error(`Test 2 update failed: ${test2Update.error}`);

    const dw2After = await db.drugWithdrawal.findUnique({
      where: { activityPlanId: test2Create.plan.id },
    });
    const items2After = await db.drugWithdrawalItem.count({
      where: { drugWithdrawalId: dw2Record.id },
    });
    const plan2After = await db.activityPlan.findUnique({
      where: { id: test2Create.plan.id },
    });

    if (dw2After !== null) throw new Error("Test 2 failed: RETURNED DrugWithdrawal was not deleted");
    if (items2After !== 0) throw new Error("Test 2 failed: DrugWithdrawalItems were not cascade deleted");
    if (!plan2After) throw new Error("Test 2 failed: ActivityPlan was deleted");
    console.log("[PASS] Test 2: RETURNED + uncheck deleted DrugWithdrawal & all items; ActivityPlan preserved\n");

    // ── 3. PENDING_APPROVAL + attempted uncheck ────────────────
    console.log("--- Test 3: PENDING_APPROVAL + attempted uncheck -> rejected, preserved ---");
    const test3Create = await createActivityPlanUseCase(user.id, {
      title: "Test 3 - PENDING_APPROVAL uncheck",
      startDate: new Date("2026-10-22T09:00:00Z"),
      endDate: new Date("2026-10-22T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing PENDING_APPROVAL uncheck",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 3",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 2,
            unit: products[0].unit,
          },
        ],
      },
    });
    if (!test3Create.success || !test3Create.plan) throw new Error("Test 3 create failed");
    createdPlanIds.push(test3Create.plan.id);

    // Set withdrawal status to PENDING_APPROVAL
    await db.drugWithdrawal.update({
      where: { activityPlanId: test3Create.plan.id },
      data: { status: DrugWithdrawalStatus.PENDING_APPROVAL },
    });

    // Attempt uncheck
    const test3Update = await updateActivityPlanUseCase(test3Create.plan.id, user.id, {
      title: "Test 3 - Attempted Uncheck",
      startDate: new Date("2026-10-22T09:00:00Z"),
      endDate: new Date("2026-10-22T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing PENDING_APPROVAL uncheck",
      drugWithdrawal: {
        hasDrugWithdrawal: false,
        items: [],
      },
    });

    if (test3Update.success) {
      throw new Error("Test 3 failed: Unchecking PENDING_APPROVAL withdrawal was unexpectedly allowed!");
    }

    const dw3After = await db.drugWithdrawal.findUnique({
      where: { activityPlanId: test3Create.plan.id },
    });
    if (!dw3After || dw3After.status !== DrugWithdrawalStatus.PENDING_APPROVAL) {
      throw new Error("Test 3 failed: DrugWithdrawal was modified or deleted");
    }
    console.log(`[PASS] Test 3: PENDING_APPROVAL uncheck rejected with error: "${test3Update.error}" (Status preserved)\n`);

    // ── 4. APPROVED + attempted uncheck ────────────────────────
    console.log("--- Test 4: APPROVED + attempted uncheck -> rejected, preserved ---");
    const test4Create = await createActivityPlanUseCase(user.id, {
      title: "Test 4 - APPROVED uncheck",
      startDate: new Date("2026-10-23T09:00:00Z"),
      endDate: new Date("2026-10-23T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing APPROVED uncheck",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 4",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 2,
            unit: products[0].unit,
          },
        ],
      },
    });
    if (!test4Create.success || !test4Create.plan) throw new Error("Test 4 create failed");
    createdPlanIds.push(test4Create.plan.id);

    // Set withdrawal status to APPROVED
    await db.drugWithdrawal.update({
      where: { activityPlanId: test4Create.plan.id },
      data: { status: DrugWithdrawalStatus.APPROVED },
    });

    // Attempt uncheck
    const test4Update = await updateActivityPlanUseCase(test4Create.plan.id, user.id, {
      title: "Test 4 - Attempted Uncheck",
      startDate: new Date("2026-10-23T09:00:00Z"),
      endDate: new Date("2026-10-23T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing APPROVED uncheck",
      drugWithdrawal: {
        hasDrugWithdrawal: false,
        items: [],
      },
    });

    if (test4Update.success) {
      throw new Error("Test 4 failed: Unchecking APPROVED withdrawal was unexpectedly allowed!");
    }

    const dw4After = await db.drugWithdrawal.findUnique({
      where: { activityPlanId: test4Create.plan.id },
    });
    if (!dw4After || dw4After.status !== DrugWithdrawalStatus.APPROVED) {
      throw new Error("Test 4 failed: DrugWithdrawal was modified or deleted");
    }
    console.log(`[PASS] Test 4: APPROVED uncheck rejected with error: "${test4Update.error}" (Status preserved)\n`);

    // ── 5. No Withdrawal + unchecked ───────────────────────────
    console.log("--- Test 5: No Withdrawal + unchecked -> remains no Withdrawal ---");
    const test5Create = await createActivityPlanUseCase(user.id, {
      title: "Test 5 - No Withdrawal",
      startDate: new Date("2026-10-24T09:00:00Z"),
      endDate: new Date("2026-10-24T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing no withdrawal",
      drugWithdrawal: {
        hasDrugWithdrawal: false,
        items: [],
      },
    });
    if (!test5Create.success || !test5Create.plan) throw new Error("Test 5 create failed");
    createdPlanIds.push(test5Create.plan.id);

    const test5Update = await updateActivityPlanUseCase(test5Create.plan.id, user.id, {
      title: "Test 5 - Still No Withdrawal",
      startDate: new Date("2026-10-24T09:00:00Z"),
      endDate: new Date("2026-10-24T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing no withdrawal update",
      drugWithdrawal: {
        hasDrugWithdrawal: false,
        items: [],
      },
    });
    if (!test5Update.success) throw new Error(`Test 5 update failed: ${test5Update.error}`);

    const dw5Count = await db.drugWithdrawal.count({
      where: { activityPlanId: test5Create.plan.id },
    });
    if (dw5Count !== 0) throw new Error("Test 5 failed: withdrawal record was created");
    console.log("[PASS] Test 5: No Withdrawal + unchecked remains 0 Withdrawal records\n");

    // ── 6. DRAFT + still checked ───────────────────────────────
    console.log("--- Test 6: DRAFT + still checked -> status DRAFT preserved, items synchronized ---");
    const test6Create = await createActivityPlanUseCase(user.id, {
      title: "Test 6 - DRAFT checked",
      startDate: new Date("2026-10-25T09:00:00Z"),
      endDate: new Date("2026-10-25T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing DRAFT checked",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 6A",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 1,
            unit: products[0].unit,
          },
        ],
      },
    });
    if (!test6Create.success || !test6Create.plan) throw new Error("Test 6 create failed");
    createdPlanIds.push(test6Create.plan.id);

    const test6Update = await updateActivityPlanUseCase(test6Create.plan.id, user.id, {
      title: "Test 6 - DRAFT checked (Updated)",
      startDate: new Date("2026-10-25T09:00:00Z"),
      endDate: new Date("2026-10-25T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing DRAFT checked",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 6B",
            productId: products[1].id,
            productName: products[1].name,
            quantity: 99,
            unit: products[1].unit,
          },
        ],
      },
    });
    if (!test6Update.success) throw new Error(`Test 6 update failed: ${test6Update.error}`);

    const plan6FromDb = await findActivityPlanById(test6Create.plan.id);
    if (plan6FromDb?.drugWithdrawal?.status !== DrugWithdrawalStatus.DRAFT) {
      throw new Error(`Test 6 failed: status changed to ${plan6FromDb?.drugWithdrawal?.status}`);
    }
    const item6 = plan6FromDb?.drugWithdrawal?.items[0];
    if (item6?.plotIdentifier !== "Plot 6B" || Number(item6?.quantity) !== 99) {
      throw new Error("Test 6 failed: items not properly synchronized");
    }
    console.log("[PASS] Test 6: DRAFT + checked preserves DRAFT status and synchronizes items\n");

    // ── 7. RETURNED + still checked ────────────────────────────
    console.log("--- Test 7: RETURNED + still checked -> status RETURNED preserved, items synchronized ---");
    const test7Create = await createActivityPlanUseCase(user.id, {
      title: "Test 7 - RETURNED checked",
      startDate: new Date("2026-10-26T09:00:00Z"),
      endDate: new Date("2026-10-26T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing RETURNED checked",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 7A",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 1,
            unit: products[0].unit,
          },
        ],
      },
    });
    if (!test7Create.success || !test7Create.plan) throw new Error("Test 7 create failed");
    createdPlanIds.push(test7Create.plan.id);

    // Set status to RETURNED
    await db.drugWithdrawal.update({
      where: { activityPlanId: test7Create.plan.id },
      data: { status: DrugWithdrawalStatus.RETURNED },
    });

    const test7Update = await updateActivityPlanUseCase(test7Create.plan.id, user.id, {
      title: "Test 7 - RETURNED checked (Updated)",
      startDate: new Date("2026-10-26T09:00:00Z"),
      endDate: new Date("2026-10-26T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing RETURNED checked",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 7B",
            productId: products[2].id,
            productName: products[2].name,
            quantity: 77,
            unit: products[2].unit,
          },
        ],
      },
    });
    if (!test7Update.success) throw new Error(`Test 7 update failed: ${test7Update.error}`);

    const plan7FromDb = await findActivityPlanById(test7Create.plan.id);
    if (plan7FromDb?.drugWithdrawal?.status !== DrugWithdrawalStatus.RETURNED) {
      throw new Error(`Test 7 failed: status changed to ${plan7FromDb?.drugWithdrawal?.status}`);
    }
    const item7 = plan7FromDb?.drugWithdrawal?.items[0];
    if (item7?.plotIdentifier !== "Plot 7B" || Number(item7?.quantity) !== 77) {
      throw new Error("Test 7 failed: items not properly synchronized");
    }
    console.log("[PASS] Test 7: RETURNED + checked preserves RETURNED status and synchronizes items\n");

    // ── 8. Transaction rollback on uncheck failure ──────────────
    console.log("--- Test 8: Transaction rollback on failure ---");
    const test8Create = await createActivityPlanUseCase(user.id, {
      title: "Test 8 - Rollback test",
      startDate: new Date("2026-10-27T09:00:00Z"),
      endDate: new Date("2026-10-27T17:00:00Z"),
      activityTypeId: type7b?.id || "TYPE_7B",
      workTypeCodes: ["TYPE_7B"],
      objective: "Testing rollback",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        items: [
          {
            plotIdentifier: "Plot 8",
            productId: products[0].id,
            productName: products[0].name,
            quantity: 5,
            unit: products[0].unit,
          },
        ],
      },
    });
    if (!test8Create.success || !test8Create.plan) throw new Error("Test 8 create failed");
    createdPlanIds.push(test8Create.plan.id);

    // Call updateActivityPlan with invalid planProducts (FK violation on Product) to force a transaction rollback
    let rollbackHappened = false;
    try {
      await updateActivityPlan(test8Create.plan.id, {
        title: "Test 8 - Should fail",
        planProducts: [
          {
            workTypeCode: "TYPE_7B",
            productId: "non-existent-product-id-99999",
            targetQuantity: 1,
          },
        ],
        drugWithdrawal: {
          hasDrugWithdrawal: false,
          items: [],
        },
        updatedUserId: user.id,
      });
    } catch {
      rollbackHappened = true;
    }

    const dw8StillExists = await db.drugWithdrawal.findUnique({
      where: { activityPlanId: test8Create.plan.id },
      include: { items: true },
    });
    if (!dw8StillExists || dw8StillExists.items.length === 0) {
      throw new Error("Test 8 failed: DrugWithdrawal was deleted despite transaction failure!");
    }
    console.log("[PASS] Test 8: Transaction rollback on failure verified; withdrawal & items untouched\n");

    console.log("==================================================");
    console.log("ALL PHASE 4 TESTS COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
  } finally {
    // Cleanup created test records
    console.log("\nCleaning up test plans...");
    for (const planId of createdPlanIds) {
      await db.drugWithdrawalItem.deleteMany({
        where: { drugWithdrawal: { activityPlanId: planId } },
      }).catch(() => {});
      await db.drugWithdrawal.deleteMany({
        where: { activityPlanId: planId },
      }).catch(() => {});
      await db.activityPlanWorkType.deleteMany({
        where: { activityPlanId: planId },
      }).catch(() => {});
      await db.activityApprovalLog.deleteMany({
        where: { activityPlanId: planId },
      }).catch(() => {});
      await db.activityPlan.deleteMany({
        where: { id: planId },
      }).catch(() => {});
    }
    console.log("Cleanup complete.");
    await db.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});
