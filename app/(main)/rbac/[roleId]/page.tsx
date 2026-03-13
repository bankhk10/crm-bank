import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { DEFAULT_AUTH_REDIRECT } from "@/modules/rbac";
import { RBACRoleDetailView } from "@/modules/rbac";

interface RolePermissionsPageProps {
  params: Promise<{
    roleId: string;
  }>;
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

  const { roleId } = await params;

  return <RBACRoleDetailView roleId={roleId} />;
}
