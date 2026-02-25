"use client";

import { useSession } from "next-auth/react";
import type { CurrentUser } from "@/types/user";

export function useCurrentUser(): CurrentUser | null {
  const { data } = useSession();
  const sessionUser = data?.user;

  if (!sessionUser) {
    return null;
  }

  return {
    id: sessionUser.id,
    name: sessionUser.name ?? "",
    email: sessionUser.email ?? "",
    roles: sessionUser.roles ?? [],
    departmentId: sessionUser.departmentId,
    positionId: sessionUser.positionId,
    permissionKeys: sessionUser.permissionKeys ?? [],
    dataAccessByResource: sessionUser.dataAccessByResource ?? {},
    editAccessByResource: sessionUser.editAccessByResource ?? {},
    deleteAccessByResource: sessionUser.deleteAccessByResource ?? {},
    employeeId: sessionUser.employeeId,
  };
}
