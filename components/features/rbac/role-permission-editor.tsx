"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import {
  Permission,
  Role,
  RolePermission,
  DataAccessLevel,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface RoleWithPermissions extends Role {
  permissions: (RolePermission & { permission: Permission })[];
}

interface RolePermissionEditorProps {
  role: RoleWithPermissions;
  allPermissions: Permission[];
}

const dataAccessOptions: { label: string; value: DataAccessLevel }[] = [
  { label: "เฉพาะฉัน", value: "VIEW_OWN" },
  { label: "แผนกเดียวกัน", value: "VIEW_DEPARTMENT" },
  { label: "ทั้งหมด", value: "VIEW_ALL" },
];

export default function RolePermissionEditor({
  role,
  allPermissions,
}: RolePermissionEditorProps) {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<RoleWithPermissions>(role);
  const [isSaving, setIsSaving] = useState(false);

  // Sort permissions like in console
  const sortedPermissions = [...allPermissions].sort((a, b) => {
    // Newest first
    const ta = new Date((a as any).createdAt).getTime();
    const tb = new Date((b as any).createdAt).getTime();
    return tb - ta;
  });

  const notify = (type: "success" | "error", message: string) => {
    if (type === "error") {
      alert(message); // Simple alert for now, or use toast if available
    } else {
      // toast.success(message)
    }
  };

  const togglePermission = async (
    permissionId: string,
    allow: boolean,
    dataAccess?: DataAccessLevel | null
  ) => {
    // Optimistic update
    const existingIndex = currentRole.permissions.findIndex(
      (entry) => entry.permissionId === permissionId
    );

    const basePermission = allPermissions.find((p) => p.id === permissionId)!;

    let nextPermissions = [...currentRole.permissions];

    if (existingIndex > -1) {
      if (!allow && !dataAccess) {
        // If untoggling, we might want to keep the record but set allow=false?
        // The Logic in Console was: filter out, then push new state.
        // Actually the logic in Console was:
        // filter out existing entry for this permissionId
        // push new entry
        nextPermissions = nextPermissions.filter(
          (p) => p.permissionId !== permissionId
        );
      } else {
        // Update existing
        nextPermissions[existingIndex] = {
          ...nextPermissions[existingIndex],
          allow,
          dataAccess:
            dataAccess ?? nextPermissions[existingIndex].dataAccess ?? null,
        };
      }
    }

    // If we filtered it out or it didn't exist, and we want to allow it (or set dataAccess)
    // Wait, the console logic always pushed a new object after filtering.
    // Let's replicate that logic exactly to be safe.

    const previousPermissions = currentRole.permissions;
    const existing = previousPermissions.find(
      (p) => p.permissionId === permissionId
    );

    const next = previousPermissions.filter(
      (p) => p.permissionId !== permissionId
    );
    next.push({
      ...(existing ?? {
        id: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        roleId: currentRole.id,
        permissionId,
        allow: false,
        dataAccess: null,
        permission: basePermission,
      }),
      permissionId,
      roleId: currentRole.id,
      allow,
      dataAccess: dataAccess ?? existing?.dataAccess ?? null,
      permission: basePermission,
    });

    setCurrentRole({ ...currentRole, permissions: next });

    // API Call
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/rbac/roles/${currentRole.id}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permissions: next.map((entry) => ({
              permissionId: entry.permissionId,
              allow: entry.allow,
              dataAccess: entry.dataAccess,
            })),
          }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        notify("error", body.error || "Save failed");
        setCurrentRole({ ...currentRole, permissions: previousPermissions }); // Revert
      } else {
        router.refresh();
      }
    } catch {
      notify("error", "Network error");
      setCurrentRole({ ...currentRole, permissions: previousPermissions }); // Revert
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGroupPermissions = async (category: string, allow: boolean) => {
    const categoryPermIds = sortedPermissions
      .filter((p) => p.category === category)
      .map((p) => p.id);

    const otherPermissions = currentRole.permissions
      .filter((rp) => !categoryPermIds.includes(rp.permissionId))
      .map((rp) => ({
        permissionId: rp.permissionId,
        allow: rp.allow,
        dataAccess: rp.dataAccess,
      }));

    const categoryPermissions = categoryPermIds.map((permId) => {
      const existing = currentRole.permissions.find(
        (rp) => rp.permissionId === permId
      );
      return {
        permissionId: permId,
        allow: allow,
        dataAccess: existing?.dataAccess ?? null,
      };
    });

    const payload = [...otherPermissions, ...categoryPermissions];

    // We need to update local state too for UI to reflect immediately
    // Ideally we reconstruct the full RolePermission objects.
    const newContextPermissions = [
      ...currentRole.permissions.filter(
        (p) => !categoryPermIds.includes(p.permissionId)
      ),
    ];
    categoryPermIds.forEach((permId) => {
      const basePermission = allPermissions.find((p) => p.id === permId)!;
      const existing = currentRole.permissions.find(
        (p) => p.permissionId === permId
      );
      newContextPermissions.push({
        ...(existing ?? {
          id: "temp-" + permId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          roleId: currentRole.id,
          permissionId: permId,
          allow: false,
          dataAccess: null,
          permission: basePermission,
        }),
        permissionId: permId,
        roleId: currentRole.id,
        permission: basePermission,
        allow,
        dataAccess: existing?.dataAccess ?? null,
      });
    });

    const previousRole = { ...currentRole };
    setCurrentRole({ ...currentRole, permissions: newContextPermissions });
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/rbac/roles/${currentRole.id}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permissions: payload,
          }),
        }
      );

      if (!response.ok) {
        notify("error", "Update failed");
        setCurrentRole(previousRole);
      } else {
        router.refresh();
      }
    } catch {
      notify("error", "Network error");
      setCurrentRole(previousRole);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/rbac")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to RBAC
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Permission Settings:{" "}
            <span className="text-primary">{currentRole.name}</span>
          </h1>
          <p className="text-muted-foreground">
            {currentRole.description || "Manage permissions for this role"}
          </p>
        </div>
      </div>

      <div className="grid gap-8 pb-12">
        {["MENU", "ACTION", "DATA"].map((category) => {
          const permsInCategory = sortedPermissions.filter(
            (p) => p.category === category
          );
          if (permsInCategory.length === 0) return null;

          const areAllSelected = permsInCategory.every((p) => {
            const current = currentRole.permissions.find(
              (entry) => entry.permissionId === p.id
            );
            return current?.allow;
          });

          return (
            <div key={category} className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold tracking-tight">
                      {category} PERMISSIONS
                    </CardTitle>
                    <CardDescription>
                      Controls for {category.toLowerCase()} access
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() =>
                      toggleGroupPermissions(category, !areAllSelected)
                    }
                    disabled={isSaving}
                  >
                    {areAllSelected ? "Deselect All" : "Select All"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {permsInCategory.map((permission) => {
                      const current = currentRole.permissions.find(
                        (entry) => entry.permissionId === permission.id
                      );
                      const isChecked = current?.allow ?? false;
                      return (
                        <div
                          key={permission.id}
                          className={`flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all ${
                            isChecked
                              ? "ring-2 ring-primary/20 border-primary/50 bg-primary/5"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-medium text-sm text-pretty leading-snug break-words">
                                {permission.name}
                              </p>
                              <p
                                className="text-xs text-muted-foreground font-mono truncate text-pretty opacity-80"
                                title={permission.key}
                              >
                                {permission.key}
                              </p>
                            </div>
                            <Switch
                              className="shrink-0 mt-0.5"
                              checked={isChecked}
                              disabled={isSaving}
                              onCheckedChange={(checked) =>
                                togglePermission(permission.id, checked)
                              }
                            />
                          </div>

                          {/* Conditionals for DATA Access */}
                          {isChecked && permission.category === "DATA" && (
                            <div className="mt-4 pt-3 border-t border-primary/10">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[10px] font-bold uppercase text-primary/70 tracking-tight">
                                  Data Scope
                                </label>
                              </div>
                              <Select
                                value={current?.dataAccess ?? "VIEW_OWN"} // Default to VIEW_OWN if null but checked? Or handle null.
                                disabled={isSaving}
                                onValueChange={(value) =>
                                  togglePermission(
                                    permission.id,
                                    true,
                                    value as DataAccessLevel
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 text-xs bg-white/50 border-primary/20 focus:ring-primary/20">
                                  <SelectValue placeholder="Select Scope" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dataAccessOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      className="text-xs"
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
