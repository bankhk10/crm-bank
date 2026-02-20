/**
 * Layout Types
 * Type definitions for layout components
 */

import type { ReactNode } from "react";

/**
 * Sidebar child navigation item
 */
export interface SidebarChildItem {
  href: string;
  label: string;
  permissionKey?: string;
  children?: SidebarChildItem[];
}

/**
 * Sidebar main navigation item
 */
export interface SidebarNavItem {
  href: string;
  label: string;
  permissionKey: string;
  icon?: ReactNode;
  children?: SidebarChildItem[];
}

/**
 * Sidebar props
 */
export interface SidebarProps {
  permissionKeys: string[];
  roles: string[];
  className?: string;
  onClose?: () => void;
}



/**
 * Navbar user type
 */
export interface NavbarUser {
  id: string;
  name: string | null;
  email: string | null;
  roles: string[];
}

/**
 * Navbar props
 */
export interface NavbarProps {
  user: NavbarUser | null;
  onMenuClick?: () => void;
}

/**
 * Dashboard shell props
 */
export interface DashboardShellProps {
  children: ReactNode;
  displayName?: string | null;
  roles: string[];
  permissionKeys: string[];
}
