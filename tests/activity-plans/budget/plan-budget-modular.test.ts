import assert from "node:assert";
import { getWorkTypeCode } from "@/modules/activity/constants";

console.log("=== Running Plan Budget Modular Slice Tests ===");

// 1. Test Work Type Code Resolution for Sales Promotion
console.log("\n[Test 1] Testing Work Type Eligibility for Sales Promotion...");
const allowedWorkTypes = ["TYPE_8", "TYPE_9", "TYPE_10", "TYPE_12"];
const disallowedWorkTypes = [
  "TYPE_1",
  "TYPE_2",
  "TYPE_3",
  "TYPE_4",
  "TYPE_5",
  "TYPE_6",
  "TYPE_7A",
  "TYPE_7B",
  "TYPE_11",
  "TYPE_13",
  "TYPE_14",
];

for (const wt of allowedWorkTypes) {
  const code = getWorkTypeCode(wt);
  const isAllowed =
    code === "TYPE_8" ||
    code === "TYPE_9" ||
    code === "TYPE_10" ||
    code === "TYPE_12";
  assert.strictEqual(
    isAllowed,
    true,
    `Work type ${wt} should be allowed for sales promotion`,
  );
}

for (const wt of disallowedWorkTypes) {
  const code = getWorkTypeCode(wt);
  const isAllowed =
    code === "TYPE_8" ||
    code === "TYPE_9" ||
    code === "TYPE_10" ||
    code === "TYPE_12";
  assert.strictEqual(
    isAllowed,
    false,
    `Work type ${wt} should NOT be allowed for sales promotion`,
  );
}
console.log("✓ Test 1 passed: Work type eligibility logic works accurately.");

// 2. Test Thai Name Resolution for Sales Promotion
console.log("\n[Test 2] Testing Thai Work Type Name Resolution...");
const thaiAllowed = [
  "จัดประชุม",
  "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  "จัดงาน Field Day",
  "ทัวร์ / ดูงาน",
];

for (const name of thaiAllowed) {
  const code = getWorkTypeCode(name);
  const isAllowed =
    code === "TYPE_8" ||
    code === "TYPE_9" ||
    code === "TYPE_10" ||
    code === "TYPE_12";
  assert.strictEqual(
    isAllowed,
    true,
    `Thai work type '${name}' (resolved: ${code}) should be allowed for sales promotion`,
  );
}
console.log("✓ Test 2 passed: Thai work type names resolve to eligible codes.");

console.log("\n🎉 ALL PLAN BUDGET MODULAR SLICE TESTS PASSED!");

