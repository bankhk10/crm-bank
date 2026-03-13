/**
 * Companies Feature Module
 */

// Types
export * from "./types";
export * from "./types/types";

// Constants
export * from "./constants";

// Application Layer (Use Cases & Validations)
export * from "./application";

// UI Components
export * from "./ui/company-status-badge";
export * from "./ui/company-card";

// Features - List View
export * from "./features/list-view/companies-table";
export * from "./features/list-view/companies-cards";
export * from "./features/list-view/use-company-columns";
export { default as CompaniesListView } from "./features/list-view/companies-list-view";
export * from "./features/list-view/companies-kanban-board";

// Features - Detail View
export { default as CompanyDetailView } from "./features/detail-view/company-detail-view";

// Features - Form
export * from "./features/form/company-form-wrapper";
export * from "./features/form/company-form";
