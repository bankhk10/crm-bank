"use client";

import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Bell, Globe, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NavbarProps } from "../_types";

const NotificationBell = dynamic(
  () => import("@/components/features/notifications/notification-bell"),
  {
    ssr: false,
    loading: () => (
      <Button
        variant="ghost"
        className="p-2 rounded hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-white" />
      </Button>
    ),
  },
);

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const displayName = user?.name ?? user?.email ?? "Guest";

  const userInitial = useMemo(
    () => (displayName ? displayName.charAt(0).toUpperCase() : null),
    [displayName],
  );

  return (
    <nav className="flex items-center justify-between bg-[#b92626] px-4 py-3 md:px-6">
      {/* Left: mobile menu + brand */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="md:hidden p-2 rounded"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 text-sm">
        <NotificationBell />
        <div className="hidden sm:block h-6 w-px bg-white/20 mx-1" />

        <div className="flex items-center gap-3 pl-1">
          <div className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center ring-2 ring-white/10">
            {userInitial ? (
              <span className="font-semibold text-sm">{userInitial}</span>
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <span className="hidden sm:block font-medium text-white max-w-[150px] truncate">
            {displayName}
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="ml-2 p-2 text-white hover:text-white hover:bg-red-600 rounded-full transition-colors"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
}
