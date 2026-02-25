/**
 * Notification Repository
 * Pure database operations for notifications.
 * No business logic, no auth checks.
 */

import { db } from "@/lib/db";
import type { NotificationType } from "@/lib/db";

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export interface NotificationFilter {
  userId: string;
  isRead?: boolean;
}

export async function createNotification(data: CreateNotificationData) {
  return db.notification.create({
    data,
  });
}

export async function findNotifications(filter: NotificationFilter) {
  return db.notification.findMany({
    where: filter,
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}

export async function markAsRead(id: string) {
  return db.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({
    where: { userId, isRead: false },
  });
}
