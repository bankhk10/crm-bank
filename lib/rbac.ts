import type {
  DataAccessLevel,
  Permission,
  PermissionType,
  RolePermission,
  UserPermissionOverride,
} from "@prisma/client";
import type { SessionPermission } from "@/types/next-auth";

interface RoutePermissionRule {
  pattern: RegExp;
  required: string[];
}

export const PUBLIC_PATHS = ["/", "/login", "/api/auth"];

export const DEFAULT_AUTH_REDIRECT = "/dashboard/employee";

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
  { pattern: /^\/employee\/new$/, required: ["employee.manage"] },
  { pattern: /^\/employee(\/.*)?$/, required: ["menu.employees"] },
  { pattern: /^\/api\/products(\/.*)?$/, required: ["product.create"] },
  { pattern: /^\/api\/employee(\/.*)?$/, required: ["employee.manage"] },
  { pattern: /^\/api\/companies(\/.*)?$/, required: ["menu.companies"] },
];

export type PermissionInput = RolePermission & {
  permission: Permission;
};

export type OverrideInput = UserPermissionOverride & {
  permission: Permission;
};

export function buildPermissionMap(
  rolePermissions: PermissionInput[],
  overrides: OverrideInput[]
): Record<string, SessionPermission> {
  const permissionMap: Record<string, SessionPermission> = {};

  for (const rolePermission of rolePermissions) {
    const current = permissionMap[rolePermission.permission.key];
    permissionMap[rolePermission.permission.key] = {
      key: rolePermission.permission.key,
      category: rolePermission.permission.category,
      menuPath: rolePermission.permission.menuPath,
      action: rolePermission.permission.action,
      resource: rolePermission.permission.resource,
      allow: rolePermission.allow || current?.allow || false,
      dataAccess:
        rolePermission.dataAccess ??
        current?.dataAccess ??
        rolePermission.permission.defaultDataAccess ??
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
    } satisfies SessionPermission;
  }

  return permissionMap;
}

export function buildDataAccessByResource(
  permissions: Record<string, SessionPermission>
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

export function isRoutePublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((route) =>
    route === "/api/auth"
      ? pathname.startsWith("/api/auth")
      : route === "/"
      ? pathname === "/"
      : pathname.startsWith(route)
  );
}

export function isAuthorized(
  pathname: string,
  permissionMap: Record<string, SessionPermission>
): boolean {
  const rule = routeRules.find((candidate) => candidate.pattern.test(pathname));
  if (!rule) {
    return true;
  }

  return rule.required.every((key) => permissionMap[key]?.allow);
}

// Helper to check for Administrator role type
export function isAdministrator(roles: string[]): boolean {
  return roles.some((role) => role === "administrator");
}

// Helper to check for Manager role type (e.g., sales_manager, manager)
export function isManager(roles: string[]): boolean {
  return roles.some((role) => role.toLowerCase().includes("manager"));
}

export function getDefaultRouteForRoles(roles: string[]): string {
  if (isAdministrator(roles)) {
    return "/dashboard/admin";
  }
  if (isManager(roles)) {
    return "/dashboard/manager";
  }
  return DEFAULT_AUTH_REDIRECT;
}

export function userHasPermission(
  permissionMap: Record<string, SessionPermission>,
  key: string
): boolean {
  return Boolean(permissionMap[key]?.allow);
}

export function getDataAccessForResource(
  permissionMap: Record<string, SessionPermission>,
  resource: string
): DataAccessLevel | null {
  const match = Object.values(permissionMap).find(
    (permission) =>
      permission.resource === resource && permission.category === "DATA"
  );
  return match?.dataAccess ?? null;
}
