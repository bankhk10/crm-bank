"use client";

import { useMemo } from "react";
import type { DataAccessLevel } from "@prisma/client";
import { useCurrentUser } from "./use-current-user";

interface PermissionHookResult {
  isLoading: boolean;
  allowed: boolean;
  roles: string[];
  hasPermission: (key: string) => boolean;
  dataAccess: (resource: string) => DataAccessLevel | null;
}

export function usePermission(required?: string | string[]): PermissionHookResult {
  const currentUser = useCurrentUser();
  const requirements = Array.isArray(required) ? required : required ? [required] : [];

  return useMemo(() => {
    if (!currentUser) {
      return {
        isLoading: true,
        allowed: requirements.length === 0,
        roles: [],
        hasPermission: () => false,
        dataAccess: () => null
      } satisfies PermissionHookResult;
    }

    const hasPermission = (key: string): boolean => Boolean(currentUser.permissions[key]?.allow);
    const allowed = requirements.length
      ? requirements.every((key) => hasPermission(key))
      : true;

    const dataAccess = (resource: string): DataAccessLevel | null =>
      currentUser.dataAccessByResource[resource] ?? null;

    return {
      isLoading: false,
      allowed,
      roles: currentUser.roles,
      hasPermission,
      dataAccess
    } satisfies PermissionHookResult;
  }, [currentUser, requirements]);
}
