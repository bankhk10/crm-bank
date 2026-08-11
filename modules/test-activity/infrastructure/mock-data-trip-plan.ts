// ===== Mock Data for Create Trip Plan Form =====

export interface EmployeeMock {
  id: string;
  name: string;
  position: string;
}

export interface StoreMock {
  id: string;
  name: string;
  province: string;
}

export interface ProductMock {
  id: string;
  name: string;
  category: string;
}

export interface PlotOwnerMock {
  id: string;
  name: string;
  province: string;
}

export interface CropTypeMock {
  id: string;
  name: string;
}

// ---- Activity Types ----
export const ACTIVITY_TYPES = [
  "ติดตามแปลงสาธิต / พืชป้าหมาย",
  "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  "เข้าหาร้านค้า / เกษตรกร",
  "ติดตามผลการใช้สินค้า",
  "เสนอขายสินค้า",
  "รวบรวม / เก็บเงิน",
  "สำรวจตลาดของคู่แข่ง",
  "แก้ปัญหา / รับเรื่องร้องเรียน",
  "ประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
  "จัดงาน Field Day",
  "ตรวจนักศึกษาฝึกหน้าร้าน",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// ---- Budget Types ----
export const BUDGET_TYPES = ["ไม่มีการเบิกงบ", "งบการตลาด", "งบส่งเสริมการขาย"] as const;

// ---- Employees ----
export const MOCK_EMPLOYEES: EmployeeMock[] = [
  { id: "E01", name: "นายวิทยา พันธุ์โชค", position: "ผู้รับผิดชอบ (เบส)" },
  { id: "E02", name: "น.ส.ภาภรรณ อนุดี", position: "ส่งเสริม" },
  { id: "E03", name: "นางสาวดีพร มาดี", position: "ส่งเสริม" },
  { id: "E04", name: "สมชาย ใจดี", position: "ผู้รับผิดชอบ" },
  { id: "E05", name: "สมหญิง รักดี", position: "ผู้รับผิดชอบ" },
  { id: "E06", name: "พิมพ์ใจ เรียนเก่ง", position: "ผู้รับผิดชอบ" },
];

// ---- Stores ----
export const MOCK_STORES: StoreMock[] = [
  { id: "S01", name: "ร้านทดสอบ สาขา 1", province: "ขอนแก่น" },
  { id: "S02", name: "ร้านเกษตรไทยรุ่งเรือง", province: "เชียงใหม่" },
  { id: "S03", name: "ร้านสมบูรณ์พูนสุข", province: "นครราชสีมา" },
  { id: "S04", name: "ร้านจิตรเจริญการเกษตร", province: "กรุงเทพฯ" },
  { id: "S05", name: "ร้านวิทยาเกษตร", province: "ขอนแก่น" },
  { id: "S06", name: "ร้านไทยเกษตร", province: "เชียงใหม่" },
];

// ---- Products ----
export const MOCK_PRODUCTS: ProductMock[] = [
  { id: "P01", name: "สินค้าทดสอบ", category: "ปุ๋ย" },
  { id: "P02", name: "สินค้าทดสอบ A", category: "ปุ๋ย" },
  { id: "P03", name: "สินค้าทดสอบ B", category: "ยาฆ่าแมลง" },
  { id: "P04", name: "ปุ๋ยสูตร X", category: "ปุ๋ย" },
  { id: "P05", name: "ปุ๋ยสูตร Y", category: "ปุ๋ย" },
  { id: "P06", name: "ยาสูตร A", category: "ยาฆ่าแมลง" },
  { id: "P07", name: "ปุ๋ยอินทรีย์ C", category: "ปุ๋ยอินทรีย์" },
];

// ---- Plot Owners ----
export const MOCK_PLOT_OWNERS: PlotOwnerMock[] = [
  { id: "PO01", name: "บริษัทดัดลอง", province: "ขอนแก่น" },
  { id: "PO02", name: "นายวิชัย มั่นคง", province: "เชียงใหม่" },
  { id: "PO03", name: "นายสมศักดิ์ ใจซื่อ", province: "นครราชสีมา" },
  { id: "PO04", name: "กลุ่มเกษตรกรโพนพิสัย", province: "นครราชสีมา" },
  { id: "PO05", name: "วิสาหกิจชุมชนเกษตรอินทรีย์", province: "เชียงใหม่" },
];

// ---- Crop Types ----
export const MOCK_CROP_TYPES: CropTypeMock[] = [
  { id: "C01", name: "ทุเรียน" },
  { id: "C02", name: "ข้าว" },
  { id: "C03", name: "ข้าวโพด" },
  { id: "C04", name: "มันสำปะหลัง" },
  { id: "C05", name: "อ้อย" },
  { id: "C06", name: "ส้ม" },
  { id: "C07", name: "ยางพารา" },
  { id: "C08", name: "พืชผัก" },
];

// ---- Units ----
export const MATERIAL_UNITS = ["ชิ้น", "กล่อง", "แผ่น", "ถุง", "กระสอบ", "ลัง", "ขวด", "แผ่นพับ"];

// ---- Material Items ----
export const MOCK_MATERIAL_CATEGORIES = ["สินค้าทดสอบ", "เอกสาร/สื่อ", "ของแจก/ของที่ระลึก", "อุปกรณ์จัดงาน"];

// Auto-generate plan number
export function generatePlanNumber(): string {
  const year = (new Date().getFullYear() + 543).toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const seq = Math.floor(Math.random() * 900) + 100;
  return `${year}${month}-${seq}`;
}
