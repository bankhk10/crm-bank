import { NotificationType } from "@/src/infrastructure/database";

export interface CreateNotificationInput {
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
