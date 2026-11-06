import assert from "node:assert";
import { validateType6Actual } from "@/modules/activity/features/type-6/planned/application/actual-validation";
import type { Type6IssueRecord } from "@/modules/activity/features/type-6/shared/types";

async function runFormSelectionTests() {
  console.log("=== Running Type 6 Actual Form Selection & Handler Tests ===");

  // Simulate how Type6ActualForm handles updates with handleItemUpdates
  let issueDetailsState: Type6IssueRecord[] = [
    {
      id: "issue-1",
      targetId: "target-1",
      storeId: "store-original",
      storeName: "ร้านเดิม",
      customerName: "เกษตรกร สมชาย",
      isManualCustomer: false,
      purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
      productId: null,
      productName: "",
      lotNumber: "LOT-001",
      issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
      detail: "ฝาแตก",
      status: "เสร็จสิ้น",
      images: [],
    },
  ];

  // Callback simulating onUpdateIssueItem from useType6Actual
  const handleUpdateT6IssueItem = (
    index: number,
    updates: Partial<Type6IssueRecord>,
  ) => {
    while (issueDetailsState.length <= index) {
      issueDetailsState.push({
        id: `issue-${issueDetailsState.length + 1}`,
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        status: "เสร็จสิ้น",
        images: [],
      });
    }
    issueDetailsState[index] = { ...issueDetailsState[index], ...updates };
  };

  // -------------------------------------------------------------------------
  // Test 1: Selecting Product (ชื่อสินค้า) sets both productId and productName
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Verifying product selection updates productId and productName atomically...");

  // Previous bug: Separate handleItemFieldChange calls caused productName to overwrite productId back to null.
  // With handleItemUpdates:
  handleUpdateT6IssueItem(0, {
    productId: "prod-101",
    productName: "สารกำจัดแมลง ซุปเปอร์การ์ด",
  });

  assert.strictEqual(
    issueDetailsState[0].productId,
    "prod-101",
    "productId must be 'prod-101' and not overwritten to null",
  );
  assert.strictEqual(
    issueDetailsState[0].productName,
    "สารกำจัดแมลง ซุปเปอร์การ์ด",
    "productName must be 'สารกำจัดแมลง ซุปเปอร์การ์ด'",
  );
  console.log("✓ Test 1 passed: Product selection correctly updates both productId and productName.");

  // -------------------------------------------------------------------------
  // Test 2: Selecting Store (เลือกร้านค้าตัวแทนจำหน่าย) sets storeId and storeName
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Verifying dealer store selection updates storeId and storeName atomically...");

  handleUpdateT6IssueItem(0, {
    storeId: "store-202",
    storeName: "ร้าน เกษตรพัฒนา มั่นคง",
  });

  assert.strictEqual(
    issueDetailsState[0].storeId,
    "store-202",
    "storeId must be 'store-202' and not reset to old store or null",
  );
  assert.strictEqual(
    issueDetailsState[0].storeName,
    "ร้าน เกษตรพัฒนา มั่นคง",
    "storeName must be 'ร้าน เกษตรพัฒนา มั่นคง'",
  );
  console.log("✓ Test 2 passed: Dealer store selection correctly updates both storeId and storeName.");

  // -------------------------------------------------------------------------
  // Test 3: Changing Purchase Channel (ช่องทางการซื้อสินค้า) to "ออนไลน์"
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Verifying switching purchase channel to 'ออนไลน์'...");

  // When switching to "ออนไลน์", channel is set and storeId/storeName are cleared to null
  handleUpdateT6IssueItem(0, {
    purchaseChannel: "ออนไลน์",
    storeId: null,
    storeName: null,
  });

  assert.strictEqual(
    issueDetailsState[0].purchaseChannel,
    "ออนไลน์",
    "purchaseChannel must be 'ออนไลน์'",
  );
  assert.strictEqual(
    issueDetailsState[0].storeId,
    null,
    "storeId must be null for online channel",
  );
  assert.strictEqual(
    issueDetailsState[0].storeName,
    null,
    "storeName must be null for online channel",
  );
  // Product should remain intact
  assert.strictEqual(
    issueDetailsState[0].productId,
    "prod-101",
    "productId must still be intact",
  );

  console.log("✓ Test 3 passed: Switching to 'ออนไลน์' cleanly clears storeId and storeName without reverting.");

  // -------------------------------------------------------------------------
  // Test 4: Switching back to "ร้านค้าตัวแทนจำหน่าย" and selecting dealer store
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Verifying switching back to 'ร้านค้าตัวแทนจำหน่าย'...");

  handleUpdateT6IssueItem(0, {
    purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
  });

  assert.strictEqual(
    issueDetailsState[0].purchaseChannel,
    "ร้านค้าตัวแทนจำหน่าย",
    "purchaseChannel must be 'ร้านค้าตัวแทนจำหน่าย'",
  );

  // Now select a dealer store
  handleUpdateT6IssueItem(0, {
    storeId: "store-303",
    storeName: "ร้าน รุ่งเรือง การเกษตร",
  });

  assert.strictEqual(
    issueDetailsState[0].storeId,
    "store-303",
    "storeId must be updated to store-303",
  );
  assert.strictEqual(
    issueDetailsState[0].storeName,
    "ร้าน รุ่งเรือง การเกษตร",
    "storeName must be 'ร้าน รุ่งเรือง การเกษตร'",
  );

  console.log("✓ Test 4 passed: Switching back to dealer channel and selecting a dealer works.");

  // -------------------------------------------------------------------------
  // Test 5: Validation passes with all fields selected
  // -------------------------------------------------------------------------
  console.log("\n[Test 5] Verifying validation succeeds with selected fields...");

  const valResult = validateType6Actual({
    items: issueDetailsState,
  });

  assert.strictEqual(valResult.isValid, true, `Validation should pass, but got: ${valResult.error}`);
  console.log("✓ Test 5 passed: Validation succeeds when channel, store, and product are properly selected.");

  console.log("\n🎉 ALL TYPE 6 FORM SELECTION TESTS PASSED!");
}

runFormSelectionTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

