"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/companies";

interface EmployeeFormProps {
  employeeId?: string;
}

export default function EmployeeForm({ employeeId }: EmployeeFormProps) {
  const [formState, setFormState] = useState<Partial<Employee>>({});
  const { allowed, isLoading } = usePermission("employee.manage");
  const canEdit = !isLoading && allowed;
  const permissionHint = "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อจัดการข้อมูลพนักงาน";

  return (
    <form className="grid gap-4 md:grid-cols-2">
      {!canEdit ? (
        <div className="md:col-span-2">
          <Alert variant="destructive">
            <AlertDescription>{permissionHint}</AlertDescription>
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
        <span className="font-medium">Role</span>
        <Input
          placeholder="Account Executive"
          value={formState.role ?? ""}
          disabled={!canEdit}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, role: event.target.value }))
          }
        />
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
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" disabled={!canEdit} title={!canEdit ? permissionHint : undefined}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!canEdit}
          title={!canEdit ? permissionHint : undefined}
        >
          {employeeId ? "Save changes" : "Create employee"}
        </Button>
      </div>
    </form>
  );
}
