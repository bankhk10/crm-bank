/**
 * Customer Constants
 * Centralized customer type definitions and labels
 */

import type { CustomerType, CustomerStatus } from "@prisma/client";

/**
 * Customer type labels in Thai
 */
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  DEALER: "ตัวแทนจำหน่าย",
  SUBDEALER: "ร้านค้าย่อย",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

/**
 * Customer status labels in Thai
 */
export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: "ใช้งาน",
  INACTIVE: "ไม่ใช้งาน",
  SUSPENDED: "ระงับชั่วคราว",
};

/**
 * Customer status styles for UI
 */
export const CUSTOMER_STATUS_STYLES: Record<
  CustomerStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "ใช้งาน",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-100",
  },
  INACTIVE: {
    label: "ไม่ใช้งาน",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-100",
  },
  SUSPENDED: {
    label: "ระงับชั่วคราว",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-100",
  },
};

/**
 * Customer type options for select inputs
 */
export const CUSTOMER_TYPE_OPTIONS = Object.entries(CUSTOMER_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as CustomerType,
    label,
  })
);

/**
 * Customer status options for select inputs
 */
export const CUSTOMER_STATUS_OPTIONS = Object.entries(
  CUSTOMER_STATUS_LABELS
).map(([value, label]) => ({
  value: value as CustomerStatus,
  label,
}));
