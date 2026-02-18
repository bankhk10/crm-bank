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
  buildEditAccessByResource,
  buildDeleteAccessByResource,
  isRoutePublic,
  isAuthorized,
  isAdministrator,
  isManager,
  getDefaultRouteForRoles,
  userHasPermission,
  getDataAccessForResource,
  getRolePermissionsPageData,
  getEditAccessForResource,
  getDeleteAccessForResource,
  hasAnyPermission,
  hasAllPermissions,
  canViewResource,
  canEditResource,
  canDeleteResource,
  checkResourceAccessScope,
} from "./rbac.service";

export * as RbacRepository from "./rbac.repository";

// Types
export * from "./rbac.types";
