/**
 * Type 6 Feature: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (Customer Complaint / Issue Resolution)
 * Shared Constants
 */

export const ISSUE_TYPES = [
  "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  "เกิดความเสียหายหลังการใช้สินค้า",
  "อื่นๆ ระบุ",
] as const;

export type IssueTypeValue = (typeof ISSUE_TYPES)[number];

export const ISSUE_TYPE_OPTIONS = ISSUE_TYPES.map((t) => ({
  value: t,
  label: t,
}));

export const PURCHASE_CHANNELS = [
  "ร้านค้าตัวแทนจำหน่าย",
  "ออนไลน์",
] as const;

export type PurchaseChannelValue = (typeof PURCHASE_CHANNELS)[number];

export const ISSUE_STATUSES = [
  "เสร็จสิ้น",
  "รอติดตาม",
] as const;

export type IssueStatusValue = (typeof ISSUE_STATUSES)[number];

export const ISSUE_ATTACHMENT_CATEGORY = "ISSUE";
