"use client";

import { signOut } from "next-auth/react";
import { useMemo } from "react";
import { Menu, Bell, Globe, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  onMenuClick: () => void;
  displayName?: string | null;
};

export default function Header({ onMenuClick, displayName }: HeaderProps) {
  const userInitial = useMemo(
    () => (displayName ? displayName.charAt(0).toUpperCase() : null),
    [displayName],
  );

  const handleLogout = () => {
    void signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="bg-transparent text-white px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="md:hidden p-2 rounded"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden sm:inline-flex items-center justify-center rounded p-2 bg-white/10 hover:bg-white/20"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-white" />
          </button>

          <button
            type="button"
            className="hidden sm:inline-flex items-center justify-center rounded p-2 bg-white/10 hover:bg-white/20"
            aria-label="Language"
          >
            <Globe className="h-5 w-5 text-white" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="items-center hidden sm:inline-flex rounded p-2 bg-white/10 hover:bg-white/20"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5 text-white" />
          </button>

          <div className="hidden sm:block h-6 w-px bg-white/20" />

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-white/20 text-white flex items-center justify-center">
              {userInitial ? <span className="font-semibold">{userInitial}</span> : <User className="h-4 w-4" />}
            </div>
            {displayName && (
              <div className="hidden xs:hidden sm:block font-semibold">{displayName}</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
