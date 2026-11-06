export const WORK_TYPE_CODE = "TYPE_14" as const;
export const WORK_TYPE_NAME = "ติดตามแปลงแฮตแทค" as const;

export const TYPE14_MAX_IMAGES_PER_VILLAGE = 20;

export const TRACKING_RESULT_OPTIONS = [
  { value: "ได้ผลดีมาก", label: "ได้ผลดีมาก (หนอน/แมลงตายสนิท คุมอยู่หมัด)" },
  {
    value: "ได้ผลตามเกณฑ์",
    label: "ได้ผลตามเกณฑ์ (ปริมาณแมลงลดลงอย่างเห็นได้ชัด)",
  },
  {
    value: "ต้องฉีดพ่นซ้ำ",
    label: "ต้องฉีดพ่นซ้ำ (ยังมีแมลงหลงเหลือ หรือมีการระบาดรอบใหม่)",
  },
  { value: "ไม่เห็นผล", label: "ไม่เห็นผล / ประสิทธิภาพต่ำกว่าคาดหมาย" },
] as const;

export const PRODUCT_RESPONSE_OPTIONS = [
  { value: "ปกติ", label: "ปกติ (พืชสมบูรณ์ ไม่มีอาการแพ้/ไหม้)" },
  { value: "พืชตอบสนองดี", label: "พืชตอบสนองดี (ใบเขียวเข้ม แตกยอดดี)" },
  {
    value: "พบอาการผิดปกติ",
    label: "พบอาการผิดปกติ (ใบไหม้/ชะงักการเจริญเติบโต)",
  },
] as const;

export const FORMULA_OPTIONS = [
  { value: "SL", label: "SL" },
  { value: "SC", label: "SC" },
  { value: "EC", label: "EC" },
  { value: "EW", label: "EW" },
  { value: "ZC", label: "ZC" },
  { value: "OD", label: "OD" },
  { value: "WP", label: "WP" },
  { value: "WG", label: "WG" },
  { value: "OTHER", label: "อื่นๆ (ระบุเอง)" },
] as const;

export const HATTACK_PLOT_STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label: "ต้องติดตามต่อ" },
  { value: "COMPLETED", label: "ปิดแปลงแล้ว" },
] as const;
