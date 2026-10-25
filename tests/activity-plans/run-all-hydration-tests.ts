import { execSync } from "node:child_process";

interface TestSuite {
  type: string;
  name: string;
  file: string;
}

const testSuites: TestSuite[] = [
  { type: "TYPE_1", name: "เข้าพบร้านค้า / Key Farmer", file: "tests/activity-plans/type-1/type-1-save-and-hydrate.test.ts" },
  { type: "TYPE_2", name: "ติดตามผลการใช้สินค้า", file: "tests/activity-plans/type-2/type-2-save-and-hydrate.test.ts" },
  { type: "TYPE_3", name: "เสนอขายสินค้า", file: "tests/activity-plans/type-3/type-3-save-and-hydrate.test.ts" },
  { type: "TYPE_4", name: "วางบิล / เก็บเงิน", file: "tests/activity-plans/type-4/type-4-save-and-hydrate.test.ts" },
  { type: "TYPE_5", name: "สำรวจตลาดของคู่แข่ง", file: "tests/activity-plans/type-5/type-5-save-and-hydrate.test.ts" },
  { type: "TYPE_6", name: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา", file: "tests/activity-plans/type-6/type-6-save-and-hydrate.test.ts" },
  { type: "TYPE_7A", name: "จัดทำแปลงสาธิต", file: "tests/activity-plans/type-7a/type-7a-planned-form.test.ts" },
  { type: "TYPE_7B", name: "ติดตามแปลงสาธิต", file: "tests/activity-plans/type-7b/type-7b-edit-hydration.test.ts" },
  { type: "TYPE_8", name: "จัดประชุม", file: "tests/activity-plans/type-8/type-8-save-and-hydrate.test.ts" },
  { type: "TYPE_9", name: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน", file: "tests/activity-plans/type-9/type-9-save-and-hydrate.test.ts" },
  { type: "TYPE_10", name: "จัดงาน Field Day", file: "tests/activity-plans/type-10/type-10-save-and-hydrate.test.ts" },
  { type: "TYPE_11", name: "ตรวจเช็คสต๊อกหน้าร้าน", file: "tests/activity-plans/type-11/type-11-save-and-hydrate.test.ts" },
  { type: "TYPE_12", name: "ทัวร์ / ดูงาน", file: "tests/activity-plans/type-12/type-12-save-and-hydrate.test.ts" },
  { type: "TYPE_13", name: "ฉีดแปลงแฮตแทค", file: "tests/activity-plans/type-13/type-13-save-and-hydrate.test.ts" },
  { type: "TYPE_14", name: "ติดตามแปลงแฮตแทค", file: "tests/activity-plans/type-14/type-14-save-and-hydrate.test.ts" },
];

async function main() {
  console.log("===============================================================================");
  console.log("🚀 MASTER TEST RUNNER: Running Save & Hydration Unit Tests for All Work Types");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;
  const results: Array<{ type: string; name: string; file: string; status: "PASSED" | "FAILED"; error?: string }> = [];

  for (const suite of testSuites) {
    process.stdout.write(`⏳ Running [${suite.type}] ${suite.name} ... `);
    try {
      execSync(`npx tsx --env-file=.env ${suite.file}`, {
        stdio: "pipe",
        encoding: "utf-8",
      });
      console.log("✅ PASSED");
      passed++;
      results.push({ type: suite.type, name: suite.name, file: suite.file, status: "PASSED" });
    } catch (err: any) {
      console.log("❌ FAILED");
      failed++;
      results.push({
        type: suite.type,
        name: suite.name,
        file: suite.file,
        status: "FAILED",
        error: err.stdout || err.stderr || err.message,
      });
    }
  }

  console.log("\n===============================================================================");
  console.log("📊 MASTER TEST EXECUTION SUMMARY");
  console.log("===============================================================================");
  console.log(`Total Work Types Tested: ${testSuites.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log("-------------------------------------------------------------------------------");

  for (const r of results) {
    const symbol = r.status === "PASSED" ? "✅" : "❌";
    console.log(`${symbol} [${r.type.padEnd(8)}] ${r.name.padEnd(35)} -> ${r.status}`);
    if (r.error) {
      console.error(`   Error details: ${r.error.split("\n")[0]}`);
    }
  }

  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Master runner error:", err);
  process.exit(1);
});

