/**
 * Type 8 Feature: จัดประชุม (Meeting)
 * Shared Constants
 */

export const WORK_TYPE_CODE = "TYPE_8" as const;
export const WORK_TYPE_NAME = "จัดประชุม" as const;
export const WORK_TYPE_PROMOTION_CODE = "TYPE_8_PROMOTION" as const;

export const MEETING_TARGET_OPTIONS = [
  { value: "FARMER", label: "เกษตรกร (Farmers)" },
  { value: "DEALER", label: "ร้านค้าตัวแทนจำหน่าย (Dealer)" },
  { value: "SUBDEALER", label: "ร้านค้าย่อย (Subdealer)" },
] as const;

export const FARMER_CHANNEL_OPTIONS = [
  { value: "DEALER", label: "ผ่านร้านค้าตัวแทนจำหน่าย (Dealer)" },
  { value: "SUBDEALER", label: "ผ่านร้านค้าย่อย (Subdealer)" },
] as const;

export const VENUE_TYPE_OPTIONS = [
  { value: "STORE", label: "ร้านค้า (Store Premises)" },
  { value: "OTHER", label: "สถานที่ภายนอก / อื่นๆ (Other Venue)" },
] as const;
