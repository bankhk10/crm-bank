/**
 * Constants specific to Type 1 (เข้าพบร้านค้า / Key Farmer)
 */

export const VISIT_TOPICS = [
  "แจ้งข่าวสาร",
  "อัปเดตข้อมูลลูกค้า",
  "เพิ่มข้อมูลเกษตรกร",
  "เลี้ยงรับรอง / สังสรรค์",
  "ให้คำแนะนำการใช้สินค้า",
  "อื่นๆ",
] as const;

export type VisitTopic = (typeof VISIT_TOPICS)[number] | string;
