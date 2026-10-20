/**
 * Constants for TYPE_7A: จัดทำแปลงสาธิต (Demo Plot Establishment)
 */

export const WORK_TYPE_CODE = "TYPE_7A";
export const WORK_TYPE_NAME = "จัดทำแปลงสาธิต";

export const CROP_CATEGORIES = [
  "พืชไร่ (ข้าว, ข้าวโพด, มันสำปะหลัง, อ้อย)",
  "ไม้ผล (ทุเรียน, มังคุด, ลำไย, ส้ม, มะม่วง)",
  "พืชผัก (พริก, มะเขือเทศ, กะหล่ำปลี, แตงกวา)",
  "ไม้ดอกไม้ประดับ",
  "พืชอื่นๆ",
] as const;

export const PLOT_OBJECTIVES = [
  "เปรียบเทียบประสิทธิภาพสินค้ากับสารเคมีคู่แข่ง",
  "ทดสอบประสิทธิภาพการป้องกันและกำจัดโรค/แมลง",
  "ทดสอบการเพิ่มผลผลิตและคุณภาพผลผลิต",
  "แปลงสาธิตเพื่อการจัดงาน Field Day",
  "อื่นๆ ระบุ",
] as const;

export const IRRIGATION_METHODS = [
  "น้ำฝนธรรมชาติ",
  "สปริงเกลอร์ (Sprinkler)",
  "น้ำหยด (Drip Irrigation)",
  "ปล่อยน้ำตามร่อง (Furrow)",
  "รดน้ำด้วยสายยาง/บัวรดน้ำ",
] as const;

export const SPRAY_METHODS = [
  "เครื่องพ่นปั๊มลากสาย",
  "เครื่องพ่นสะพายหลัง (เครื่องยนต์)",
  "เครื่องพ่นแบตเตอรี่",
  "โดรนเพื่อการเกษตร (Drone)",
  "แอร์บัส / รถพ่นยา",
] as const;

export const DEMO_PLOT_STATUSES = [
  { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
  { value: "COMPLETED", label: "เสร็จสิ้นการสาธิต" },
  { value: "CANCELLED", label: "ยกเลิกแปลง" },
] as const;
