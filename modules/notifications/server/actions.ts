"use server";

import { auth } from "@/modules/auth/infrastructure/next-auth";
import {
  getUserNotificationsUseCase,
  markAsReadUseCase,
  markAllAsReadUseCase,
  getUnreadCountUseCase,
} from "../application";

/**
 * Get notifications for the current user.
 */
export async function getNotificationsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const notifications = await getUserNotificationsUseCase(session.user.id);
  return JSON.parse(JSON.stringify(notifications));
}

/**
 * Mark a single notification as read.
 */
export async function markAsReadAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await markAsReadUseCase(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark as read" };
  }
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsReadAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await markAllAsReadUseCase(session.user.id);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to mark all as read",
    };
  }
}

/**
 * Get unread notification count for the current user.
 */
export async function getUnreadCountAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return 0;
  }

  return getUnreadCountUseCase(session.user.id);
}

