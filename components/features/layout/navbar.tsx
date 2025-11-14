"use client";

import { signOut } from "next-auth/react";
import { Bell, Globe, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    roles: string[];
  } | null;
  onMenuClick?: () => void;
}

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const displayName = user?.name ?? user?.email ?? "Guest";

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
      <div className="flex items-center gap-1 text-sm">
        <Button
          variant="ghost"
          className="hidden sm:inline-flex p-2 rounded hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-white" />
        </Button>
        <Button
          variant="ghost"
          className="hidden sm:inline-flex p-2 rounded hover:bg-white/10"
          aria-label="Language"
        >
          <Globe className="h-5 w-5 text-white" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-white hover:bg-white/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
        </Button>
        <div className="ml-2 pl-2 border-l border-white/30 hidden flex-col text-right text-white sm:flex">
          <span className="flex items-center justify-end gap-1 font-medium text-white">
            <User className="h-4 w-4" /> {displayName}
          </span>
        </div>
      </div>
    </nav>
  );
}
