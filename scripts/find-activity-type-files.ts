import fs from "fs";
import path from "path";

const rawArg = process.argv[2];
const modeArg = (process.argv[3] || "all").toLowerCase();

if (!rawArg) {
  console.log(`
========================================================================
📌 วิธีใช้งานสคริปต์ค้นหาไฟล์ & สร้างคำสั่งสั่ง AI สำหรับ modules/activity
========================================================================
คำสั่งพื้นฐาน:
  npx tsx scripts/find-activity-type-files.ts <หมายเลข Type> [รูปแบบปัญหา]

ตัวอย่าง:
  npx tsx scripts/find-activity-type-files.ts 14
  npx tsx scripts/find-activity-type-files.ts 14 unplanned-sync
  npx tsx scripts/find-activity-type-files.ts 14 hydrate
  npx tsx scripts/find-activity-type-files.ts 14 add-field

รูปแบบปัญหาที่เลือกได้ (พารามิเตอร์ตัวที่ 2):
  - all            (ค่าเริ่มต้น) แสดงรายชื่อไฟล์ทั้งหมด + รวม 4 แม่แบบคำสั่งยอดฮิต
  - unplanned-sync ปรับหน้า "นอกแผน (Unplanned)" ให้เหมือน "สร้างแผน + บันทึกผลตามแผน"
  - hydrate        แก้ปัญหา "มีข้อมูลใน DB แต่เปิดหน้าแก้ไข/บันทึกผลแล้วไม่ดึงข้อมูลมาแสดง"
  - add-field      เพิ่ม/แก้ไขฟิลด์ใหม่ให้ครบทุกหน้า (สร้างแผน, บันทึกผล, นอกแผน, รายละเอียด)
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
    (f.includes("actual") || f.endsWith(".strategy.ts") || f.endsWith(".repository.ts")),
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

function formatList(files: string[]): string {
  return Array.from(new Set(files))
    .map((f) => `   - ${f}`)
    .join("\n");
}

if (modeArg === "all") {
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
}

console.log(`\n========================================================================`);
console.log(`📋 แม่แบบคำสั่ง (Prompt Templates) สำหรับก๊อปปี้ไปสั่ง AI (${upperCode})`);
console.log(`========================================================================`);

// CASE 1: Unplanned Sync (ปรับหน้านอกแผนให้เหมือนหน้าสร้างแผน + บันทึกผลตามแผน)
if (modeArg === "all" || modeArg === "unplanned-sync") {
  console.log(`
------------------------------------------------------------------------
🟢 [เคสที่ 1: ปรับหน้า "นอกแผน (Unplanned)" ให้เหมือน "สร้างแผน + บันทึกผลตามแผน"]
------------------------------------------------------------------------
ช่วยปรับปรุงหน้ากิจกรรมนอกแผน (Unplanned) ของ ${upperCode} (${sliceFolder}) ให้มีโครงสร้างข้อมูล ช่องกรอก (UI) การตรวจสอบข้อมูล (Validation) การบันทึกข้อมูลลง DB และขาดึงข้อมูลกลับมาแสดงตอนแก้ไข (Hydration) ให้ครบถ้วนเหมือนกับการนำ "หน้าสร้างแผน (Planned)" มารวมกับ "หน้าบันทึกผลตามแผน (Actual)" (2-in-1 Target + Actual) โดยอ้างอิงและแก้ไขไฟล์ต่อไปนี้ให้ครบทุกจุด:

1. ต้นแบบฝั่งในแผน (ใช้อ้างอิงฟิลด์, UI, Logic และการเซฟลง DB):
${formatList([...plannedFiles, ...actualFiles])}

2. ไฟล์ฝั่งนอกแผน (Unplanned) ที่ต้องปรับให้รองรับข้อมูลครบเหมือนฝั่งในแผน + บันทึกผล:
${formatList(unplannedFiles)}

3. ไฟล์ส่วนกลางสำหรับเชื่อมข้อมูล Unplanned (ทั้งตอนสร้าง, แก้ไข, ดึงจาก DB และแสดงผล):
${formatList([
  ...dbAndServerFiles,
  ...viewUnplannedFiles,
  ...domainAndAppFiles,
  ... displayCardFiles,
  ...viewDetailAndApprovalFiles,
])}

สิ่งที่ต้องตรวจสอบให้ครบ (Checklist):
- UI ใน ${camelPrefix}-unplanned-form.tsx ต้องมีฟิลด์เลือกข้อมูลตั้งต้นเหมือน ${camelPrefix}-planned-form.tsx และมีส่วนบันทึกผลการปฏิบัติงานจริง (รวมถึงรูปภาพ/พิกัด GPS/สินค้า) เหมือน ${camelPrefix}-actual-form.tsx
- ตอนกดบันทึก (Save): ${camelPrefix}-unplanned.strategy.ts ต้องบันทึกข้อมูลลงตาราง Target, Product, Result และ Attachment ครบเหมือนที่ ${camelPrefix}-planned.strategy.ts ทำทั้งใน savePlan และ saveActual
- ตอนกดเข้ามาแก้ไข (Edit Hydration): เช็ค views/unplanned/edit-view.tsx, unplanned-activity-form.tsx, unplanned-mapper.ts และ use-${camelPrefix}-unplanned-form.ts ว่าดึงข้อมูลจาก DB กลับมาใส่ในทุกช่องของฟอร์มได้ครบถ้วน
- รัน npx tsc --noEmit เพื่อตรวจสอบว่าไม่มี TypeScript error และไปอัปเดตไฟล์ modules/activity/features/${sliceFolder}/README.md ของ Type ที่แก้ไขให้เป็นปัจจุบันด้วย`);
}

// CASE 2: Hydrate (บันทึกเข้า DB แล้ว แต่เปิดหน้าแก้ไข/บันทึกผลแล้วข้อมูลไม่ขึ้น)
if (modeArg === "all" || modeArg === "hydrate") {
  console.log(`
------------------------------------------------------------------------
🟡 [เคสที่ 2: บันทึกข้อมูลลง DB ได้แล้ว แต่เปิดหน้าแก้ไข/บันทึกผลแล้วข้อมูลไม่ดึงมาใส่ช่อง]
------------------------------------------------------------------------
ตอนนี้ ${upperCode} (${sliceFolder}) บันทึกข้อมูลลง Database ได้แล้ว แต่เวลาเปิดกลับมาที่หน้าแก้ไขแผน (Planned Edit), หน้าบันทึกผล (Actual) หรือหน้าแก้ไขนอกแผน (Unplanned Edit) ข้อมูลจาก DB ไม่ถูกดึงมาแสดงในช่องฟอร์ม (หรือแสดงไม่ครบ)
ช่วยไล่เช็คและแก้ไขขากลับ (Read & Hydration Pipeline) ให้ครบทั้ง 5 ด่านตามไฟล์ต่อไปนี้:

1. [ด่าน Prisma Query Include] เช็คว่าดึง relation และฟิลด์ของ ${upperCode} ออกมาจาก DB ครบหรือยัง:
${formatList(dbAndServerFiles)}

2. [ด่าน View & Summary Extractor] เช็คว่าดึงข้อมูลจาก getActivityPlanAction แล้วส่งเข้า initialData / props ครบทุกฟิลด์หรือไม่:
${formatList([
  ...domainAndAppFiles,
  ...viewPlannedFiles,
  ...viewUnplannedFiles,
  ...viewActualFiles,
  ...viewDetailAndApprovalFiles,
])}

3. [ด่าน Mapper & Hook Hydration] เช็คฟังก์ชันแปลงข้อมูล DB -> Form State และ useEffect ตอนโหลด initialData (ระวังชื่อฟิลด์ตอน Save กับตอน Load ไม่ตรงกัน หรือติด ref guard ก่อนข้อมูล async โหลดเสร็จ):
${formatList(
  sliceFiles.filter((f) => f.includes("-mapper.ts") || f.includes("/hooks/")),
)}

4. [ด่าน UI Component Value Binding] เช็คว่าช่อง Input / Select ผูก value ตรงกับ state ที่ hydrate มาหรือไม่:
${formatList(sliceFiles.filter((f) => f.includes("/components/")))}

เมื่อแก้ไขครบแล้ว ให้รัน npx tsc --noEmit เพื่อตรวจเช็ค TypeScript error ด้วย และไปอัปเดตไฟล์ modules/activity/features/${sliceFolder}/README.md ของ Type ที่แก้ไขให้เป็นปัจจุบันด้วย`);
}

// CASE 3: Add / Modify Field across all screens
if (modeArg === "all" || modeArg === "add-field") {
  const plannedFormFile =
    sliceFiles.find((f) => f.endsWith(`${camelPrefix}-planned-form.tsx`)) ||
    `modules/activity/features/${sliceFolder}/planned/components/${camelPrefix}-planned-form.tsx`;
  const actualFormFile =
    sliceFiles.find((f) => f.endsWith(`${camelPrefix}-actual-form.tsx`)) ||
    `modules/activity/features/${sliceFolder}/planned/components/${camelPrefix}-actual-form.tsx`;
  const unplannedFormFile =
    sliceFiles.find((f) => f.endsWith(`${camelPrefix}-unplanned-form.tsx`)) ||
    `modules/activity/features/${sliceFolder}/unplanned/components/${camelPrefix}-unplanned-form.tsx`;

  console.log(`
------------------------------------------------------------------------
🔵 [เคสที่ 3: เพิ่มช่องกรอกข้อมูล (Field ใหม่) ในหน้าสร้างแผน ${plannedFormFile} ให้ครบทุกจุด]
------------------------------------------------------------------------
ฉันต้องการเพิ่มช่องกรอกข้อมูล [ระบุชื่อช่อง เช่น "เบอร์โทรเจ้าของแปลง" / ชนิดข้อมูล เช่น ข้อความ หรือ ตัวเลข / บังคับกรอกไหม] ในหน้า ${plannedFormFile}
ช่วยเพิ่มฟิลด์นี้แบบ Full Round-Trip (ตั้งแต่หน้ากรอก -> บันทึกลง DB -> ดึงกลับมาแสดงในหน้าแก้ไข -> แสดงในการ์ดสรุป/หน้าบันทึกผล/หน้านอกแผน/หน้ารายละเอียด) โดยทำตามลำดับ 6 ขั้นตอนนี้ให้ครบห้ามตกหล่น:

ขั้นที่ 1 [Database & Prisma]:
   - เช็คใน prisma/schema.prisma ว่าตารางของ ${upperCode} มีคอลัมน์สำหรับเก็บค่านี้หรือยัง (ถ้ายังไม่มี ให้เพิ่มฟิลด์ใน schema หรือระบุว่าจะเก็บลงฟิลด์ไหน และเช็คใน modules/activity/infrastructure/activity-plan-include.ts ว่าดึงฟิลด์นี้ออกมาด้วย)

ขั้นที่ 2 [Types & Validation]:
   - เพิ่มชื่อฟิลด์ใน Types และ Zod Validation ของ ${upperCode}:
${formatList(
  sliceFiles.filter((f) => f.includes("/types/") || f.includes("/shared/") || f.includes("-validation.ts")),
)}

ขั้นที่ 3 [UI ช่องกรอกข้อมูล]:
   - เพิ่มช่อง Input/Select ในหน้าสร้างแผน: ${plannedFormFile}
   - (ถ้าต้องแสดงหรือให้กรอกในหน้าบันทึกผลและนอกแผนด้วย) ให้เพิ่มใน:
     * ${actualFormFile}
     * ${unplannedFormFile}

ขั้นที่ 4 [ขา Save บันทึกลง DB (Hook -> Mapper -> Strategy)]:
   - รับค่าจากฟอร์มส่งเข้า payload และบันทึกลง Prisma ในไฟล์:
${formatList(
  sliceFiles.filter(
    (f) => f.includes("/hooks/") || f.includes("-mapper.ts") || f.includes(".strategy.ts") || f.includes(".repository.ts"),
  ),
)}

ขั้นที่ 5 [ขา Load ดึงข้อมูลจาก DB กลับมาแสดงตอนกด "แก้ไข" (Edit Hydration - สำคัญมาก!)]:
   - เช็คว่าเวลาเปิดหน้าแก้ไขแผน (views/planned/edit-view.tsx) และหน้าแก้ไขนอกแผน (views/unplanned/edit-view.tsx) มีการ map ฟิลด์นี้จาก DB กลับมาใส่ initialData และเซ็ตเข้า state ของฟอร์มครบถ้วน ไม่กลายเป็นค่าว่าง:
${formatList([...viewPlannedFiles, ...viewUnplannedFiles])}

ขั้นที่ 6 [ขาแสดงผลในการ์ดสรุปแผน / หน้าบันทึกผล / หน้ารายละเอียด / หน้าอนุมัติ]:
   - นำฟิลด์นี้ไปแสดงผลในการ์ดสรุปแผนและหน้ารายละเอียดด้วย:
${formatList([...displayCardFiles, ...domainAndAppFiles, ...viewActualFiles, ...viewDetailAndApprovalFiles])}

เมื่อแก้ไขครบแล้ว ให้รัน npx tsc --noEmit เพื่อตรวจเช็ค TypeScript error ด้วย และไปอัปเดตไฟล์ modules/activity/features/${sliceFolder}/README.md ของ Type ที่แก้ไขให้เป็นปัจจุบันด้วย`);
}
