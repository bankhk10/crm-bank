import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/modules/layout";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { DEFAULT_AUTH_REDIRECT } from "@/modules/rbac";

interface MainLayoutProps {
  children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(DEFAULT_AUTH_REDIRECT)}`);
  }

  const { user } = session;

  return (
    <DashboardShell
      displayName={user.name ?? user.email ?? null}
      roles={user.roles ?? []}
      permissionKeys={user.permissionKeys ?? []}
    >
      {children}
    </DashboardShell>
  );
}

