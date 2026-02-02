"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import { EmployeeForm } from "@/features/employee";
import { Card } from "@/components/ui/card";

export default function EditEmployeePage() {
  const { employeeId } = useParams() as { employeeId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("employee.edit");
  const canEdit =
    !isLoading &&
    (hasPermission("employee.edit") ||
      hasPermission("employee.manage") ||
      hasPermission("menu.employees"));

  const [payload, setPayload] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/employee/${employeeId}`);

        if (!res.ok) throw new Error("Failed to load employee");
        const json = await res.json();
        const src = (json && (json.employee ?? json)) || {};

        if (mounted) {
          // Map API fields into the form's expected initial shape if needed
          const mappedPayload = {
            prefix: src.prefix ?? "",
            firstName: src.firstName ?? src.name ?? "",
            lastName: src.lastName ?? "",
            email: src.email ?? "",
            phone: src.phone ?? "",
            birthDate: src.birthDate ?? "",
            employeeCode: src.employeeCode ?? "",
            position: src.positionId ?? src.position ?? "",
            department: src.departmentId ?? src.department ?? "",
            company: src.companyId ?? src.company?.id ?? "",
            responsibilityArea: src.responsibilityArea ?? "",
            managerId: src.managerId ?? src.manager?.id ?? "",
            addressLine: src.addressLine ?? "",
            // Ensure address object is provided for the form's ThaiAddressPicker
            address:
              src.address ??
              ({
                province: src.province ?? src.provinceName ?? "",
                district: src.district ?? "",
                subdistrict: src.subdistrict ?? "",
                postalCode: src.postalCode ?? src.zipCode ?? "",
              } as any),
            status: src.status ?? "ACTIVE",
            // Try multiple places where role info may be stored:
            // - explicit roleDefinitionId on employee
            // - roleId on employee (legacy)
            // - linked user -> userRoles -> role.id (first assigned role)
            roleDefinitionId:
              src.roleDefinitionId ??
              src.roleId ??
              (src.user &&
                src.user.userRoles &&
                src.user.userRoles[0]?.role?.id) ??
              undefined,
          };
          setPayload(mappedPayload);
        }
      } catch (e: any) {
        if (mounted) setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  async function handleUpdate(payloadData: any) {
    if (!canEdit) return { success: false, error: "No permission" };
    try {
      const res = await fetch(`/api/employee/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadData), // Send full payload including user data
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
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              แก้ไขข้อมูลพนักงาน
            </h5>
          </div>

          {(!canEdit || error) && (
            <div>
              {!canEdit && (
                <Alert variant="destructive">
                  <AlertDescription>
                    คุณไม่มีสิทธิ์แก้ไขพนักงานนี้
                  </AlertDescription>
                </Alert>
              )}
              {error && (
                <div className="mt-3">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-2/5 bg-slate-200 rounded" />
              <div className="mt-4 h-4 w-3/5 bg-slate-200 rounded" />
            </div>
          ) : (
            <EmployeeForm
              employeeId={employeeId}
              initial={payload}

              onSubmit={async (body) => {
                const result = await handleUpdate(body);
                if (result.success) router.push(`/employee`);
                return result;
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
