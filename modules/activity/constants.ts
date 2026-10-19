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
    name: "ทำแปลงสาธิต",
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
    name: "จัดงานแสดงสินค้า / นิทรรศการ",
    shortName: "Exhibition",
    sortOrder: 12,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_12: {
    code: "TYPE_12",
    name: "ร่วมกิจกรรมกับหน่วยงานราชการ",
    shortName: "Government",
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
    name: "ติดตามแปลงแฮทแทค",
    shortName: "AttackFollow",
    sortOrder: 15,
    hasActual: true,
    requiresApproval: true,
  },
};

export const WORK_TYPES = Object.values(WORK_TYPE_CONFIG).map((c) => c.name);

export function getWorkTypeCode(nameOrCode: string): string {
  if (!nameOrCode) return "";
  const upper = nameOrCode.toUpperCase().trim();
  if (WORK_TYPE_CONFIG[upper]) return upper;

  const found = Object.values(WORK_TYPE_CONFIG).find(
    (c) =>
      c.name.trim() === nameOrCode.trim() ||
      c.shortName.toUpperCase() === upper ||
      c.code.toUpperCase() === upper,
  );
  return found ? found.code : nameOrCode;
}

export function getWorkTypeName(codeOrName: string): string {
  if (!codeOrName) return "";
  const upper = codeOrName.toUpperCase().trim();
  if (WORK_TYPE_CONFIG[upper]) return WORK_TYPE_CONFIG[upper].name;

  const found = Object.values(WORK_TYPE_CONFIG).find(
    (c) =>
      c.code.toUpperCase() === upper ||
      c.name.trim() === codeOrName.trim() ||
      c.shortName.toUpperCase() === upper,
  );
  return found ? found.name : codeOrName;
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

export const DEMO_PRODUCTS = [
  "สินค้าทดสอบ A",
  "สินค้าทดสอบ B",
  "สินค้าทดสอบ C",
  "ปุ๋ยเคมีสูตรพิเศษ",
];

export const MARKETING_PRODUCT_CATEGORIES = [
  "Premium_item",
  "PP_Board",
  "Banner",
  "Leaflet",
  "อุปกรณ์จัดงาน",
  "อื่นๆ",
];

