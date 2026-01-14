import { db } from "@/src/infrastructure/database";
import {
  CreateNotificationInput,
  NotificationFilter,
} from "./notification.types";

export async function createNotification(data: CreateNotificationInput) {
  return db.notification.create({
    data,
  });
}

export async function getNotifications(filter: NotificationFilter) {
  return db.notification.findMany({
    where: filter,
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Limit to recent 50
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
