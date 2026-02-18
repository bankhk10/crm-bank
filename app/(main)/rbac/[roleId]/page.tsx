import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/rbac";
import { RolePermissionEditor } from "@/features/rbac";
import { getRolePermissionsPageData } from "@/src/core/rbac";

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

  const { role, permissions } = await getRolePermissionsPageData(roleId);

  if (!role) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <RolePermissionEditor role={role} allPermissions={permissions} />
    </div>
  );
}
