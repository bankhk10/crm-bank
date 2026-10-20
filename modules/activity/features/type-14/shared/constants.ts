export const WORK_TYPE_CODE = "TYPE_14" as const;
export const WORK_TYPE_NAME = "ติดตามแปลงแฮทแทค" as const;

export const TYPE14_MAX_IMAGES_PER_VILLAGE = 20;

export const TRACKING_RESULT_OPTIONS = [
  { value: "ได้ผลดีมาก", label: "ได้ผลดีมาก (หนอน/แมลงตายสนิท คุมอยู่หมัด)" },
  { value: "ได้ผลตามเกณฑ์", label: "ได้ผลตามเกณฑ์ (ปริมาณแมลงลดลงอย่างเห็นได้ชัด)" },
  { value: "ต้องฉีดพ่นซ้ำ", label: "ต้องฉีดพ่นซ้ำ (ยังมีแมลงหลงเหลือ หรือมีการระบาดรอบใหม่)" },
  { value: "ไม่เห็นผล", label: "ไม่เห็นผล / ประสิทธิภาพต่ำกว่าคาดหมาย" },
] as const;

export const PRODUCT_RESPONSE_OPTIONS = [
  { value: "ปกติ", label: "ปกติ (พืชสมบูรณ์ ไม่มีอาการแพ้/ไหม้)" },
  { value: "พืชตอบสนองดี", label: "พืชตอบสนองดี (ใบเขียวเข้ม แตกยอดดี)" },
  { value: "พบอาการผิดปกติ", label: "พบอาการผิดปกติ (ใบไหม้/ชะงักการเจริญเติบโต)" },
] as const;

export const FORMULA_OPTIONS = [
  { value: "SL", label: "SL (Soluble Liquid)" },
  { value: "SC", label: "SC (Suspension Concentrate)" },
  { value: "EC", label: "EC (Emulsifiable Concentrate)" },
  { value: "EW", label: "EW (Emulsion, Oil in Water)" },
  { value: "ZC", label: "ZC (Mixed CS and SC)" },
  { value: "OD", label: "OD (Oil Dispersion)" },
  { value: "WP", label: "WP (Wettable Powder)" },
  { value: "WG", label: "WG (Water Dispersible Granule)" },
  { value: "OTHER", label: "อื่นๆ (ระบุเอง)" },
] as const;
