import type { LucideIcon } from "lucide-react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationConfig {
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  borderColor: string;
}
