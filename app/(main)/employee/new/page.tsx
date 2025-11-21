"use client";

import React, { useState } from "react";
import EmployeeForm from "@/components/features/employee/employee-form";
import Can from "@/components/rbac/Can";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { usePermission } from "@/hooks/use-permission";
import { useRouter } from "next/navigation";

export default function NewEmployeePage() {
  const { allowed, isLoading } = usePermission("employee.manage");
  const canCreate = !isLoading && allowed;
  const permissionHint =
    "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อสร้างพนักงานใหม่";
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [randomizeFn, setRandomizeFn] = useState<(() => void) | null>(null);

  async function handleCreate(payload: any) {
    setError(null);
    try {
      const res = await fetch(`/api/rbac/employees/create-with-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, issues: json?.issues, error: json?.error };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: String(e) };
    }
  }

  return (
    <section className="space-y-6">
      {/* <div className="flex justify-center mb-4">
        <Can permission="randomize">
          <button
            type="button"
            className="w-36 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl py-2"
            onClick={() => randomizeFn && randomizeFn()}
            disabled={!randomizeFn}
            title={!randomizeFn ? "รอโหลดฟอร์มก่อนใช้งาน" : undefined}
          >
            สุ่มกรอก
          </button>
        </Can>
      </div> */}
      {!canCreate ? (
        <Alert variant="destructive">
          <AlertDescription>{permissionHint}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl border-b pb-6">
              เพิ่มข้อมูลพนักงานใหม่
            </h5>
          </div>

          {error && (
            <div className="mt-3">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <EmployeeForm
            hideBorder
            registerRandomize={(fn) => setRandomizeFn(() => fn)}
            onSubmit={async (body) => {
              const result = await handleCreate(body);
              if (result.success) router.push(`/employee`);
              return result;
            }}
            onCancel={() => router.push(`/employee`)}
          />
        </div>
      </Card>
    </section>
  );
}
