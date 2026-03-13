import { redirect } from "next/navigation";
import { RBACListView } from "@/modules/rbac";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { DEFAULT_AUTH_REDIRECT } from "@/modules/rbac";

export default async function RBACPage() {
  const session = await auth();
  const canManage =
    session?.user?.permissionKeys?.includes("rbac.manage") ?? false;

  if (!canManage) {
    redirect(DEFAULT_AUTH_REDIRECT);
  }

  return <RBACListView />;
}
