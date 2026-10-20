/**
 * Constants for TYPE_7B: ติดตามแปลงสาธิต (Demo Plot Follow-up)
 */

export const WORK_TYPE_CODE = "TYPE_7B";
export const WORK_TYPE_NAME = "ติดตามแปลงสาธิต";

export const CROP_CONDITIONS = [
  "สมบูรณ์",
  "ปานกลาง",
  "มีปัญหา",
  "ทรุดโทรม",
] as const;

export const PRODUCT_RESPONSES = [
  "พืชตอบสนองดี",
  "พบปัญหา",
] as const;

export const SPRAY_METHODS = [
  "เครื่องพ่นปั๊มลากสาย",
  "เครื่องพ่นสะพายหลัง (เครื่องยนต์)",
  "เครื่องพ่นแบตเตอรี่",
  "โดรนเพื่อการเกษตร (Drone)",
  "แอร์บัส / รถพ่นยา",
] as const;

export const SPRAY_EQUIPMENTS = [
  "หัวพ่นพัด (Fan Nozzle)",
  "หัวพ่นกรวย (Cone Nozzle)",
  "หัวพ่นปรับได้ (Adjustable Nozzle)",
  "หัวพ่นคู่ (Twin Nozzle)",
  "อื่นๆ ระบุ",
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

export const DEMO_PLOT_STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label: "กำลังดำเนินการ (ติดตามต่อเนื่อง)" },
  { value: "COMPLETED", label: "เสร็จสิ้นการสาธิต (รอบสุดท้าย/เก็บเกี่ยว)" },
  { value: "FAILED", label: "แปลงสาธิตเสียหาย/ยุติการติดตาม" },
] as const;
