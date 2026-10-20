export const WORK_TYPE_CODE = "TYPE_11";
export const WORK_TYPE_NAME = "ตรวจเช็คสต๊อกหน้าร้าน";

export const STOCK_STATUS_OPTIONS = [
  { value: "ปกติ", label: "ปกติ (มีสินค้าเพียงพอ)" },
  { value: "ใกล้หมด", label: "ใกล้หมด (ควรสั่งซื้อเพิ่ม)" },
  { value: "ขาดสต็อก", label: "ขาดสต็อก (สินค้าหมดชั้นวาง)" },
] as const;

export type StockStatus = (typeof STOCK_STATUS_OPTIONS)[number]["value"];

export const REORDER_OPPORTUNITY_OPTIONS = [
  { value: "สูง", label: "สูง (พร้อมสั่งซื้อทันที / สต็อกต่ำ)" },
  { value: "ยังไม่แน่ใจ", label: "ยังไม่แน่ใจ (รอดูรอบการสั่งซื้อ / สินค้าเหลือปานกลาง)" },
  { value: "ต่ำ", label: "ต่ำ (ยังไม่ต้องการสั่งซื้อ / สต็อกยังเต็ม)" },
] as const;

export type ReorderOpportunity = (typeof REORDER_OPPORTUNITY_OPTIONS)[number]["value"];
