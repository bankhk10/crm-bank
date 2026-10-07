/**
 * RBAC Service
 * Role-Based Access Control business logic
 */

import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/lib/db";
import type {
  SessionPermission,
  RoutePermissionRule,
  PermissionInput,
  OverrideInput,
  AccessScopeCheckOptions,
  AccessScopeCheckResult,
} from "../types/authorization";

/**
 * Public paths that don't require authentication
 */
export const PUBLIC_PATHS = ["/", "/login", "/api/auth"];

/**
 * Default redirect path after authentication
 */
export const DEFAULT_AUTH_REDIRECT = "/dashboard/employee";

/**
 * Route permission rules
 */
const routeRules: RoutePermissionRule[] = [
  {
    pattern: /^\/reports(\/aggregateReport|\/activityReport)?$/,
    required: ["menu.reports"],
  },
  { pattern: /^\/reports\/salesReport(\/.*)?$/, required: ["menu.sales"] },
  { pattern: /^\/dashboard\/products\/new$/, required: ["product.create"] },
  {
    pattern: /^\/dashboard\/products\/[^/]+\/edit$/,
    required: ["product.edit"],
  },
  { pattern: /^\/dashboard\/products(\/.*)?$/, required: ["menu.products"] },
  { pattern: /^\/companies(\/.*)?$/, required: ["menu.companies"] },
  { pattern: /^\/employee\/new$/, required: ["employee.create"] },
  { pattern: /^\/employee(\/.*)?$/, required: ["menu.employees"] },
  { pattern: /^\/api\/employee(\/.*)?$/, required: ["employee.view"] },
  { pattern: /^\/api\/companies(\/.*)?$/, required: ["menu.companies"] },
  { pattern: /^\/exports(\/.*)?$/, required: ["menu.exports"] },
];

/**
 * Data Access hierarchy rank: higher value = broader scope
 */
const DATA_ACCESS_HIERARCHY: Record<DataAccessLevel, number> = {
  VIEW_OWN: 1,
  VIEW_TEAM: 2,
  VIEW_DEPARTMENT: 3,
  VIEW_ALL: 4,
};

/**
 * Merge two DataAccessLevel values for the same resource, selecting the broadest scope
 */
export function mergeDataAccess(
  a?: DataAccessLevel | null,
  b?: DataAccessLevel | null,
): DataAccessLevel | null {
  if (!a) return b ?? null;
  if (!b) return a ?? null;
  return DATA_ACCESS_HIERARCHY[a] >= DATA_ACCESS_HIERARCHY[b] ? a : b;
}

/**
 * Build permission map from role permissions and overrides
 */
export function buildPermissionMap(
  rolePermissions: PermissionInput[],
  overrides: OverrideInput[],
): Record<string, SessionPermission> {
  const permissionMap: Record<string, SessionPermission> = {};

  for (const rolePermission of rolePermissions) {
    const current = permissionMap[rolePermission.permission.key];
    const incomingDataAccess =
      rolePermission.dataAccess ??
      rolePermission.permission.defaultDataAccess ??
      null;

    permissionMap[rolePermission.permission.key] = {
      key: rolePermission.permission.key,
      category: rolePermission.permission.category,
      menuPath: rolePermission.permission.menuPath,
      action: rolePermission.permission.action,
      resource: rolePermission.permission.resource,
      allow: rolePermission.allow || current?.allow || false,
      dataAccess: mergeDataAccess(current?.dataAccess, incomingDataAccess),
      editAccess:
        rolePermission.editAccess ??
        current?.editAccess ??
        rolePermission.permission.defaultEditAccess ??
        null,
      deleteAccess:
        rolePermission.deleteAccess ??
        current?.deleteAccess ??
        rolePermission.permission.defaultDeleteAccess ??
        null,
    } satisfies SessionPermission;
  }

  for (const override of overrides) {
    permissionMap[override.permission.key] = {
      key: override.permission.key,
      category: override.permission.category,
      menuPath: override.permission.menuPath,
      action: override.permission.action,
      resource: override.permission.resource,
      allow: override.allow,
      dataAccess:
        override.dataAccess ??
        permissionMap[override.permission.key]?.dataAccess ??
        override.permission.defaultDataAccess ??
        null,
      editAccess:
        override.editAccess ??
        permissionMap[override.permission.key]?.editAccess ??
        override.permission.defaultEditAccess ??
        null,
      deleteAccess:
        override.deleteAccess ??
        permissionMap[override.permission.key]?.deleteAccess ??
        override.permission.defaultDeleteAccess ??
        null,
    } satisfies SessionPermission;
  }

  return permissionMap;
}

/**
 * Build data access level map by resource
 */
export function buildDataAccessByResource(
  permissions: Record<string, SessionPermission>,
): Record<string, DataAccessLevel> {
  const map: Record<string, DataAccessLevel> = {};
  for (const permission of Object.values(permissions)) {
    if (
      permission.resource &&
      permission.category === "DATA" &&
      permission.dataAccess
    ) {
      map[permission.resource] = permission.dataAccess;
    }
  }
  return map;
}

/**
 * Build edit access level map by resource
 */
export function buildEditAccessByResource(
  permissions: Record<string, SessionPermission>,
): Record<string, EditAccessLevel> {
  const map: Record<string, EditAccessLevel> = {};
  for (const permission of Object.values(permissions)) {
    if (
      permission.resource &&
      permission.category === "DATA" &&
      permission.editAccess
    ) {
      map[permission.resource] = permission.editAccess;
    }
  }
  return map;
}

/**
 * Build delete access level map by resource
 */
export function buildDeleteAccessByResource(
  permissions: Record<string, SessionPermission>,
): Record<string, DeleteAccessLevel> {
  const map: Record<string, DeleteAccessLevel> = {};
  for (const permission of Object.values(permissions)) {
    if (
      permission.resource &&
      permission.category === "DATA" &&
      permission.deleteAccess
    ) {
      map[permission.resource] = permission.deleteAccess;
    }
  }
  return map;
}

/**
 * Check if a route is public (no authentication required)
 */
export function isRoutePublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((route) =>
    route === "/api/auth"
      ? pathname.startsWith("/api/auth")
      : route === "/"
        ? pathname === "/"
        : pathname.startsWith(route),
  );
}

/**
 * Check if user is authorized for a route
 */
export function isAuthorized(
  pathname: string,
  permissionKeys: string[],
): boolean {
  const rule = routeRules.find((candidate) => candidate.pattern.test(pathname));
  if (!rule) {
    return true;
  }

  return rule.required.every((key) => permissionKeys.includes(key));
}

/**
 * Check for Administrator role type
 */
export function isAdministrator(roles: string[]): boolean {
  return roles.some((role) => role === "administrator" || role === "ceo");
}

/**
 * Check for Manager role type
 */
export function isManager(roles: string[]): boolean {
  return roles.some((role) => role.toLowerCase().includes("manager"));
}

export function isCeo(roles: string[]): boolean {
  return roles.some((role) => role.toLowerCase().includes("ceo"));
}

/**
 * Get default route for user roles
 */
export function getDefaultRouteForRoles(roles: string[]): string {
  if (isAdministrator(roles)) {
    return "/dashboard/admin";
  }
  if (roles.some((role) => role === "admin" || role === "ceo")) {
    return "/dashboard/admin";
  }
  if (isManager(roles)) {
    return "/dashboard/manager";
  }
  if (
    roles.some(
      (role) =>
        role === "sales_promotion" || role === "sales_promotion_supervisor",
    )
  ) {
    return "/activity-plans";
  }
  return DEFAULT_AUTH_REDIRECT;
}

/**
 * Check if user has a specific permission
 */
export function userHasPermission(
  permissionMap: Record<string, SessionPermission>,
  key: string,
): boolean {
  return Boolean(permissionMap[key]?.allow);
}

/**
 * Get data access level for a resource
 */
export function getDataAccessForResource(
  permissionMap: Record<string, SessionPermission>,
  resource: string,
): DataAccessLevel | null {
  const match = Object.values(permissionMap).find(
    (permission) =>
      permission.resource === resource && permission.category === "DATA",
  );
  return match?.dataAccess ?? null;
}

/**
 * Get edit access level for a resource
 */
export function getEditAccessForResource(
  permissionMap: Record<string, SessionPermission>,
  resource: string,
): EditAccessLevel | null {
  const match = Object.values(permissionMap).find(
    (permission) =>
      permission.resource === resource && permission.category === "DATA",
  );
  return match?.editAccess ?? null;
}

/**
 * Get delete access level for a resource
 */
export function getDeleteAccessForResource(
  permissionMap: Record<string, SessionPermission>,
  resource: string,
): DeleteAccessLevel | null {
  const match = Object.values(permissionMap).find(
    (permission) =>
      permission.resource === resource && permission.category === "DATA",
  );
  return match?.deleteAccess ?? null;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  permissionMap: Record<string, SessionPermission>,
  keys: string[],
): boolean {
  return keys.some((key) => userHasPermission(permissionMap, key));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  permissionMap: Record<string, SessionPermission>,
  keys: string[],
): boolean {
  return keys.every((key) => userHasPermission(permissionMap, key));
}

/**
 * Check if user can view a resource based on data access scope
 */
export function canViewResource(
  dataAccess: DataAccessLevel | null,
  options: AccessScopeCheckOptions,
): boolean {
  if (!dataAccess) return false;

  switch (dataAccess) {
    case "VIEW_ALL":
      return true;
    case "VIEW_TEAM":
    case "VIEW_DEPARTMENT":
      return (
        options.userDepartmentId === options.resourceDepartmentId ||
        options.userId === options.resourceOwnerId
      );
    case "VIEW_OWN":
      return options.userId === options.resourceOwnerId;
    default:
      return false;
  }
}

/**
 * Check if user can edit a resource based on edit access scope
 */
export function canEditResource(
  editAccess: EditAccessLevel | null,
  options: AccessScopeCheckOptions,
): boolean {
  if (!editAccess) return false;

  switch (editAccess) {
    case "EDIT_ALL":
      return true;
    case "EDIT_TEAM":
    case "EDIT_DEPARTMENT":
      return (
        options.userDepartmentId === options.resourceDepartmentId ||
        options.userId === options.resourceOwnerId
      );
    case "EDIT_OWN":
      return options.userId === options.resourceOwnerId;
    case "EDIT_NONE":
      return false;
    default:
      return false;
  }
}

/**
 * Check if user can delete a resource based on delete access scope
 */
export function canDeleteResource(
  deleteAccess: DeleteAccessLevel | null,
  options: AccessScopeCheckOptions,
): boolean {
  if (!deleteAccess) return false;

  switch (deleteAccess) {
    case "DELETE_ALL":
      return true;
    case "DELETE_TEAM":
    case "DELETE_DEPARTMENT":
      return (
        options.userDepartmentId === options.resourceDepartmentId ||
        options.userId === options.resourceOwnerId
      );
    case "DELETE_OWN":
      return options.userId === options.resourceOwnerId;
    case "DELETE_NONE":
      return false;
    default:
      return false;
  }
}

/**
 * Get full access scope check result for a resource
 */
export function checkResourceAccessScope(
  permissionMap: Record<string, SessionPermission>,
  resource: string,
  options: AccessScopeCheckOptions,
): AccessScopeCheckResult {
  const dataAccess = getDataAccessForResource(permissionMap, resource);
  const editAccess = getEditAccessForResource(permissionMap, resource);
  const deleteAccess = getDeleteAccessForResource(permissionMap, resource);

  return {
    canView: canViewResource(dataAccess, options),
    canEdit: canEditResource(editAccess, options),
    canDelete: canDeleteResource(deleteAccess, options),
    viewScope: dataAccess,
    editScope: editAccess,
    deleteScope: deleteAccess,
  };
}
