"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { Bell, Globe, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/features/layout/sidebar";

interface NavbarProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: Role;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = user?.name ?? user?.email ?? "Guest";
  const roleLabel: Role = user?.role ?? "USER";

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="md:hidden p-2 rounded"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link className="text-lg font-semibold text-blue-600" href="/dashboard/aggregateReport">
          MoveCRM
        </Link>
        <div className="hidden gap-3 text-sm text-slate-600 md:flex">
          <Link href="/dashboard/aggregateReport">Overview</Link>
          <Link href="/dashboard/salesReport">Sales</Link>
          <Link href="/dashboard/activityReport">Activity</Link>
        </div>
      </div>

      <div className="flex items-center gap-1 text-sm">
        <Button variant="ghost" className="hidden sm:inline-flex p-2 rounded" aria-label="Notifications">
          <Bell className="h-5 w-5 text-slate-600" />
        </Button>
        <Button variant="ghost" className="hidden sm:inline-flex p-2 rounded" aria-label="Language">
          <Globe className="h-5 w-5 text-slate-600" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-slate-600"
        >
          <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
        </Button>
        <div className="ml-2 hidden flex-col text-right text-slate-600 sm:flex">
          <span className="flex items-center justify-end gap-1 font-medium text-slate-700">
            <User className="h-4 w-4" /> {displayName}
          </span>
          <span className="text-xs uppercase tracking-wide text-slate-400">{roleLabel}</span>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-64 bg-[#b92626]">
            <Sidebar role={roleLabel} className="block md:hidden" />
          </div>
        </div>
      )}
    </nav>
  );
}
