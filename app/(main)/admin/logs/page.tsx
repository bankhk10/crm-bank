import { Suspense } from "react";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { redirect } from "next/navigation";
import LogViewerClient from "./log-viewer-client";

export const metadata = {
  title: "Log Viewer | Admin",
  description: "View system logs, audit trails, and security events",
};

export default async function LogViewerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check admin access - check for 'administrator' role (based on existing roles in the system)
  const isAdmin =
    session.user.roles?.includes("administrator") ||
    session.user.roles?.includes("admin") ||
    session.user.permissionKeys?.includes("logs.view");

  if (!isAdmin) {
    redirect("/sales");
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          📋 Log Viewer
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          ดู Audit Logs, Security Events และ Application Logs
        </p>
      </div>

      <Suspense fallback={<LogViewerSkeleton />}>
        <LogViewerClient />
      </Suspense>
    </div>
  );
}

function LogViewerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-24 rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>

      {/* Table */}
      <div className="h-96 rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

