import { WORK_TYPE_CONFIG } from "@/modules/activity-plans/constants";

/**
 * Supported Work Types for Unplanned Activity (Employee UI)
 * Strictly TYPE_1 to TYPE_11 and TYPE_13.
 * TYPE_12 (Tour) and TYPE_14 (HattackFollow) are NOT allowed and NEVER displayed.
 */
export const UNPLANNED_SUPPORTED_CODES = [
  "TYPE_1",
  "TYPE_2",
  "TYPE_3",
  "TYPE_4",
  "TYPE_5",
  "TYPE_6",
  "TYPE_7A",
  "TYPE_7B",
  "TYPE_8",
  "TYPE_9",
  "TYPE_10",
  "TYPE_11",
  "TYPE_13",
] as const;

export type UnplannedWorkTypeCode = (typeof UNPLANNED_SUPPORTED_CODES)[number];

export interface UnplannedWorkTypeItem {
  code: UnplannedWorkTypeCode;
  name: string;
  shortName: string;
  badgeClass: string;
  description: string;
}

export const UNPLANNED_WORK_TYPE_ITEMS: UnplannedWorkTypeItem[] = [
  {
    code: "TYPE_1",
    name: WORK_TYPE_CONFIG.TYPE_1.name, // "เข้าพบร้านค้า / Key Farmer"
    shortName: WORK_TYPE_CONFIG.TYPE_1.shortName,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    description: "บันทึกการเข้าพบ ให้คำแนะนำผลิตภัณฑ์ หรือเปิดโอกาสการขาย",
  },
  {
    code: "TYPE_2",
    name: WORK_TYPE_CONFIG.TYPE_2.name, // "ติดตามผลการใช้สินค้า"
    shortName: WORK_TYPE_CONFIG.TYPE_2.shortName,
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    description: "ติดตามผลการใช้ ประเมินความพึงพอใจ และการตอบสนองของพืช",
  },
  {
    code: "TYPE_3",
    name: WORK_TYPE_CONFIG.TYPE_3.name, // "เสนอขายสินค้า"
    shortName: WORK_TYPE_CONFIG.TYPE_3.shortName,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "บันทึกการเสนอขาย ปิดการขายจริง และยอดขายสินค้า",
  },
  {
    code: "TYPE_4",
    name: WORK_TYPE_CONFIG.TYPE_4.name, // "วางบิล / เก็บเงิน"
    shortName: WORK_TYPE_CONFIG.TYPE_4.shortName,
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "บันทึกการวางบิล รับชำระเงิน หรือส่งมอบเอกสารการเงิน",
  },
  {
    code: "TYPE_5",
    name: WORK_TYPE_CONFIG.TYPE_5.name, // "สำรวจตลาดของคู่แข่ง"
    shortName: WORK_TYPE_CONFIG.TYPE_5.shortName,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    description: "สำรวจราคา โปรโมชั่น และความเคลื่อนไหวสินค้าคู่แข่ง",
  },
  {
    code: "TYPE_6",
    name: WORK_TYPE_CONFIG.TYPE_6.name, // "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"
    shortName: WORK_TYPE_CONFIG.TYPE_6.shortName,
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    description: "บันทึกและตรวจสอบปัญหาคุณภาพสินค้า บรรจุภัณฑ์ หรือการใช้งาน",
  },
  {
    code: "TYPE_7A",
    name: WORK_TYPE_CONFIG.TYPE_7A.name, // "ทำแปลงสาธิต"
    shortName: WORK_TYPE_CONFIG.TYPE_7A.shortName,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    description: "บันทึกการจัดทำแปลงสาธิตใหม่ ผลิตภัณฑ์ และพิกัดแปลง",
  },
  {
    code: "TYPE_7B",
    name: WORK_TYPE_CONFIG.TYPE_7B.name, // "ติดตามแปลงสาธิต"
    shortName: WORK_TYPE_CONFIG.TYPE_7B.shortName,
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    description: "ติดตามผลการพ่นแปลงสาธิตเดิม การเจริญเติบโต และผลผลิต",
  },
  {
    code: "TYPE_8",
    name: WORK_TYPE_CONFIG.TYPE_8.name, // "จัดประชุม"
    shortName: WORK_TYPE_CONFIG.TYPE_8.shortName,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    description: "บันทึกผลการจัดประชุม อบรม และจำนวนผู้เข้าร่วมจริง",
  },
  {
    code: "TYPE_9",
    name: WORK_TYPE_CONFIG.TYPE_9.name, // "จัดกิจกรรมส่งเสริมการขายหน้าร้าน"
    shortName: WORK_TYPE_CONFIG.TYPE_9.shortName,
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "จัดกิจกรรมกระตุ้นยอดขายหน้าร้านค้าตัวแทนจำหน่าย",
  },
  {
    code: "TYPE_10",
    name: WORK_TYPE_CONFIG.TYPE_10.name, // "จัดงาน Field Day"
    shortName: WORK_TYPE_CONFIG.TYPE_10.shortName,
    badgeClass: "bg-lime-50 text-lime-800 border-lime-300",
    description: "จัดงานวันถ่ายทอดเทคโนโลยี แปลงสาธิตใหญ่ และบันทึกยอดจอง",
  },
  {
    code: "TYPE_11",
    name: WORK_TYPE_CONFIG.TYPE_11.name, // "ตรวจเช็กสต็อกหน้าร้าน"
    shortName: WORK_TYPE_CONFIG.TYPE_11.shortName,
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    description: "เช็กสต็อกคงเหลือหน้าร้าน วันหมดอายุ และโอกาสสั่งซื้อซ้ำ",
  },
  {
    code: "TYPE_13",
    name: WORK_TYPE_CONFIG.TYPE_13.name, // "ฉีดแปลงแฮตแทค"
    shortName: WORK_TYPE_CONFIG.TYPE_13.shortName,
    badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    description: "บันทึกการฉีดพ่นแปลงโครงการแฮตแทค พิกัด และรอบการพ่น",
  },
];
