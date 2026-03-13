"use client";

import { useEffect, useState } from "react";
import RolePermissionEditor from "./role-permission-editor";
import { getRoleDetailAction, listPermissionsAction } from "../../server/actions";
import { RoleWithPermissions } from "../../types";

interface RBACRoleDetailViewProps {
  roleId: string;
}

export default function RBACRoleDetailView({ roleId }: RBACRoleDetailViewProps) {
  const [role, setRole] = useState<RoleWithPermissions | null>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [roleResult, permissionsResult] = await Promise.all([
          getRoleDetailAction(roleId),
          listPermissionsAction(),
        ]);

        if (roleResult.success && 'role' in roleResult) {
          setRole(roleResult.role as RoleWithPermissions);
        } else {
          setError(roleResult.error || "ไม่พบข้อมูลบทบาท");
        }

        if (permissionsResult.success && 'permissions' in permissionsResult) {
          setAllPermissions(permissionsResult.permissions as any[]);
        }
      } catch (err) {
        console.error("Fetch role detail failed:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [roleId]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="animate-pulse text-muted-foreground">กำลังโหลดข้อมูลบทบาทและสิทธิ์...</p>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold">เกิดข้อผิดพลาด</h3>
          <p>{error || "ไม่พบข้อมูล"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <RolePermissionEditor role={role} allPermissions={allPermissions} />
    </div>
  );
}
