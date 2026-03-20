/**
 * Application Layer – Public Facade
 *
 * Re-exports use cases for the notification feature.
 * All use cases are thin wrappers since notification logic is simple.
 */

import {
  createNotification,
  findNotifications,
  markAsRead as repoMarkAsRead,
  markAllAsRead as repoMarkAllAsRead,
  getUnreadCount as repoGetUnreadCount,
  deleteNotification as repoDeleteNotification,
  type CreateNotificationData,
} from "../infrastructure/notification.repository";

// ─────────────────────────────────────────────
// Use Cases (inline – thin wrappers)
// ─────────────────────────────────────────────

/**
 * Use case: Send a notification to a user.
 * Used by other modules (e.g. sales) to create notifications.
 */
export async function sendNotificationUseCase(input: CreateNotificationData) {
  return createNotification(input);
}

/**
 * Use case: Get notifications for a specific user.
 */
export async function getUserNotificationsUseCase(userId: string) {
  return findNotifications({ userId });
}

/**
 * Use case: Get unread notification count for a user.
 */
export async function getUnreadCountUseCase(userId: string) {
  return repoGetUnreadCount(userId);
}

/**
 * Use case: Mark a single notification as read.
 */
export async function markAsReadUseCase(id: string) {
  return repoMarkAsRead(id);
}

/**
 * Use case: Mark all notifications as read for a user.
 */
export async function markAllAsReadUseCase(userId: string) {
  return repoMarkAllAsRead(userId);
}

/**
 * Use case: Delete a notification.
 */
export async function deleteNotificationUseCase(id: string) {
  return repoDeleteNotification(id);
}

// ─────────────────────────────────────────────
// Re-export types used by other modules
// ─────────────────────────────────────────────

export type { CreateNotificationData } from "../infrastructure/notification.repository";
