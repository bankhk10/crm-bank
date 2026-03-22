/**
 * Shipping Companies Feature Module
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// Application Layer (Use Cases & Validations)
export * from "./application";

// UI Components
export * from "./ui/shipping-company-status-badge";

// Features - List View
export * from "./features/list-view/shipping-companies-table";
export * from "./features/list-view/use-shipping-company-columns";
export { default as ShippingCompaniesListView } from "./features/list-view/shipping-companies-list-view";

// Features - Detail View
export { ShippingCompanyDetailView } from "./features/detail-view/shipping-company-detail-view";
export { default as ShippingCompanyDetailPageView } from "./features/detail-view/shipping-company-detail-page-view";

// Features - Form
export { default as ShippingCompanyForm } from "./features/form/shipping-company-form";
export { ShippingCompanyNewView } from "./features/form/shipping-company-new-view";
export { ShippingCompanyEditView } from "./features/form/shipping-company-edit-view";
export { default as ShippingCompanyCreateView } from "./features/form/shipping-company-create-view";
export { default as ShippingCompanyEditPageView } from "./features/form/shipping-company-edit-page-view";
