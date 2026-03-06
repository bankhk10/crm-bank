/**
 * Sales Targets Feature Module
 *
 * This is the main barrel export file for the sales-targets feature.
 * Import everything from this file when working with sales-targets.
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// Application Layer – DO NOT re-export here.
// Application imports infrastructure (Prisma) which is server-only.
// Server code should import directly: import { ... } from "@/modules/sales-targets/application";
// Only re-export client-safe validations:
export {
  salesTargetSchema,
  salesTargetItemSchema,
  salesTargetStoreSchema,
  type SalesTargetFormValues,
  type SalesTargetStoreValues,
  type SalesTargetItemValues,
} from "./application/validations";

// Features - List View
export { SalesTargetTable } from "./features/list-view/sales-target-table";
export { SalesTargetFilters } from "./features/list-view/sales-target-filters";

// Features - Detail View
export { SalesTargetDetailDialog } from "./features/detail-view/sales-target-detail-dialog";

// Features - Form
export { SalesTargetForm } from "./features/form/sales-target-form";
