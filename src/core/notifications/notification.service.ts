import * as NotificationRepository from "./notification.repository";
import { CreateNotificationInput } from "./notification.types";

export async function sendNotification(input: CreateNotificationInput) {
  return NotificationRepository.createNotification(input);
}

export async function getUserNotifications(userId: string) {
  return NotificationRepository.getNotifications({ userId });
}

export async function getUnreadCount(userId: string) {
  return NotificationRepository.getUnreadCount(userId);
}

export async function markAsRead(id: string) {
  return NotificationRepository.markAsRead(id);
}

export async function markAllAsRead(userId: string) {
  return NotificationRepository.markAllAsRead(userId);
}
