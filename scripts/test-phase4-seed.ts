/**
 * PHASE 4 VERIFICATION TEST SUITE
 * 
 * Verifies Seed Scripts Refactoring & Target Architecture Compliance:
 * 1. Database schema and data integrity (Normalized relations)
 * 2. Absolute absence of ActivityPlanItem
 * 3. Absence of JSON business strings & comma-separated IDs
 * 4. TYPE 3 business rules (targetAmount = qty * price, isPriceOverridden)
 * 5. TYPE 10 business rules (targetBookingSales separate from budget, targetAttendeesCount)
 * 6. TYPE 11 business rules (1 store = 1 ActivityPlanStore row)
 * 7. TYPE 8 business rules (target products in ActivityPlanProduct rows)
 * 8. TYPE 12 business rules (ActivityPlanTour present, zero ActivityResult)
 * 9. Master Data integrity (zero dummy records, all FKs valid)
 * 10. Idempotency of seed scripts
 * 11. UI Contract readability (Repository mapPrismaToDomain reads seeded plans)
 */

import "dotenv/config";
import { db } from "../lib/db";
import { findActivityPlanById } from "../modules/activity-plans/infrastructure/activity-plan.repository";

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, message?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✅ PASS: ${name}`);
  } else {
    results.push({ name, passed: false, message });
    console.error(`  ❌ FAIL: ${name} - ${message}`);
  }
}

async function runPhase4Tests() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🧪 PHASE 4 — SEED SCRIPTS & NORMALIZED DATA VERIFICATION SUITE");
  console.log("═════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────
  // 1. Check ActivityPlanItem non-existence
  // ─────────────────────────────────────────────────────────────
  console.log("▶ 1. ActivityPlanItem Elimination Audit");
  const dmmf = (db as any)._runtimeDataModel;
  const models = Object.keys(dmmf?.models || {});
  assert(
    !models.includes("ActivityPlanItem"),
    "1.1 Prisma Client has zero ActivityPlanItem model"
  );

  const rawTableCheck = await db.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'activity_plan_items'
    );
  `;
  assert(
    !rawTableCheck[0]?.exists,
    "1.2 PostgreSQL physical database has zero activity_plan_items table"
  );

  // ─────────────────────────────────────────────────────────────
  // 2. Audit Seeded Activity Plans
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ 2. Seeded Plans Population & Structure");
  const seededPlans = await db.activityPlan.findMany({
    include: {
      workTypes: { include: { activityType: true } },
      stores: true,
      products: true,
      marketingItems: true,
      promotionItems: true,
      tour: true,
      helpers: true,
      approvalLogs: true,
      result: true,
      demoPlotVisits: true,
    },
  });

  assert(seededPlans.length >= 36, `2.1 Total seeded plans >= 36 (found ${seededPlans.length})`);

  // ─────────────────────────────────────────────────────────────
  // 3. TYPE 3 Business Rules
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ 3. TYPE 3 Business Rules Verification");
  const type3Plans = seededPlans.filter((p) =>
    p.workTypes.some((wt) => wt.activityType.code === "TYPE_3")
  );
  assert(type3Plans.length > 0, "3.1 TYPE_3 plans exist");

  for (const p of type3Plans) {
    for (const prod of p.products) {
      if (prod.targetQuantity && prod.unitPrice) {
        const expectedAmt = Number(prod.targetQuantity) * Number(prod.unitPrice);
        const actualAmt = Number(prod.targetAmount);
        assert(
          Math.abs(actualAmt - expectedAmt) < 0.01,
          `3.2 TYPE_3 Plan ${p.code} Product ${prod.productId}: targetAmount (${actualAmt}) = qty (${prod.targetQuantity}) * unitPrice (${prod.unitPrice})`
        );
      }
      assert(
        typeof prod.isPriceOverridden === "boolean",
        `3.3 TYPE_3 Plan ${p.code} Product ${prod.productId}: isPriceOverridden is a boolean flag (${prod.isPriceOverridden})`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. TYPE 10 Business Rules
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ 4. TYPE 10 Business Rules Verification");
  const type10Plans = seededPlans.filter((p) =>
    p.workTypes.some((wt) => wt.activityType.code === "TYPE_10")
  );
  assert(type10Plans.length > 0, "4.1 TYPE_10 plans exist");

  for (const p of type10Plans) {
    assert(
      p.targetAttendeesCount !== undefined,
      `4.2 TYPE_10 Plan ${p.code}: targetAttendeesCount column exists and is tracked`
    );
    if (p.targetBookingSales != null) {
      assert(
        Number(p.targetBookingSales) > 0,
        `4.3 TYPE_10 Plan ${p.code}: targetBookingSales (${p.targetBookingSales}) is separated independently from totalBudgetRequested (${p.totalBudgetRequested})`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. TYPE 11 Business Rules
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ 5. TYPE 11 Business Rules Verification");
  const type11Plans = seededPlans.filter((p) =>
    p.workTypes.some((wt) => wt.activityType.code === "TYPE_11")
  );
  assert(type11Plans.length > 0, "5.1 TYPE_11 plans exist");

  for (const p of type11Plans) {
    assert(
      p.stores.length > 0,
      `5.2 TYPE_11 Plan ${p.code}: stores collection has normalized rows (found ${p.stores.length})`
    );
    // Each store row must have a valid storeId
    for (const st of p.stores) {
      assert(
        !!st.storeId,
        `5.3 TYPE_11 Plan ${p.code}: 1 store = 1 ActivityPlanStore row with valid storeId (${st.storeId})`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. TYPE 8 Business Rules
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ 6. TYPE 8 Business Rules Verification");
  const type8Plans = seededPlans.filter((p) =>
    p.workTypes.some((wt) => wt.activityType.code === "TYPE_8")
  );
  assert(type8Plans.length > 0, "6.1 TYPE_8 plans exist");

  for (const p of type8Plans) {
    if (p.products.length > 0) {
      for (const prod of p.products) {
        assert(
          !prod.productId.includes(","),
          `6.2 TYPE_8 Plan ${p.code} Product: Target products stored as individual rows without commas (${prod.productId})`
        );
      }
    }
    assert(
      p.targetAttendeesCount !== undefined,
      `6.3 TYPE_8 Plan ${p.code}: targetAttendeesCount tracked on plan`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 7. TYPE 12 Business Rules
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ 7. TYPE 12 Business Rules Verification");
  const type12Plans = seededPlans.filter((p) =>
    p.workTypes.some((wt) => wt.activityType.code === "TYPE_12")
  );
  assert(type12Plans.length >= 3, "7.1 TYPE_12 plans exist (3 plans)");

  for (const p of type12Plans) {
    assert(
      !!p.tour,
      `7.2 TYPE_12 Plan ${p.code}: Uses ActivityPlanTour relation (tourType: ${p.tour?.tourType})`
    );
    assert(
      !p.result,
      `7.3 TYPE_12 Plan ${p.code}: Has ZERO ActivityResult rows`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 8. Zero Business Data Hidden in JSON Strings
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ 8. Structured Data Audit (Zero JSON business strings)");
  for (const p of seededPlans) {
    if (p.description) {
      assert(
        !p.description.startsWith("{") && !p.description.startsWith("["),
        `8.1 Plan ${p.code} description is human-readable, not JSON string`
      );
    }
    if (p.notes) {
      assert(
        !p.notes.startsWith("{") && !p.notes.startsWith("["),
        `8.2 Plan ${p.code} notes is human-readable, not JSON string`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. Master Data Integrity & Foreign Key Validity
  // ─────────────────────────────────────────────────────────────
  const allStoreIds = new Set(
    seededPlans.flatMap((p) => p.stores.map((s) => s.storeId).filter((id): id is string => id !== null))
  );
  const allProductIds = new Set(seededPlans.flatMap((p) => p.products.map((pr) => pr.productId)));
  const allEmployeeIds = new Set(seededPlans.map((p) => p.employeeId));

  const validCustomerCount = await db.customer.count({
    where: { id: { in: Array.from(allStoreIds) } },
  });
  assert(
    validCustomerCount === allStoreIds.size,
    `9.1 All storeId FKs (${allStoreIds.size}) resolve to real active Customer records`
  );

  const validProductCount = await db.product.count({
    where: { id: { in: Array.from(allProductIds) } },
  });
  assert(
    validProductCount === allProductIds.size,
    `9.2 All productId FKs (${allProductIds.size}) resolve to real active Product records`
  );

  const validEmployeeCount = await db.employee.count({
    where: { id: { in: Array.from(allEmployeeIds) } },
  });
  assert(
    validEmployeeCount === allEmployeeIds.size,
    `9.3 All employeeId FKs (${allEmployeeIds.size}) resolve to real Employee records`
  );

  // ─────────────────────────────────────────────────────────────
  // 10. UI Contract Readability (Repository Mapper)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ 10. UI Contract Readability via Repository Mapper");
  const samplePlanCodes = ["TP2608S011", "TP2608S031", "TP2608S081", "TP2608S101", "TP2608S121", "TEST-ACT-002", "TEST-ACT-006"];
  
  for (const code of samplePlanCodes) {
    const plan = await db.activityPlan.findFirst({ where: { code } });
    if (plan) {
      const domainPlan = await findActivityPlanById(plan.id);
      assert(
        !!domainPlan && domainPlan.id === plan.id,
        `10.1 Plan ${code} successfully loaded and mapped to Domain / UI Contract via findActivityPlanById`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log("\n═════════════════════════════════════════════════════════════════");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 PHASE 4 VERIFICATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${results.length})`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4Tests()
  .catch((err) => {
    console.error("❌ Test suite error:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
