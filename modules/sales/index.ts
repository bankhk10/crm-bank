/**
 * Sales Feature Module
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// Application Layer (Use Cases & Validations)
export * from "./application";

// UI Components
export * from "./ui/sale-status-badge";

// Features - List View
export { default as SalesListView } from "./features/list-view/sales-list-view";
export * from "./features/list-view/sales-table";
export * from "./features/list-view/sales-cards";
export * from "./features/list-view/use-sale-columns";

// Features - Form
export { default as SaleNewView } from "./features/form/sale-new-view";
export { default as SaleEditView } from "./features/form/sale-edit-view";
export { default as SaleConfirmPaymentView } from "./features/form/sale-confirm-payment-view";
export * from "./features/form/sale-form";

// Features - Detail View
export * from "./features/detail-view/sale-detail-view";
export * from "./features/detail-view/sale-detail-mobile-view";

// Features - Approve View
export * from "./features/approve-view/sale-approve-view";
