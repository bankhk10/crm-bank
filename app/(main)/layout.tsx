import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/features/layout/navbar";
import Sidebar from "@/components/features/layout/sidebar";
import { auth } from "@/lib/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/rbac";

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
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col">
        <Navbar
          user={{
            id: user.id,
            name: user.name ?? null,
            email: user.email ?? null,
            role: user.role
          }}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
