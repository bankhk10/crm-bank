export * from "./types";

export * from "./features/list-view/customers-table";
export { default as CustomersListView } from "./features/list-view/customers-list-view";
export * from "./features/detail-view/customer-detail-panel";
export * from "./features/detail-view/parent-dealer-info";
export { default as CustomerDetailView } from "./features/detail-view/customer-detail-view";

export { default as CustomerNewView } from "./features/form/customer-new-view";
export { default as CustomerEditView } from "./features/form/customer-edit-view";

export * from "./ui/customer-status-badge";
export * from "./ui/customer-type-badge";
