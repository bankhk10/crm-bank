/**
 * RBAC Constants
 *
 * Access-level dropdown options and other RBAC-specific constants.
 */

import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/lib/db";

/**
 * Data access level options
 */
export const DATA_ACCESS_OPTIONS: { label: string; value: DataAccessLevel }[] =
  [
    { label: "เฉพาะฉัน", value: "VIEW_OWN" },
    { label: "ทีมเดียวกัน", value: "VIEW_TEAM" },
    { label: "แผนกเดียวกัน", value: "VIEW_DEPARTMENT" },
    { label: "ทั้งหมด", value: "VIEW_ALL" },
  ];

/**
 * Edit access level options
 */
export const EDIT_ACCESS_OPTIONS: { label: string; value: EditAccessLevel }[] =
  [
    { label: "ไม่สามารถแก้ไข", value: "EDIT_NONE" },
    { label: "เฉพาะของตัวเอง", value: "EDIT_OWN" },
    { label: "ทีมเดียวกัน", value: "EDIT_TEAM" },
    { label: "เฉพาะแผนกตัวเอง", value: "EDIT_DEPARTMENT" },
    { label: "แก้ไขได้ทั้งหมด", value: "EDIT_ALL" },
  ];

/**
 * Delete access level options
 */
export const DELETE_ACCESS_OPTIONS: {
  label: string;
  value: DeleteAccessLevel;
}[] = [
  { label: "ไม่สามารถลบ", value: "DELETE_NONE" },
  { label: "เฉพาะของตัวเอง", value: "DELETE_OWN" },
  { label: "ทีมเดียวกัน", value: "DELETE_TEAM" },
  { label: "เฉพาะแผนกตัวเอง", value: "DELETE_DEPARTMENT" },
  { label: "ลบได้ทั้งหมด", value: "DELETE_ALL" },
];

/**
 * Permission group name overrides for Thai display
 */
export const PERMISSION_GROUP_OVERRIDES: Record<string, string> = {
  rbac: "สิทธิ์การใช้งาน",
  crm: "CRM",
  sale: "การขาย",
  sales: "การขาย",
  product: "สินค้า",
  products: "สินค้า",
  customer: "ลูกค้า",
  customers: "ลูกค้า",
  employee: "พนักงาน",
  employees: "พนักงาน",
  company: "บริษัท",
  companies: "บริษัท",
  report: "รายงาน",
  reports: "รายงาน",
  notification: "การแจ้งเตือน",
  "shipping-company": "บริษัทขนส่ง",
  "shipping-companies": "บริษัทขนส่ง",
  sales_target: "ตั้งเป้าหมายยอดขาย",
  sales_targets: "ตั้งเป้าหมายยอดขาย",
  sales_forecast: "คาดการณ์ยอดขาย",
  fulfillment: "จัดการคำสั่งขาย",
  creditlimit: "จัดการวงเงินเครดิต",
  temporary_creditlimit: "วงเงินเครดิตชั่วคราว",
  "temporary creditlimit": "วงเงินเครดิตชั่วคราว",
  show_product: "หน้าแรก",
  dashboard: "แดชบอร์ด",
  export: "การส่งออกข้อมูล",
  exports: "การส่งออกข้อมูล",
};
