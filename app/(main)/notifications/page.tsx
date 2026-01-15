"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  CheckCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    bgHover: string;
  }
> = {
  SUCCESS: {
    icon: CheckCircle2,
    gradient: "from-emerald-50 via-green-50 to-teal-50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
    iconColor: "text-white",
    accentColor: "text-emerald-700",
    borderColor: "border-l-emerald-500",
    bgHover: "hover:from-emerald-100 hover:via-green-100 hover:to-teal-100",
  },
  APPROVED: {
    icon: CheckCircle2,
    gradient: "from-emerald-50 via-green-50 to-teal-50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
    iconColor: "text-white",
    accentColor: "text-emerald-700",
    borderColor: "border-l-emerald-500",
    bgHover: "hover:from-emerald-100 hover:via-green-100 hover:to-teal-100",
  },
  ERROR: {
    icon: XCircle,
    gradient: "from-red-50 via-rose-50 to-pink-50",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "text-red-700",
    borderColor: "border-l-red-500",
    bgHover: "hover:from-red-100 hover:via-rose-100 hover:to-pink-100",
  },
  REJECTED: {
    icon: XCircle,
    gradient: "from-red-50 via-rose-50 to-pink-50",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "text-red-700",
    borderColor: "border-l-red-500",
    bgHover: "hover:from-red-100 hover:via-rose-100 hover:to-pink-100",
  },
  WARNING: {
    icon: AlertTriangle,
    gradient: "from-amber-50 via-yellow-50 to-orange-50",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    iconColor: "text-white",
    accentColor: "text-amber-700",
    borderColor: "border-l-amber-500",
    bgHover: "hover:from-amber-100 hover:via-yellow-100 hover:to-orange-100",
  },
  INFO: {
    icon: Info,
    gradient: "from-blue-50 via-sky-50 to-cyan-50",
    iconBg: "bg-gradient-to-br from-blue-500 to-sky-600",
    iconColor: "text-white",
    accentColor: "text-blue-700",
    borderColor: "border-l-blue-500",
    bgHover: "hover:from-blue-100 hover:via-sky-100 hover:to-cyan-100",
  },
};

const getNotificationConfig = (type: string) => {
  return notificationConfig[type] || notificationConfig["INFO"];
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
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
      router.push(targetLink);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = format(new Date(notification.createdAt), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดการแจ้งเตือน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    การแจ้งเตือน
                  </h1>
                  <p className="text-white/70 mt-1">
                    {unreadCount > 0
                      ? `${unreadCount} รายการยังไม่ได้อ่าน`
                      : "ไม่มีรายการใหม่"}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  อ่านทั้งหมด
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6">
              <Bell className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              ไม่มีการแจ้งเตือน
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              เมื่อมีการแจ้งเตือนใหม่ เช่น การอนุมัติรายการขาย
              หรือการเปลี่ยนแปลงสถานะต่างๆ จะปรากฏที่นี่
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <span className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-1.5 rounded-full">
                  {format(new Date(date), "d MMMM yyyy", { locale: th })}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>

              {/* Notifications for this date */}
              <div className="space-y-3">
                {groupedNotifications[date].map((notification) => {
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
                        relative w-full text-left rounded-xl p-5 
                        transition-all duration-300 ease-out
                        border-l-4 ${config.borderColor}
                        bg-gradient-to-r ${config.gradient} ${config.bgHover}
                        hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5
                        active:scale-[0.99]
                        ${
                          !notification.isRead
                            ? "ring-2 ring-indigo-200 ring-offset-2 shadow-md"
                            : "opacity-90 hover:opacity-100"
                        }
                        group cursor-pointer
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className={`
                          shrink-0 p-3 rounded-xl ${config.iconBg}
                          shadow-lg shadow-black/10
                          group-hover:scale-110 transition-transform duration-300
                        `}
                        >
                          <Icon className={`h-5 w-5 ${config.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`
                              text-base font-semibold
                              ${config.accentColor}
                              ${!notification.isRead ? "font-bold" : ""}
                            `}
                            >
                              {notification.title}
                            </span>
                            {!notification.isRead && (
                              <span className="shrink-0 h-3 w-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">
                                {formatDistanceToNow(
                                  new Date(notification.createdAt),
                                  {
                                    addSuffix: true,
                                    locale: th,
                                  }
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {showApprovalBadge && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-sm">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  พิจารณาอนุมัติ
                                </span>
                              )}

                              {targetLink && (
                                <ChevronRight
                                  className={`
                                  h-5 w-5 text-gray-400 
                                  group-hover:text-gray-600 group-hover:translate-x-1 
                                  transition-all duration-300
                                `}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
