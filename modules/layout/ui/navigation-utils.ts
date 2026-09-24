/**
 * Navigation Utilities
 * Helper functions for navigation filtering and route matching
 */

import type { SidebarChildItem, SidebarNavItem } from "../types";

/**
 * Filter child items based on permission keys (recursive)
 * If user has administrator role, bypass permission filtering.
 */
function filterChildItems(
  items: SidebarChildItem[],
  permissionKeys: string[],
  isSuperAdmin: boolean = false,
): SidebarChildItem[] {
  return items
    .filter((item) => {
      if (isSuperAdmin) return true;
      if (!item.permissionKey) return true;
      return permissionKeys.includes(item.permissionKey);
    })
    .map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterChildItems(item.children, permissionKeys, isSuperAdmin),
        };
      }
      return item;
    });
}

/**
 * Filter top-level navigation items based on permission keys
 * If user has administrator role, bypass permission filtering.
 */
export function filterNavItems(
  items: SidebarNavItem[],
  permissionKeys: string[],
  roles?: string[],
): SidebarNavItem[] {
  const isSuperAdmin = roles?.includes("administrator") ?? false;

  return items
    .filter((item) => {
      if (isSuperAdmin) return true;
      if (!item.permissionKey) return true;
      return permissionKeys.includes(item.permissionKey);
    })
    .map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterChildItems(item.children, permissionKeys, isSuperAdmin),
        };
      }
      return item;
    });
}

/**
 * Check if a route is active (exact or starts with for nested routes)
 */
export function isRouteActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("#")) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Check if any child of an item is active
 */
export function isChildActive(
  item: SidebarChildItem,
  pathname: string,
): boolean {
  if (isRouteActive(item.href, pathname)) return true;
  if (item.children) {
    return item.children.some((child) => isChildActive(child, pathname));
  }
  return false;
}
