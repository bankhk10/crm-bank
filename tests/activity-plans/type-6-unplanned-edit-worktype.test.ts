import assert from "node:assert";
import {
  WORK_TYPE_CONFIG,
  getWorkTypeCode,
  getWorkTypeName,
} from "@/modules/activity/constants";

// Simulate the getInitialWorkTypes resolution function from unplanned-activity-form.tsx
function resolveSelectedWorkTypes(
  initialData: any,
  activityTypes: any[] = [],
  isEdit: boolean = true,
): string[] {
  // 1. ตรวจสอบจาก workTypes ที่บันทึกไว้ในฐานข้อมูลโดยตรง (Canonical Source of Truth)
  if (
    Array.isArray(initialData.workTypes) &&
    initialData.workTypes.length > 0
  ) {
    for (const wt of initialData.workTypes) {
      const name = getWorkTypeName(wt);
      if (name) return [name];
    }
  }

  // 2. ตรวจสอบจาก workTypeCodes
  if (
    Array.isArray(initialData.workTypeCodes) &&
    initialData.workTypeCodes.length > 0
  ) {
    for (const wt of initialData.workTypeCodes) {
      const name = getWorkTypeName(wt);
      if (name) return [name];
    }
  }

  // 3. ตรวจสอบจาก activityType
  if (initialData.activityType) {
    const code = getWorkTypeCode(initialData.activityType);
    if (code && WORK_TYPE_CONFIG[code]) return [WORK_TYPE_CONFIG[code].name];
    const name = getWorkTypeName(initialData.activityType);
    if (name) return [name];
  }

  // 4. ตรวจสอบจาก activityTypeId
  if (
    initialData.activityTypeId &&
    Array.isArray(activityTypes) &&
    activityTypes.length > 0
  ) {
    const matched = activityTypes.find(
      (t: any) => t.id === initialData.activityTypeId,
    );
    if (matched) {
      const code = getWorkTypeCode(matched.code || matched.name);
      if (code && WORK_TYPE_CONFIG[code]) return [WORK_TYPE_CONFIG[code].name];
      const name = getWorkTypeName(matched);
      if (name) return [name];
    }
  }

  // 5. Fallback ตรวจสอบจาก Dedicated Target / Stores สำหรับข้อมูลเก่า (Legacy Data)
  // 5.1 Type 2
  if (
    (Array.isArray(initialData.type2Targets) &&
      initialData.type2Targets.length > 0) ||
    (Array.isArray(initialData.stores) &&
      initialData.stores.some((s: any) => s.workTypeCode === "TYPE_2")) ||
    (Array.isArray(initialData.products) &&
      initialData.products.some((p: any) => p.workTypeCode === "TYPE_2"))
  ) {
    return [WORK_TYPE_CONFIG.TYPE_2.name];
  }

  // 5.2 Type 3
  if (
    (Array.isArray(initialData.type3Targets) &&
      initialData.type3Targets.length > 0) ||
    (Array.isArray(initialData.stores) &&
      initialData.stores.some((s: any) => s.workTypeCode === "TYPE_3")) ||
    (Array.isArray(initialData.products) &&
      initialData.products.some((p: any) => p.workTypeCode === "TYPE_3"))
  ) {
    return [WORK_TYPE_CONFIG.TYPE_3.name];
  }

  // 5.3 Type 4
  if (
    (Array.isArray(initialData.type4Targets) &&
      initialData.type4Targets.length > 0) ||
    (Array.isArray(initialData.type4Items) &&
      initialData.type4Items.length > 0) ||
    (Array.isArray(initialData.stores) &&
      initialData.stores.some((s: any) => s.workTypeCode === "TYPE_4"))
  ) {
    return [WORK_TYPE_CONFIG.TYPE_4.name];
  }

  // 5.4 Type 5
  if (
    (Array.isArray(initialData.type5Targets) &&
      initialData.type5Targets.length > 0) ||
    (Array.isArray(initialData.stores) &&
      initialData.stores.some((s: any) => s.workTypeCode === "TYPE_5")) ||
    (Array.isArray(initialData.type5SurveyRecords) &&
      initialData.type5SurveyRecords.length > 0) ||
    (typeof initialData.competitorBrand === "string" &&
      initialData.competitorBrand.trim().length > 0)
  ) {
    return [WORK_TYPE_CONFIG.TYPE_5.name];
  }

  // 5.5 Type 6
  if (
    (Array.isArray(initialData.type6Targets) &&
      initialData.type6Targets.length > 0) ||
    (Array.isArray(initialData.stores) &&
      initialData.stores.some((s: any) => s.workTypeCode === "TYPE_6")) ||
    (Array.isArray(initialData.type6ActualIssues) &&
      initialData.type6ActualIssues.length > 0) ||
    (initialData.t6IssueRecord &&
      Object.keys(initialData.t6IssueRecord).length > 0)
  ) {
    return [WORK_TYPE_CONFIG.TYPE_6.name];
  }

  // 5.11 Type 1
  if (
    Array.isArray(initialData.type1Stores) &&
    initialData.type1Stores.length > 0 &&
    isEdit
  ) {
    return [WORK_TYPE_CONFIG.TYPE_1.name];
  }

  return [];
}

async function runTests() {
  console.log("=== Running Type 6 Unplanned Edit Work Type Resolution Tests ===");

  // -------------------------------------------------------------
  // Test 1: getWorkTypeCode & getWorkTypeName with ActivityPlanWorkType object
  // -------------------------------------------------------------
  console.log("\n[Test 1] Verifying getWorkTypeCode & getWorkTypeName on join table objects...");
  const type6WorkType = {
    id: "apwt-1",
    activityPlanId: "plan-1",
    activityTypeId: "act-type-6",
    activityType: {
      id: "act-type-6",
      code: "TYPE_6",
      name: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
    },
  };

  assert.strictEqual(getWorkTypeCode(type6WorkType), "TYPE_6");
  assert.strictEqual(getWorkTypeName(type6WorkType), WORK_TYPE_CONFIG.TYPE_6.name);
  console.log("✓ Test 1 passed: ActivityPlanWorkType correctly parsed as TYPE_6");

  // -------------------------------------------------------------
  // Test 2: Unplanned Type 6 loaded in edit-view with empty arrays
  // (Previously, type5SurveyRecords: [] caused it to evaluate to TYPE_5)
  // -------------------------------------------------------------
  console.log("\n[Test 2] Verifying initialData for Type 6 unplanned plan resolves to TYPE_6 even with empty fallback arrays...");

  const type6InitialData = {
    id: "plan-type6-unplanned",
    planType: "UNPLANNED",
    title: "แก้ไขปัญหาสินค้าชำรุด",
    activityTypeId: "act-type-6",
    activityType: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
    workTypes: [type6WorkType],
    type5Targets: [],
    type5SurveyRecords: [], // empty array in edit-view
    surveyResults: [],
    t5SurveyDetails: [],
    type6Targets: [
      {
        id: "t6-target-1",
        customerName: "สมชาย ฟาร์ม",
      },
    ],
    type6ActualIssues: [
      {
        id: "issue-1",
        problemFound: "ฝาแตก",
      },
    ],
  };

  const selectedWorkTypes = resolveSelectedWorkTypes(type6InitialData);
  assert.deepStrictEqual(selectedWorkTypes, [WORK_TYPE_CONFIG.TYPE_6.name]);
  assert.notDeepStrictEqual(selectedWorkTypes, [WORK_TYPE_CONFIG.TYPE_5.name]);
  console.log("✓ Test 2 passed: Resolves to Type 6 ('ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา') and NOT Type 5");

  // -------------------------------------------------------------
  // Test 3: Unplanned Type 5 loaded in edit-view resolves to TYPE_5
  // -------------------------------------------------------------
  console.log("\n[Test 3] Verifying initialData for Type 5 unplanned plan resolves to TYPE_5...");

  const type5WorkType = {
    id: "apwt-2",
    activityPlanId: "plan-2",
    activityTypeId: "act-type-5",
    activityType: {
      id: "act-type-5",
      code: "TYPE_5",
      name: "สำรวจตลาดของคู่แข่ง",
    },
  };

  const type5InitialData = {
    id: "plan-type5-unplanned",
    planType: "UNPLANNED",
    title: "สำรวจราคาตลาดปุ๋ย",
    activityTypeId: "act-type-5",
    activityType: "สำรวจตลาดของคู่แข่ง",
    workTypes: [type5WorkType],
    type5Targets: [{ id: "t5-1", storeName: "ร้าน ป.การเกษตร" }],
    type5SurveyRecords: [{ competitorBrand: "ตรามงกุฎ" }],
    type6Targets: [],
    type6ActualIssues: [],
  };

  const selectedType5 = resolveSelectedWorkTypes(type5InitialData);
  assert.deepStrictEqual(selectedType5, [WORK_TYPE_CONFIG.TYPE_5.name]);
  console.log("✓ Test 3 passed: Resolves to Type 5 ('สำรวจตลาดของคู่แข่ง')");

  // -------------------------------------------------------------
  // Test 4: Legacy plan with no workTypes array, only activityTypeId
  // -------------------------------------------------------------
  console.log("\n[Test 4] Verifying legacy plan with only activityTypeId and activityTypes array...");

  const activityTypesList = [
    { id: "act-type-5", code: "TYPE_5", name: "สำรวจตลาดของคู่แข่ง" },
    { id: "act-type-6", code: "TYPE_6", name: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา" },
  ];

  const legacyType6Data = {
    id: "legacy-plan",
    activityTypeId: "act-type-6",
    workTypes: [],
    type5SurveyRecords: [],
  };

  const selectedLegacy = resolveSelectedWorkTypes(legacyType6Data, activityTypesList);
  assert.deepStrictEqual(selectedLegacy, [WORK_TYPE_CONFIG.TYPE_6.name]);
  console.log("✓ Test 4 passed: Legacy plan correctly resolved via activityTypeId");

  console.log("\n🎉 ALL UNPLANNED WORK TYPE RESOLUTION TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

