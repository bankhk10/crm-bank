"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

type DashboardShellProps = {
  children: ReactNode;
  displayName?: string | null;
  role?: string;
};

export default function DashboardShell({
  children,
  displayName,
  role = "USER",
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex min-h-screen bg-[#b92626]">
      {/* Desktop Sidebar */}
      <Sidebar role={role as any} className="hidden md:block" />

      <div className="flex flex-1 flex-col">
        <div className="bg-[#b92626] text-white shrink-0">
          <Navbar
            user={{
              id: "",
              name: displayName ?? null,
              email: null,
              role: role as any,
            }}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 flex w-64 bg-[#b92626]">
              <Sidebar role={role as any} className="block md:hidden" />
            </div>
          </div>
        )}

        <main className="flex-1 min-h-0 overflow-hidden">
          <div className="bg-gray-100 min-h-full rounded-tl-3xl p-4 md:p-6">
            <div className="space-y-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
