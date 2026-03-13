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
export { default as SalesTargetsListView } from "./features/list-view/sales-targets-list-view";

// Features - Detail View
export { default as SalesTargetDetailView } from "./features/detail-view/sales-target-detail-view";

// Features - Form
export { SalesTargetForm } from "./features/form/sales-target-form";
export { default as SalesTargetCreateView } from "./features/form/sales-target-create-view";
export { default as SalesTargetEditView } from "./features/form/sales-target-edit-view";
export { default as SalesTargetCopyView } from "./features/form/sales-target-copy-view";
