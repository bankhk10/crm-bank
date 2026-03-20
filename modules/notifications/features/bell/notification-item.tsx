"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Clock, CheckCircle2, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "../../types";
import { getNotificationConfig } from "../../constants";
import { getNotificationLink } from "./utils";
import { usePermission } from "@/hooks/use-permission";

interface Props {
    notification: Notification;
    onRead: (id: string) => Promise<void> | void;
    onDelete: (id: string) => Promise<void> | void;
    onAction?: () => void;
}

export function NotificationItem({ notification, onRead, onDelete, onAction }: Props) {
    const router = useRouter();
    const { hasPermission } = usePermission();
    const canApproveSale = hasPermission("sale.approve");

    const config = getNotificationConfig(notification.type);
    const Icon = config.icon;
    const targetLink = getNotificationLink(notification, canApproveSale);
    const showApprovalBadge =
        canApproveSale &&
        targetLink?.includes("/approve") &&
        notification.link !== targetLink;

    const handleClick = async () => {
        if (!notification.isRead) {
            await onRead(notification.id);
        }
        if (targetLink) {
            onAction?.();
            router.push(targetLink);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการแจ้งเตือนนี้?")) return;
        await onDelete(notification.id);
    };

    return (
        <div
            className={`
        relative w-full text-left rounded-xl p-4 
        transition-all duration-300 ease-out
        border-l-4 ${config.borderColor}
        bg-gradient-to-r ${config.gradient}
        hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5
        ${!notification.isRead
                    ? "ring-2 ring-indigo-200 ring-offset-1"
                    : "opacity-90 hover:opacity-100"
                }
        group cursor-pointer
      `}
            onClick={handleClick}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div
                    className={`
          shrink-0 p-2 rounded-xl ${config.iconBg}
          shadow-lg shadow-black/10
          group-hover:scale-110 transition-transform duration-300
        `}
                >
                    <Icon className={`h-4 w-4 mt-6 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <span
                            className={`
              text-sm font-semibold line-clamp-1
              ${config.accentColor}
              ${!notification.isRead ? "font-bold" : ""}
            `}
                        >
                            {notification.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {!notification.isRead && (
                                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                        {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-medium">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                    locale: th,
                                })}
                            </span>
                        </div>

                        {showApprovalBadge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold rounded-full shadow-sm">
                                <CheckCircle2 className="h-3 w-3" />
                                พิจารณาอนุมัติ
                            </span>
                        )}

                        {targetLink && (
                            <ChevronRight
                                className={`
                h-4 w-4 text-gray-400 
                group-hover:text-gray-600 group-hover:translate-x-1 
                transition-all duration-300
              `}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
