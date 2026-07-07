/**
 * Login Announcement Application Layer
 * Use cases – thin wrappers over the repository with Zod validation.
 */

import { z } from "zod";
import {
  findAllAnnouncements,
  findActiveAnnouncementsForRoles,
  findAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  reorderAnnouncement,
  type CreateAnnouncementData,
} from "../infrastructure/login-announcement.repository";

// ─── Validation Schemas ──────────────────────────────────────────────────────

export const createAnnouncementSchema = z.object({
  imageUrl: z.string().min(1, "กรุณาอัปโหลดรูปภาพ"),
  title: z.string().optional(),
  roles: z.array(z.string()).min(1, "กรุณาเลือก Role อย่างน้อย 1 รายการ"),
  isActive: z.boolean().optional().default(true),
});

export const updateAnnouncementSchema = z.object({
  imageUrl: z.string().min(1).optional(),
  title: z.string().optional(),
  roles: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// ─── Use Cases ───────────────────────────────────────────────────────────────

export async function listAnnouncementsUseCase() {
  return findAllAnnouncements();
}

export async function getAnnouncementsForUserUseCase(roles: string[]) {
  return findActiveAnnouncementsForRoles(roles);
}

export async function createAnnouncementUseCase(
  input: CreateAnnouncementInput
) {
  const data = createAnnouncementSchema.parse(input);
  return createAnnouncement(data as CreateAnnouncementData);
}

export async function updateAnnouncementUseCase(
  id: string,
  input: UpdateAnnouncementInput
) {
  const existing = await findAnnouncementById(id);
  if (!existing) throw new Error("ไม่พบรายการที่ต้องการแก้ไข");
  const data = updateAnnouncementSchema.parse(input);
  return updateAnnouncement(id, data);
}

export async function deleteAnnouncementUseCase(id: string) {
  const existing = await findAnnouncementById(id);
  if (!existing) throw new Error("ไม่พบรายการที่ต้องการลบ");
  return deleteAnnouncement(id);
}

export async function toggleActiveUseCase(id: string) {
  const existing = await findAnnouncementById(id);
  if (!existing) throw new Error("ไม่พบรายการ");
  return updateAnnouncement(id, { isActive: !existing.isActive });
}

export async function reorderAnnouncementUseCase(
  id: string,
  direction: "up" | "down"
) {
  return reorderAnnouncement(id, direction);
}

// ─── Re-export types ─────────────────────────────────────────────────────────

export type { LoginAnnouncementItem } from "../infrastructure/login-announcement.repository";
