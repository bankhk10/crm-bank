/**
 * RBAC Module – Barrel Exports
 *
 * Re-exports everything that outside modules need.
 */

// ─── Types ───
export type {
  RBACSummaryResponse,
  RoleWithPermissions,
  RolePermissionEditorProps,
  APIMessage,
} from "./types";

export * from "./types/authorization";

// ─── Constants ───
export {
  DATA_ACCESS_OPTIONS,
  EDIT_ACCESS_OPTIONS,
  DELETE_ACCESS_OPTIONS,
  PERMISSION_GROUP_OVERRIDES,
} from "./constants";

// ─── Application (Use Cases + Validations) ───
export {
  getRBACSummaryUseCase,
  getRBACCatalogUseCase,
  listRolesUseCase,
  getRoleDetailUseCase,
  createRoleUseCase,
  updateRoleUseCase,
  deleteRoleUseCase,
  listPermissionsUseCase,
  createPermissionUseCase,
  updatePermissionUseCase,
  deletePermissionUseCase,
  listDepartmentsUseCase,
  createDepartmentUseCase,
  updateDepartmentUseCase,
  deleteDepartmentUseCase,
  listPositionsUseCase,
  createPositionUseCase,
  updatePositionUseCase,
  deletePositionUseCase,
  updateRolePermissionsUseCase,
  updateUserRolesUseCase,
  updateUserOverridesUseCase,
  roleSchema,
  roleUpdateSchema,
  permissionSchema,
  permissionUpdateSchema,
  departmentSchema,
  departmentUpdateSchema,
  positionSchema,
  positionUpdateSchema,
  rolePermissionsPayloadSchema,
  userRolesPayloadSchema,
  userOverridesPayloadSchema,
  type RoleFormData,
  type PermissionFormData,
  type DepartmentFormData,
  type PositionFormData,
} from "./application";

export * from "./application/authorization";

// ─── Features (UI Screens) ───
export { default as RBACConsole } from "./features/list-view/rbac-console";
export { default as RolePermissionEditor } from "./features/detail-view/role-permission-editor";
