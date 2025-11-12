"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export default function AuthSessionProvider({ children, session }: SessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
