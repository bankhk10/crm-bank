"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Department,
  Permission,
  Position,
  Role,
  RolePermission,
  User,
  UserPermissionOverride
} from "@prisma/client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { DataAccessLevel } from "@prisma/client";

interface SummaryResponse {
  departments: Department[];
  positions: (Position & { department: Department | null; defaultRole: Role | null })[];
  roles: (Role & { permissions: (RolePermission & { permission: Permission })[]; _count?: { userRoles: number } })[];
  permissions: Permission[];
  users: (User & {
    department: Department | null;
    position: Position | null;
    userRoles: { roleId: string; role: Role }[];
    permissionOverrides?: (UserPermissionOverride & { permission: Permission })[];
  })[];
}

const roleSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9_-]+$/),
  description: z.string().optional()
});

const permissionSchema = z.object({
  name: z.string().min(3),
  key: z.string().min(3),
  category: z.enum(["MENU", "ACTION", "DATA"]),
  resource: z.string().optional(),
  menuPath: z.string().optional(),
  action: z.string().optional(),
  defaultDataAccess: z.enum(["VIEW_OWN", "VIEW_DEPARTMENT", "VIEW_ALL"]).optional()
});

const departmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2)
});

const positionSchema = z.object({
  name: z.string().min(2),
  level: z.number().min(1).max(10),
  departmentId: z.string().optional()
});

const dataAccessOptions: { label: string; value: DataAccessLevel }[] = [
  { label: "เฉพาะฉัน", value: "VIEW_OWN" },
  { label: "แผนกเดียวกัน", value: "VIEW_DEPARTMENT" },
  { label: "ทั้งหมด", value: "VIEW_ALL" }
];

const notify = (type: "success" | "error", message: string) => {
  if (type === "error") {
    console.error(message);
  } else {
    console.log(message);
  }
};

export default function RBACConsole() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const roleForm = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", slug: "", description: "" }
  });

  const permissionForm = useForm<z.infer<typeof permissionSchema>>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
      key: "",
      category: "MENU",
      resource: "",
      menuPath: ""
    }
  });

  const departmentForm = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", code: "" }
  });

  const positionForm = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
    defaultValues: { name: "", level: 1, departmentId: undefined }
  });

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch("/api/rbac/summary", { cache: "no-store" });
    if (!response.ok) {
      setIsLoading(false);
      notify("error", "ไม่สามารถดึงข้อมูล RBAC ได้");
      return;
    }
    const payload: SummaryResponse = await response.json();
    setSummary(payload);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const selectedRole = useMemo(
    () => summary?.roles.find((role) => role.id === activeRoleId) ?? null,
    [summary, activeRoleId]
  );

  const selectedUser = useMemo(
    () => summary?.users.find((user) => user.id === activeUserId) ?? null,
    [summary, activeUserId]
  );

  const handleCreateRole = roleForm.handleSubmit(async (values) => {
    const response = await fetch("/api/rbac/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      notify("error", "สร้าง Role ไม่สำเร็จ");
      return;
    }

    notify("success", "สร้าง Role แล้ว");
    roleForm.reset();
    setRoleDialogOpen(false);
    fetchSummary();
  });

  const handleCreatePermission = permissionForm.handleSubmit(async (values) => {
    const response = await fetch("/api/rbac/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      notify("error", "สร้าง Permission ไม่สำเร็จ");
      return;
    }

    notify("success", "สร้าง Permission แล้ว");
    permissionForm.reset();
    setPermissionDialogOpen(false);
    fetchSummary();
  });

  const handleCreateDepartment = departmentForm.handleSubmit(async (values) => {
    const response = await fetch("/api/rbac/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      notify("error", "สร้าง Department ไม่สำเร็จ");
      return;
    }

    notify("success", "เพิ่ม Department แล้ว");
    departmentForm.reset();
    fetchSummary();
  });

  const handleCreatePosition = positionForm.handleSubmit(async (values) => {
    const response = await fetch("/api/rbac/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      notify("error", "สร้าง Position ไม่สำเร็จ");
      return;
    }

    notify("success", "เพิ่ม Position แล้ว");
    positionForm.reset();
    fetchSummary();
  });

  const togglePermission = async (permissionId: string, allow: boolean, dataAccess?: DataAccessLevel | null) => {
    if (!selectedRole) return;
    const existing = selectedRole.permissions.find((entry) => entry.permissionId === permissionId);
    const basePermission = existing?.permission ?? summary!.permissions.find((perm) => perm.id === permissionId)!;
    const next = selectedRole.permissions.filter((entry) => entry.permissionId !== permissionId);
    next.push({
      ...(existing ?? {
        id: "",
        createdAt: new Date(),
        roleId: selectedRole.id,
        permissionId,
        allow: false,
        dataAccess: null,
        permission: basePermission
      }),
      permissionId,
      roleId: selectedRole.id,
      allow,
      dataAccess: dataAccess ?? existing?.dataAccess ?? null,
      permission: basePermission
    });

    const response = await fetch(`/api/rbac/roles/${selectedRole.id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permissions: next.map((entry) => ({
          permissionId: entry.permissionId,
          allow: entry.allow,
          dataAccess: entry.dataAccess
        }))
      })
    });

    if (!response.ok) {
      notify("error", "อัปเดตสิทธิ์ไม่สำเร็จ");
      return;
    }

    notify("success", "บันทึกสิทธิ์เรียบร้อย");
    fetchSummary();
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าจะลบ Role นี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    const response = await fetch(`/api/rbac/roles/${roleId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      let msg = "ลบ Role ไม่สำเร็จ";
      try {
        const body = await response.json();
        if (body?.error) msg = body.error;
      } catch (_) {}
      notify("error", msg);
      return;
    }

    notify("success", "ลบ Role เรียบร้อย");
    // refresh data
    fetchSummary();
  };

  const handleUserRoleChange = async (roleId: string, checked: boolean) => {
    if (!selectedUser) return;
    const roleIds = new Set(selectedUser.userRoles.map((entry) => entry.roleId));
    if (checked) {
      roleIds.add(roleId);
    } else {
      roleIds.delete(roleId);
    }

    const response = await fetch(`/api/rbac/users/${selectedUser.id}/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleIds: Array.from(roleIds) })
    });

    if (!response.ok) {
      notify("error", "อัปเดต Role ผู้ใช้ล้มเหลว");
      return;
    }

    notify("success", "อัปเดต Role แล้ว");
    fetchSummary();
  };

  if (isLoading) {
    return <Card className="p-6">กำลังโหลดข้อมูล RBAC...</Card>;
  }

  if (!summary) {
    return <Card className="p-6 text-red-600">ไม่สามารถโหลดข้อมูล RBAC ได้</Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Role Management</h2>
            <p className="text-sm text-slate-500">จัดการ Role และกำหนด Permission</p>
          </div>
          <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
            <DialogTrigger asChild>
              <Button>เพิ่ม Role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>สร้าง Role</DialogTitle>
                <DialogDescription>กำหนดชื่อและ slug เพื่อใช้อ้างอิง</DialogDescription>
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
                          <Input placeholder="Manager" {...field} />
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
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="manager" {...field} />
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
                          <Input placeholder="สิทธิ์สำหรับหัวหน้าทีม" {...field} />
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
                    <Button type="submit">บันทึก</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>สิทธิ์ทั้งหมด</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.slice(0, 3).map((entry) => (
                        <Badge key={entry.permissionId} variant="secondary">
                          {entry.permission.key}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline">+{role.permissions.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setActiveRoleId(role.id)}
                        className="text-xs"
                      >
                        กำหนดสิทธิ์
                      </Button>
                      {/** Disable delete for protected roles or roles with assigned users */}
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-xs text-red-600"
                        title={
                          role.slug === "administrator"
                            ? "ไม่สามารถลบ role พื้นฐานได้"
                            : (role._count?.userRoles ?? 0) > 0
                            ? "มีผู้ใช้ผูกอยู่ ไม่สามารถลบได้"
                            : "ลบ Role"
                        }
                        disabled={role.slug === "administrator" || (role._count?.userRoles ?? 0) > 0}
                      >
                        ลบ
                      </Button>
                      {(role._count?.userRoles ?? 0) > 0 ? (
                        <Badge variant="warning">ผู้ใช้ {role._count?.userRoles}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {selectedRole ? (
          <Dialog open={Boolean(selectedRole)} onOpenChange={(open) => !open && setActiveRoleId(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Permission ของ {selectedRole.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {summary.permissions.map((permission) => {
                  const current = selectedRole.permissions.find((entry) => entry.permissionId === permission.id);
                  const isChecked = current?.allow ?? false;
                  return (
                    <div key={permission.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{permission.name}</p>
                        <p className="text-xs text-slate-500">{permission.key}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {permission.category === "DATA" ? (
                          <Select
                            value={current?.dataAccess ?? undefined}
                            onValueChange={(value) =>
                              togglePermission(permission.id, true, value as DataAccessLevel)
                            }
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue placeholder="เลือกระดับข้อมูล" />
                            </SelectTrigger>
                            <SelectContent>
                              {dataAccessOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                        <Switch
                          checked={isChecked}
                          onCheckedChange={(checked) => togglePermission(permission.id, checked)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Permission Management</h2>
            <p className="text-sm text-slate-500">เพิ่ม/ลบ Permission ที่ใช้ในระบบ</p>
          </div>
          <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">เพิ่ม Permission</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>สร้าง Permission</DialogTitle>
              </DialogHeader>
              <Form {...permissionForm}>
                <form className="space-y-4" onSubmit={handleCreatePermission}>
                  <FormField
                    control={permissionForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อ</FormLabel>
                        <FormControl>
                          <Input placeholder="Product Create" {...field} />
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
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                          <Input placeholder="product.create" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={permissionForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ประเภท</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกรายการ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MENU">MENU</SelectItem>
                              <SelectItem value="ACTION">ACTION</SelectItem>
                              <SelectItem value="DATA">DATA</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={permissionForm.control}
                    name="resource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource</FormLabel>
                        <FormControl>
                          <Input placeholder="product" {...field} />
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
                          <Input placeholder="/dashboard/products" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={permissionForm.control}
                    name="defaultDataAccess"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Access Default</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="ไม่กำหนด" />
                            </SelectTrigger>
                            <SelectContent>
                              {dataAccessOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
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
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {summary.permissions.map((permission) => (
            <Card key={permission.id} className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{permission.name}</p>
                  <p className="text-xs text-slate-500">{permission.key}</p>
                </div>
                <Badge variant="outline">{permission.category}</Badge>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                {permission.resource ? <p>Resource: {permission.resource}</p> : null}
                {permission.menuPath ? <p>Path: {permission.menuPath}</p> : null}
                {permission.defaultDataAccess ? (
                  <p>
                    Data Access: {
                      dataAccessOptions.find((option) => option.value === permission.defaultDataAccess)?.label
                    }
                  </p>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">ผู้ใช้และ Role</h2>
            <p className="text-sm text-slate-500">Mapping User ↔ Role และ Override เฉพาะบุคคล</p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {user.userRoles.map((entry) => (
                        <Badge key={entry.role.id} variant="success">
                          {entry.role.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet open={activeUserId === user.id} onOpenChange={(open) => setActiveUserId(open ? user.id : null)}>
                      <SheetTrigger asChild>
                        <Button variant="secondary" className="text-xs">
                          Manage Access
                        </Button>
                      </SheetTrigger>
                      {selectedUser?.id === user.id ? (
                        <SheetContent className="w-full max-w-xl overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>{user.name}</SheetTitle>
                            <SheetDescription>{user.email}</SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 space-y-6">
                            <section>
                              <h3 className="text-sm font-semibold">Roles</h3>
                              <div className="mt-3 space-y-2">
                                {summary.roles.map((role) => (
                                  <label key={role.id} className="flex items-center justify-between rounded border p-3">
                                    <div>
                                      <p className="font-medium">{role.name}</p>
                                      <p className="text-xs text-slate-500">{role.slug}</p>
                                    </div>
                                    <Checkbox
                                      checked={selectedUser.userRoles.some((entry) => entry.roleId === role.id)}
                                      onCheckedChange={(checked) => handleUserRoleChange(role.id, Boolean(checked))}
                                    />
                                  </label>
                                ))}
                              </div>
                            </section>
                            <section>
                              <h3 className="text-sm font-semibold">Permission Override</h3>
                              <p className="text-xs text-slate-500">(ตัวอย่างการเปิดใช้งานเท่านั้น)</p>
                              <div className="mt-2 rounded border p-3 text-sm text-slate-500">
                                ใช้ API /users/[id]/overrides เพื่อกำหนด Allow/Deny เฉพาะบุคคล
                              </div>
                            </section>
                          </div>
                        </SheetContent>
                      ) : null}
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Organization</h2>
            <p className="text-sm text-slate-500">Department / Position Management</p>
          </div>
          <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">เพิ่มแผนก / ตำแหน่ง</Button>
            </DialogTrigger>
            <DialogContent className="space-y-6">
              <div>
                <DialogHeader>
                  <DialogTitle>เพิ่ม Department</DialogTitle>
                </DialogHeader>
                <Form {...departmentForm}>
                  <form className="space-y-3" onSubmit={handleCreateDepartment}>
                    <FormField
                      control={departmentForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อ Department</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Customer Success" />
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
                          <FormLabel>โค้ด</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="CS" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">บันทึก Department</Button>
                  </form>
                </Form>
              </div>
              <div>
                <DialogHeader>
                  <DialogTitle>เพิ่ม Position</DialogTitle>
                </DialogHeader>
                <Form {...positionForm}>
                  <form className="space-y-3" onSubmit={handleCreatePosition}>
                    <FormField
                      control={positionForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อตำแหน่ง</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Sales Rep" />
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
                          <FormLabel>ระดับ</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={10} {...field} />
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
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกแผนก" />
                              </SelectTrigger>
                              <SelectContent>
                                {summary.departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">บันทึก Position</Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-semibold">Departments</h3>
            <div className="mt-3 space-y-2">
              {summary.departments.map((dept) => (
                <div key={dept.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{dept.name}</span>
                    <Badge variant="outline">{dept.code}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold">Positions</h3>
            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-2">
              {summary.positions.map((pos) => (
                <div key={pos.id} className="rounded border p-3 text-sm">
                  <p className="font-medium">
                    {pos.name} <span className="text-xs text-slate-500">(L{pos.level})</span>
                  </p>
                  <p className="text-xs text-slate-500">{pos.department?.name ?? "-"}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
