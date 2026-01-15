import { NextResponse } from "next/server";
import { z } from "zod";
import {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/src/infrastructure/database";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const payloadSchema = z.object({
  permissions: z
    .array(
      z.object({
        permissionId: z.string(),
        allow: z.boolean(),
        dataAccess: z.nativeEnum(DataAccessLevel).nullable().optional(),
        editAccess: z.nativeEnum(EditAccessLevel).nullable().optional(),
        deleteAccess: z.nativeEnum(DeleteAccessLevel).nullable().optional(),
      })
    )
    .min(1),
});

export async function PUT(request: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const roleId = params?.roleId as string | undefined;

  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    // 1. Get all existing valid/invalid mappings for this role (to check for soft-deleted ones)
    const existing = await tx.rolePermission.findMany({
      where: { roleId },
    });

    const inputPerms = parsed.data.permissions;
    const inputPermissionIds = new Set(inputPerms.map((p) => p.permissionId));

    // 2. Upsert (Update existing or Create new)
    for (const item of inputPerms) {
      const match = existing.find((e) => e.permissionId === item.permissionId);
      if (match) {
        // Update existing record (restore if deleted)
        await tx.rolePermission.update({
          where: { id: match.id },
          data: {
            allow: item.allow,
            dataAccess: item.dataAccess ?? null,
            editAccess: item.editAccess ?? null,
            deleteAccess: item.deleteAccess ?? null,
            deletedAt: null, // Restore
          },
        });
      } else {
        // Create new record
        await tx.rolePermission.create({
          data: {
            roleId,
            permissionId: item.permissionId,
            allow: item.allow,
            dataAccess: item.dataAccess ?? null,
            editAccess: item.editAccess ?? null,
            deleteAccess: item.deleteAccess ?? null,
          },
        });
      }
    }

    // 3. Soft delete entries that are NOT in the input payload
    // (This ensures the state matches the payload exactly)
    const toDelete = existing.filter(
      (e) => !inputPermissionIds.has(e.permissionId) && !e.deletedAt
    );
    if (toDelete.length > 0) {
      await tx.rolePermission.updateMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
        data: { deletedAt: new Date() },
      });
    }
  });

  const role = await db.role.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } },
  });

  // filter out soft-deleted entries on the application side because `include` does not accept `where` in this context
  const cleaned = role
    ? {
        ...role,
        permissions: role.permissions
          .filter((rp) => !rp.deletedAt)
          .map((rp) => ({
            ...rp,
            permission:
              rp.permission && !(rp.permission as any).deletedAt
                ? rp.permission
                : null,
          })),
      }
    : role;

  return NextResponse.json(cleaned);
}
