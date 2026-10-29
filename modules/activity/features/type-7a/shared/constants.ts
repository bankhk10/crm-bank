/**
 * Constants for TYPE_7A: จัดทำแปลงสาธิต (Demo Plot Establishment)
 */

export const WORK_TYPE_CODE = "TYPE_7A";
export const WORK_TYPE_NAME = "จัดทำแปลงสาธิต";

export const CROP_CATEGORIES = ["ผักและพืชล้มลุก", "พืชไร่", "พืชสวน"] as const;

export const CROP_NAMES_BY_CATEGORY: Record<string, readonly string[]> = {
  ผักและพืชล้มลุก: [
    "คะน้า",
    "กะหล่ำปลี",
    "พริก",
    "มะเขือเทศ",
    "แตงกวา",
    "หอมแดง",
    "กระเทียม",
    "แตงโม",
    "ฟักทอง",
    "ผักและพืชล้มลุกอื่นๆ",
  ],
  พืชไร่: [
    "ข้าว",
    "อ้อย",
    "ยางพารา",
    "มันสำปะหลัง",
    "ข้าวโพด",
    "ปาล์มน้ำมัน",
    "ถั่วเหลือง",
    "พืชไร่อื่นๆ",
  ],
  พืชสวน: [
    "ทุเรียน",
    "ชมพู่",
    "มังคุด",
    "เงาะ",
    "ส้ม",
    "มะม่วง",
    "ลำไย",
    "มะพร้าว",
    "ลองกอง",
    "พืชสวนอื่นๆ",
  ],
};

export const OTHER_CROP_OPTIONS = [
  "ผักและพืชล้มลุกอื่นๆ",
  "พืชไร่อื่นๆ",
  "พืชสวนอื่นๆ",
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
  "คน + สายลาก",
  "เครื่องพ่นสะพายหลัง (เครื่องยนต์)",
  "เครื่องพ่นแบตเตอรี่",
  "โดรนเพื่อการเกษตร (Drone)",
  "แอร์บัส",
] as const;

export const DEMO_PLOT_STATUSES = [
  { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
  { value: "COMPLETED", label: "เสร็จสิ้นการสาธิต" },
  { value: "CANCELLED", label: "ยกเลิกแปลง" },
] as const;
