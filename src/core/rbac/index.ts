/**
 * RBAC Module
 * Exports RBAC services and types
 */

// Service
export {
  PUBLIC_PATHS,
  DEFAULT_AUTH_REDIRECT,
  buildPermissionMap,
  buildDataAccessByResource,
  isRoutePublic,
  isAuthorized,
  isAdministrator,
  isManager,
  getDefaultRouteForRoles,
  userHasPermission,
  getDataAccessForResource,
  hasAnyPermission,
  hasAllPermissions,
} from "./rbac.service";

// Types
export * from "./rbac.types";
