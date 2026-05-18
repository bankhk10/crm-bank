import { DateRangeFilter } from "./types";
import { startOfDay, endOfDay, parseISO } from "date-fns";
// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────
export const formatTHB = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatNumber = (num: number) =>
  new Intl.NumberFormat("th-TH").format(num);

export const formatShortTHB = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getDateRange(filter: DateRangeFilter) {
  const start = startOfDay(parseISO(filter.startDate));
  const end = endOfDay(parseISO(filter.endDate));
  return { start, end };
}

export function getDayOfWeekThai(dayIndex: number): string {
  const days = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  return days[dayIndex];
}

export function getQuarterLabel(quarter: number): string {
  return `ไตรมาส ${quarter}`;
}

const regionMapping: Record<string, string[]> = {
  ภาคเหนือ: [
    "เชียงใหม่",
    "เชียงราย",
    "ลำปาง",
    "ลำพูน",
    "แม่ฮ่องสอน",
    "น่าน",
    "พะเยา",
    "แพร่",
    "อุตรดิตถ์",
    "ตาก",
    "สุโขทัย",
    "พิษณุโลก",
    "พิจิตร",
    "กำแพงเพชร",
    "เพชรบูรณ์",
    "นครสวรรค์",
    "อุทัยธานี",
  ],
  ภาคอีสาน: [
    "ขอนแก่น",
    "อุดรธานี",
    "นครราชสีมา",
    "อุบลราชธานี",
    "ร้อยเอ็ด",
    "มหาสารคาม",
    "สกลนคร",
    "นครพนม",
    "กาฬสินธุ์",
    "หนองคาย",
    "หนองบัวลำภู",
    "เลย",
    "ชัยภูมิ",
    "บุรีรัมย์",
    "สุรินทร์",
    "ศรีสะเกษ",
    "ยโสธร",
    "อำนาจเจริญ",
    "มุกดาหาร",
    "บึงกาฬ",
  ],
  ภาคตะวันออก: [
    "ชลบุรี",
    "จันทบุรี",
    "ตราด",
    "ฉะเชิงเทรา",
    "ปราจีนบุรี",
    "สระแก้ว",
  ],
  ภาคตะวันตก: [
    "ราชบุรี",
    "กาญจนบุรี",
    "สุพรรณบุรี",
    "นครปฐม",
    "สมุทรสาคร",
    "สมุทรสงคราม",
    "เพชรบุรี",
    "ประจวบคีรีขันธ์",
  ],
  ภาคกลาง: [
    "กรุงเทพมหานคร",
    "นนทบุรี",
    "ปทุมธานี",
    "สมุทรปราการ",
    "พระนครศรีอยุธยา",
    "อ่างทอง",
    "ลพบุรี",
    "สิงห์บุรี",
    "ชัยนาท",
    "สระบุรี",
    "นครนายก",
  ],
  ภาคใต้: [
    "นครศรีธรรมราช",
    "กระบี่",
    "พังงา",
    "ภูเก็ต",
    "สุราษฎร์ธานี",
    "ระนอง",
    "ชุมพร",
    "สงขลา",
    "สตูล",
    "ตรัง",
    "พัทลุง",
    "ปัตตานี",
    "ยะลา",
    "นราธิวาส",
    "ระยอง",
  ],
};

export function getRegionFromProvince(province: string | null): string {
  if (!province) return "ไม่ระบุ";
  for (const [region, provinces] of Object.entries(regionMapping)) {
    if (provinces.some((p) => province.includes(p) || p.includes(province))) {
      return region;
    }
  }
  return "อื่นๆ";
}
