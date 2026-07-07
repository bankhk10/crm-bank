import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/modules/layout";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { DEFAULT_AUTH_REDIRECT } from "@/modules/rbac";
import { getMyAnnouncementsAction } from "@/modules/login-announcements";

interface MainLayoutProps {
  children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(DEFAULT_AUTH_REDIRECT)}`);
  }

  const { user } = session;

  // Fetch active announcements for this user's roles (server-side, no client fetch needed)
  const announcements = await getMyAnnouncementsAction();

  return (
    <DashboardShell
      displayName={user.name ?? user.email ?? null}
      roles={user.roles ?? []}
      permissionKeys={user.permissionKeys ?? []}
      announcements={announcements}
    >
      {children}
    </DashboardShell>
  );
}
