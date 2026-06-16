"use client";

import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Bell, LogOut, Menu, User, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { NavbarProps } from "../types";

const NotificationBell = dynamic(
    () => import("@/modules/notifications").then((mod) => mod.NotificationBell),
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-3 pl-1 pr-2 hover:bg-white/10 rounded-full transition-colors focus-visible:ring-0 focus-visible:ring-offset-0">
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
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>บัญชีผู้ใช้</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/change-password" className="cursor-pointer flex w-full items-center">
                                <KeyRound className="mr-2 h-4 w-4" />
                                <span>เปลี่ยนรหัสผ่าน</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>ออกจากระบบ</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
}
