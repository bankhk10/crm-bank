"use client";

import { useSession } from "next-auth/react";
import type { CurrentUser } from "@/types/customer";

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
    role: sessionUser.role
  };
}
