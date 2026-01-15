/**
 * Customers Feature Module
 * Centralized exports for customers feature
 */

// Components
export * from "./components";

// Hooks
export * from "./hooks";

// Utils
export * from "./utils";

// Types
export * from "./types";

// Main Form Components
export { default as CustomerFormDealer } from "./customer-form-dealer";
export { default as CustomerFormSubdealer } from "./customer-form-subdealer";
export { default as CustomerFormFarmer } from "./customer-form-farmer";
export { default as CustomerFormBroker } from "./customer-form-broker";

// Table Component
export { CustomersTable } from "./customers-table";
