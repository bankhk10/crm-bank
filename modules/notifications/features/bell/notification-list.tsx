"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import type { Notification } from "../../types";
import { NotificationItem } from "./notification-item";

interface Props {
    notifications: Notification[];
    onRead: (id: string) => Promise<void> | void;
    onAction?: () => void;
}

export function NotificationList({ notifications, onRead, onAction }: Props) {
    return (
        <ScrollArea className="h-[360px]">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="p-4 bg-gray-100 rounded-2xl mb-4">
                        <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">ไม่มีการแจ้งเตือน</p>
                    <p className="text-gray-400 text-sm mt-1">
                        เมื่อมีการแจ้งเตือนใหม่จะปรากฏที่นี่
                    </p>
                </div>
            ) : (
                <div className="p-2 space-y-2">
                    {notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onRead={onRead}
                            onAction={onAction}
                        />
                    ))}
                </div>
            )}
        </ScrollArea>
    );
}
