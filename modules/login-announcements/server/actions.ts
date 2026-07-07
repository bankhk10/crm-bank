"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import {
  listAnnouncementsUseCase,
  getAnnouncementsForUserUseCase,
  createAnnouncementUseCase,
  updateAnnouncementUseCase,
  deleteAnnouncementUseCase,
  toggleActiveUseCase,
  reorderAnnouncementUseCase,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
} from "../application";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const roles: string[] = session.user.roles ?? [];
  if (!roles.includes("admin")) throw new Error("Forbidden: Admin only");
  return session;
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

/** List all announcements (Admin only) */
export async function listAnnouncementsAction() {
  await requireAdmin();
  const items = await listAnnouncementsUseCase();
  return JSON.parse(JSON.stringify(items));
}

/** Create a new announcement (Admin only) */
export async function createAnnouncementAction(input: CreateAnnouncementInput) {
  await requireAdmin();
  try {
    await createAnnouncementUseCase(input);
    revalidatePath("/admin/login-announcements");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}

/** Update an existing announcement (Admin only) */
export async function updateAnnouncementAction(
  id: string,
  input: UpdateAnnouncementInput
) {
  await requireAdmin();
  try {
    await updateAnnouncementUseCase(id, input);
    revalidatePath("/admin/login-announcements");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}

/** Soft-delete an announcement (Admin only) */
export async function deleteAnnouncementAction(id: string) {
  await requireAdmin();
  try {
    await deleteAnnouncementUseCase(id);
    revalidatePath("/admin/login-announcements");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}

/** Toggle isActive on an announcement (Admin only) */
export async function toggleAnnouncementActiveAction(id: string) {
  await requireAdmin();
  try {
    await toggleActiveUseCase(id);
    revalidatePath("/admin/login-announcements");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}

/** Reorder an announcement up or down (Admin only) */
export async function reorderAnnouncementAction(
  id: string,
  direction: "up" | "down"
) {
  await requireAdmin();
  try {
    await reorderAnnouncementUseCase(id, direction);
    revalidatePath("/admin/login-announcements");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}

// ─── User Actions ─────────────────────────────────────────────────────────────

/** Get active announcements matching the current user's roles (for Popup) */
export async function getMyAnnouncementsAction() {
  const session = await auth();
  if (!session?.user) return [];
  const roles: string[] = session.user.roles ?? [];
  const items = await getAnnouncementsForUserUseCase(roles);
  return JSON.parse(JSON.stringify(items));
}
