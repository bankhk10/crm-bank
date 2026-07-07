/**
 * Layout Types
 * Type definitions for layout components
 */

import type { ReactNode } from "react";
import type { LoginAnnouncementItem } from "@/modules/login-announcements";

/**
 * Sidebar child navigation item
 */
export interface SidebarChildItem {
  href: string;
  label: string;
  permissionKey?: string;
  target?: string;
  children?: SidebarChildItem[];
}

/**
 * Sidebar main navigation item
 */
export interface SidebarNavItem {
  href: string;
  label: string;
  permissionKey?: string;
  icon?: ReactNode;
  target?: string;
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
  /** Active login announcements for this user's roles (fetched server-side) */
  announcements?: LoginAnnouncementItem[];
}

