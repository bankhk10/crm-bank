export const WORK_TYPE_CODE = "TYPE_13";
export const WORK_TYPE_NAME = "ฉีดแปลงแฮตแทค";

export const TYPE13_MAX_IMAGES_PER_VILLAGE = 20;

export const SPRAY_EQUIPMENT_OPTIONS = [
  { value: "เครื่องยนต์พ่นยา", label: "เครื่องยนต์พ่นยา" },
  { value: "โดรนพ่นยา", label: "โดรนพ่นยา" },
  { value: "เครื่องสะพายหลัง", label: "เครื่องสะพายหลัง" },
  { value: "ปั๊มลากสาย", label: "ปั๊มลากสาย" },
  { value: "อื่นๆ ระบุ", label: "อื่นๆ ระบุ" },
] as const;

export const PRODUCT_RESPONSE_OPTIONS = [
  { value: "ปกติ", label: "ปกติ" },
  { value: "ใบไหม้", label: "ใบไหม้" },
  { value: "ยอดหงิก", label: "ยอดหงิก" },
  { value: "ตกตะกอน", label: "ตกตะกอน" },
  { value: "ยาไม่ละลาย", label: "ยาไม่ละลาย" },
  { value: "อื่นๆ", label: "อื่นๆ" },
] as const;

export const EXTERNAL_CHEMICAL_FORMULAS = [
  "SL",
  "SC",
  "EC",
  "EW",
  "ZC",
  "OD",
  "WP",
  "WG",
  "อื่นๆ",
] as const;

export type ExternalChemicalFormula =
  (typeof EXTERNAL_CHEMICAL_FORMULAS)[number];

export const FORMULA_OPTIONS = EXTERNAL_CHEMICAL_FORMULAS.map((f) => ({
  value: f,
  label: f,
}));
