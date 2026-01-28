import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/features/layout/dashboard-shell";
import { auth } from "@/lib/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/src/core/rbac";

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
