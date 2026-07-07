"use client";

import { useState } from "react";
import type { DashboardShellProps } from "../types";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import { SessionTimeoutWarning } from "../../auth/features/session-timeout-warning/session-timeout-warning";
import LoginAnnouncementPopup from "../../login-announcements/features/popup/login-announcement-popup";

export default function DashboardShell({
    children,
    displayName,
    roles,
    permissionKeys,
    announcements = [],
}: DashboardShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="fixed inset-0 flex min-h-screen overflow-hidden bg-[#b92626]">
            <SessionTimeoutWarning />

            {/* Post-login announcement popup slideshow */}
            <LoginAnnouncementPopup items={announcements} />

            {/* Desktop Sidebar */}
            <Sidebar
                permissionKeys={permissionKeys}
                roles={roles}
                className="hidden md:block"
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="bg-[#b92626] text-white shrink-0">
                    <Navbar
                        user={{
                            id: "",
                            name: displayName ?? null,
                            email: null,
                            roles,
                        }}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                </div>

                {/* Mobile sidebar overlay with slide-in transition */}
                <div
                    className={`fixed inset-0 z-50 md:hidden ${isSidebarOpen ? "" : "pointer-events-none"
                        }`}
                    role="dialog"
                    aria-modal
                >
                    {/* Backdrop: fades in/out */}
                    <div
                        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${isSidebarOpen
                            ? "opacity-40 pointer-events-auto"
                            : "opacity-0 pointer-events-none"
                            }`}
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden
                    />

                    {/* Sidebar panel: slides from left */}
                    <div
                        className={`absolute inset-y-0 left-0 w-64 transform bg-[#b92626] transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                            }`}
                    >
                        <Sidebar
                            permissionKeys={permissionKeys}
                            roles={roles}
                            className="block md:hidden"
                            onClose={() => setIsSidebarOpen(false)}
                        />
                    </div>
                </div>

                <main className="flex-1 min-h-0 bg-gray-100 rounded-tl-3xl flex flex-col">
                    <div className="flex-1 min-h-0 p-4 md:p-6 overflow-auto">
                        <div className="space-y-6">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}

