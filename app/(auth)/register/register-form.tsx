"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface CatalogRole {
  id: string;
  name: string;
  slug: string;
  permissions: { permission: { id: string; key: string; name: string } }[];
}

interface CatalogResponse {
  departments: { id: string; name: string }[];
  positions: { id: string; name: string; departmentId: string | null }[];
  roles: CatalogRole[];
}

const registerSchema = z.object({
  name: z.string().min(2, "กรอกชื่อให้ครบ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องอย่างน้อย 8 ตัว"),
  departmentId: z.string().min(1, "เลือกแผนก"),
  positionId: z.string().min(1, "เลือกตำแหน่ง"),
  roleId: z.string().min(1, "เลือก Role")
});

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      departmentId: "",
      positionId: "",
      roleId: ""
    }
  });

  useEffect(() => {
    fetch("/api/rbac/catalog")
      .then((response) => response.json())
      .then((data: CatalogResponse) => {
        setCatalog(data);
        setIsLoadingCatalog(false);
      })
      .catch(() => {
        setCatalog(null);
        setIsLoadingCatalog(false);
      });
  }, []);

  const departmentId = form.watch("departmentId");
  const positionId = form.watch("positionId");
  const roleId = form.watch("roleId");

  const availablePositions = useMemo(() => {
    if (!catalog) return [];
    if (!departmentId) {
      return catalog.positions;
    }
    return catalog.positions.filter((position) => position.departmentId === departmentId);
  }, [catalog, departmentId]);

  useEffect(() => {
    if (!positionId) return;
    const stillValid = availablePositions.some((position) => position.id === positionId);
    if (!stillValid) {
      form.setValue("positionId", "");
    }
  }, [availablePositions, positionId, form]);

  const selectedRole = useMemo(() => catalog?.roles.find((role) => role.id === roleId), [catalog, roleId]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "ไม่สามารถสร้างบัญชีได้");
      return;
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false
    });

    if (result?.ok) {
      router.push("/dashboard/aggregateReport");
      router.refresh();
    } else {
      router.push("/login");
    }
  });

  if (isLoadingCatalog) {
    return (
      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">สร้างบัญชีใหม่</h2>
        <p className="text-sm text-slate-500">กำลังโหลดข้อมูล RBAC...</p>
      </Card>
    );
  }

  if (!catalog) {
    return (
      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">สร้างบัญชีใหม่</h2>
        <p className="text-sm text-red-600">ไม่สามารถโหลดข้อมูล RBAC ได้ โปรดลองใหม่อีกครั้ง</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">สร้างบัญชีใหม่</h2>
        <p className="text-sm text-slate-500">เลือกแผนก / ตำแหน่ง / Role ตั้งแต่ขั้นตอนสมัคร</p>
      </div>
      <Form {...form}>
        <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อ-นามสกุล</FormLabel>
                  <FormControl>
                    <Input placeholder="Somsak Admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อีเมล</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่าน</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="อย่างน้อย 8 ตัว" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>แผนก</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกแผนก" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="positionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ตำแหน่ง</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกตำแหน่ง" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePositions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือก Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedRole ? (
              <div className="rounded border p-4">
                <p className="text-sm font-semibold">Permission จาก Role {selectedRole.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedRole.permissions.map((entry) => (
                    <Badge key={entry.permission.id} variant="outline">
                      {entry.permission.key}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
            </Button>
        </form>
      </Form>
    </Card>
  );
}
