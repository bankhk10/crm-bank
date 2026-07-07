"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
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

async function requireManageAnnouncements() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  
  const permissionKeys = session.user.permissionKeys ?? [];
  if (!permissionKeys.includes("announcement.manage")) {
    throw new Error("Forbidden: Requires announcement.manage permission");
  }
  
  return session;
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

/** List all announcements (Admin only) */
export async function listAnnouncementsAction() {
  await requireManageAnnouncements();
  const items = await listAnnouncementsUseCase();
  return JSON.parse(JSON.stringify(items));
}

/** Create a new announcement (Admin only) */
export async function createAnnouncementAction(input: CreateAnnouncementInput) {
  await requireManageAnnouncements();
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
  await requireManageAnnouncements();
  try {
    // get old record to know if image changed
    const items = await listAnnouncementsUseCase();
    const oldItem = items.find((i) => i.id === id);

    await updateAnnouncementUseCase(id, input);

    // If image was changed, delete the old file
    if (oldItem && oldItem.imageUrl && input.imageUrl && oldItem.imageUrl !== input.imageUrl) {
      const filePath = path.join(process.cwd(), "public", oldItem.imageUrl.replace(/^\//, ""));
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.warn("Could not delete old file:", e);
      }
    }

    revalidatePath("/admin/login-announcements");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}

/** Soft-delete an announcement (Admin only) */
export async function deleteAnnouncementAction(id: string) {
  await requireManageAnnouncements();
  try {
    const items = await listAnnouncementsUseCase();
    const deleted = items.find((i) => i.id === id);

    await deleteAnnouncementUseCase(id);
    
    // Physically delete the image file to save space
    if (deleted && deleted.imageUrl) {
      // The imageUrl is something like '/uploads/1783395816660-n30bc.jpg'
      const filePath = path.join(process.cwd(), "public", deleted.imageUrl.replace(/^\//, ""));
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.warn("Could not delete file, perhaps already deleted:", e);
      }
    }

    revalidatePath("/admin/login-announcements");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}

/** Toggle isActive on an announcement (Admin only) */
export async function toggleAnnouncementActiveAction(id: string) {
  await requireManageAnnouncements();
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
  await requireManageAnnouncements();
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
