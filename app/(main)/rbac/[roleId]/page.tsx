import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/rbac";
import { RolePermissionEditor } from "@/modules/rbac";

interface RolePermissionsPageProps {
  params: {
    roleId: string;
  };
}

export default async function RolePermissionsPage({
  params,
}: RolePermissionsPageProps) {
  const session = await auth();
  const canManage =
    session?.user?.permissionKeys?.includes("rbac.manage") ?? false;

  if (!canManage) {
    redirect(DEFAULT_AUTH_REDIRECT);
  }

  // Next.js 15: params is promised
  const { roleId } = await Promise.resolve(params); // or just use params if it's already resolved in this version, but safe to await if unsure or just access direct if not using latest experimental.
  // Wait, in latest Next.js params is a Promise. But usually in standard 14 it's object.
  // Let's assume standard behavior or just await it if needed.
  // The user prompt said Next.js + Typescript.

  const role = await db.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        where: { deletedAt: null },
        include: { permission: true },
      },
    },
  });

  if (!role) {
    notFound();
  }

  const permissions = await db.permission.findMany({
    where: { deletedAt: null }, // Assuming soft delete might exist or just all permissions
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto py-6">
      <RolePermissionEditor role={role} allPermissions={permissions} />
    </div>
  );
}
