"use client";

import { useMemo } from "react";
import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/lib/db";
import { useCurrentUser } from "./use-current-user";

interface AccessScopeCheck {
  userId: string;
  userDepartmentId?: string | null;
  resourceOwnerId?: string | null;
  resourceDepartmentId?: string | null;
}

interface PermissionHookResult {
  isLoading: boolean;
  allowed: boolean;
  roles: string[];
  hasPermission: (key: string) => boolean;
  dataAccess: (resource: string) => DataAccessLevel | null;
  editAccess: (resource: string) => EditAccessLevel | null;
  deleteAccess: (resource: string) => DeleteAccessLevel | null;
  canView: (
    resource: string,
    options: Omit<AccessScopeCheck, "userId" | "userDepartmentId">,
  ) => boolean;
  canEdit: (
    resource: string,
    options: Omit<AccessScopeCheck, "userId" | "userDepartmentId">,
  ) => boolean;
  canDelete: (
    resource: string,
    options: Omit<AccessScopeCheck, "userId" | "userDepartmentId">,
  ) => boolean;
}

export function usePermission(
  required?: string | string[],
): PermissionHookResult {
  const currentUser = useCurrentUser();
  const requirements = Array.isArray(required)
    ? required
    : required
      ? [required]
      : [];

  return useMemo(() => {
    if (!currentUser) {
      return {
        isLoading: true,
        allowed: requirements.length === 0,
        roles: [],
        hasPermission: () => false,
        dataAccess: () => null,
        editAccess: () => null,
        deleteAccess: () => null,
        canView: () => false,
        canEdit: () => false,
        canDelete: () => false,
      } satisfies PermissionHookResult;
    }

    const hasPermission = (key: string): boolean =>
      currentUser.permissionKeys?.includes(key) ?? false;
    const allowed = requirements.length
      ? requirements.every((key) => hasPermission(key))
      : true;

    const dataAccess = (resource: string): DataAccessLevel | null =>
      currentUser.dataAccessByResource[resource] ?? null;

    const editAccess = (resource: string): EditAccessLevel | null =>
      currentUser.editAccessByResource?.[resource] ?? null;

    const deleteAccess = (resource: string): DeleteAccessLevel | null =>
      currentUser.deleteAccessByResource?.[resource] ?? null;

    // Check if user can view a resource based on data access scope
    const canView = (
      resource: string,
      options: Omit<AccessScopeCheck, "userId" | "userDepartmentId">,
    ): boolean => {
      const access = dataAccess(resource);
      if (!access) return false;

      switch (access) {
        case "VIEW_ALL":
          return true;
        case "VIEW_DEPARTMENT":
        case "VIEW_TEAM":
          // VIEW_TEAM is enforced on server-side; client-side approximates like department
          return (
            currentUser.departmentId === options.resourceDepartmentId ||
            currentUser.id === options.resourceOwnerId
          );
        case "VIEW_OWN":
          return currentUser.id === options.resourceOwnerId;
        default:
          return false;
      }
    };

    // Check if user can edit a resource based on edit access scope
    const canEdit = (
      resource: string,
      options: Omit<AccessScopeCheck, "userId" | "userDepartmentId">,
    ): boolean => {
      const access = editAccess(resource);
      if (!access) return false;

      switch (access) {
        case "EDIT_ALL":
          return true;
        case "EDIT_DEPARTMENT":
        case "EDIT_TEAM":
          // EDIT_TEAM is enforced on server-side; client-side approximates like department
          return (
            currentUser.departmentId === options.resourceDepartmentId ||
            currentUser.id === options.resourceOwnerId
          );
        case "EDIT_OWN":
          return currentUser.id === options.resourceOwnerId;
        case "EDIT_NONE":
          return false;
        default:
          return false;
      }
    };

    // Check if user can delete a resource based on delete access scope
    const canDelete = (
      resource: string,
      options: Omit<AccessScopeCheck, "userId" | "userDepartmentId">,
    ): boolean => {
      const access = deleteAccess(resource);
      if (!access) return false;

      switch (access) {
        case "DELETE_ALL":
          return true;
        case "DELETE_DEPARTMENT":
        case "DELETE_TEAM":
          // DELETE_TEAM is enforced on server-side; client-side approximates like department
          return (
            currentUser.departmentId === options.resourceDepartmentId ||
            currentUser.id === options.resourceOwnerId
          );
        case "DELETE_OWN":
          return currentUser.id === options.resourceOwnerId;
        case "DELETE_NONE":
          return false;
        default:
          return false;
      }
    };

    return {
      isLoading: false,
      allowed,
      roles: currentUser.roles,
      hasPermission,
      dataAccess,
      editAccess,
      deleteAccess,
      canView,
      canEdit,
      canDelete,
    } satisfies PermissionHookResult;
  }, [currentUser, requirements]);
}
