"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * Returns true ONLY if the currently authenticated user has the `administrator` role.
 * Enforces the strict requirement that testing buttons and hydration inspector panels
 * are exclusively visible to administrators.
 */
export function useIsAdminTester(): {
  isAdminTester: boolean;
  isLoading: boolean;
} {
  const { data: session, status } = useSession();
  const user = useCurrentUser();

  const isAdminTester = useMemo(() => {
    const sessionUser: any = session?.user;
    const sessionRoles: string[] = Array.isArray(sessionUser?.roles)
      ? sessionUser.roles
      : [];
    const currentUserRoles: string[] = Array.isArray(user?.roles)
      ? user.roles
      : [];

    const hasAdminInSessionRoles = sessionRoles.some(
      (r) => String(r).toLowerCase() === "administrator",
    );
    const hasAdminInCurrentUserRoles = currentUserRoles.some(
      (r) => String(r).toLowerCase() === "administrator",
    );
    const hasAdminRoleProp =
      String(sessionUser?.role || "").toLowerCase() === "administrator" ||
      String((user as any)?.role || "").toLowerCase() === "administrator";

    return (
      hasAdminInSessionRoles ||
      hasAdminInCurrentUserRoles ||
      hasAdminRoleProp
    );
  }, [session?.user, user]);

  return {
    isAdminTester,
    isLoading: status === "loading",
  };
}
