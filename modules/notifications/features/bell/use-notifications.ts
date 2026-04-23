"use client";

import { useState, useEffect, useCallback } from "react";
import type { Notification } from "../../types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, []);

  useEffect(() => {
    // Run asynchronously to fix "Calling setState synchronously within an effect" warning
    let isMounted = true;
    const initFetch = async () => {
      if (isMounted) await fetchNotifications();
    };
    initFetch();

    // Listen for changes from other components (like NotificationListView)
    const handleSync = () => {
      if (isMounted) fetchNotifications();
    };
    window.addEventListener("notifications-changed", handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener("notifications-changed", handleSync);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      // Dispatch event to sync with other views
      window.dispatchEvent(new CustomEvent("notifications-changed"));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Dispatch event to sync with other views
      window.dispatchEvent(new CustomEvent("notifications-changed"));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // We can use the server action directly here
      const { deleteNotificationAction } = await import("../../server/actions");
      const result = await deleteNotificationAction(id);
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // Dispatch event to sync with other views
        window.dispatchEvent(new CustomEvent("notifications-changed"));
      }
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshFn: fetchNotifications,
  };
}
