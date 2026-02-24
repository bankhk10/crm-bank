/**
 * Notification Types
 * Type definitions for notification module
 */

import type { LucideIcon } from "lucide-react";

/**
 * Notification record
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Notification visual config (for UI rendering)
 */
export interface NotificationConfig {
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  borderColor: string;
}

/**
 * Create notification input (used by other modules)
 */
export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}
