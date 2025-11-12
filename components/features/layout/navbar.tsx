"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";

interface NavbarProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: Role;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const displayName = user?.name ?? user?.email ?? "Guest";
  const roleLabel = user?.role ?? "USER";

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <Link className="text-lg font-semibold text-blue-600" href="/dashboard/aggregateReport">
          MoveCRM
        </Link>
        <div className="hidden gap-3 text-sm text-slate-600 md:flex">
          <Link href="/dashboard/aggregateReport">Overview</Link>
          <Link href="/dashboard/salesReport">Sales</Link>
          <Link href="/dashboard/activityReport">Activity</Link>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="hidden flex-col text-right text-slate-600 sm:flex">
          <span className="font-medium text-slate-700">{displayName}</span>
          <span className="text-xs uppercase tracking-wide text-slate-400">{roleLabel}</span>
        </div>
        <button
          className="rounded border px-3 py-1 text-slate-600 transition hover:bg-slate-100"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
