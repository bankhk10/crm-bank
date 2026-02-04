import {
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { NotificationConfig } from "../_types/types";

export const NOTIFICATION_CONFIG: Record<string, NotificationConfig> = {
  SUCCESS: {
    icon: CheckCircle2,
    gradient: "from-emerald-50 via-green-50 to-teal-50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
    iconColor: "text-white",
    accentColor: "text-emerald-700",
    borderColor: "border-l-emerald-500",
  },
  APPROVED: {
    icon: CheckCircle2,
    gradient: "from-emerald-50 via-green-50 to-teal-50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
    iconColor: "text-white",
    accentColor: "text-emerald-700",
    borderColor: "border-l-emerald-500",
  },
  ERROR: {
    icon: XCircle,
    gradient: "from-red-50 via-rose-50 to-pink-50",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "text-red-700",
    borderColor: "border-l-red-500",
  },
  REJECTED: {
    icon: XCircle,
    gradient: "from-red-50 via-rose-50 to-pink-50",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "text-red-700",
    borderColor: "border-l-red-500",
  },
  WARNING: {
    icon: AlertTriangle,
    gradient: "from-amber-50 via-yellow-50 to-orange-50",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    iconColor: "text-white",
    accentColor: "text-amber-700",
    borderColor: "border-l-amber-500",
  },
  INFO: {
    icon: Info,
    gradient: "from-blue-50 via-sky-50 to-cyan-50",
    iconBg: "bg-gradient-to-br from-blue-500 to-sky-600",
    iconColor: "text-white",
    accentColor: "text-blue-700",
    borderColor: "border-l-blue-500",
  },
};

export const getNotificationConfig = (type: string): NotificationConfig => {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG["INFO"];
};
