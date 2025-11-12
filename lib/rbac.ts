import type { Role } from "@prisma/client";

interface AccessRule {
  pattern: RegExp;
  roles: Role[];
}

const DEFAULT_ROLES: Role[] = ["ADMIN", "MANAGER", "USER"];

const accessRules: AccessRule[] = [
  { pattern: /^\/companies\/new$/, roles: ["ADMIN"] },
  { pattern: /^\/companies(\/.*)?$/, roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/employee\/new$/, roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/employee(\/.*)?$/, roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/api\/companies(\/.*)?$/, roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/api\/employee(\/.*)?$/, roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard(\/.*)?$/, roles: DEFAULT_ROLES }
];

export const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth"];

export const DEFAULT_AUTH_REDIRECT = "/dashboard/aggregateReport";

export function getAllowedRoles(pathname: string): Role[] {
  const matchedRule = accessRules.find((rule) => rule.pattern.test(pathname));
  return matchedRule ? matchedRule.roles : DEFAULT_ROLES;
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

export function isAuthorized(role: Role, pathname: string): boolean {
  return getAllowedRoles(pathname).includes(role);
}

export function getDefaultRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
    case "MANAGER":
      return DEFAULT_AUTH_REDIRECT;
    default:
      return "/dashboard/activityReport";
  }
}
