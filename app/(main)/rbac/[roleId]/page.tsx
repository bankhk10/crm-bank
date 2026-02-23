import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/src/core/rbac";
import { RolePermissionEditor } from "@/modules/rbac";
import { findRoleById, findAllPermissions } from "@/modules/rbac/infrastructure/rbac.repository";

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

  const { roleId } = await Promise.resolve(params);

  const role = await findRoleById(roleId);

  if (!role) {
    notFound();
  }

  const permissions = await findAllPermissions();

  return (
    <div className="container mx-auto py-6">
      <RolePermissionEditor role={role} allPermissions={permissions} />
    </div>
  );
}
