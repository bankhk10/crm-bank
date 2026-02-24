"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Sparkles, ChevronRight } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "./use-notifications";
import { NotificationList } from "./notification-list";

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead } =
        useNotifications();

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-pulse">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                            <span className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 animate-ping opacity-75" />
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-96 p-0 border-0 shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl"
                align="end"
                sideOffset={8}
            >
                {/* Header with gradient */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-90" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                    <div className="relative p-5 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">การแจ้งเตือน</h4>
                                    <p className="text-white/70 text-xs mt-0.5">
                                        {unreadCount > 0
                                            ? `${unreadCount} รายการยังไม่ได้อ่าน`
                                            : "ไม่มีรายการใหม่"}
                                    </p>
                                </div>
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto px-3 py-1.5 text-xs text-white/90 hover:text-white hover:bg-white/20 rounded-lg font-medium transition-all"
                                    onClick={markAllAsRead}
                                >
                                    อ่านทั้งหมด
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notification List */}
                <NotificationList
                    notifications={notifications}
                    onRead={markAsRead}
                    onAction={() => setIsOpen(false)}
                />

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                        <Button
                            variant="ghost"
                            className="w-full h-9 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-all"
                            onClick={() => {
                                setIsOpen(false);
                                router.push("/notifications");
                            }}
                        >
                            ดูทั้งหมด
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
