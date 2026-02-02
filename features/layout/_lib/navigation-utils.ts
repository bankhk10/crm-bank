/**
 * Navigation Utilities
 * Helper functions for navigation filtering and route matching
 */

import type { SidebarChildItem } from "../_types";

/**
 * Recursive helper to filter navigation items based on permission keys
 */
export function filterNavItems<T extends { permissionKey?: string; children?: T[] }>(
  items: T[],
  permissionKeys: string[]
): T[] {
  return items
    .filter((item) => {
      if (!item.permissionKey) return true;
      return permissionKeys.includes(item.permissionKey);
    })
    .map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterNavItems(item.children, permissionKeys),
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
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Check if any child of an item is active
 */
export function isChildActive(
  item: SidebarChildItem,
  pathname: string
): boolean {
  if (isRouteActive(item.href, pathname)) return true;
  if (item.children) {
    return item.children.some((child) => isChildActive(child, pathname));
  }
  return false;
}
