/**
 * Layout Module
 *
 * Provides the main application shell: sidebar navigation,
 * top navbar, and dashboard layout wrapper.
 */

// Types
export * from "./types";

// Constants
export { navigationItems } from "./constants";

// UI Utilities
export {
  filterNavItems,
  isRouteActive,
  isChildActive,
} from "./ui/navigation-utils";
export { useSidebar } from "./ui/use-sidebar";

// Features
export { default as DashboardShell } from "./features/dashboard-shell";
export { default as Navbar } from "./features/navbar";
export { default as Sidebar } from "./features/sidebar";
