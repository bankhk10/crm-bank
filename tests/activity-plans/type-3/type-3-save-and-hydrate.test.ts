import assert from "node:assert";
import {
  hydrateType3PlannedData,
  extractType3PlanTargets,
} from "@/modules/activity/features/type-3/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 3 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydrate from dedicated table ActivityPlanType3Target with Products
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating Type 3 from dedicated type3Targets and type3Products...");

  const planWithSales = {
    id: "plan-t3-001",
    code: "TP26100030",
    title: "เสนอขายสินค้าเปิดฤดูกาล",
    status: "APPROVED",
    type3Targets: [
      {
        id: "t3-target-1",
        activityPlanId: "plan-t3-001",
        workTypeCode: "TYPE_3",
        storeId: "store-001",
        isSubDealer: false,
        notes: "เสนอขายปุ๋ยและยาชุดพิเศษช่วงต้นฤดู",
        store: {
          id: "store-001",
          name: "ร้านสมบูรณ์พาณิชย์",
          customerCode: "CUST-T3-01",
          province: "นครสวรรค์",
        },
        products: [
          {
            id: "t3-prod-1",
            targetId: "t3-target-1",
            productId: "prod-t3-101",
            targetQuantity: 50,
            unitPrice: 450,
            targetAmount: 22500,
            notes: "โปรโมชั่น 10 แถม 1",
            product: {
              id: "prod-t3-101",
              name: "บิ๊กกิล",
              productCode: "BG001",
              price: 450,
              unit: "ขวด",
            },
          },
          {
            id: "t3-prod-2",
            targetId: "t3-target-1",
            productId: "prod-t3-102",
            targetQuantity: 20,
            unitPrice: 850,
            targetAmount: 17000,
            notes: "สินค้าล็อตใหม่",
            product: {
              id: "prod-t3-102",
              name: "ฟังก์การ์ด",
              productCode: "FC002",
              price: 850,
              unit: "แกลลอน",
            },
          },
        ],
      },
    ],
  };

  const hydrated1 = hydrateType3PlannedData(planWithSales);
  assert.strictEqual(hydrated1.length, 1, "Should hydrate 1 Type 3 item");
  assert.strictEqual(hydrated1[0].customerName, "ร้านสมบูรณ์พาณิชย์", "Customer name should match");
  assert.strictEqual(hydrated1[0].storeId, "store-001", "storeId should match");
  assert.strictEqual(hydrated1[0]?.products?.length, 2, "Should hydrate 2 products");
  assert.strictEqual(hydrated1[0]?.products?.[0]?.productName, "บิ๊กกิล", "First product name should match");
  assert.strictEqual(hydrated1[0]?.products?.[0]?.quantity, 50, "First product quantity should match");
  assert.strictEqual(hydrated1[0]?.products?.[0]?.unitPrice, 450, "First product unit price should match");
  assert.strictEqual(hydrated1[0]?.products?.[0]?.price, 22500, "First product total amount should match");
  assert.strictEqual(hydrated1[0]?.products?.[1]?.productName, "ฟังก์การ์ด", "Second product name should match");
  assert.strictEqual(hydrated1[0]?.products?.[1]?.quantity, 20, "Second product quantity should match");
  assert.strictEqual(hydrated1[0]?.price, 39500, "Row price sum should match total targetAmount");

  const targetExtract1 = extractType3PlanTargets(planWithSales);
  assert.ok(targetExtract1.primary, "Primary target should exist");
  assert.strictEqual(targetExtract1.list.length, 1, "List should contain 1 target");
  assert.strictEqual(targetExtract1.primary.items?.length, 2, "Target items should have 2 products");
  assert.strictEqual(targetExtract1.primary.targetSales, 39500, "Target sales sum should match");
  console.log("✓ Test 1 passed: Dedicated type3Targets and products hydrated perfectly.");

  // -------------------------------------------------------------------------
  // Test 2: Subdealer in Type 3
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Hydrating Subdealer Target in Type 3...");

  const planWithSubdealer = {
    id: "plan-t3-002",
    code: "TP26100031",
    title: "เสนอขายร้านค้าย่อย",
    status: "APPROVED",
    type3Targets: [
      {
        id: "t3-target-2",
        activityPlanId: "plan-t3-002",
        workTypeCode: "TYPE_3",
        storeId: "store-001",
        isSubDealer: true,
        subDealerStore: "ร้านรุ่งโรจน์ (ร้านค้าย่อย)",
        notes: "ส่งสินค้าผ่านร้านสมบูรณ์พาณิชย์",
        store: {
          id: "store-001",
          name: "ร้านสมบูรณ์พาณิชย์",
          customerCode: "CUST-T3-01",
        },
        products: [
          {
            id: "t3-prod-3",
            targetId: "t3-target-2",
            productId: "prod-t3-101",
            targetQuantity: 10,
            unitPrice: 450,
            targetAmount: 4500,
            product: {
              id: "prod-t3-101",
              name: "บิ๊กกิล",
            },
          },
        ],
      },
    ],
  };

  const hydrated2 = hydrateType3PlannedData(planWithSubdealer);
  assert.strictEqual(hydrated2.length, 1, "Should hydrate 1 item");
  assert.strictEqual(hydrated2[0].isSubDealer, true, "isSubDealer should be true");
  assert.strictEqual(hydrated2[0].subDealerStore, "ร้านรุ่งโรจน์ (ร้านค้าย่อย)", "subDealerStore should match");
  assert.strictEqual(hydrated2[0].customerName, "ร้านสมบูรณ์พาณิชย์", "Main dealer name should match store");

  const targetExtract2 = extractType3PlanTargets(planWithSubdealer);
  assert.strictEqual(
    targetExtract2.primary.customer,
    "ร้านรุ่งโรจน์ (ร้านค้าย่อย) (Dealer: ร้านสมบูรณ์พาณิชย์)",
    "Subdealer display name in target should format correctly",
  );
  console.log("✓ Test 2 passed: Subdealer target hydrated perfectly.");

  console.log("\n All Type 3 Save & Hydration Unit Tests Passed!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

