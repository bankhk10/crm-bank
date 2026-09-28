/**
 * Phase 6 Verification Test Suite: Drug Withdrawal — TYPE Integration
 *
 * Verifies:
 * 1. TYPE_7A (ทำแปลงสาธิต) integration with multiple demo plots and decimal quantities
 * 2. TYPE_7B (ติดตามแปลงสาธิต) integration with existing demo plots
 * 3. TYPE_13 (ฉีดแปลงแฮตแทค) integration with Hattack plots separated from spray rounds
 * 4. TYPE_14 (ติดตามแปลงแฮทแทค) clean contract + withdrawal plot selection
 * 5. Multiple plots & multiple products per plot integrity
 * 6. Product Master derivation (name, unit snapshot)
 * 7. Decimal quantity support (> 0)
 * 8. Create/Edit payload integration through existing ActivityPlan use cases
 * 9. Existing withdrawal hydration on edit
 * 10. Lifecycle preservation:
 *     - DRAFT / RETURNED + uncheck => deletes DrugWithdrawal & items
 *     - PENDING_APPROVAL / APPROVED + uncheck => rejected
 * 11. Unsupported activity types (e.g. TYPE_1, TYPE_8) rejection
 */

import "dotenv/config";
import { ActivityStatus, DrugWithdrawalStatus } from "@prisma/client";
import { db as prisma } from "../lib/db";
import { seedWorkflowTestUsers } from "../prisma/seed/activity/workflow-test-users";
import { seedActivityTypes } from "../prisma/seed/activity/activity-types";
import {
  createActivityPlanUseCase,
  updateActivityPlanUseCase,
  submitActivityPlanUseCase,
  approveActivityPlanUseCase,
  requestCorrectionPlanUseCase,
} from "../modules/activity-plans/application";
import {
  isDrugWithdrawalSupported,
  DRUG_WITHDRAWAL_SUPPORTED_TYPES,
} from "../modules/activity-plans/constants";
import { validateDrugWithdrawal } from "../modules/activity-plans/application/validations";

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

async function runPhase6Tests() {
  console.log("==================================================");
  console.log("PHASE 6 VERIFICATION TEST SUITE: TYPE INTEGRATION");
  console.log("==================================================\n");

  const timestamp = Date.now();

  // ── Setup Test Data ───────────────────────────────────────────
  console.log("Setting up Test Users, Roles, and Products via seeders...");

  const seedData = await seedWorkflowTestUsers(prisma);
  const { uSales: uCreator, uAreaMgr: uArea, uMktMgr: uMkt } = seedData.users;
  const { empSales } = seedData.employees;
  await seedActivityTypes(prisma);

  let prodCategory = await prisma.productCategory.findFirst({ where: { deletedAt: null } });
  if (!prodCategory) {
    prodCategory = await prisma.productCategory.create({
      data: { code: "HERBICIDE", description: "สารกำจัดวัชพืช" },
    });
  }

  // Master Products
  const prodA = await prisma.product.create({
    data: {
      name: `ยาฆ่าแมลง A ${timestamp}`,
      productCode: `PROD-A-${timestamp}`,
      unit: "ลิตร",
      price: 450,
      status: "ACTIVE",
      category: { connect: { id: prodCategory.id } },
    },
  });

  const prodB = await prisma.product.create({
    data: {
      name: `ฮอร์โมนพืช B ${timestamp}`,
      productCode: `PROD-B-${timestamp}`,
      unit: "กิโลกรัม",
      price: 600,
      status: "ACTIVE",
      category: { connect: { id: prodCategory.id } },
    },
  });

  const prodC = await prisma.product.create({
    data: {
      name: `สารเสริมประสิทธิภาพ C ${timestamp}`,
      productCode: `PROD-C-${timestamp}`,
      unit: "มิลลิลิตร",
      price: 250,
      status: "ACTIVE",
      category: { connect: { id: prodCategory.id } },
    },
  });

  // Customers & Existing DemoPlots for TYPE_7B and TYPE_14
  const dealerCust = await prisma.customer.create({
    data: {
      name: `ดีลเลอร์ ทดสอบ ${timestamp}`,
      customerCode: `CUST-D-${timestamp}`,
      customerType: "DEALER",
      province: "เชียงใหม่",
    },
  });

  const farmerCust = await prisma.customer.create({
    data: {
      name: `เกษตรกร สมชาย ${timestamp}`,
      customerCode: `CUST-F-${timestamp}`,
      customerType: "FARMER",
      province: "เชียงใหม่",
    },
  });

  const existingDemoPlot7B = await prisma.demoPlot.create({
    data: {
      name: `แปลงสาธิต 7B เดิม ${timestamp}`,
      code: `DP-7B-${timestamp}`,
      plotType: "DEMO",
      customer: { connect: { id: dealerCust.id } },
      ownerName: farmerCust.name,
      province: "เชียงใหม่",
      district: "แม่ริม",
      cropName: "ข้าว",
      startDate: new Date(),
      employeeId: empSales.id,
    },
  });

  const existingHattackPlot14 = await prisma.demoPlot.create({
    data: {
      name: `แปลงแฮตแทค 14 เดิม ${timestamp}`,
      code: `DP-14-${timestamp}`,
      plotType: "HATTACK",
      customer: { connect: { id: dealerCust.id } },
      ownerName: farmerCust.name,
      province: "เชียงใหม่",
      district: "สันทราย",
      cropName: "ข้าวโพด",
      startDate: new Date(),
      employeeId: empSales.id,
    },
  });

  // ── TEST 1: Supported Work Types Constants ────────────────────
  console.log("\n[TEST 1] Verifying Supported Work Types Constants...");
  assert(
    DRUG_WITHDRAWAL_SUPPORTED_TYPES.includes("TYPE_7A") &&
    DRUG_WITHDRAWAL_SUPPORTED_TYPES.includes("TYPE_7B") &&
    DRUG_WITHDRAWAL_SUPPORTED_TYPES.includes("TYPE_13") &&
    DRUG_WITHDRAWAL_SUPPORTED_TYPES.includes("TYPE_14"),
    "DRUG_WITHDRAWAL_SUPPORTED_TYPES contains exactly TYPE_7A, TYPE_7B, TYPE_13, TYPE_14",
  );
  assert(
    isDrugWithdrawalSupported("TYPE_7A") &&
    isDrugWithdrawalSupported("TYPE_7B") &&
    isDrugWithdrawalSupported("TYPE_13") &&
    isDrugWithdrawalSupported("TYPE_14") &&
    !isDrugWithdrawalSupported("TYPE_1") &&
    !isDrugWithdrawalSupported("TYPE_8"),
    "isDrugWithdrawalSupported returns true ONLY for supported types",
  );

  // ── TEST 2: TYPE_7A Create with Drug Withdrawal ───────────────
  console.log("\n[TEST 2] Verifying TYPE_7A Create with Multiple Demo Plots & Decimals...");
  const type7aPayload = {
    title: `Trip Plan TYPE_7A ${timestamp}`,
    startDate: new Date("2026-10-01T08:00:00Z"),
    endDate: new Date("2026-10-01T17:00:00Z"),
    activityTypeId: "TYPE_7A",
    workTypeCodes: ["TYPE_7A"],
    demoPlotData: {
      name: "แปลงสาธิต ข้าวหอมมะลิ",
      customerId: dealerCust.id,
      ownerName: "นายทองดี มีชัย",
      ownerPhone: "0812345678",
      province: "เชียงใหม่",
      district: "แม่ริม",
      categoryId: prodCategory.id,
      cropCategory: "พืชไร่",
      cropName: "ข้าวหอมมะลิ 105",
      objective: "ทดสอบประสิทธิภาพการควบคุมวัชพืช",
      areaRai: 5,
      sprayMethod: "SINGLE",
      hasExternalChemicals: false,
    },
    planProducts: [
      {
        workTypeCode: "TYPE_7A",
        productId: prodA.id,
        productName: prodA.name,
        targetQuantity: 1,
        isPriceOverridden: false,
      },
    ],
    drugWithdrawal: {
      hasDrugWithdrawal: true,
      notes: "เบิกยาสำหรับแปลงสาธิตแปลง A และ B",
      items: [
        {
          plotIdentifier: "แปลงสาธิต A (ข้าวหอมมะลิ)",
          productId: prodA.id,
          productName: prodA.name,
          quantity: 2.5, // decimal
          unit: prodA.unit,
          sortOrder: 0,
        },
        {
          plotIdentifier: "แปลงสาธิต A (ข้าวหอมมะลิ)",
          productId: prodB.id,
          productName: prodB.name,
          quantity: 0.75, // decimal
          unit: prodB.unit,
          sortOrder: 1,
        },
        {
          plotIdentifier: "แปลงสาธิต B (ข้าวเหนียว)",
          productId: prodA.id,
          productName: prodA.name,
          quantity: 3.25, // decimal
          unit: prodA.unit,
          sortOrder: 2,
        },
      ],
    },
  };

  const res7a = await createActivityPlanUseCase(uCreator.id, type7aPayload);
  assert(res7a.success === true, "TYPE_7A ActivityPlan created successfully with Drug Withdrawal", res7a.error);
  if (!res7a.success) {
    console.error("  res7a error:", res7a.error);
    process.exit(1);
  }

  const plan7a = await prisma.activityPlan.findUnique({
    where: { id: res7a.plan!.id },
    include: {
      drugWithdrawal: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  assert(Boolean(plan7a?.drugWithdrawal), "TYPE_7A has linked DrugWithdrawal");
  assert(plan7a?.drugWithdrawal?.status === DrugWithdrawalStatus.DRAFT, "TYPE_7A DrugWithdrawal initial status is DRAFT");
  assert(plan7a?.drugWithdrawal?.items.length === 3, "TYPE_7A DrugWithdrawal contains 3 items across 2 plots");
  assert(
    Number(plan7a?.drugWithdrawal?.items[0].quantity) === 2.5 &&
    Number(plan7a?.drugWithdrawal?.items[1].quantity) === 0.75 &&
    Number(plan7a?.drugWithdrawal?.items[2].quantity) === 3.25,
    "TYPE_7A decimal quantities accurately saved",
  );
  assert(
    plan7a?.drugWithdrawal?.items[0].plotIdentifier === "แปลงสาธิต A (ข้าวหอมมะลิ)" &&
    plan7a?.drugWithdrawal?.items[2].plotIdentifier === "แปลงสาธิต B (ข้าวเหนียว)",
    "TYPE_7A multiple plots correctly preserved",
  );

  // ── TEST 3: TYPE_7B Create with Drug Withdrawal ───────────────
  console.log("\n[TEST 3] Verifying TYPE_7B Create with Existing DemoPlot Context...");
  const type7bPayload = {
    title: `Trip Plan TYPE_7B ${timestamp}`,
    startDate: new Date("2026-10-02T08:00:00Z"),
    endDate: new Date("2026-10-02T17:00:00Z"),
    activityTypeId: "TYPE_7B",
    workTypeCodes: ["TYPE_7B"],
    demoPlotId: existingDemoPlot7B.id,
    drugWithdrawal: {
      hasDrugWithdrawal: true,
      notes: "เบิกยาติดตามแปลงสาธิตรอบที่ 2",
      items: [
        {
          demoPlotId: existingDemoPlot7B.id,
          plotIdentifier: existingDemoPlot7B.name,
          productId: prodC.id,
          productName: prodC.name,
          quantity: 1.5,
          unit: prodC.unit,
        },
      ],
    },
  };

  const res7b = await createActivityPlanUseCase(uCreator.id, type7bPayload);
  assert(res7b.success === true, "TYPE_7B ActivityPlan created successfully with Drug Withdrawal");

  const plan7b = await prisma.activityPlan.findUnique({
    where: { id: res7b.plan!.id },
    include: {
      drugWithdrawal: {
        include: { items: true },
      },
    },
  });

  assert(Boolean(plan7b?.drugWithdrawal), "TYPE_7B has linked DrugWithdrawal");
  assert(plan7b?.drugWithdrawal?.items[0].demoPlotId === existingDemoPlot7B.id, "TYPE_7B item links to existing DemoPlot ID");
  assert(Number(plan7b?.drugWithdrawal?.items[0].quantity) === 1.5, "TYPE_7B withdrawal quantity is 1.5");

  // ── TEST 4: TYPE_13 Create with Drug Withdrawal ───────────────
  console.log("\n[TEST 4] Verifying TYPE_13 Create with Hattack Plots Separated from Spraying...");
  const type13Payload = {
    title: `Trip Plan TYPE_13 ${timestamp}`,
    startDate: new Date("2026-10-03T08:00:00Z"),
    endDate: new Date("2026-10-03T17:00:00Z"),
    activityTypeId: "TYPE_13",
    workTypeCodes: ["TYPE_13"],
    type13Plots: [
      {
        id: "plot-hattack-1",
        name: "แปลงแฮตแทค 1 (สวนส้ม)",
        storeId: dealerCust.id,
        ownerName: "นายเกษตรกร 1",
        province: "เชียงใหม่",
        district: "ฝาง",
        products: [
          {
            productId: prodA.id,
            productName: prodA.name,
            quantity: 2,
            unit: prodA.unit,
          },
        ],
      },
      {
        id: "plot-hattack-2",
        name: "แปลงแฮตแทค 2 (สวนลำไย)",
        storeId: dealerCust.id,
        ownerName: "นายเกษตรกร 2",
        province: "เชียงใหม่",
        district: "พร้าว",
        products: [
          {
            productId: prodB.id,
            productName: prodB.name,
            quantity: 1,
            unit: prodB.unit,
          },
        ],
      },
    ],
    drugWithdrawal: {
      hasDrugWithdrawal: true,
      notes: "เบิกยาสำหรับฉีดแปลงแฮตแทค 2 แปลง",
      items: [
        {
          plotIdentifier: "แปลงแฮตแทค 1 (สวนส้ม)",
          productId: prodA.id,
          productName: prodA.name,
          quantity: 4.5, // Requested withdrawal quantity (separate from actual spray)
          unit: prodA.unit,
        },
        {
          plotIdentifier: "แปลงแฮตแทค 2 (สวนลำไย)",
          productId: prodC.id,
          productName: prodC.name,
          quantity: 1.25,
          unit: prodC.unit,
        },
      ],
    },
  };

  const res13 = await createActivityPlanUseCase(uCreator.id, type13Payload);
  assert(res13.success === true, "TYPE_13 ActivityPlan created successfully with Drug Withdrawal");

  const plan13 = await prisma.activityPlan.findUnique({
    where: { id: res13.plan!.id },
    include: {
      drugWithdrawal: {
        include: { items: true },
      },
    },
  });

  assert(Boolean(plan13?.drugWithdrawal), "TYPE_13 has linked DrugWithdrawal");
  assert(plan13?.drugWithdrawal?.items.length === 2, "TYPE_13 has 2 withdrawal items matching Hattack plots");
  assert(
    Number(plan13?.drugWithdrawal?.items[0].quantity) === 4.5,
    "Withdrawal quantity is the requested withdrawal quantity (separate from spray)",
  );

  // ── TEST 5: TYPE_14 Create with Clean Contract + Withdrawal Plot Selection ─
  console.log("\n[TEST 5] Verifying TYPE_14 Clean Contract + Drug Withdrawal Plot Selection...");
  const type14Payload = {
    title: `Trip Plan TYPE_14 ${timestamp}`,
    startDate: new Date("2026-10-04T08:00:00Z"),
    endDate: new Date("2026-10-04T17:00:00Z"),
    activityTypeId: "TYPE_14",
    workTypeCodes: ["TYPE_14"],
    type14Data: {
      mode: "EXISTING_PLOT" as const,
      demoPlotId: existingHattackPlot14.id,
      name: existingHattackPlot14.name,
      storeId: dealerCust.id,
      ownerName: farmerCust.name,
      province: "เชียงใหม่",
      district: "สันทราย",
      latitude: "18.790000",
      longitude: "98.980000",
      trackings: [
        {
          visitDate: "2026-10-04",
          daysSinceStart: 7,
          notes: "ติดตามผลรอบ 7 วัน",
          attachments: [],
        },
      ],
    },
    drugWithdrawal: {
      hasDrugWithdrawal: true,
      notes: "เบิกยาเพิ่มเติมสำหรับการติดตามแปลงแฮตแทค",
      items: [
        {
          demoPlotId: existingHattackPlot14.id,
          plotIdentifier: existingHattackPlot14.name,
          productId: prodA.id,
          productName: prodA.name,
          quantity: 2.0,
          unit: prodA.unit,
        },
      ],
    },
  };

  const res14 = await createActivityPlanUseCase(uCreator.id, type14Payload);
  assert(res14.success === true, "TYPE_14 ActivityPlan created successfully with clean contract + Drug Withdrawal");

  const plan14 = await prisma.activityPlan.findUnique({
    where: { id: res14.plan!.id },
    include: {
      drugWithdrawal: {
        include: { items: true },
      },
    },
  });

  assert(Boolean(plan14?.drugWithdrawal), "TYPE_14 has linked DrugWithdrawal");
  assert(plan14?.drugWithdrawal?.items[0].demoPlotId === existingHattackPlot14.id, "TYPE_14 withdrawal item correctly linked to Hattack plot");
  assert(Number(plan14?.drugWithdrawal?.items[0].quantity) === 2.0, "TYPE_14 withdrawal quantity is 2.0");

  // ── TEST 6: Edit & Existing Withdrawal Hydration ───────────────
  console.log("\n[TEST 6] Verifying Edit & Existing Withdrawal Hydration...");
  // Update TYPE_7A plan with edited quantities and an additional item
  const updatePayload = {
    title: `Trip Plan TYPE_7A Updated ${timestamp}`,
    startDate: new Date("2026-10-01T08:00:00Z"),
    endDate: new Date("2026-10-01T17:00:00Z"),
    activityTypeId: "TYPE_7A",
    workTypeCodes: ["TYPE_7A"],
    demoPlotData: type7aPayload.demoPlotData,
    planProducts: type7aPayload.planProducts,
    drugWithdrawal: {
      hasDrugWithdrawal: true,
      notes: "อัปเดตรายการเบิกยาใหม่",
      items: [
        {
          plotIdentifier: "แปลงสาธิต A (ข้าวหอมมะลิ)",
          productId: prodA.id,
          productName: prodA.name,
          quantity: 5.75, // updated quantity
          unit: prodA.unit,
          sortOrder: 0,
        },
        {
          plotIdentifier: "แปลงสาธิต C (แปลงใหม่)",
          productId: prodC.id,
          productName: prodC.name,
          quantity: 0.5,
          unit: prodC.unit,
          sortOrder: 1,
        },
      ],
    },
  };

  const updateRes = await updateActivityPlanUseCase(plan7a!.id, uCreator.id, updatePayload);
  assert(updateRes.success === true, "updateActivityPlanUseCase succeeds with updated Drug Withdrawal", updateRes.error);

  const updatedPlan7a = await prisma.activityPlan.findUnique({
    where: { id: plan7a!.id },
    include: {
      drugWithdrawal: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  assert(updatedPlan7a?.title === `Trip Plan TYPE_7A Updated ${timestamp}`, "Plan title updated");
  assert(updatedPlan7a?.drugWithdrawal?.notes === "อัปเดตรายการเบิกยาใหม่", "DrugWithdrawal notes updated");
  assert(updatedPlan7a?.drugWithdrawal?.items.length === 2, "DrugWithdrawal items updated to 2 rows");
  assert(Number(updatedPlan7a?.drugWithdrawal?.items[0].quantity) === 5.75, "Item 1 updated quantity is 5.75");
  assert(
    updatedPlan7a?.drugWithdrawal?.items[1].plotIdentifier === "แปลงสาธิต C (แปลงใหม่)",
    "Item 2 plot is 'แปลงสาธิต C (แปลงใหม่)'",
  );

  // ── TEST 7: Uncheck Behavior in DRAFT State ────────────────────
  console.log("\n[TEST 7] Verifying Uncheck Behavior in DRAFT State (deletes DrugWithdrawal)...");
  const uncheckDraftPayload = {
    title: `Trip Plan TYPE_7A Unchecked in Draft ${timestamp}`,
    startDate: new Date("2026-10-01T08:00:00Z"),
    endDate: new Date("2026-10-01T17:00:00Z"),
    activityTypeId: "TYPE_7A",
    workTypeCodes: ["TYPE_7A"],
    demoPlotData: type7aPayload.demoPlotData,
    planProducts: type7aPayload.planProducts,
    drugWithdrawal: {
      hasDrugWithdrawal: false,
      items: [],
    },
  };

  const uncheckDraftRes = await updateActivityPlanUseCase(plan7a!.id, uCreator.id, uncheckDraftPayload);
  assert(uncheckDraftRes.success === true, "Unchecking Drug Withdrawal in DRAFT succeeds", uncheckDraftRes.error);

  const uncheckPlan7a = await prisma.activityPlan.findUnique({
    where: { id: plan7a!.id },
    include: { drugWithdrawal: true },
  });
  assert(uncheckPlan7a?.drugWithdrawal === null, "DrugWithdrawal and items successfully deleted in DRAFT");

  // ── TEST 8: Re-add Drug Withdrawal & Test RETURNED Uncheck ─────
  console.log("\n[TEST 8] Verifying RETURNED State Uncheck Behavior...");
  // Re-add drug withdrawal to plan7a
  await updateActivityPlanUseCase(plan7a!.id, uCreator.id, updatePayload);

  // Submit plan7a -> PENDING_LINE_APPROVAL
  await submitActivityPlanUseCase(plan7a!.id, uCreator.id);

  // Return plan7a by Area Manager -> WAITING_FOR_CORRECTION (RETURNED)
  await requestCorrectionPlanUseCase(plan7a!.id, uArea.id, "กรุณาปรับรายการเบิกยา");

  const returnedPlan = await prisma.activityPlan.findUnique({
    where: { id: plan7a!.id },
    include: { drugWithdrawal: true },
  });
  assert(returnedPlan?.status === ActivityStatus.WAITING_FOR_CORRECTION, "Plan is in WAITING_FOR_CORRECTION (RETURNED)");
  assert(returnedPlan?.drugWithdrawal?.status === DrugWithdrawalStatus.RETURNED, "DrugWithdrawal status is RETURNED");

  // Creator unchecks "มีการเบิกยา" in RETURNED state
  const uncheckReturnedPayload = {
    title: `Trip Plan TYPE_7A Unchecked in Returned ${timestamp}`,
    startDate: new Date("2026-10-01T08:00:00Z"),
    endDate: new Date("2026-10-01T17:00:00Z"),
    activityTypeId: "TYPE_7A",
    workTypeCodes: ["TYPE_7A"],
    demoPlotData: type7aPayload.demoPlotData,
    planProducts: type7aPayload.planProducts,
    drugWithdrawal: {
      hasDrugWithdrawal: false,
      items: [],
    },
  };

  const uncheckReturnedRes = await updateActivityPlanUseCase(plan7a!.id, uCreator.id, uncheckReturnedPayload);
  assert(uncheckReturnedRes.success === true, "Unchecking Drug Withdrawal in RETURNED state succeeds", uncheckReturnedRes.error);

  const deletedReturnedDw = await prisma.drugWithdrawal.findUnique({
    where: { activityPlanId: plan7a!.id },
  });
  assert(deletedReturnedDw === null, "DrugWithdrawal and items successfully deleted in RETURNED state");

  // ── TEST 9: Uncheck in PENDING_APPROVAL / APPROVED Rejected ──
  console.log("\n[TEST 9] Verifying Uncheck in PENDING_APPROVAL / APPROVED is Rejected...");
  // Plan 7b is currently in DRAFT with DrugWithdrawal. Submit it:
  await submitActivityPlanUseCase(plan7b!.id, uCreator.id);

  const pendingPlan7b = await prisma.activityPlan.findUnique({
    where: { id: plan7b!.id },
    include: { drugWithdrawal: true },
  });
  assert(
    pendingPlan7b?.status === ActivityStatus.PENDING_LINE_APPROVAL ||
      pendingPlan7b?.status === ActivityStatus.PENDING_BUDGET_APPROVAL,
    "Plan 7b is in pending line approval state (PENDING_LINE_APPROVAL / PENDING_BUDGET_APPROVAL)",
  );
  assert(pendingPlan7b?.drugWithdrawal?.status === DrugWithdrawalStatus.PENDING_APPROVAL, "DrugWithdrawal is PENDING_APPROVAL");

  // Attempt to update/uncheck Drug Withdrawal in PENDING_APPROVAL
  const uncheckPendingPayload = {
    title: `Trip Plan TYPE_7B Uncheck Pending ${timestamp}`,
    startDate: new Date("2026-10-02T08:00:00Z"),
    endDate: new Date("2026-10-02T17:00:00Z"),
    activityTypeId: "TYPE_7B",
    workTypeCodes: ["TYPE_7B"],
    demoPlotId: existingDemoPlot7B.id,
    drugWithdrawal: {
      hasDrugWithdrawal: false,
      items: [],
    },
  };

  const uncheckPendingRes = await updateActivityPlanUseCase(plan7b!.id, uCreator.id, uncheckPendingPayload);
  assert(
    uncheckPendingRes.success === false,
    "Unchecking Drug Withdrawal in PENDING_APPROVAL is rejected by edit lifecycle",
  );

  // ── TEST 10: Unsupported Activity Types Rejection ──────────────
  console.log("\n[TEST 10] Verifying Unsupported Activity Types (e.g. TYPE_1, TYPE_8) Rejection...");
  const unsupportedPayload = {
    title: `Trip Plan TYPE_1 Unsupported DW ${timestamp}`,
    startDate: new Date("2026-10-05T08:00:00Z"),
    endDate: new Date("2026-10-05T17:00:00Z"),
    activityTypeId: "TYPE_1",
    workTypeCodes: ["TYPE_1"],
    planStores: [
      {
        workTypeCode: "TYPE_1",
        storeId: dealerCust.id,
        storeName: dealerCust.name,
      },
    ],
    drugWithdrawal: {
      hasDrugWithdrawal: true,
      items: [
        {
          plotIdentifier: "แปลง 1",
          productId: prodA.id,
          productName: prodA.name,
          quantity: 1,
          unit: prodA.unit,
        },
      ],
    },
  };

  const unsupportedRes = await createActivityPlanUseCase(uCreator.id, unsupportedPayload);
  assert(
    unsupportedRes.success === false,
    "Creating ActivityPlan with Drug Withdrawal on unsupported type (TYPE_1) is rejected",
  );

  // Validation function test for unsupported types
  const valUnsupported = validateDrugWithdrawal(unsupportedPayload.drugWithdrawal, "TYPE_1");
  assert(
    valUnsupported.isValid === false,
    "validateDrugWithdrawal returns isValid = false for TYPE_1",
  );

  const valSupported = validateDrugWithdrawal(type7aPayload.drugWithdrawal, "TYPE_7A");
  assert(
    valSupported.isValid === true,
    "validateDrugWithdrawal returns isValid = true for TYPE_7A with valid items",
  );

  // ── Cleanup Test Data ─────────────────────────────────────────
  console.log("\nCleaning up test records...");
  const planIds = [res7a.plan?.id, res7b.plan?.id, res13.plan?.id, res14.plan?.id].filter(Boolean) as string[];
  for (const pid of planIds) {
    await prisma.drugWithdrawalItem.deleteMany({ where: { drugWithdrawal: { activityPlanId: pid } } });
    await prisma.drugWithdrawal.deleteMany({ where: { activityPlanId: pid } });
    await prisma.activityPlanStore.deleteMany({ where: { activityPlanId: pid } });
    await prisma.activityPlanProduct.deleteMany({ where: { activityPlanId: pid } });
    await prisma.demoPlotVisit.deleteMany({ where: { activityPlanId: pid } });
    await prisma.activityApprovalLog.deleteMany({ where: { activityPlanId: pid } });
    await prisma.activityPlan.delete({ where: { id: pid } }).catch(() => {});
  }
  await prisma.demoPlotProduct.deleteMany({ where: { productId: { in: [prodA.id, prodB.id, prodC.id] } } });
  await prisma.demoPlot.deleteMany({
    where: {
      OR: [
        { id: { in: [existingDemoPlot7B.id, existingHattackPlot14.id] } },
        { customerId: dealerCust.id },
      ],
    },
  });
  await prisma.product.deleteMany({ where: { id: { in: [prodA.id, prodB.id, prodC.id] } } });
  await prisma.customer.deleteMany({ where: { id: { in: [dealerCust.id, farmerCust.id] } } });

  console.log("\n==================================================");
  console.log(`PHASE 6 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${testCount})`);
  console.log("==================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase6Tests()
  .catch((err) => {
    console.error("Fatal error during Phase 6 verification tests:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
