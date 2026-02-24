/**
 * Notifications Module
 * Barrel exports – client-safe only.
 *
 * ⚠️  Server-only imports (application use cases, server actions)
 *     must be imported directly from their subpaths:
 *       import { sendNotificationUseCase } from "@/modules/notifications/application";
 *       import { getNotificationsAction }  from "@/modules/notifications/server/actions";
 */

// Types (client-safe)
export * from "./types";

// Constants (client-safe)
export { NOTIFICATION_CONFIG, getNotificationConfig } from "./constants";

// Features – Bell (client components)
export { NotificationBell } from "./features/bell/notification-bell";
export { NotificationList } from "./features/bell/notification-list";
export { NotificationItem } from "./features/bell/notification-item";

// Features – Hook (client hook)
export { useNotifications } from "./features/bell/use-notifications";
