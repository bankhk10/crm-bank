"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Shield,
    Users,
    Building2,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Settings,
    ShieldCheck,
    UserCog,
} from "lucide-react";

import type { RBACSummaryResponse } from "../../types";
import { DATA_ACCESS_OPTIONS } from "../../constants";
import {
    roleSchema,
    permissionSchema,
    departmentSchema,
    positionSchema,
    type RoleFormData,
    type PermissionFormData,
    type DepartmentFormData,
    type PositionFormData,
} from "../../application/validations";
import {
    getRBACSummaryAction,
    createRoleAction,
    deleteRoleAction,
    createPermissionAction,
    updatePermissionAction,
    deletePermissionAction,
    createDepartmentAction,
    updateDepartmentAction,
    deleteDepartmentAction,
    createPositionAction,
    updatePositionAction,
    deletePositionAction,
    updateUserRolesAction,
} from "../../server/actions";

const notify = (type: "success" | "error", message: string) => {
    if (type === "error") {
        console.error(message);
    } else {
        console.log(message);
    }
};

export default function RBACConsole() {
    const [summary, setSummary] = useState<RBACSummaryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
    const [editingPermissionId, setEditingPermissionId] = useState<string | null>(
        null
    );
    const [deptDialogOpen, setDeptDialogOpen] = useState(false);
    const [posDialogOpen, setPosDialogOpen] = useState(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(
        null
    );
    const [editingPositionId, setEditingPositionId] = useState<string | null>(
        null
    );
    const [apiMessage, setApiMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const [activeUserId, setActiveUserId] = useState<string | null>(null);

    const roleForm = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: "", slug: "", description: "" },
    });

    const permissionForm = useForm<PermissionFormData>({
        resolver: zodResolver(permissionSchema),
        defaultValues: {
            name: "",
            key: "",
            category: "MENU",
            resource: "",
            menuPath: "",
        },
    });

    const departmentForm = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
        defaultValues: { name: "", code: "" },
    });

    const positionForm = useForm<PositionFormData>({
        resolver: zodResolver(positionSchema),
        defaultValues: { name: "", level: 1, departmentId: undefined },
    });

    const fetchSummary = useCallback(async () => {
        try {
            const result = await getRBACSummaryAction();
            if (!result.success) {
                notify("error", result.error || "ไม่สามารถดึงข้อมูล RBAC ได้");
                return;
            }
            setSummary(result.data as RBACSummaryResponse);
        } catch (error) {
            console.error("Fetch RBAC summary failed:", error);
            notify("error", "เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูล");
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    // Use a separate function for refreshing that explicitly sets loading
    const refreshSummary = useCallback(async () => {
        setIsLoading(true);
        await fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const showApiMessage = (type: "success" | "error", text: string) => {
        setApiMessage({ type, text });
        // auto-clear after 4s
        setTimeout(() => setApiMessage(null), 4000);
    };

    // Handle Dialog/Form resets in event handlers instead of useEffect 
    // to avoid cascading renders and "setState in effect" warnings.

    const openRoleDialog = () => {
        roleForm.reset({ name: "", slug: "", description: "" });
        setRoleDialogOpen(true);
    };

    const openPermissionDialog = (permission: any = null) => {
        if (permission) {
            setEditingPermissionId(permission.id);
            permissionForm.reset({
                name: permission.name,
                key: permission.key,
                category: permission.category,
                resource: permission.resource ?? "",
                menuPath: permission.menuPath ?? "",
                defaultDataAccess: (permission.defaultDataAccess as any) ?? undefined,
            });
        } else {
            setEditingPermissionId(null);
            permissionForm.reset({
                name: "",
                key: "",
                category: "MENU",
                resource: "",
                menuPath: "",
            });
        }
        setPermissionDialogOpen(true);
    };

    const openDepartmentDialog = (dept: any = null) => {
        if (dept) {
            setEditingDepartmentId(dept.id);
            departmentForm.reset({ name: dept.name, code: dept.code });
        } else {
            setEditingDepartmentId(null);
            departmentForm.reset({ name: "", code: "" });
        }
        setDeptDialogOpen(true);
    };

    const openPositionDialog = (pos: any = null) => {
        if (pos) {
            setEditingPositionId(pos.id);
            positionForm.reset({
                name: pos.name,
                level: pos.level,
                departmentId: pos.departmentId ?? undefined,
            });
        } else {
            setEditingPositionId(null);
            positionForm.reset({ name: "", level: 1, departmentId: undefined });
        }
        setPosDialogOpen(true);
    };

    const selectedUser = useMemo(
        () => summary?.users.find((user) => user.id === activeUserId) ?? null,
        [summary, activeUserId]
    );

    // derive sorted lists so UI stays ordered immediately after creates
    const sortedRoles = useMemo(() => {
        if (!summary) return [] as RBACSummaryResponse["roles"];
        return [...summary.roles].sort((a, b) => {
            const ta = new Date((a as any).createdAt).getTime();
            const tb = new Date((b as any).createdAt).getTime();
            return tb - ta; // newest first
        });
    }, [summary]);

    const sortedPermissions = useMemo(() => {
        if (!summary) return [] as RBACSummaryResponse["permissions"];
        return [...summary.permissions].sort((a, b) => {
            const ta = new Date((a as any).createdAt).getTime();
            const tb = new Date((b as any).createdAt).getTime();
            return tb - ta; // newest first
        });
    }, [summary]);

    const sortedDepartments = useMemo(() => {
        if (!summary) return [] as RBACSummaryResponse["departments"];
        return [...summary.departments].sort((a, b) => {
            const ta = new Date((a as any).createdAt).getTime();
            const tb = new Date((b as any).createdAt).getTime();
            return tb - ta; // newest first
        });
    }, [summary]);

    const sortedPositions = useMemo(() => {
        if (!summary) return [] as RBACSummaryResponse["positions"];
        return [...summary.positions].sort((a, b) => {
            const ta = new Date((a as any).createdAt).getTime();
            const tb = new Date((b as any).createdAt).getTime();
            return tb - ta; // newest first
        });
    }, [summary]);

    const handleCreateRole = roleForm.handleSubmit(async (values) => {
        try {
            const result = await createRoleAction(values);
            if (!result.success) {
                showApiMessage("error", result.error || "สร้าง Role ไม่สำเร็จ");
                return;
            }
            showApiMessage("success", "สร้าง Role แล้ว");
            setRoleDialogOpen(false);
            refreshSummary();
        } catch (_) {
            showApiMessage("error", "สร้าง Role ไม่สำเร็จ");
        }
    });

    const handleSavePermission = permissionForm.handleSubmit(async (values) => {
        try {
            if (editingPermissionId) {
                const result = await updatePermissionAction(editingPermissionId, values);
                if (!result.success) {
                    showApiMessage("error", result.error || "แก้ไข Permission ไม่สำเร็จ");
                    return;
                }
                showApiMessage("success", "แก้ไข Permission แล้ว");
            } else {
                const result = await createPermissionAction(values);
                if (!result.success) {
                    showApiMessage("error", result.error || "สร้าง Permission ไม่สำเร็จ");
                    return;
                }
                showApiMessage("success", "สร้าง Permission แล้ว");
            }
            setPermissionDialogOpen(false);
            refreshSummary();
        } catch (_) {
            showApiMessage("error", editingPermissionId ? "แก้ไข Permission ไม่สำเร็จ" : "สร้าง Permission ไม่สำเร็จ");
        }
    });

    const handleEditPermission = (permission: any) => {
        openPermissionDialog(permission);
    };

    const handleDeletePermission = async (permissionId: string) => {
        if (
            !confirm(
                "คุณแน่ใจหรือไม่ที่จะลบ Permission นี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
            )
        )
            return;

        try {
            const result = await deletePermissionAction(permissionId);
            if (!result.success) {
                showApiMessage("error", result.error || "ลบ Permission ไม่สำเร็จ");
                return;
            }
            showApiMessage("success", "ลบ Permission เรียบร้อย");
            refreshSummary();
        } catch (_) {
            showApiMessage("error", "ลบ Permission ไม่สำเร็จ");
        }
    };

    const handleCreateDepartment = departmentForm.handleSubmit(async (values) => {
        try {
            if (editingDepartmentId) {
                const result = await updateDepartmentAction(editingDepartmentId, values);
                if (!result.success) {
                    showApiMessage("error", result.error || "แก้ไข Department ไม่สำเร็จ");
                    return;
                }
                showApiMessage("success", "แก้ไข Department แล้ว");
            } else {
                const result = await createDepartmentAction(values);
                if (!result.success) {
                    showApiMessage("error", result.error || "สร้าง Department ไม่สำเร็จ");
                    return;
                }
                showApiMessage("success", "เพิ่ม Department แล้ว");
            }
            setDeptDialogOpen(false);
            refreshSummary();
        } catch (_) {
            showApiMessage("error", editingDepartmentId ? "แก้ไข Department ไม่สำเร็จ" : "สร้าง Department ไม่สำเร็จ");
        }
    });

    const handleCreatePosition = positionForm.handleSubmit(async (values) => {
        try {
            if (editingPositionId) {
                const result = await updatePositionAction(editingPositionId, values);
                if (!result.success) {
                    showApiMessage("error", result.error || "แก้ไข Position ไม่สำเร็จ");
                    return;
                }
                showApiMessage("success", "แก้ไข Position แล้ว");
            } else {
                const result = await createPositionAction(values);
                if (!result.success) {
                    showApiMessage("error", result.error || "สร้าง Position ไม่สำเร็จ");
                    return;
                }
                showApiMessage("success", "เพิ่ม Position แล้ว");
            }
            setPosDialogOpen(false);
            refreshSummary();
        } catch (_) {
            showApiMessage("error", editingPositionId ? "แก้ไข Position ไม่สำเร็จ" : "สร้าง Position ไม่สำเร็จ");
        }
    });

    const handleEditDepartment = (dept: any) => {
        openDepartmentDialog(dept);
    };

    const handleDeleteDepartment = async (departmentId: string) => {
        if (
            !confirm(
                "คุณแน่ใจหรือไม่ที่จะลบ Department นี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
            )
        )
            return;

        try {
            const result = await deleteDepartmentAction(departmentId);
            if (!result.success) {
                showApiMessage("error", result.error || "ลบ Department ไม่สำเร็จ");
                return;
            }
            showApiMessage("success", "ลบ Department เรียบร้อย");
            refreshSummary();
        } catch (_) {
            showApiMessage("error", "ลบ Department ไม่สำเร็จ");
        }
    };

    const handleEditPosition = (pos: any) => {
        openPositionDialog(pos);
    };

    const handleDeletePosition = async (positionId: string) => {
        if (
            !confirm(
                "คุณแน่ใจหรือไม่ที่จะลบ Position นี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
            )
        )
            return;

        try {
            const result = await deletePositionAction(positionId);
            if (!result.success) {
                showApiMessage("error", result.error || "ลบ Position ไม่สำเร็จ");
                return;
            }
            showApiMessage("success", "ลบ Position เรียบร้อย");
            refreshSummary();
        } catch (_) {
            showApiMessage("error", "ลบ Position ไม่สำเร็จ");
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (
            !confirm(
                "คุณแน่ใจหรือไม่ว่าจะลบ Role นี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
            )
        )
            return;

        try {
            const result = await deleteRoleAction(roleId);
            if (!result.success) {
                showApiMessage("error", result.error || "ลบ Role ไม่สำเร็จ");
                return;
            }
            showApiMessage("success", "ลบ Role เรียบร้อย");
            refreshSummary();
        } catch (_) {
            showApiMessage("error", "ลบ Role ไม่สำเร็จ");
        }
    };

    const handleUserRoleChange = async (roleId: string, checked: boolean) => {
        if (!selectedUser) return;
        const roleIds = new Set(
            selectedUser.userRoles.map((entry) => entry.roleId)
        );
        if (checked) {
            roleIds.add(roleId);
        } else {
            roleIds.delete(roleId);
        }

        try {
            const result = await updateUserRolesAction(selectedUser.id, { roleIds: Array.from(roleIds) });
            if (!result.success) {
                notify("error", result.error || "อัปเดต Role ผู้ใช้ล้มเหลว");
                return;
            }
            notify("success", "อัปเดต Role แล้ว");
            refreshSummary();
        } catch (_) {
            notify("error", "อัปเดต Role ผู้ใช้ล้มเหลว");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="animate-pulse text-muted-foreground">
                    กำลังโหลดข้อมูล RBAC...
                </p>
            </div>
        );
    }

    if (!summary) {
        return (
            <Card className="border-destructive/50 bg-destructive/10 p-6">
                <div className="flex items-center gap-4 text-destructive">
                    <Shield className="h-8 w-8" />
                    <h2 className="text-lg font-semibold">
                        ไม่สามารถโหลดข้อมูล RBAC ได้
                    </h2>
                </div>
            </Card>
        );
    }

    return (
        <div className="min-h-screen space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        RBAC Console
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        ศูนย์กลางการจัดการสิทธิ์การเข้าถึง (Access Control), บทบาทหน้าที่
                        (Roles) และโครงสร้างองค์กร (Organization)
                    </p>
                </div>
                {apiMessage && (
                    <Alert
                        variant={apiMessage.type === "error" ? "destructive" : "default"}
                        className="w-full md:w-auto md:min-w-[300px] animate-in slide-in-from-right-5 fade-in"
                    >
                        <AlertTitle>
                            {apiMessage.type === "error" ? "ข้อผิดพลาด" : "สำเร็จ"}
                        </AlertTitle>
                        <AlertDescription>{apiMessage.text}</AlertDescription>
                    </Alert>
                )}
            </div>

            <Tabs defaultValue="roles" className="space-y-6">
                <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:mx-0 md:px-0">
                    <TabsList className="grid w-full grid-cols-3 md:w-[500px]">
                        <TabsTrigger value="roles" className="gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Roles & Permissions</span>
                            <span className="sm:hidden">Roles</span>
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2">
                            <Users className="h-4 w-4" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="org" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Organization</span>
                            <span className="sm:hidden">Org</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* =========================================================================
            TAB: ROLES & PERMISSIONS
           ========================================================================= */}
                <TabsContent value="roles" className="space-y-8">
                    {/* Roles Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight">Roles</h2>
                                <p className="text-sm text-muted-foreground">
                                    บทบาทและกลุ่มสิทธิ์ในระบบ
                                </p>
                            </div>
                            <Dialog open={roleDialogOpen} onOpenChange={(open) => {
                                if (!open) setRoleDialogOpen(false);
                            }}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 shadow-sm" onClick={openRoleDialog}>
                                        <Plus className="h-4 w-4" />
                                        เพิ่ม Role
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>สร้าง Role ใหม่</DialogTitle>
                                        <DialogDescription>
                                            ตั้งชื่อและกำหนด Slug สำหรับใช้อ้างอิงในระบบ
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...roleForm}>
                                        <form className="space-y-4" onSubmit={handleCreateRole}>
                                            <FormField
                                                control={roleForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>ชื่อ Role</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="เช่น: HR Manager"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={roleForm.control}
                                                name="slug"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Slug (System Name)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="เช่น: hr_manager"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={roleForm.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>คำอธิบาย</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="รายละเอียดหน้าที่ความรับผิดชอบ"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="ghost" type="button">
                                                        ยกเลิก
                                                    </Button>
                                                </DialogClose>
                                                <Button type="submit">สร้าง Role</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {sortedRoles.map((role) => (
                                <Card
                                    key={role.id}
                                    className="group relative overflow-hidden transition-all hover:shadow-md"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg font-bold">
                                                    {role.name}
                                                </CardTitle>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {role.slug}
                                                </Badge>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/rbac/${role.id}`}>
                                                            <Settings className="mr-2 h-4 w-4" /> กำหนดสิทธิ์
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteRole(role.id)}
                                                        className="text-red-600 focus:text-red-600"
                                                        disabled={
                                                            role.slug === "administrator" ||
                                                            (role._count?.userRoles ?? 0) > 0
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> ลบ Role
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <p className="line-clamp-2 text-sm text-muted-foreground min-h-[40px]">
                                            {role.description || "ไม่มีคำอธิบาย"}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Badge
                                                variant="secondary"
                                                className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            >
                                                {role.permissions.length} Permissions
                                            </Badge>
                                            {(role._count?.userRoles ?? 0) > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-200 bg-amber-50 text-amber-700"
                                                >
                                                    {role._count?.userRoles} Users
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                </Card>
                            ))}
                        </div>
                    </section>

                    <div className="my-8 border-t" />

                    {/* Permissions Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight">
                                    Permissions
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    รายการสิทธิ์ทั้งหมดที่สามารถเรียกใช้ได้
                                </p>
                            </div>
                            <Dialog
                                open={permissionDialogOpen}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        setPermissionDialogOpen(false);
                                        setEditingPermissionId(null);
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => openPermissionDialog()}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> เพิ่ม Permission
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingPermissionId
                                                ? "แก้ไข Permission"
                                                : "สร้าง Permission"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <Form {...permissionForm}>
                                        <form className="space-y-4" onSubmit={handleSavePermission}>
                                            <FormField
                                                control={permissionForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>ชื่อ Permission</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="เช่น: Create Product"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={permissionForm.control}
                                                name="key"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Key (Unique Identifier)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="เช่น: product.create"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={permissionForm.control}
                                                    name="category"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>หมวดหมู่</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="เลือก..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="MENU">MENU</SelectItem>
                                                                    <SelectItem value="ACTION">ACTION</SelectItem>
                                                                    <SelectItem value="DATA">DATA</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={permissionForm.control}
                                                    name="defaultDataAccess"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Data Access</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                value={field.value || undefined}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="None" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {DATA_ACCESS_OPTIONS.map((option) => (
                                                                        <SelectItem
                                                                            key={option.value}
                                                                            value={option.value}
                                                                        >
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={permissionForm.control}
                                                    name="resource"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Resource</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="products" {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={permissionForm.control}
                                                    name="menuPath"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Menu Path</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="/dashboard/..."
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="ghost" type="button">
                                                        ยกเลิก
                                                    </Button>
                                                </DialogClose>
                                                <Button type="submit">บันทึก</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {sortedPermissions.map((permission) => (
                                <Card key={permission.id} className="border-slate-200 text-sm">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold">{permission.name}</span>
                                                <span className="font-mono text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                    {permission.key}
                                                </span>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                    >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleEditPermission(permission as any)
                                                        }
                                                    >
                                                        <Edit className="mr-2 h-3 w-3" /> แก้ไข
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() =>
                                                            handleDeletePermission(permission.id)
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-3 w-3" /> ลบ
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                                    Category
                                                </span>
                                                <span>{permission.category}</span>
                                            </div>
                                            {permission.resource && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                                        Resource
                                                    </span>
                                                    <span>{permission.resource}</span>
                                                </div>
                                            )}
                                            {permission.menuPath && (
                                                <div className="flex flex-col col-span-2">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                                        Path
                                                    </span>
                                                    <span className="truncate">
                                                        {permission.menuPath}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                </TabsContent>

                {/* =========================================================================
            TAB: USERS
           ========================================================================= */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Role Assignments</CardTitle>
                            <CardDescription>
                                จัดการบทบาท (Roles) ของผู้ใช้งานแต่ละคนในระบบ
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Mobile View */}
                            <div className="block md:hidden space-y-4">
                                {summary.users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="border rounded-lg p-4 space-y-3"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            </div>
                                            <Sheet
                                                open={activeUserId === user.id}
                                                onOpenChange={(open) =>
                                                    setActiveUserId(open ? user.id : null)
                                                }
                                            >
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-8">
                                                        <UserCog className="h-4 w-4" />
                                                    </Button>
                                                </SheetTrigger>
                                                {/* Shared Sheet Content */}
                                                {selectedUser?.id === user.id && (
                                                    <SheetContent className="w-full max-w-md overflow-y-auto">
                                                        <SheetHeader>
                                                            <SheetTitle>จัดการสิทธิ์: {user.name}</SheetTitle>
                                                            <SheetDescription>{user.email}</SheetDescription>
                                                        </SheetHeader>
                                                        <div className="mt-6 space-y-6">
                                                            <div className="space-y-4">
                                                                <h3 className="font-medium flex items-center gap-2">
                                                                    <Shield className="h-4 w-4" /> Roles
                                                                </h3>
                                                                {sortedRoles.map((role) => (
                                                                    <div
                                                                        key={role.id}
                                                                        className="flex items-center justify-between rounded-md border p-3 shadow-sm"
                                                                    >
                                                                        <div>
                                                                            <p className="font-medium text-sm">
                                                                                {role.name}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {role.slug}
                                                                            </p>
                                                                        </div>
                                                                        <Switch
                                                                            checked={selectedUser.userRoles.some(
                                                                                (entry) => entry.roleId === role.id
                                                                            )}
                                                                            onCheckedChange={(checked) =>
                                                                                handleUserRoleChange(
                                                                                    role.id,
                                                                                    Boolean(checked)
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </SheetContent>
                                                )}
                                            </Sheet>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {user.userRoles.length === 0 && (
                                                <span className="text-xs text-muted-foreground italic">
                                                    ไม่มี Role
                                                </span>
                                            )}
                                            {user.userRoles.map((entry) => (
                                                <Badge
                                                    key={entry.role.id}
                                                    variant="secondary"
                                                    className="bg-emerald-50 text-emerald-700 border-emerald-200"
                                                >
                                                    {entry.role.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Assigned Roles</TableHead>
                                            <TableHead className="text-right">Manage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summary.users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    {user.name}
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.userRoles.map((entry) => (
                                                            <Badge
                                                                key={entry.role.id}
                                                                variant="outline"
                                                                className="bg-emerald-50 text-emerald-700 border-emerald-100"
                                                            >
                                                                {entry.role.name}
                                                            </Badge>
                                                        ))}
                                                        {user.userRoles.length === 0 && (
                                                            <span className="text-muted-foreground text-xs italic">
                                                                No roles
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Sheet
                                                        open={activeUserId === user.id}
                                                        onOpenChange={(open) =>
                                                            setActiveUserId(open ? user.id : null)
                                                        }
                                                    >
                                                        <SheetTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <UserCog className="h-4 w-4 mr-2" /> Manage
                                                                Access
                                                            </Button>
                                                        </SheetTrigger>
                                                        {selectedUser?.id === user.id && (
                                                            <SheetContent className="w-[400px] overflow-y-auto">
                                                                <SheetHeader>
                                                                    <SheetTitle>
                                                                        จัดการสิทธิ์: {user.name}
                                                                    </SheetTitle>
                                                                    <SheetDescription>
                                                                        {user.email}
                                                                    </SheetDescription>
                                                                </SheetHeader>
                                                                <div className="mt-8 space-y-6">
                                                                    <div className="space-y-3">
                                                                        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                                                                            Roles Assignment
                                                                        </h3>
                                                                        <div className="space-y-2">
                                                                            {sortedRoles.map((role) => {
                                                                                const isAssigned =
                                                                                    selectedUser.userRoles.some(
                                                                                        (entry) => entry.roleId === role.id
                                                                                    );
                                                                                return (
                                                                                    <div
                                                                                        key={role.id}
                                                                                        className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${isAssigned
                                                                                            ? "bg-primary/5 border-primary/20"
                                                                                            : "bg-transparent"
                                                                                            }`}
                                                                                    >
                                                                                        <div className="space-y-0.5">
                                                                                            <p className="font-medium text-sm">
                                                                                                {role.name}
                                                                                            </p>
                                                                                            <p className="text-xs text-muted-foreground">
                                                                                                {role.slug}
                                                                                            </p>
                                                                                        </div>
                                                                                        <Switch
                                                                                            checked={isAssigned}
                                                                                            onCheckedChange={(checked) =>
                                                                                                handleUserRoleChange(
                                                                                                    role.id,
                                                                                                    Boolean(checked)
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </SheetContent>
                                                        )}
                                                    </Sheet>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* =========================================================================
            TAB: ORGANIZATION
           ========================================================================= */}
                <TabsContent value="org" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Departments */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div className="space-y-1">
                                    <CardTitle>Departments</CardTitle>
                                    <CardDescription>แผนกในองค์กร</CardDescription>
                                </div>
                                <Dialog open={deptDialogOpen} onOpenChange={(open) => {
                                    if (!open) {
                                        setDeptDialogOpen(false);
                                        setEditingDepartmentId(null);
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDepartmentDialog()}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> เพิ่มแผนก
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingDepartmentId ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <Form {...departmentForm}>
                                            <form
                                                className="space-y-4"
                                                onSubmit={handleCreateDepartment}
                                            >
                                                <FormField
                                                    control={departmentForm.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>ชื่อแผนก</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="เช่น: Marketing"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={departmentForm.control}
                                                    name="code"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>รหัสแผนก</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="เช่น: MKT" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <DialogFooter>
                                                    <Button type="submit">บันทึก</Button>
                                                </DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {sortedDepartments.length === 0 && (
                                        <p className="text-sm text-center py-4 text-muted-foreground">
                                            ยังไม่มีข้อมูลแผนก
                                        </p>
                                    )}
                                    {sortedDepartments.map((dept) => (
                                        <div
                                            key={dept.id}
                                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium">{dept.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {dept.code}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleEditDepartment(dept as any)}
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteDepartment(dept.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Positions */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div className="space-y-1">
                                    <CardTitle>Positions</CardTitle>
                                    <CardDescription>ตำแหน่งงาน</CardDescription>
                                </div>
                                <Dialog open={posDialogOpen} onOpenChange={(open) => {
                                    if (!open) {
                                        setPosDialogOpen(false);
                                        setEditingPositionId(null);
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openPositionDialog()}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> เพิ่มตำแหน่ง
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingPositionId
                                                    ? "แก้ไขตำแหน่ง"
                                                    : "เพิ่มตำแหน่งใหม่"}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <Form {...positionForm}>
                                            <form
                                                className="space-y-4"
                                                onSubmit={handleCreatePosition}
                                            >
                                                <FormField
                                                    control={positionForm.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>ชื่อตำแหน่ง</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="เช่น: Senior Developer"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={positionForm.control}
                                                    name="level"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Level (1-10)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={10}
                                                                    {...field}
                                                                    onChange={(e) =>
                                                                        field.onChange(parseInt(e.target.value))
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={positionForm.control}
                                                    name="departmentId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>สังกัดแผนก</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                value={field.value || undefined}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="เลือกแผนก" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {sortedDepartments.map((d) => (
                                                                        <SelectItem key={d.id} value={d.id}>
                                                                            {d.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <DialogFooter>
                                                    <Button type="submit">บันทึก</Button>
                                                </DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                    {sortedPositions.length === 0 && (
                                        <p className="text-sm text-center py-4 text-muted-foreground">
                                            ยังไม่มีข้อมูลตำแหน่ง
                                        </p>
                                    )}
                                    {sortedPositions.map((pos) => (
                                        <div
                                            key={pos.id}
                                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{pos.name}</p>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] h-5 px-1.5 rounded-full"
                                                    >
                                                        L{pos.level}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {pos.department?.name || "ไม่ระบุแผนก"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleEditPosition(pos as any)}
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeletePosition(pos.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
