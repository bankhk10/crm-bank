/**
 * Login Announcement Repository
 * Pure database operations only – no auth, no validation.
 */

import { db } from "@/lib/db";

export interface LoginAnnouncementItem {
  id: string;
  imageUrl: string;
  title: string | null;
  roles: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnnouncementData {
  imageUrl: string;
  title?: string;
  roles: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateAnnouncementData {
  imageUrl?: string;
  title?: string;
  roles?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

/** List all non-deleted announcements ordered by sortOrder asc */
export async function findAllAnnouncements(): Promise<LoginAnnouncementItem[]> {
  return db.loginAnnouncement.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });
}

/** Find active announcements that match at least one of the given roles */
export async function findActiveAnnouncementsForRoles(
  roles: string[]
): Promise<LoginAnnouncementItem[]> {
  if (roles.length === 0) return [];
  const all = await db.loginAnnouncement.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  // Filter: roles array contains at least one matching role
  return all.filter((a) => a.roles.some((r) => roles.includes(r)));
}

/** Find one announcement by id (non-deleted) */
export async function findAnnouncementById(
  id: string
): Promise<LoginAnnouncementItem | null> {
  return db.loginAnnouncement.findFirst({
    where: { id, deletedAt: null },
  });
}

/** Create new announcement (auto-increment sortOrder) */
export async function createAnnouncement(
  data: CreateAnnouncementData
): Promise<LoginAnnouncementItem> {
  const maxRecord = await db.loginAnnouncement.findFirst({
    where: { deletedAt: null },
    orderBy: { sortOrder: "desc" },
  });
  const nextOrder = (maxRecord?.sortOrder ?? -1) + 1;

  return db.loginAnnouncement.create({
    data: {
      imageUrl: data.imageUrl,
      title: data.title,
      roles: data.roles,
      sortOrder: data.sortOrder ?? nextOrder,
      isActive: data.isActive ?? true,
    },
  });
}

/** Update announcement fields */
export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementData
): Promise<LoginAnnouncementItem> {
  return db.loginAnnouncement.update({ where: { id }, data });
}

/** Soft delete – sets deletedAt, never removes the row */
export async function deleteAnnouncement(id: string): Promise<void> {
  await db.loginAnnouncement.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/** Swap sortOrder with the adjacent record (direction: "up" | "down") */
export async function reorderAnnouncement(
  id: string,
  direction: "up" | "down"
): Promise<void> {
  const current = await db.loginAnnouncement.findFirst({
    where: { id, deletedAt: null },
  });
  if (!current) return;

  const adjacent = await db.loginAnnouncement.findFirst({
    where: {
      deletedAt: null,
      sortOrder:
        direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!adjacent) return;

  // Swap sortOrder values atomically
  await db.$transaction([
    db.loginAnnouncement.update({
      where: { id: current.id },
      data: { sortOrder: adjacent.sortOrder },
    }),
    db.loginAnnouncement.update({
      where: { id: adjacent.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
}
