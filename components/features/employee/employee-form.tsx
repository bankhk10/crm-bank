"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/companies";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";

interface EmployeeFormProps {
  employeeId?: string;
}

export default function EmployeeForm({ employeeId }: EmployeeFormProps) {
  const [formState, setFormState] = useState<Partial<Employee>>({});
  const [password, setPassword] = useState<string>("");
  const [roles, setRoles] = useState<Array<any>>([]);
  const [address, setAddress] = useState<{
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { allowed, isLoading } = usePermission("employee.manage");
  const canEdit = !isLoading && allowed;
  const permissionHint = "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อจัดการข้อมูลพนักงาน";

  useEffect(() => {
    let mounted = true;

    async function loadRoles() {
      try {
        const res = await fetch("/api/rbac/roles");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setRoles(data);
      } catch (e) {
        // ignore
      }
    }

    loadRoles();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const roleId = formState.role ?? undefined;
      const roleObj = roles.find((r) => r.id === roleId);

      const payload: any = {
        employee: {
          name: String(formState.name ?? "").trim(),
          email: String(formState.email ?? "").trim() || undefined,
          roleTitle: (formState.role && roleObj?.name) || undefined,
          phone: String(formState.phone ?? "").trim() || undefined
        }
      };

      if (address && (address.province || address.district || address.subdistrict || address.postalCode)) {
        payload.employee.address = address;
      }

      if (password) {
        payload.user = {
          email: String(formState.email ?? "").trim(),
          password: String(password),
          roleId: roleId
        };
      }

      const res = await fetch("/api/rbac/employees/create-with-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Server error");
      } else {
        setSuccess("สร้างพนักงานเรียบร้อยแล้ว");
        // reset form
        setFormState({});
        setPassword("");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      {!canEdit ? (
        <div className="md:col-span-2">
          <Alert variant="destructive">
            <AlertDescription>{permissionHint}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {error ? (
        <div className="md:col-span-2">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {success ? (
        <div className="md:col-span-2">
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Full name</span>
        <Input
          placeholder="Jane Doe"
          value={formState.name ?? ""}
          disabled={!canEdit}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, name: event.target.value }))
          }
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Email</span>
        <Input
          placeholder="jane@example.com"
          type="email"
          value={formState.email ?? ""}
          disabled={!canEdit}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, email: event.target.value }))
          }
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Password</span>
        <Input
          placeholder="Password for login"
          type="password"
          value={password}
          disabled={!canEdit}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Role</span>
        {roles.length ? (
          <select
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-6 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:opacity-50"
            value={formState.role ?? ""}
            disabled={!canEdit}
            onChange={(e) => setFormState((prev) => ({ ...prev, role: e.target.value }))}
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <Input
            placeholder="Account Executive"
            value={formState.role ?? ""}
            disabled={!canEdit}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, role: event.target.value }))
            }
          />
        )}
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Phone</span>
        <Input
          placeholder="(+66) 02-123-4567"
          value={formState.phone ?? ""}
          disabled={!canEdit}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, phone: event.target.value }))
          }
        />
      </label>
      <div className="md:col-span-2">
        <span className="block text-sm font-medium mb-2">ที่อยู่ (จังหวัด/อำเภอ/ตำบล)</span>
        <ThaiAddressPicker value={address} onChange={(next) => setAddress(next)} />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" disabled={!canEdit} title={!canEdit ? permissionHint : undefined}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!canEdit || loading}
          title={!canEdit ? permissionHint : undefined}
        >
          {loading ? "Saving..." : employeeId ? "Save changes" : "Create employee"}
        </Button>
      </div>
    </form>
  );
}
