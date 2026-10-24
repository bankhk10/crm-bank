import assert from "node:assert";
import { Prisma } from "@prisma/client";
import { createType7bData } from "@/modules/activity/features/type-7b/planned/infrastructure/type7b.repository";

async function runTests() {
  console.log("=== Running Type 7B Product Foreign Key Protection Tests ===");

  const insertedProducts: any[] = [];
  const insertedPlots: any[] = [];
  let createdType7bRecord: any = null;

  // Mock DB products in master table
  const mockDbProducts = [
    { id: "prod-uuid-1", name: "สารกำจัดแมลง โปรเคลม", unit: "ขวด" },
    { id: "prod-uuid-2", name: "สารกำจัดวัชพืช กราม็อกโซน", unit: "แกลลอน" },
  ];

  const mockTx: any = {
    activityPlanType7b: {
      create: async (args: any) => {
        createdType7bRecord = { id: "t7b-record-001", ...args.data };
        return createdType7bRecord;
      },
    },
    activityPlanType7bPlot: {
      createMany: async (args: any) => {
        insertedPlots.push(...args.data);
      },
    },
    demoPlotVisit: {
      findFirst: async () => ({ id: "visit-existing" }),
      create: async (args: any) => args.data,
    },
    product: {
      findMany: async (args: any) => {
        const orConditions = args.where?.OR || [];
        const matches: any[] = [];
        for (const cond of orConditions) {
          if (cond.id?.in) {
            for (const p of mockDbProducts) {
              if (cond.id.in.includes(p.id) && !matches.some((m) => m.id === p.id)) {
                matches.push(p);
              }
            }
          }
          if (cond.name?.in) {
            for (const p of mockDbProducts) {
              if (cond.name.in.includes(p.name) && !matches.some((m) => m.id === p.id)) {
                matches.push(p);
              }
            }
          }
        }
        return matches;
      },
    },
    activityPlanType7bProduct: {
      createMany: async (args: any) => {
        // Enforce DB Foreign Key rule: productId MUST exist in mockDbProducts
        for (const row of args.data) {
          const exists = mockDbProducts.some((p) => p.id === row.productId);
          if (!exists) {
            throw new Error(
              `Foreign key constraint violated on the constraint: activity_plan_type_7b_products_product_id_fkey. Attempted productId: ${row.productId}`,
            );
          }
          insertedProducts.push(row);
        }
      },
    },
  };

  // Test 1: Standard case - user selects products with valid productId
  console.log("\n[Test 1] Testing with valid product ID (prod-uuid-1)...");
  await createType7bData(
    mockTx,
    "plan-001",
    {
      plots: [{ demoPlotId: "plot-01", plotName: "แปลงทดสอบ 1" }],
      products: [
        {
          productId: "prod-uuid-1",
          productName: "สารกำจัดแมลง โปรเคลม",
          quantity: 2,
          unit: "ขวด",
        },
      ],
    },
    new Date(),
  );

  assert.strictEqual(insertedProducts.length, 1);
  assert.strictEqual(insertedProducts[0].productId, "prod-uuid-1");
  assert.strictEqual(insertedProducts[0].productName, "สารกำจัดแมลง โปรเคลม");
  console.log("✓ Test 1 passed: Product with valid ID was inserted successfully.");

  // Test 2: Fallback case - productId was passed as the product name (the bug reported by user)
  console.log("\n[Test 2] Testing when productId was passed as product name...");
  insertedProducts.length = 0;
  await createType7bData(
    mockTx,
    "plan-002",
    {
      plots: [{ demoPlotId: "plot-01", plotName: "แปลงทดสอบ 1" }],
      products: [
        {
          productId: "สารกำจัดวัชพืช กราม็อกโซน", // Bug scenario: value was product name!
          productName: "",
          quantity: 3,
          unit: "แกลลอน",
        },
      ],
    },
    new Date(),
  );

  assert.strictEqual(insertedProducts.length, 1);
  // It MUST resolve to the real UUID!
  assert.strictEqual(insertedProducts[0].productId, "prod-uuid-2");
  assert.strictEqual(insertedProducts[0].productName, "สารกำจัดวัชพืช กราม็อกโซน");
  console.log("✓ Test 2 passed: Product passed as name was safely resolved to real UUID prod-uuid-2.");

  // Test 3: Foreign Key protection - product not found in database at all
  console.log("\n[Test 3] Testing with completely unknown/deleted product...");
  insertedProducts.length = 0;
  await createType7bData(
    mockTx,
    "plan-003",
    {
      plots: [{ demoPlotId: "plot-01", plotName: "แปลงทดสอบ 1" }],
      products: [
        {
          productId: "non-existent-product-id",
          productName: "สินค้าที่ไม่มีในระบบ",
          quantity: 1,
          unit: "ขวด",
        },
        {
          productId: "prod-uuid-1",
          productName: "สารกำจัดแมลง โปรเคลม",
          quantity: 1,
          unit: "ขวด",
        },
      ],
    },
    new Date(),
  );

  // The invalid product must be skipped, and the valid one must be inserted WITHOUT throwing FK violation
  assert.strictEqual(insertedProducts.length, 1);
  assert.strictEqual(insertedProducts[0].productId, "prod-uuid-1");
  console.log("✓ Test 3 passed: Unknown product was gracefully skipped without crashing transaction.");

  console.log("\n🎉 ALL PRODUCT FOREIGN KEY PROTECTION TESTS PASSED 100%!\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

