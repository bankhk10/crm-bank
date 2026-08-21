// Master 11 work types list
export const WORK_TYPES = [
  "เข้าพบร้านค้า / Key Farmer",
  "ติดตามผลการใช้สินค้า",
  "เสนอขายสินค้า",
  "วางบิล / เก็บเงิน",
  "สำรวจตลาดของคู่แข่ง",
  "แก้ปัญหา / รับเรื่องร้องเรียน",
  "ติดตามแปลงสาธิต / ทำแปลง",
  "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
  "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  "จัดงาน Field Day",
  "ตรวจเช็กสต็อกหน้าร้าน",
];

// Sample lists for dropdowns
export const DEMO_OWNERS = [
  "บริษัททดสอบ",
  "ร้านทดสอบ สาขา 1",
  "เกษตรกรตัวอย่าง 1",
  "ร้านสหายพานิช",
];

export const DEMO_PRODUCTS = [
  "สินค้าทดสอบ A",
  "สินค้าทดสอบ B",
  "สินค้าทดสอบ C",
  "ปุ๋ยเคมีสูตรพิเศษ",
];

export const DEMO_PRODUCT_PRICES: Record<string, number> = {
  "สินค้าทดสอบ A": 500,
  "สินค้าทดสอบ B": 750,
  "สินค้าทดสอบ C": 1200,
  ปุ๋ยเคมีสูตรพิเศษ: 950,
};

export const MARKETING_PRODUCT_CATEGORIES = [
  "Premium_item",
  "PP_Board",
  "Banner",
  "Leaflet",
  "อุปกรณ์จัดงาน",
  "อื่นๆ",
];

export const CROP_CATEGORIES = ["ผักและพืชล้มลุก", "พืชไร่", "พืชสวน"];

export const CROPS_BY_CATEGORY: Record<string, string[]> = {
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
    "มันสำปะหลัง",
    "ยางพารา",
    "อ้อย",
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

export const TARGET_CROPS = [
  "ทุเรียน",
  "ข้าว",
  "มันสำปะหลัง",
  "ยางพารา",
  "อ้อย",
  "ส้ม",
];

export const STORES_LIST = [
  "ร้านทดสอบ สาขา 1",
  "ร้านทดสอบ สาขา 2",
  "ร้านสหายพานิช จันทบุรี",
  "ร้านเกษตรพัฒนา",
];

export const REQUISITION_UNITS = [
  "ขวด",
  "ซอง",
  "แผ่น",
  "กล่อง",
  "ชิ้น",
  "ถุง",
  "ชุด",
  "ม้วน",
];

export const MARKETING_UNITS = [
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

export interface UserDemoPlotOption {
  id: string;
  code?: string;
  name: string;
  location: string;
  targetCrop: string;
  showcase: string;
  ownerName?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  productName?: string;
  areaRai?: number;
  treeCount?: number;
  startDate?: string;
  status?: string;
  visitsCount?: number;
  totalCost?: number;
  daysSinceStart?: number;
  objective?: string;
  experimentDetail?: string;
  latitude?: string;
  longitude?: string;
}

export const USER_DEMO_PLOTS: UserDemoPlotOption[] = [
  {
    id: "plot-1",
    name: "แปลงสาธิตสวนทุเรียน อ.แกลง (นายสมชาย)",
    location: "แปลงสาธิตสวนทุเรียน ต.วังหว้า อ.แกลง จ.ระยอง",
    targetCrop: "ทุเรียนหมอนทอง",
    showcase: "ปุ๋ยสูตรพรีเมียม A",
    ownerName: "นายสมชาย ใจดี",
    cropCategory: "พืชสวน",
    cropName: "ทุเรียน",
    productName: "สินค้าทดสอบ A",
    areaRai: 10,
    treeCount: 120,
    startDate: "2026-03-15",
  },
  {
    id: "plot-2",
    name: "แปลงสาธิตนาข้าว อ.บางเลน (ร้านเกษตรพัฒนา)",
    location: "แปลงสาธิตนาข้าว ต.บางเลน อ.บางเลน จ.นครปฐม",
    targetCrop: "ข้าวหอมมะลิ",
    showcase: "ฮอร์โมนเร่งรวง B",
    ownerName: "ร้านเกษตรพัฒนา (นายสมศักดิ์)",
    cropCategory: "พืชไร่",
    cropName: "ข้าว",
    productName: "สินค้าทดสอบ B",
    areaRai: 25,
    treeCount: 0,
    startDate: "2026-04-01",
  },
  {
    id: "plot-3",
    name: "แปลงสาธิตมันสำปะหลัง อ.ด่านขุนทด (ร้านสหายพานิช)",
    location: "แปลงสาธิต ต.ห้วยบง อ.ด่านขุนทด จ.นครราชสีมา",
    targetCrop: "มันสำปะหลัง",
    showcase: "ปุ๋ยชีวภาพเร่งหัว C",
    ownerName: "ร้านสหายพานิช",
    cropCategory: "พืชไร่",
    cropName: "มันสำปะหลัง",
    productName: "สินค้าทดสอบ C",
    areaRai: 15,
    treeCount: 0,
    startDate: "2026-02-10",
  },
  {
    id: "plot-4",
    name: "แปลงสาธิตสวนส้ม อ.ฝาง (เกษตรกรตัวอย่าง 1)",
    location: "แปลงสาธิต ต.เวียง อ.ฝาง จ.เชียงใหม่",
    targetCrop: "ส้มสายน้ำผึ้ง",
    showcase: "สารบำรุงใบพรีเมียม",
    ownerName: "เกษตรกรตัวอย่าง 1 (นายวิชัย)",
    cropCategory: "พืชสวน",
    cropName: "ส้ม",
    productName: "ปุ๋ยเคมีสูตรพิเศษ",
    areaRai: 8,
    treeCount: 150,
    startDate: "2026-01-20",
  },
];

/**
 * Helper to identify whether an ActivityPlanItem is a Type 10 (Field Day) item
 */
export function isFieldDayItem(item: any): boolean {
  if (!item) return false;
  if (item.itemType === "TYPE_10") return true;
  if (typeof item.meetingTopic === "string" && item.meetingTopic.includes("Field Day")) return true;
  const detailStr = String(item.detail || "");
  if (
    detailStr.includes("[Field Day]") ||
    detailStr.includes("Field Day") ||
    detailStr.includes("จัดงาน Field Day")
  ) {
    return true;
  }
  if (
    detailStr.includes("สินค้าโชว์:") ||
    (detailStr.includes("พืชเป้าหมาย:") && (detailStr.includes("เป้ายอดจอง:") || detailStr.includes("ผู้ร่วมงาน:")))
  ) {
    return true;
  }
  if (
    item.plotProductName &&
    item.plotCropName &&
    item.meetingAttendeesCount != null &&
    item.saleTotalPrice != null &&
    !item.saleQuantity &&
    !item.plotActivityType
  ) {
    return true;
  }
  return false;
}
