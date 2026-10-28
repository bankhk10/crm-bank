import fs from "fs";
import path from "path";

const rawArg = process.argv[2];

if (!rawArg) {
  console.log(`
========================================================================
📌 วิธีใช้งานสคริปต์ค้นหาไฟล์ของแต่ละ Type ใน modules/activity
========================================================================
คำสั่ง:
  npx tsx scripts/find-activity-type-files.ts <หมายเลข Type>

ตัวอย่าง:
  npx tsx scripts/find-activity-type-files.ts 1
  npx tsx scripts/find-activity-type-files.ts 7a
  npx tsx scripts/find-activity-type-files.ts 13
========================================================================
`);
  process.exit(0);
}

// Normalize input: e.g. "1", "type-1", "type1", "TYPE_1", "7a", "7A" -> "1" or "7a"
const normalizedId = rawArg
  .trim()
  .toLowerCase()
  .replace(/^type[-_]?/, "");

const sliceFolder = `type-${normalizedId}`; // e.g., type-1, type-7a
const camelPrefix = `type${normalizedId}`; // e.g., type1, type7a
const upperCode = `TYPE_${normalizedId.toUpperCase()}`; // e.g., TYPE_1, TYPE_7A

const rootDir = process.cwd();
const activityDir = path.join(rootDir, "modules", "activity");
const sliceDir = path.join(activityDir, "features", sliceFolder);

function toRelative(fullPath: string): string {
  return path.relative(rootDir, fullPath).replace(/\\/g, "/");
}

function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

if (!fs.existsSync(sliceDir)) {
  console.error(`❌ ไม่พบโฟลเดอร์: modules/activity/features/${sliceFolder}`);
  const featuresDir = path.join(activityDir, "features");
  if (fs.existsSync(featuresDir)) {
    const available = fs
      .readdirSync(featuresDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .join(", ");
    console.error(`💡 Type ที่มีในระบบคือ: ${available}`);
  }
  process.exit(1);
}

// 1. Collect all files inside features/type-X
const sliceFiles = walkFiles(sliceDir).map(toRelative);

const plannedFiles = sliceFiles.filter(
  (f) =>
    f.includes("/planned/") &&
    !f.includes("actual") &&
    !f.includes("-detail-view") &&
    !f.includes("-plan-card") &&
    !f.includes("-approval-card"),
);

const actualFiles = sliceFiles.filter(
  (f) =>
    f.includes("/planned/") &&
    (f.includes("actual") || f.endsWith(".strategy.ts")),
);

const unplannedFiles = sliceFiles.filter((f) => f.includes("/unplanned/"));

const displayCardFiles = sliceFiles.filter(
  (f) =>
    f.includes("-detail-view") ||
    f.includes("-plan-card") ||
    f.includes("-approval-card"),
);

const sharedAndIndexFiles = sliceFiles.filter(
  (f) => f.includes("/shared/") || f.endsWith(`/${sliceFolder}/index.ts`),
);

// 2. Scan core/view files outside features/ that reference this type
const allActivityFiles = walkFiles(activityDir);
// Match exact type token (e.g. type1, type1Targets, type-1, TYPE_1, but NOT type10 or type7a when searching 7)
const escapedId = normalizedId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const typeRegex = new RegExp(
  `\\b(type[-_]?${escapedId}(?![0-9]|a\\b|b\\b)|TYPE_${escapedId.toUpperCase()}(?![0-9A-Z]))`,
  "i",
);

const coreRefFiles = allActivityFiles
  .filter((fullPath) => !fullPath.includes(path.join("modules", "activity", "features")))
  .filter((fullPath) => {
    const content = fs.readFileSync(fullPath, "utf8");
    return typeRegex.test(content);
  })
  .map(toRelative);

const dbAndServerFiles = coreRefFiles.filter(
  (f) => f.includes("/infrastructure/") || f.includes("/server/"),
);
const domainAndAppFiles = coreRefFiles.filter(
  (f) => f.includes("/domain/") || f.includes("/application/"),
);
const viewPlannedFiles = coreRefFiles.filter((f) => f.includes("/views/planned/"));
const viewUnplannedFiles = coreRefFiles.filter((f) => f.includes("/views/unplanned/"));
const viewActualFiles = coreRefFiles.filter((f) => f.includes("/views/actual/"));
const viewDetailAndApprovalFiles = coreRefFiles.filter(
  (f) => f.includes("/views/detail/") || f.includes("/views/approvals/"),
);
const otherCoreFiles = coreRefFiles.filter(
  (f) =>
    !dbAndServerFiles.includes(f) &&
    !domainAndAppFiles.includes(f) &&
    !viewPlannedFiles.includes(f) &&
    !viewUnplannedFiles.includes(f) &&
    !viewActualFiles.includes(f) &&
    !viewDetailAndApprovalFiles.includes(f),
);

function printSection(title: string, files: string[]) {
  console.log(`\n${title}`);
  if (files.length === 0) {
    console.log("  (ไม่มี)");
    return;
  }
  for (const file of files) {
    console.log(`  - ${file}`);
  }
}

console.log(`========================================================================`);
console.log(`🔍 รายการไฟล์ทั้งหมดที่เกี่ยวข้องกับ [${upperCode} / ${sliceFolder}]`);
console.log(`========================================================================`);

console.log(`\n📦 [ส่วนที่ 1] ไฟล์ภายใน Feature Slice (modules/activity/features/${sliceFolder})`);
printSection(`1.1 หน้าสร้างแผน & แก้ไขแผน (Planned):`, plannedFiles);
printSection(`1.2 หน้าบันทึกผลตามแผน (Actual):`, actualFiles);
printSection(`1.3 หน้าสร้าง & แก้ไขกิจกรรมนอกแผน (Unplanned):`, unplannedFiles);
printSection(`1.4 การ์ดสรุปแผน / หน้ารายละเอียด / หน้าอนุมัติ:`, displayCardFiles);
printSection(`1.5 Shared & Public Index:`, sharedAndIndexFiles);

console.log(`\n🔗 [ส่วนที่ 2] ไฟล์ส่วนกลางที่ดึงข้อมูล DB และส่งเข้าหน้าจอ (Core & Views)`);
printSection(`2.1 ดึงข้อมูล DB & บันทึกข้อมูล (Infrastructure / Server):`, dbAndServerFiles);
printSection(`2.2 สกัดข้อมูลแสดงผล (Domain Summary / Application):`, domainAndAppFiles);
printSection(`2.3 หน้าแก้ไขแผนในแผนงาน (Views - Planned):`, viewPlannedFiles);
printSection(`2.4 หน้าแก้ไขกิจกรรมนอกแผน (Views - Unplanned):`, viewUnplannedFiles);
printSection(`2.5 หน้าบันทึกผลการปฏิบัติงานจริง (Views - Actual):`, viewActualFiles);
printSection(`2.6 หน้ารายละเอียด & หน้าอนุมัติ (Views - Detail & Approvals):`, viewDetailAndApprovalFiles);
if (otherCoreFiles.length > 0) {
  printSection(`2.7 ไฟล์ส่วนกลางอื่นๆ:`, otherCoreFiles);
}

console.log(`\n========================================================================`);
console.log(`📋 ก๊อปปี้ Prompt ด้านล่างนี้ไปสั่ง AI เพื่อแก้ ${upperCode} ให้ครบทุกจุด:`);
console.log(`========================================================================\n`);

console.log(`ช่วยแก้ไขปัญหา [ระบุอาการ] ของ ${upperCode} (${sliceFolder}) โดยเช็คและแก้ไขให้ครบทั้งขาบันทึก (Save) และขาดึงข้อมูลมาแสดงผลตอนแก้ไข (Load & Hydrate) ในไฟล์ต่อไปนี้:

1. ไฟล์ภายใน Slice:
${sliceFiles.map((f) => `   - ${f}`).join("\n")}

2. ไฟล์ดึงข้อมูล DB & เชื่อมเข้าหน้าจอ (ห้ามตกหล่น):
${[
  ...dbAndServerFiles,
  ...domainAndAppFiles,
  ...viewPlannedFiles,
  ...viewUnplannedFiles,
  ...viewActualFiles,
  ...viewDetailAndApprovalFiles,
]
  .map((f) => `   - ${f}`)
  .join("\n")}
`);
