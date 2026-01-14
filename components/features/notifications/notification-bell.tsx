"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronRight,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "next/navigation";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePermission } from "@/hooks/use-permission";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Configuration for notification types - modern & vibrant colors
const notificationConfig: Record<
  string,
  {
    icon: typeof Info;
    gradient: string;
    iconBg: string;
    iconColor: string;
    accentColor: string;
    borderColor: string;
  }
> = {
  SUCCESS: {
    icon: CheckCircle2,
    gradient: "from-emerald-50 via-green-50 to-teal-50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
    iconColor: "text-white",
    accentColor: "text-emerald-700",
    borderColor: "border-l-emerald-500",
  },
  APPROVED: {
    icon: CheckCircle2,
    gradient: "from-emerald-50 via-green-50 to-teal-50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
    iconColor: "text-white",
    accentColor: "text-emerald-700",
    borderColor: "border-l-emerald-500",
  },
  ERROR: {
    icon: XCircle,
    gradient: "from-red-50 via-rose-50 to-pink-50",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "text-red-700",
    borderColor: "border-l-red-500",
  },
  REJECTED: {
    icon: XCircle,
    gradient: "from-red-50 via-rose-50 to-pink-50",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "text-red-700",
    borderColor: "border-l-red-500",
  },
  WARNING: {
    icon: AlertTriangle,
    gradient: "from-amber-50 via-yellow-50 to-orange-50",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    iconColor: "text-white",
    accentColor: "text-amber-700",
    borderColor: "border-l-amber-500",
  },
  INFO: {
    icon: Info,
    gradient: "from-blue-50 via-sky-50 to-cyan-50",
    iconBg: "bg-gradient-to-br from-blue-500 to-sky-600",
    iconColor: "text-white",
    accentColor: "text-blue-700",
    borderColor: "border-l-blue-500",
  },
};

const getNotificationConfig = (type: string) => {
  return notificationConfig[type] || notificationConfig["INFO"];
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { hasPermission } = usePermission();

  // Check if user can approve sales (manager permission)
  const canApproveSale = hasPermission("sale.approve");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getNavigationLink = (n: Notification): string | null => {
    // If manager with approve permission and notification is about sale pending approval
    // Navigate to approval page instead of detail page
    if (canApproveSale && n.link) {
      // Check if this is a sale-related notification that needs approval
      const saleMatch = n.link.match(/\/sales\/([^/]+)$/);
      if (saleMatch) {
        const saleId = saleMatch[1];
        // Check if notification indicates pending status (waiting for approval)
        const isPendingApproval =
          n.title.toLowerCase().includes("pending") ||
          n.title.includes("รออนุมัติ") ||
          n.message.toLowerCase().includes("pending") ||
          n.message.includes("รออนุมัติ") ||
          n.type === "WARNING";

        if (isPendingApproval) {
          return `/sales/${saleId}/approve`;
        }
      }
    }
    return n.link || null;
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }

    const targetLink = getNavigationLink(n);
    if (targetLink) {
      setIsOpen(false);
      router.push(targetLink);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
                  onClick={handleMarkAllAsRead}
                >
                  อ่านทั้งหมด
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notification List */}
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
              {notifications.map((notification) => {
                const config = getNotificationConfig(notification.type);
                const Icon = config.icon;
                const targetLink = getNavigationLink(notification);
                const showApprovalBadge =
                  canApproveSale &&
                  targetLink?.includes("/approve") &&
                  notification.link !== targetLink;

                return (
                  <button
                    key={notification.id}
                    className={`
                      relative w-full text-left rounded-xl p-4 
                      transition-all duration-300 ease-out
                      border-l-4 ${config.borderColor}
                      bg-gradient-to-r ${config.gradient}
                      hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5
                      active:scale-[0.98]
                      ${
                        !notification.isRead
                          ? "ring-2 ring-indigo-200 ring-offset-1"
                          : "opacity-90 hover:opacity-100"
                      }
                      group cursor-pointer
                    `}
                    onClick={() => handleNotificationClick(notification)}
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
                        <Icon className={`h-4 w-4 ${config.iconColor}`} />
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
                          {!notification.isRead && (
                            <span className="shrink-0 h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                          )}
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-medium">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                  locale: th,
                                }
                              )}
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
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

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
