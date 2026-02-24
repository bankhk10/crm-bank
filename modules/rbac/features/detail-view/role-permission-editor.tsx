"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Eye, Pencil, Trash2 } from "lucide-react";
import type {
    Permission,
    DataAccessLevel,
    EditAccessLevel,
    DeleteAccessLevel,
} from "@/src/infrastructure/database";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";

import type { RoleWithPermissions, RolePermissionEditorProps } from "../../types";
import {
    DATA_ACCESS_OPTIONS,
    EDIT_ACCESS_OPTIONS,
    DELETE_ACCESS_OPTIONS,
    PERMISSION_GROUP_OVERRIDES,
} from "../../constants";
import { updateRolePermissionsAction } from "../../server/actions";

export default function RolePermissionEditor({
    role,
    allPermissions,
}: RolePermissionEditorProps) {
    const router = useRouter();
    const [currentRole, setCurrentRole] = useState<RoleWithPermissions>(role);
    const [isSaving, setIsSaving] = useState(false);

    // Helper to determine group name
    const getPermissionGroup = (p: Permission) => {
        let raw = p.resource || "";

        // Fallback logic only if resource is missing
        if (!raw) {
            if (p.key.startsWith("menu.")) {
                raw = p.key.split(".")[1] || "Other";
            } else {
                // Fallback for actions without resource
                raw = p.key.split(".")[0];
            }
        }

        const lower = raw.toLowerCase();
        if (PERMISSION_GROUP_OVERRIDES[lower]) return PERMISSION_GROUP_OVERRIDES[lower];

        // General formatting: replace delimiters with spaces and Title Case
        return raw
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Group permissions
    const groupedPermissions = allPermissions.reduce((acc, p) => {
        const group = getPermissionGroup(p);
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    // Sort groups: RBAC/System last, otherwise alphabetical
    const sortedGroupKeys = Object.keys(groupedPermissions).sort((a, b) => {
        // Force RBAC/System to bottom
        const isSystemA = a === "RBAC" || a === "System";
        const isSystemB = b === "RBAC" || b === "System";

        if (isSystemA && !isSystemB) return 1;
        if (!isSystemA && isSystemB) return -1;

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
        dataAccess?: DataAccessLevel | null,
        editAccess?: EditAccessLevel | null,
        deleteAccess?: DeleteAccessLevel | null
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
                editAccess:
                    editAccess ?? nextPermissions[existingIndex].editAccess ?? null,
                deleteAccess:
                    deleteAccess ?? nextPermissions[existingIndex].deleteAccess ?? null,
            };
        } else {
            // Add new
            nextPermissions.push({
                id: "temp-" + permissionId,
                createdAt: new Date(),
                deletedAt: null,
                roleId: currentRole.id,
                permissionId,
                allow,
                dataAccess: dataAccess ?? null,
                editAccess: editAccess ?? null,
                deleteAccess: deleteAccess ?? null,
                permission: basePermission,
            });
        }

        // Clean up: if allow is false and no access settings, remove from list
        if (!allow && !dataAccess && !editAccess && !deleteAccess) {
            nextPermissions = nextPermissions.filter(
                (p) => p.permissionId !== permissionId
            );
        }

        // Update State
        setCurrentRole({ ...currentRole, permissions: nextPermissions });
        setIsSaving(true);

        try {
            const payload = nextPermissions.map((entry) => ({
                permissionId: entry.permissionId,
                allow: entry.allow,
                dataAccess: entry.dataAccess,
                editAccess: entry.editAccess,
                deleteAccess: entry.deleteAccess,
            }));

            const result = await updateRolePermissionsAction(
                currentRole.id,
                { permissions: payload },
            );

            if (!result.success) {
                notify("error", result.error || "Save failed");
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
                    deletedAt: null,
                    roleId: currentRole.id,
                    permissionId: id,
                    allow: false,
                    dataAccess: null,
                    editAccess: null,
                    deleteAccess: null,
                    permission: base,
                }),
                permissionId: id,
                allow: allow,
                // Preserve existing access settings
                dataAccess: existing?.dataAccess ?? null,
                editAccess: existing?.editAccess ?? null,
                deleteAccess: existing?.deleteAccess ?? null,
                permission: base,
            };
        });

        // Filter out strictly empty ones if allow=false
        const finalGroupPerms = newGroupPerms.filter(
            (p) => p.allow || p.dataAccess || p.editAccess || p.deleteAccess
        );

        const nextPermissions = [...otherPerms, ...finalGroupPerms];

        setCurrentRole({ ...currentRole, permissions: nextPermissions });
        setIsSaving(true);

        try {
            const payload = nextPermissions.map((p) => ({
                permissionId: p.permissionId,
                allow: p.allow,
                dataAccess: p.dataAccess,
                editAccess: p.editAccess,
                deleteAccess: p.deleteAccess,
            }));

            const result = await updateRolePermissionsAction(
                currentRole.id,
                { permissions: payload },
            );

            if (!result.success) {
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
        <TooltipProvider>
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
                                                toggleGroupPermissions(
                                                    groupPermissions,
                                                    !areAllSelected
                                                )
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
                                    {menuPermissions.length > 0 &&
                                        actionPermissions.length > 0 && (
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
        </TooltipProvider>
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
    onToggle: (
        id: string,
        allow: boolean,
        da?: DataAccessLevel | null,
        ea?: EditAccessLevel | null,
        dela?: DeleteAccessLevel | null
    ) => void;
    disabled: boolean;
}) {
    const entry = role.permissions.find((p) => p.permissionId === permission.id);
    const isChecked = entry?.allow ?? false;

    return (
        <div
            className={`flex flex-col gap-3 rounded-lg border p-3 transition-all ${isChecked
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
                <div className="pt-2 mt-auto border-t border-primary/10 space-y-3">
                    {/* View Scope */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Eye className="h-3 w-3 text-blue-500" />
                            <label className="text-[10px] font-bold uppercase text-blue-600/80">
                                ขอบเขตการมองเห็น
                            </label>
                        </div>
                        <Select
                            value={entry?.dataAccess ?? "VIEW_OWN"}
                            disabled={disabled}
                            onValueChange={(value) =>
                                onToggle(
                                    permission.id,
                                    true,
                                    value as DataAccessLevel,
                                    entry?.editAccess,
                                    entry?.deleteAccess
                                )
                            }
                        >
                            <SelectTrigger className="h-7 text-[11px] bg-white/50 border-blue-200">
                                <SelectValue placeholder="Select Scope" />
                            </SelectTrigger>
                            <SelectContent>
                                {DATA_ACCESS_OPTIONS.map((option) => (
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

                    {/* Edit Scope */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Pencil className="h-3 w-3 text-amber-500" />
                            <label className="text-[10px] font-bold uppercase text-amber-600/80">
                                ขอบเขตการแก้ไข
                            </label>
                        </div>
                        <Select
                            value={entry?.editAccess ?? "EDIT_NONE"}
                            disabled={disabled}
                            onValueChange={(value) =>
                                onToggle(
                                    permission.id,
                                    true,
                                    entry?.dataAccess,
                                    value as EditAccessLevel,
                                    entry?.deleteAccess
                                )
                            }
                        >
                            <SelectTrigger className="h-7 text-[11px] bg-white/50 border-amber-200">
                                <SelectValue placeholder="Select Scope" />
                            </SelectTrigger>
                            <SelectContent>
                                {EDIT_ACCESS_OPTIONS.map((option) => (
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

                    {/* Delete Scope */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Trash2 className="h-3 w-3 text-red-500" />
                            <label className="text-[10px] font-bold uppercase text-red-600/80">
                                ขอบเขตการลบ
                            </label>
                        </div>
                        <Select
                            value={entry?.deleteAccess ?? "DELETE_NONE"}
                            disabled={disabled}
                            onValueChange={(value) =>
                                onToggle(
                                    permission.id,
                                    true,
                                    entry?.dataAccess,
                                    entry?.editAccess,
                                    value as DeleteAccessLevel
                                )
                            }
                        >
                            <SelectTrigger className="h-7 text-[11px] bg-white/50 border-red-200">
                                <SelectValue placeholder="Select Scope" />
                            </SelectTrigger>
                            <SelectContent>
                                {DELETE_ACCESS_OPTIONS.map((option) => (
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
                </div>
            )}
        </div>
    );
}
