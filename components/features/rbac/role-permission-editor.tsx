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

  // Helper to determine group name
  const getPermissionGroup = (p: Permission) => {
    let raw = "";
    if (p.resource) {
      raw = p.resource;
    } else if (p.key.startsWith("menu.")) {
      raw = p.key.split(".")[1] || "Other";
    } else {
      // Fallback for actions without resource (e.g. rbac.manage)
      raw = p.key.split(".")[0];
    }

    // Normalize specific known keys to common Module Names
    const lower = raw.toLowerCase();
    if (lower.includes("sale")) return "Sales";
    if (lower.includes("product")) return "Products";
    if (lower.includes("customer")) return "Customers";
    if (lower.includes("employee")) return "Employees";
    if (lower.includes("company") || lower.includes("companies"))
      return "Companies";
    if (lower.includes("report")) return "Reports";
    if (
      lower.includes("rbac") ||
      lower.includes("role") ||
      lower.includes("permission")
    )
      return "System & RBAC";
    if (lower.includes("fulfillment")) return "Fulfillment";
    if (lower.includes("credit")) return "Credit Limits";

    // Default capitalization
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  // Group permissions
  const groupedPermissions = allPermissions.reduce((acc, p) => {
    const group = getPermissionGroup(p);
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Sort groups: System & RBAC last, otherwise alphabetical
  const sortedGroupKeys = Object.keys(groupedPermissions).sort((a, b) => {
    if (a === "System & RBAC") return 1;
    if (b === "System & RBAC") return -1;
    return a.localeCompare(b);
  });

  const notify = (type: "success" | "error", message: string) => {
    if (type === "error") {
      alert(message); // Simple alert for now
    }
  };

  const togglePermission = async (
    permissionId: string,
    allow: boolean,
    dataAccess?: DataAccessLevel | null
  ) => {
    // Optimistic update logic
    const basePermission = allPermissions.find((p) => p.id === permissionId)!;
    const previousPermissions = currentRole.permissions;
    const existingIndex = previousPermissions.findIndex(
      (p) => p.permissionId === permissionId
    );

    let nextPermissions = [...previousPermissions];

    if (existingIndex > -1) {
      // Update existing
      nextPermissions[existingIndex] = {
        ...nextPermissions[existingIndex],
        allow,
        dataAccess:
          dataAccess ?? nextPermissions[existingIndex].dataAccess ?? null,
      };
      // If disabling, we could technically filter it out, but keeping it with allow=false is also fine for UI state
      // However, to match previous logic of "clean state", let's replicate the filter-then-push or just update.
      // The previous implementation used filter-then-push to ensure consistent object structure.
      // Let's stick to update if exists for simplicity, but handle the case of "removing" if that was the intent.
      // Actually, simplified: just set allow.
    } else {
      // Add new
      nextPermissions.push({
        id: "temp-" + permissionId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        roleId: currentRole.id,
        permissionId,
        allow,
        dataAccess: dataAccess ?? null,
        permission: basePermission,
      });
    }

    // Clean up: if allow is false and no dataAccess, maybe removing it from list is cleaner for the API payload?
    // But API payload expects list of changes.
    // Let's simpler approach: Always maintain the list in state as "what is currently active/inactive".
    // For the UI to show "checked", we need the entry to exist AND allow=true.

    // WAIT: The previous logic was explicitly removing it if !allow && !dataAccess.
    // Let's refine:
    if (!allow && !dataAccess) {
      nextPermissions = nextPermissions.filter(
        (p) => p.permissionId !== permissionId
      );
    } else if (existingIndex === -1 && (allow || dataAccess)) {
      // (already pushed above)
    }

    // Update State
    setCurrentRole({ ...currentRole, permissions: nextPermissions });
    setIsSaving(true);

    try {
      // Prepare payload for JUST this permission change or all?
      // The API accepts a list. Efficient to send just the changed one?
      // Or send all? The API uses Upsert. Sending all is safer for "replace" logic but bulkier.
      // The previous implementation sent ONLY the modified ones in a specific way,
      // actually looking at the previous code: it rebuilt a payload list based on interaction.
      // But `togglePermission` built a `next` list of ALL permissions and sent THAT?
      // No, let's look at the toggle logic I replaced.
      // It sent: `permissions: next.map(...)` which was the FULL list.
      // That is safest to ensure full sync.

      const payload = nextPermissions.map((entry) => ({
        permissionId: entry.permissionId,
        allow: entry.allow,
        dataAccess: entry.dataAccess,
      }));

      const response = await fetch(
        `/api/rbac/roles/${currentRole.id}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: payload }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        notify("error", body.error || "Save failed");
        setCurrentRole({ ...currentRole, permissions: previousPermissions });
      } else {
        router.refresh();
      }
    } catch {
      notify("error", "Network error");
      setCurrentRole({ ...currentRole, permissions: previousPermissions });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGroupPermissions = async (
    permsInGroup: Permission[],
    allow: boolean
  ) => {
    const permIds = permsInGroup.map((p) => p.id);

    // Construct new permissions list
    const currentPerms = [...currentRole.permissions];
    const otherPerms = currentPerms.filter(
      (p) => !permIds.includes(p.permissionId)
    );

    const newGroupPerms = permIds.map((id) => {
      const existing = currentPerms.find((p) => p.permissionId === id);
      const base = allPermissions.find((p) => p.id === id)!;
      return {
        ...(existing ?? {
          id: "temp-" + id,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          roleId: currentRole.id,
          permissionId: id,
          allow: false,
          dataAccess: null,
          permission: base,
        }),
        permissionId: id,
        allow: allow,
        // Preserve data access if enable, or keep if disable?
        dataAccess: existing?.dataAccess ?? null,
        permission: base,
      };
    });

    // Filter out strictly empty ones if allow=false?
    // Actually keeping them with allow=false is fine, better for "Select All" logic retention.
    // But to match togglePermission logic:
    const finalGroupPerms = newGroupPerms.filter(
      (p) => p.allow || p.dataAccess
    );

    const nextPermissions = [...otherPerms, ...finalGroupPerms];

    setCurrentRole({ ...currentRole, permissions: nextPermissions });
    setIsSaving(true);

    try {
      const payload = nextPermissions.map((p) => ({
        permissionId: p.permissionId,
        allow: p.allow,
        dataAccess: p.dataAccess,
      }));

      const response = await fetch(
        `/api/rbac/roles/${currentRole.id}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: payload }),
        }
      );

      if (!response.ok) {
        notify("error", "Update failed");
        setCurrentRole({ ...currentRole, permissions: currentPerms });
      } else {
        router.refresh();
      }
    } catch {
      notify("error", "Network error");
      setCurrentRole({ ...currentRole, permissions: currentPerms });
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

      <div className="grid gap-6 pb-12">
        {sortedGroupKeys.map((groupName) => {
          const groupPermissions = groupedPermissions[groupName];

          // Further split into "Access (Menu)" and "Capabilities (Action/Data)"
          const menuPermissions = groupPermissions.filter(
            (p) => p.category === "MENU"
          );
          const actionPermissions = groupPermissions.filter(
            (p) => p.category !== "MENU"
          );

          const areAllSelected = groupPermissions.every((p) => {
            const existing = currentRole.permissions.find(
              (ep) => ep.permissionId === p.id
            );
            return existing?.allow;
          });

          return (
            <Card
              key={groupName}
              className="overflow-hidden border-slate-200 shadow-sm"
            >
              <CardHeader className="bg-slate-50/50 border-b py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800">
                  {groupName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">
                    {groupPermissions.length} permissions
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      toggleGroupPermissions(groupPermissions, !areAllSelected)
                    }
                    disabled={isSaving}
                  >
                    {areAllSelected ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 grid gap-6">
                {/* Menu Access Section */}
                {menuPermissions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      Menu Access
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {menuPermissions.map((p) => (
                        <PermissionItem
                          key={p.id}
                          permission={p}
                          role={currentRole}
                          onToggle={togglePermission}
                          disabled={isSaving}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider if both exist */}
                {menuPermissions.length > 0 && actionPermissions.length > 0 && (
                  <div className="border-t border-slate-100" />
                )}

                {/* Actions Section */}
                {actionPermissions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Actions & Data
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {actionPermissions.map((p) => (
                        <PermissionItem
                          key={p.id}
                          permission={p}
                          role={currentRole}
                          onToggle={togglePermission}
                          disabled={isSaving}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Sub-component for individual permission card
function PermissionItem({
  permission,
  role,
  onToggle,
  disabled,
}: {
  permission: Permission;
  role: RoleWithPermissions;
  onToggle: (id: string, allow: boolean, da?: DataAccessLevel | null) => void;
  disabled: boolean;
}) {
  const entry = role.permissions.find((p) => p.permissionId === permission.id);
  const isChecked = entry?.allow ?? false;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-3 transition-all ${
        isChecked
          ? "border-primary/50 bg-primary/5"
          : "bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="font-medium text-sm leading-tight text-slate-900">
            {permission.name}
          </p>
          <p
            className="text-[10px] text-muted-foreground font-mono truncate opacity-70"
            title={permission.key}
          >
            {permission.key}
          </p>
        </div>
        <Switch
          className="shrink-0 scale-90"
          checked={isChecked}
          disabled={disabled}
          onCheckedChange={(checked) => onToggle(permission.id, checked)}
        />
      </div>

      {isChecked && permission.category === "DATA" && (
        <div className="pt-2 mt-auto border-t border-primary/10">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold uppercase text-primary/70">
              Data Scope
            </label>
          </div>
          <Select
            value={entry?.dataAccess ?? "VIEW_OWN"}
            disabled={disabled}
            onValueChange={(value) =>
              onToggle(permission.id, true, value as DataAccessLevel)
            }
          >
            <SelectTrigger className="h-7 text-[11px] bg-white/50 border-primary/20">
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
}
