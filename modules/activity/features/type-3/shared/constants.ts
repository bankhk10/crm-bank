/**
 * Constants for Type 3: เสนอขายสินค้า (Product Sales Proposal)
 */

export const NOT_CLOSED_REASONS = [
  "สต็อกเดิมยังมีอยู่เพียงพอ",
  "ราคาแพงกว่าคู่แข่ง",
  "รอตัดสินใจในรอบถัดไป",
  "สินค้ายังไม่ตรงกับช่วงฤดูกาลเพาะปลูก",
  "ติดปัญหาเครดิต / วงเงินไม่เพียงพอ",
  "ต้องการรายการโปรโมชั่น / ของแถมเพิ่มเติม",
  "ไม่มีสินค้าในขนาดบรรจุภัณฑ์ที่ต้องการ",
  "อื่นๆ",
] as const;

export type NotClosedReason = (typeof NOT_CLOSED_REASONS)[number];

export const SALE_STATUSES = [
  "ปิดการขายได้ทั้งหมด",
  "ปิดการขายได้บางส่วน",
  "ปิดการขายไม่ได้",
] as const;

export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SALE_STATUS_CONFIG: Record<
  SaleStatus,
  { label: string; badgeClass: string; textClass: string }
> = {
  "ปิดการขายได้ทั้งหมด": {
    label: "ปิดการขายได้ทั้งหมด",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    textClass: "text-emerald-700",
  },
  "ปิดการขายได้บางส่วน": {
    label: "ปิดการขายได้บางส่วน",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    textClass: "text-amber-700",
  },
  "ปิดการขายไม่ได้": {
    label: "ปิดการขายไม่ได้",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    textClass: "text-rose-700",
  },
};
