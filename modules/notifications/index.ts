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

// Features
export * from "./features";
