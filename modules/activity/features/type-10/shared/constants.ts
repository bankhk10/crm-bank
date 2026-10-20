export const WORK_TYPE_CODE = "TYPE_10";
export const WORK_TYPE_NAME = "จัดงาน Field Day";

export const FARMER_FEEDBACK_OPTIONS = [
  { value: "สูง", label: "สูง (ผลตอบรับดีมาก/มีความสนใจซื้อสูง)" },
  { value: "กลาง", label: "กลาง (มีความสนใจปานกลาง/ต้องการดูผลเพิ่มเติม)" },
  { value: "ต่ำ", label: "ต่ำ (ผลตอบรับน้อย/เกษตรกรยังไม่มั่นใจ)" },
] as const;

export type FarmerFeedback = (typeof FARMER_FEEDBACK_OPTIONS)[number]["value"];
