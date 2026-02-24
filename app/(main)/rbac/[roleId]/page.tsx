import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/modules/rbac";
import { RolePermissionEditor } from "@/modules/rbac";
import { getRoleDetailUseCase, listPermissionsUseCase } from "@/modules/rbac/application";

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

  const result = await getRoleDetailUseCase(roleId);

  if (!result.success || !('role' in result)) {
    notFound();
  }

  const permissions = await listPermissionsUseCase();

  return (
    <div className="container mx-auto py-6">
      <RolePermissionEditor role={result.role} allPermissions={permissions} />
    </div>
  );
}
