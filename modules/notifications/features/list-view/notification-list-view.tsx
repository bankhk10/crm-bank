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
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePermission } from "@/hooks/use-permission";
import { 
  getNotificationsAction, 
  markAsReadAction, 
  markAllAsReadAction,
  deleteNotificationAction,
} from "../../server/actions";

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

export default function NotificationListView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { hasPermission } = usePermission();

  // Check if user can approve sales (manager permission)
  const canApproveSale = hasPermission("sale.approve");

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsAction();
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for changes from other components (like Bell dropdown)
    const handleSync = () => {
      fetchNotifications();
    };
    window.addEventListener("notifications-changed", handleSync);

    return () => {
      window.removeEventListener("notifications-changed", handleSync);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const result = await markAsReadAction(id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsReadAction();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการแจ้งเตือนนี้?")) return;

    try {
      const result = await deleteNotificationAction(id);
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // Dispatch event to sync with bell dropdown
        window.dispatchEvent(new CustomEvent("notifications-changed"));
      }
    } catch (error) {
      console.error("Failed to delete notification", error);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">กำลังโหลดการแจ้งเตือน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient-x" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/40 blur-xl rounded-full scale-150 animate-pulse" />
                <div className="relative p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-xl">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                  การแจ้งเตือน
                </h1>
                <p className="text-white/80 mt-1.5 font-medium flex items-center gap-2">
                  {unreadCount > 0 ? (
                    <>
                      <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
                      {unreadCount} รายการยังไม่ได้อ่าน
                    </>
                  ) : (
                    "ไม่มีรายการใหม่ (เรียบร้อยแล้ว!)"
                  )}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                className="bg-white/10 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg group"
              >
                <CheckCheck className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                อ่านทั้งหมด
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150" />
              <div className="relative p-10 bg-gradient-to-br from-indigo-50 to-white rounded-[2.5rem] shadow-xl border border-indigo-100">
                <Bell className="h-16 w-16 text-indigo-300 animate-bounce" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mt-10 mb-3">
              ไม่มีการแจ้งเตือนในขณะนี้
            </h3>
            <p className="text-gray-500 text-center max-w-sm leading-relaxed">
              เมื่อมีการแจ้งเตือนใหม่ เช่น การอนุมัติรายการขาย 
              หรือการอัปเดตสำคัญ จะปรากฏขึ้นที่หน้าจอนี้ทันที
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-5">
              {/* Date Header */}
              <div className="flex items-center gap-5">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-100 to-transparent" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-50/50 px-5 py-2 rounded-full border border-indigo-100/50 backdrop-blur-sm">
                  {format(new Date(date), "d MMMM yyyy", { locale: th })}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-100 to-transparent" />
              </div>

              {/* Notifications for this date */}
              <div className="grid gap-4">
                {groupedNotifications[date].map((notification) => {
                  const config = getNotificationConfig(notification.type);
                  const Icon = config.icon;
                  const targetLink = getNavigationLink(notification);
                  const showApprovalBadge =
                    canApproveSale &&
                    targetLink?.includes("/approve") &&
                    notification.link !== targetLink;

                  return (
                    <div
                      key={notification.id}
                      className={`
                        relative w-full text-left rounded-2xl p-6 
                        transition-all duration-500 ease-in-out
                        border-l-8 ${config.borderColor}
                        bg-gradient-to-r ${config.gradient} ${config.bgHover}
                        hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1
                        ${
                          !notification.isRead
                            ? "ring-2 ring-indigo-200 ring-offset-2 shadow-xl bg-white"
                            : "opacity-80 hover:opacity-100 shadow-lg"
                        }
                        group overflow-hidden cursor-pointer
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Interactive Background Glow */}
                      <div className="absolute -right-20 -top-20 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                      
                      <div className="flex gap-6 relative z-10">
                        {/* Icon */}
                        <div
                          className={`
                          shrink-0 p-4 rounded-2xl ${config.iconBg}
                          shadow-2xl shadow-black/10 flex items-center justify-center
                          group-hover:rotate-6 transition-all duration-300
                        `}
                        >
                          <Icon className={`h-6 w-6 ${config.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-start justify-between gap-4">
                            <span
                              className={`
                              text-lg font-bold tracking-tight
                              ${config.accentColor}
                              ${!notification.isRead ? "text-indigo-900" : ""}
                            `}
                            >
                              {notification.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                onClick={(e) => handleDelete(e, notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-[15px] text-gray-600 mt-2 leading-relaxed font-medium">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-5">
                            <div className="flex items-center gap-2.5 text-gray-400 bg-black/5 px-3 py-1 rounded-lg">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs font-bold group-hover:text-gray-600 transition-colors">
                                {formatDistanceToNow(
                                  new Date(notification.createdAt),
                                  {
                                    addSuffix: true,
                                    locale: th,
                                  }
                                )
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {showApprovalBadge && (
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/30">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  พิจารณาอนุมัติ
                                </span>
                              )}

                              {targetLink && (
                                <div className="p-1.5 rounded-full bg-white/50 group-hover:bg-indigo-50 transition-colors border border-transparent group-hover:border-indigo-100">
                                  <ChevronRight
                                    className={`
                                    h-5 w-5 text-gray-400 
                                    group-hover:text-indigo-600 group-hover:translate-x-1 
                                    transition-all duration-300
                                  `}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
