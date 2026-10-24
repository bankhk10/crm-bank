/**
 * Constants for TYPE_7B: ติดตามแปลงสาธิต (Demo Plot Follow-up)
 */

export const WORK_TYPE_CODE = "TYPE_7B";
export const WORK_TYPE_NAME = "ติดตามแปลงสาธิต";

export const SPRAY_METHOD_RADIO_OPTIONS = [
  { value: "SINGLE", label: "ฉีดเดี่ยว (Single)" },
  { value: "TANK_MIXED", label: "ผสมถัง (Tank-mixed)" },
] as const;

export const EXTERNAL_FORMULA_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "SL", label: "SL (Soluble Liquid)" },
  { value: "SC", label: "SC (Suspension Concentrate)" },
  { value: "EC", label: "EC (Emulsifiable Concentrate)" },
  { value: "อื่นๆ", label: "อื่นๆ (ระบุ)" },
];

export const SPRAY_EQUIPMENT_RADIO_OPTIONS = [
  { value: "เป้สะพายหลัง", label: "เป้สะพายหลัง" },
  { value: "ถัง + สายลาก", label: "ถัง + สายลาก" },
  { value: "โดรน", label: "โดรน" },
  { value: "แอร์บัส", label: "แอร์บัส" },
  { value: "อื่นๆ ระบุ...", label: "อื่นๆ ระบุ..." },
] as const;

export const SPRAY_RESPONSE_OPTIONS = [
  { value: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)", label: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)" },
  { value: "ยังไม่เห็นผลชัดเจน", label: "ยังไม่เห็นผลชัดเจน" },
  { value: "พบปัญหา / พืชมีอาการผิดปกติ", label: "พบปัญหา / พืชมีอาการผิดปกติ" },
] as const;

export const DEMO_PLOT_STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label: "อยู่ระหว่างการทดลอง (ยังคงติดตามต่อ)" },
  { value: "COMPLETED", label: "เสร็จสิ้น/ปิดแปลงสาธิต" },
  { value: "CANCELLED", label: "ยกเลิก/ยุติแปลงสาธิต" },
] as const;

export const CROP_CONDITIONS = [
  "สมบูรณ์",
  "ปานกลาง",
  "มีปัญหา",
  "ทรุดโทรม",
] as const;

export const PRODUCT_RESPONSES = [
  "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
  "ยังไม่เห็นผลชัดเจน",
  "พบปัญหา / พืชมีอาการผิดปกติ",
] as const;

export const SPRAY_METHODS = [
  "ฉีดเดี่ยว (Single)",
  "ผสมถัง (Tank-mixed)",
] as const;

export const SPRAY_EQUIPMENT_OPTIONS = [
  "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
  "เครื่องพ่นปั๊มลากสาย",
  "โดรนเพื่อการเกษตร",
  "แอร์บัส / รถพ่นยา",
  "อื่นๆ (ระบุ)",
] as const;

export const SPRAY_EQUIPMENTS = [
  "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
  "เครื่องพ่นปั๊มลากสาย",
  "โดรนเพื่อการเกษตร",
  "แอร์บัส / รถพ่นยา",
  "อื่นๆ (ระบุ)",
] as const;

export const COMMERCIAL_POTENTIALS = [
  "สูงมาก (พร้อมขยายผลเชิงพาณิชย์)",
  "สูง (เกษตรกรสนใจมาก)",
  "ปานกลาง (ต้องติดตามผลเพิ่มเติม)",
  "น้อย (ยังไม่เห็นความแตกต่างชัดเจน)",
] as const;

export const SATISFACTION_SCORES = [
  { value: 5, label: "5 - พึงพอใจมากที่สุด" },
  { value: 4, label: "4 - พึงพอใจมาก" },
  { value: 3, label: "3 - พึงพอใจปานกลาง" },
  { value: 2, label: "2 - พึงพอใจน้อย" },
  { value: 1, label: "1 - ไม่พึงพอใจ" },
] as const;

