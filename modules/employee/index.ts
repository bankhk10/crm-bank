/**
 * Employee Feature Module
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// Application Layer (Use Cases & Validations)
export * from "./application";

// UI Components
export * from "./ui/employee-status-badge";

// Features - List View
export * from "./features/list-view/use-employee-columns";
export { default as EmployeeListView } from "./features/list-view/employee-list-view";

// Features - Detail View
export { default as EmployeeDetailView } from "./features/detail-view/employee-detail-view";

// Features - Form
export { default as EmployeeNewView } from "./features/form/employee-new-view";
export { default as EmployeeEditView } from "./features/form/employee-edit-view";
export { default as EmployeeForm } from "./features/form/employee-form";
export { EmployeeFormWrapper } from "./features/form/employee-form-wrapper";
