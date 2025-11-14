"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import FloatingLabelInput from "@/components/custom/FloatingLabelInput";
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
          phone: String(formState.phone ?? "").trim() || undefined,
        },
      };

      if (address && (address.province || address.district || address.subdistrict || address.postalCode)) {
        payload.employee.address = address;
      }

      if (password) {
        payload.user = {
          email: String(formState.email ?? "").trim(),
          password: String(password),
          roleId: roleId,
        };
      }

      const res = await fetch("/api/rbac/employees/create-with-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="bg-white shadow-sm sm:rounded-lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">ข้อมูลพนักงาน</h2>
            <p className="text-sm text-muted-foreground">กรอกข้อมูลพื้นฐานของพนักงาน</p>
          </div>
        </div>

        {/* Alerts */}
        {(!canEdit || error || success) && (
          <div>
            {!canEdit ? (
              <Alert variant="destructive">
                <AlertDescription>{permissionHint}</AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <div className="mt-3">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : null}
            {success ? (
              <div className="mt-3">
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </div>
            ) : null}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FloatingLabelInput
              label="Full name"
              placeholder="Jane Doe"
              value={formState.name ?? ""}
              disabled={!canEdit}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>

          <div>
            <FloatingLabelInput
              label="Email"
              type="email"
              placeholder="jane@example.com"
              value={formState.email ?? ""}
              disabled={!canEdit}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </div>

          <div>
            <FloatingLabelInput
              label="Password"
              type="password"
              placeholder="Password for login"
              value={password}
              disabled={!canEdit}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน</p>
          </div>

          <div>
            <label className="sr-only">Role</label>
            {roles.length ? (
              <FloatingLabelInput
                label="Role"
                type="select"
                options={roles.map((r: any) => ({ value: r.id, label: r.name }))}
                value={formState.role ?? ""}
                disabled={!canEdit}
                onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
                  setFormState((prev) => ({ ...prev, role: (e.target as HTMLSelectElement).value }))
                }
              />
            ) : (
              <FloatingLabelInput
                label="Role"
                placeholder="Account Executive"
                value={formState.role ?? ""}
                disabled={!canEdit}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setFormState((prev) => ({ ...prev, role: event.target.value }))
                }
              />
            )}
          </div>

          <div>
            <FloatingLabelInput
              label="Phone"
              placeholder="(+66) 02-123-4567"
              value={formState.phone ?? ""}
              disabled={!canEdit}
              prefix="+66"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่ (จังหวัด / อำเภอ / ตำบล)</label>
            <div className="rounded-lg border p-3 bg-gray-50">
              <ThaiAddressPicker value={address} onChange={(next) => setAddress(next)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" disabled={!canEdit} title={!canEdit ? permissionHint : undefined}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canEdit || loading} title={!canEdit ? permissionHint : undefined}>
            {loading ? "Saving..." : employeeId ? "Save changes" : "Create employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}
