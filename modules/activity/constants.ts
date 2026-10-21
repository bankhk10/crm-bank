/**
 * Module-level constants for Activity Module
 * Follows MODULE_ARCHITECTURE.md standard module structure
 */

export interface WorkTypeConfig {
  code: string;
  name: string;
  shortName: string;
  sortOrder: number;
  hasActual: boolean;
  requiresApproval: boolean;
}

export const WORK_TYPE_CONFIG: Record<string, WorkTypeConfig> = {
  TYPE_1: {
    code: "TYPE_1",
    name: "เข้าพบร้านค้า / Key Farmer",
    shortName: "Visit",
    sortOrder: 1,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_2: {
    code: "TYPE_2",
    name: "ติดตามผลการใช้สินค้า",
    shortName: "Followup",
    sortOrder: 2,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_3: {
    code: "TYPE_3",
    name: "เสนอขายสินค้า",
    shortName: "Sales",
    sortOrder: 3,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_4: {
    code: "TYPE_4",
    name: "วางบิล / เก็บเงิน",
    shortName: "Collect",
    sortOrder: 4,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_5: {
    code: "TYPE_5",
    name: "สำรวจตลาดของคู่แข่ง",
    shortName: "Survey",
    sortOrder: 5,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_6: {
    code: "TYPE_6",
    name: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
    shortName: "Issue",
    sortOrder: 6,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_7A: {
    code: "TYPE_7A",
    name: "จัดทำแปลงสาธิต",
    shortName: "DemoNew",
    sortOrder: 7,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_7B: {
    code: "TYPE_7B",
    name: "ติดตามแปลงสาธิต",
    shortName: "DemoFollow",
    sortOrder: 8,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_8: {
    code: "TYPE_8",
    name: "จัดประชุม",
    shortName: "Meeting",
    sortOrder: 9,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_9: {
    code: "TYPE_9",
    name: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    shortName: "Store",
    sortOrder: 10,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_10: {
    code: "TYPE_10",
    name: "จัดงาน Field Day",
    shortName: "FieldDay",
    sortOrder: 11,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_11: {
    code: "TYPE_11",
    name: "ตรวจเช็คสต๊อกหน้าร้าน",
    shortName: "StockCheck",
    sortOrder: 12,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_12: {
    code: "TYPE_12",
    name: "ทัวร์",
    shortName: "Tour",
    sortOrder: 13,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_13: {
    code: "TYPE_13",
    name: "ฉีดแปลงแฮตแทค",
    shortName: "AttackSpray",
    sortOrder: 14,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_14: {
    code: "TYPE_14",
    name: "ติดตามแปลงแฮตแทค",
    shortName: "AttackFollow",
    sortOrder: 15,
    hasActual: true,
    requiresApproval: true,
  },
};

export const WORK_TYPES = Object.values(WORK_TYPE_CONFIG).map((c) => c.name);

/**
 * ประเภทงานที่ไม่รองรับในหน้าสร้างกิจกรรมนอกแผน (Unplanned Activity):
 * 1. จัดทำแปลงสาธิต (TYPE_7A)
 * 2. จัดประชุม (TYPE_8)
 * 3. จัดกิจกรรมส่งเสริมการขายหน้าร้าน (TYPE_9)
 * 4. ทัวร์ (TYPE_12)
 */
export const UNPLANNED_EXCLUDED_WORK_TYPE_CODES = [
  "TYPE_7A",
  "TYPE_8",
  "TYPE_9",
  "TYPE_12",
] as const;

export function getWorkTypeCode(nameOrCode: any): string {
  if (!nameOrCode) return "";
  let raw = "";
  if (typeof nameOrCode === "string") {
    raw = nameOrCode;
  } else if (typeof nameOrCode === "object") {
    raw =
      nameOrCode.workTypeCode ||
      nameOrCode.code ||
      nameOrCode.activityType?.name ||
      nameOrCode.name ||
      nameOrCode.activityTypeId ||
      "";
  } else {
    raw = String(nameOrCode || "");
  }
  if (!raw) return "";

  const upper = raw.toUpperCase().trim();
  if (WORK_TYPE_CONFIG[upper]) return upper;

  // Match if input contains "TYPE_10".."TYPE_14", "TYPE_7A", "TYPE_7B", "TYPE_1".."TYPE_9" (longest first)
  const sortedKeys = Object.keys(WORK_TYPE_CONFIG).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of sortedKeys) {
    if (upper.includes(key)) return key;
  }

  // Common Thai alias matching
  if (raw.includes("ทำแปลงสาธิต") && !raw.includes("ติดตาม")) return "TYPE_7A";
  if (raw.includes("ตรวจเช็คสต๊อก") || raw.includes("ตรวจเช็คสต๊อก"))
    return "TYPE_11";
  if (raw.includes("ทัวร์") || raw.includes("ทัวร์")) return "TYPE_12";
  if (raw.includes("ฉีดแปลงแฮตแทค") || raw.includes("ฉีดแปลงแฮตแทค"))
    return "TYPE_13";
  if (raw.includes("ติดตามแปลงแฮตแทค") || raw.includes("ติดตามแปลงแฮตแทค"))
    return "TYPE_14";

  const found = Object.values(WORK_TYPE_CONFIG).find(
    (c) =>
      c.name.trim() === raw.trim() ||
      raw.includes(c.name) ||
      c.name.includes(raw) ||
      c.shortName.toUpperCase() === upper ||
      c.code.toUpperCase() === upper,
  );
  return found ? found.code : raw;
}

export function getWorkTypeName(codeOrName: any): string {
  if (!codeOrName) return "";
  let raw = "";
  if (typeof codeOrName === "string") {
    raw = codeOrName;
  } else if (typeof codeOrName === "object") {
    raw =
      codeOrName.workTypeCode ||
      codeOrName.code ||
      codeOrName.activityType?.name ||
      codeOrName.name ||
      codeOrName.activityTypeId ||
      "";
  } else {
    raw = String(codeOrName || "");
  }
  if (!raw) return "";

  const upper = raw.toUpperCase().trim();
  if (WORK_TYPE_CONFIG[upper]) return WORK_TYPE_CONFIG[upper].name;

  const found = Object.values(WORK_TYPE_CONFIG).find(
    (c) =>
      c.code.toUpperCase() === upper ||
      upper.includes(c.code.toUpperCase()) ||
      c.name.trim() === raw.trim() ||
      raw.includes(c.name) ||
      c.shortName.toUpperCase() === upper,
  );
  return found ? found.name : raw;
}

export const ACTIVITY_RESULT_STATUS_LABELS: Record<string, string> = {
  PARTIAL: "สำเร็จบางส่วน",
  COMPLETED: "ปฏิบัติงานแล้วเสร็จ",
  POSTPONED: "เลื่อนกำหนดการปฏิบัติงาน",
  CANCELLED: "ยกเลิก",
};

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "ร่าง" },
  { value: "PENDING_LINE_APPROVAL", label: "รออนุมัติตามสายงาน" },
  { value: "PENDING_MARKETING_APPROVAL", label: "รออนุมัติการเบิกสินค้า" },
  { value: "PENDING_BUDGET_APPROVAL", label: "รออนุมัติงบประมาณ" },
  { value: "PENDING_HELPER_APPROVAL", label: "รออนุมัติคนช่วยงาน" },
  { value: "APPROVED", label: "อนุมัติสำเร็จ" },
  { value: "PENDING_CANCELLATION", label: "รออนุมัติการยกเลิก" },
  {
    value: "COMPLETED",
    label: `ผลกิจกรรม: ${ACTIVITY_RESULT_STATUS_LABELS.COMPLETED}`,
  },
  { value: "PARTIAL", label: "ผลกิจกรรม: สำเร็จบางส่วน" },
  {
    value: "POSTPONED",
    label: `ผลกิจกรรม: ${ACTIVITY_RESULT_STATUS_LABELS.POSTPONED}`,
  },
  { value: "WAITING_FOR_CORRECTION", label: "รอแก้ไข/ข้อมูลเพิ่ม" },
  { value: "PENDING_REVIEW", label: "รอตรวจสอบ" },
  { value: "REVIEWED", label: "ตรวจสอบแล้ว" },
  { value: "RETURNED", label: "ส่งกลับแก้ไข" },
  { value: "REJECTED", label: "ปฏิเสธ" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

export const MARKETING_UNITS: string[] = [
  "ชิ้น",
  "ใบ",
  "เล่ม",
  "ตัว",
  "แผ่น",
  "ผืน",
  "กล่อง",
  "ลัง",
  "แพค",
  "อัน",
  "คัน",
  "ชุด",
  "ขวด",
  "ซอง",
  "ถุง",
  "ม้วน",
];

export const LOCATION_TEAM_WORK_TYPE_CODES = new Set([
  "TYPE_8",
  "TYPE_9",
  "TYPE_10",
]);

export function isLocationAndTeamRequired(
  workTypes?: string[] | null,
): boolean {
  if (!workTypes || workTypes.length === 0) return false;
  return workTypes.some((wt) => {
    const code = getWorkTypeCode(wt);
    return LOCATION_TEAM_WORK_TYPE_CODES.has(code);
  });
}

export const MARKETING_PRODUCT_CATEGORIES = [
  "Premium_item",
  "PP_Board",
  "Banner",
  "Leaflet",
  "อุปกรณ์จัดงาน",
  "อื่นๆ",
];

/**
 * Resolves canonical work type code (e.g. "TYPE_1") from relation item, code, or name.
 */
export function resolveWorkTypeCode(
  wt: any,
  masterList?: Array<{ id?: string; code?: string; name?: string }>,
): string | null {
  if (!wt) return null;
  if (typeof wt === "string") {
    if (WORK_TYPE_CONFIG[wt]) return wt;
    if (wt === "เข้าพบร้านค้า / Key Farmer" || wt === "เข้าพบเกษตรกร")
      return "TYPE_1";
    if (
      wt === "แก้ปัญหา / รับเรื่องร้องเรียน" ||
      wt === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"
    ) {
      return "TYPE_6";
    }
    const found = Object.values(WORK_TYPE_CONFIG).find(
      (c) => c.name === wt || c.shortName === wt,
    );
    if (found) return found.code;
    return null;
  }
  // 1. Primary: activityType.code
  if (wt.activityType?.code && typeof wt.activityType.code === "string") {
    if (WORK_TYPE_CONFIG[wt.activityType.code]) return wt.activityType.code;
  }
  // 2. Direct workTypeCode
  if (wt.workTypeCode && typeof wt.workTypeCode === "string") {
    if (WORK_TYPE_CONFIG[wt.workTypeCode]) return wt.workTypeCode;
  }
  // 3. activityTypeId matching master lookup by id or code
  if (wt.activityTypeId && typeof wt.activityTypeId === "string") {
    if (WORK_TYPE_CONFIG[wt.activityTypeId]) return wt.activityTypeId;
    if (masterList && masterList.length > 0) {
      const matched = masterList.find(
        (at) => at.id === wt.activityTypeId || at.code === wt.activityTypeId,
      );
      if (matched?.code && WORK_TYPE_CONFIG[matched.code]) {
        return matched.code;
      }
    }
  }
  // 4. Fallback: activityType.name
  if (wt.activityType?.name && typeof wt.activityType.name === "string") {
    return getWorkTypeCode(wt.activityType.name);
  }
  return null;
}

// Re-export filter matcher and criteria from application layer for backward compatibility
export {
  type ActivityFilterCriteria,
  matchesActivityFilters,
  matchesWorkTypes,
  matchesAssignedPerson,
  matchesPlanStatus,
  matchesSearchText,
} from "./application/filters/activity-filter-matcher";
