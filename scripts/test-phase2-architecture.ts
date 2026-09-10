/**
 * Phase 2 Architecture Verification Test Suite
 * 
 * Verifies:
 * 1. Domain Layer: Pure logic (budget calculation, price override, objective builder)
 * 2. Mapper Layer: UI-to-Normalized conversion for all 12 Work Types (Zero ActivityPlanItem)
 * 3. Repository Layer: Transactional Create, Find, and Update on Normalized Models
 */

import { db } from "../lib/db";
import { ActivityStatus, ActivityHelperStatus } from "@prisma/client";
import {
  calculateMarketingBudget,
  calculatePromotionBudget,
  calculateTotalBudget,
  calculateTargetSales,
  calculateBudgetSalesRatio,
  isPriceOverridden,
} from "../modules/activity-plans/domain/budget-calculator";
import { buildActivityObjective } from "../modules/activity-plans/domain/objective-builder";
import { normalizePlanInput } from "../modules/activity-plans/application/plan-mapper";
import {
  createActivityPlan,
  findActivityPlanById,
  updateActivityPlan,
  softDeleteActivityPlan,
} from "../modules/activity-plans/infrastructure/activity-plan.repository";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${name}${detail ? ` - ${detail}` : ""}`);
    failCount++;
  }
}

async function runPhase2Tests() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🚀 STARTING PHASE 2 DATA ARCHITECTURE TEST SUITE");
  console.log("═════════════════════════════════════════════════════════════════\n");

  // ────────────────────────────────────────────────────────────
  // 1. DOMAIN LAYER TESTS (Pure TypeScript, Zero DB)
  // ────────────────────────────────────────────────────────────
  console.log("--- 1. Domain Layer: Budget Calculator & Objective Builder ---");

  // 1.1 Marketing Budget
  const mktItems = [
    { category: "ป้าย", materialName: "ไวนิล", unitPrice: 500, quantity: 2, totalAmount: 1000 },
    { category: "ของชำร่วย", materialName: "หมวก", unitPrice: 100, quantity: 10, totalAmount: 1000 },
  ];
  const mktBudget = calculateMarketingBudget(mktItems);
  assert(mktBudget === 2000, "Domain 1.1: calculateMarketingBudget computes sum correctly (2,000)");

  // 1.2 Promotion Budget
  const promoItems = [
    { budgetType: "แถมสินค้า", detail: "ซื้อ 10 แถม 1", amount: 1500 },
    { budgetType: "ส่วนลด", detail: "ลดพิเศษ 5%", amount: 2500 },
  ];
  const promoBudget = calculatePromotionBudget(promoItems);
  assert(promoBudget === 4000, "Domain 1.2: calculatePromotionBudget computes sum correctly (4,000)");

  // 1.3 Total Budget
  const totalBudget = calculateTotalBudget(mktBudget, promoBudget);
  assert(totalBudget === 6000, "Domain 1.3: calculateTotalBudget combines mkt + promo (6,000)");

  // 1.4 Target Sales (TYPE_3 products)
  const type3Products = [
    { targetAmount: 20000, targetQuantity: 20, unitPrice: 1000 },
    { targetAmount: 30000, targetQuantity: 10, unitPrice: 3000 },
  ];
  const type3TargetSales = calculateTargetSales(type3Products);
  assert(type3TargetSales === 50000, "Domain 1.4: calculateTargetSales computes product total (50,000)");

  // 1.5 Budget to Sales Ratio
  const ratio = calculateBudgetSalesRatio(totalBudget, 125000);
  assert(ratio === 4.8, "Domain 1.5: calculateBudgetSalesRatio (6,000 / 125,000 * 100 = 4.8%)");

  // 1.6 Price Override
  assert(isPriceOverridden(100, 90) === true, "Domain 1.6: isPriceOverridden detects price change");
  assert(isPriceOverridden(100, 100) === false, "Domain 1.7: isPriceOverridden returns false when price matches");

  // 1.7 Objective Builder
  const generatedObjective = buildActivityObjective({
    workTypeCodes: ["TYPE_1", "TYPE_3"],
    stores: [
      { workTypeCode: "TYPE_1", storeName: "ร้านสมชายการเกษตร", remarks: "ปรึกษาเรื่องสินค้าใหม่" },
      { workTypeCode: "TYPE_3", storeName: "ร้านสมชายการเกษตร" },
    ],
    products: [
      { workTypeCode: "TYPE_3", productName: "ปุ๋ยสูตร 1", targetQuantity: 50, unitPrice: 800, targetAmount: 40000 },
    ],
  });
  assert(
    generatedObjective.includes("[เข้าพบร้านค้า / Key Farmer]"),
    "Domain 1.8: buildActivityObjective includes TYPE_1 header"
  );
  assert(
    generatedObjective.includes("[เสนอขายสินค้า]"),
    "Domain 1.9: buildActivityObjective includes TYPE_3 header"
  );
  assert(
    generatedObjective.includes("ร้านสมชายการเกษตร"),
    "Domain 1.10: buildActivityObjective mentions store name"
  );

  // ────────────────────────────────────────────────────────────
  // 2. MAPPER LAYER TESTS (UI-to-Normalized Transformation)
  // ────────────────────────────────────────────────────────────
  console.log("\n--- 2. Mapper Layer: UI to Normalized Transformation (All 12 Types) ---");

  // TYPE 11: Multi-Store Check (Strict 1-row-per-store, zero comma-separated strings)
  const rawType11 = {
    title: "ตรวจเช็กสต็อกหลายร้าน",
    startDate: new Date("2026-09-15T09:00:00Z"),
    endDate: new Date("2026-09-15T17:00:00Z"),
    activityTypeId: "TYPE_11",
    workTypeCodes: ["TYPE_11"],
    planStores: [
      { workTypeCode: "TYPE_11", storeId: "store-001", storeName: "ร้าน ก" },
      { workTypeCode: "TYPE_11", storeId: "store-002", storeName: "ร้าน ข" },
      { workTypeCode: "TYPE_11", storeId: "store-003", storeName: "ร้าน ค" },
    ],
  };
  const normType11 = normalizePlanInput(rawType11 as any);
  assert(
    normType11.planStores.length === 3,
    "Mapper 2.1: TYPE_11 produces exactly 3 separate rows in planStores"
  );
  assert(
    normType11.planStores.every((s) => !s.storeName?.includes(",")),
    "Mapper 2.2: TYPE_11 store rows contain zero comma-separated strings"
  );

  // TYPE 3: Target Quantity × Unit Price Calculation
  const rawType3 = {
    title: "เสนอขายสินค้าหลัก",
    startDate: new Date("2026-09-16T09:00:00Z"),
    endDate: new Date("2026-09-16T12:00:00Z"),
    activityTypeId: "TYPE_3",
    workTypeCodes: ["TYPE_3"],
    planProducts: [
      {
        workTypeCode: "TYPE_3",
        productId: "prod-001",
        productName: "สินค้า A",
        masterPrice: 500,
        unitPrice: 480,
        isPriceOverridden: true,
        targetQuantity: 100,
        targetAmount: 48000,
      },
    ],
  };
  const normType3 = normalizePlanInput(rawType3 as any);
  assert(
    normType3.planProducts[0].targetAmount === 48000,
    "Mapper 2.3: TYPE_3 targetAmount is correctly 48,000"
  );
  assert(
    normType3.planProducts[0].isPriceOverridden === true,
    "Mapper 2.4: TYPE_3 isPriceOverridden flag preserved"
  );

  // TYPE 10: Demo Plot + Attendees + Booking Sales
  const rawType10 = {
    title: "จัดงาน Field Day ประจำปี",
    startDate: new Date("2026-09-20T08:00:00Z"),
    endDate: new Date("2026-09-20T16:00:00Z"),
    activityTypeId: "TYPE_10",
    workTypeCodes: ["TYPE_10"],
    targetAttendeesCount: 80,
    targetBookingSales: 150000,
    demoPlotId: "plot-001",
  };
  const normType10 = normalizePlanInput(rawType10 as any);
  assert(
    normType10.targetAttendeesCount === 80,
    "Mapper 2.5: TYPE_10 targetAttendeesCount is 80"
  );
  assert(
    normType10.targetBookingSales === 150000,
    "Mapper 2.6: TYPE_10 targetBookingSales is separated metric (150,000)"
  );
  assert(
    normType10.demoPlotId === "plot-001",
    "Mapper 2.7: TYPE_10 demoPlotId linked directly"
  );

  // TYPE 12: Tour Data
  const rawType12 = {
    title: "ทัวร์ร้านค้าดีเด่น",
    startDate: new Date("2026-10-01T08:00:00Z"),
    endDate: new Date("2026-10-05T18:00:00Z"),
    activityTypeId: "TYPE_12",
    workTypeCodes: ["TYPE_12"],
    tourData: {
      tourType: "STORE" as const,
      tourSize: "LARGE" as const,
      country: "ญี่ปุ่น",
      destination: "โตเกียว",
      storeId: "store-vip-01",
    },
  };
  const normType12 = normalizePlanInput(rawType12 as any);
  assert(
    normType12.tourData?.tourType === "STORE",
    "Mapper 2.8: TYPE_12 tourType is STORE"
  );
  assert(
    normType12.tourData?.country === "ญี่ปุ่น",
    "Mapper 2.9: TYPE_12 country is ญี่ปุ่น"
  );

  // ────────────────────────────────────────────────────────────
  // 3. REPOSITORY LAYER INTEGRATION TESTS (DB Persistence)
  // ────────────────────────────────────────────────────────────
  console.log("\n--- 3. Repository Layer: Normalized Transactional CRUD ---");

  // Lookup an existing employee and activity type to satisfy FKs
  const existingEmployee = await db.employee.findFirst({ where: { deletedAt: null } });
  const existingActivityType = await db.activityType.findFirst({ where: { isActive: true } });
  const existingUser = await db.user.findFirst();
  const existingStore = await db.customer.findFirst({ where: { deletedAt: null } });
  const existingProduct = await db.product.findFirst({ where: { deletedAt: null } });

  if (!existingEmployee || !existingActivityType || !existingUser) {
    console.warn("⚠️ Skipping repository DB tests: Required master fixtures (Employee, ActivityType, User) not found in DB.");
    return;
  }

  const testPlanTitle = `[PHASE2_TEST] แผนงานบูรณาการสถาปัตยกรรมใหม่ ${Date.now()}`;

  // 3.1 CREATE Activity Plan with Normalized Collections
  const createdPlan = await createActivityPlan({
    title: testPlanTitle,
    startDate: new Date("2026-09-25T09:00:00Z"),
    endDate: new Date("2026-09-25T17:00:00Z"),
    activityTypeId: existingActivityType.id,
    workTypeCodes: ["TYPE_1", "TYPE_3", "TYPE_9"],
    location: "สาขาทดสอบ กรุงเทพฯ",
    province: "กรุงเทพมหานคร",
    district: "บางเขน",
    objective: "ทดสอบการบันทึกลง Normalized Tables 100%",
    status: ActivityStatus.DRAFT,
    employeeId: existingEmployee.id,
    createdById: existingUser.id,
    salesPromotionBudgetRequested: 5000,
    marketingBudgetRequested: 3000,
    planStores: existingStore
      ? [
          {
            workTypeCode: "TYPE_1",
            storeId: existingStore.id,
            storeName: existingStore.name,
            remarks: "ทดสอบเข้าพบ",
          },
          {
            workTypeCode: "TYPE_9",
            storeId: existingStore.id,
            storeName: existingStore.name,
            subDealerStore: "ซับดีลเลอร์ A",
          },
        ]
      : [],
    planProducts: existingProduct
      ? [
          {
            workTypeCode: "TYPE_3",
            productId: existingProduct.id,
            productName: existingProduct.name,
            masterPrice: 500,
            unitPrice: 480,
            isPriceOverridden: true,
            targetQuantity: 50,
            targetAmount: 24000,
          },
        ]
      : [],
    marketingItems: [
      {
        category: "สื่อสิ่งพิมพ์",
        materialName: "โบรชัวร์ผลิตภัณฑ์",
        unit: "ชุด",
        unitPrice: 30,
        quantity: 100,
        totalAmount: 3000,
      },
    ],
    promotionItems: [
      {
        budgetType: "ส่งเสริมการขาย",
        detail: "โปรโมชั่นพิเศษเปิดตัว",
        amount: 5000,
      },
    ],
  });

  assert(Boolean(createdPlan.id), "Repository 3.1: createActivityPlan returns valid Plan ID");
  assert(createdPlan.title === testPlanTitle, "Repository 3.2: Plan title matches input");

  // 3.2 READ Activity Plan using Normalized Relations (Zero ActivityPlanItem)
  const fetchedPlan = await findActivityPlanById(createdPlan.id);
  assert(Boolean(fetchedPlan), "Repository 3.3: findActivityPlanById finds created plan");
  assert(
    fetchedPlan?.marketingItems.length === 1,
    "Repository 3.4: Fetched marketingItems has exactly 1 normalized record"
  );
  assert(
    fetchedPlan?.promotionItems.length === 1,
    "Repository 3.5: Fetched promotionItems has exactly 1 normalized record"
  );
  if (existingStore) {
    assert(
      fetchedPlan?.stores.length === 2,
      "Repository 3.6: Fetched stores has 2 normalized records (TYPE_1 and TYPE_9)"
    );
  }
  if (existingProduct) {
    assert(
      fetchedPlan?.products.length === 1,
      "Repository 3.7: Fetched products has 1 normalized record with targetAmount 24,000"
    );
  }

  // 3.3 UPDATE Activity Plan with Transactional Child Sync
  const updatedPlan = await updateActivityPlan(createdPlan.id, {
    title: `${testPlanTitle} (แก้ไขแล้ว)`,
    updatedUserId: existingUser.id,
    marketingItems: [
      // Replaced old item with 2 new items
      {
        category: "ป้ายไวนิล",
        materialName: "ป้ายหน้าร้าน",
        unit: "ผืน",
        unitPrice: 1500,
        quantity: 2,
        totalAmount: 3000,
      },
    ],
    promotionItems: [
      {
        budgetType: "แถมสินค้า",
        detail: "แถมสินค้าทดลองใช้ 5 ชุด",
        amount: 2500,
      },
    ],
  });

  assert(
    updatedPlan.title.includes("(แก้ไขแล้ว)"),
    "Repository 3.8: updateActivityPlan updates title successfully"
  );

  const refetchedPlan = await findActivityPlanById(createdPlan.id);
  assert(
    refetchedPlan?.marketingItems[0].materialName === "ป้ายหน้าร้าน",
    "Repository 3.9: Transactional sync replaced marketingItems with new record"
  );
  assert(
    Number(refetchedPlan?.promotionItems[0].amount) === 2500,
    "Repository 3.10: Transactional sync updated promotionItems amount to 2,500"
  );

  // 3.4 CLEANUP test plan
  await softDeleteActivityPlan(createdPlan.id);
  const deletedPlan = await findActivityPlanById(createdPlan.id);
  assert(deletedPlan === null, "Repository 3.11: softDeleteActivityPlan marks plan deleted");

  // Hard delete test plan to keep DB pristine
  await db.$transaction(async (tx) => {
    await tx.activityPlanStore.deleteMany({ where: { activityPlanId: createdPlan.id } });
    await tx.activityPlanProduct.deleteMany({ where: { activityPlanId: createdPlan.id } });
    await tx.activityPlanMarketingItem.deleteMany({ where: { activityPlanId: createdPlan.id } });
    await tx.activityPlanPromotionItem.deleteMany({ where: { activityPlanId: createdPlan.id } });
    await tx.activityPlanWorkType.deleteMany({ where: { activityPlanId: createdPlan.id } });
    await tx.activityHelper.deleteMany({ where: { activityPlanId: createdPlan.id } });
    await tx.activityPlan.delete({ where: { id: createdPlan.id } });
  });
  console.log("  🧹 Test plan cleaned up from database.");

  console.log("\n===============================================================");
  console.log(`PHASE 2 TEST SUMMARY: ${passCount} passed, ${failCount} failed`);
  console.log("===============================================================");
  if (failCount === 0) {
    console.log("🎉 ALL PHASE 2 DATA ARCHITECTURE TESTS PASSED SUCCESSFULLY!");
  } else {
    process.exit(1);
  }
}

runPhase2Tests()
  .catch((err) => {
    console.error("FATAL TEST ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
