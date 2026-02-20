import { redirect } from "next/navigation";
import { RBACConsole } from "@/modules/rbac";
import { auth } from "@/lib/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/src/core/rbac";

export default async function RBACPage() {
  const session = await auth();
  const canManage =
    session?.user?.permissionKeys?.includes("rbac.manage") ?? false;

  if (!canManage) {
    redirect(DEFAULT_AUTH_REDIRECT);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">RBAC ศูนย์ควบคุมสิทธิ์</h1>
        <p className="text-sm text-slate-500">
          จัดการ Role, Permission, Department และ Mapping ต่าง ๆ
        </p>
      </div>
      <RBACConsole />
    </div>
  );
}
