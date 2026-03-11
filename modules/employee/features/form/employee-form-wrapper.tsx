"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import EmployeeForm from "@/modules/employee/features/form/employee-form";
import {
    createEmployeeAction,
    updateEmployeeAction,
    getEmployeeAction,
} from "@/modules/employee/server/actions";
import { toast } from "sonner";

interface EmployeeFormWrapperProps {
    employeeId?: string;
}

export function EmployeeFormWrapper({ employeeId }: EmployeeFormWrapperProps) {
    const router = useRouter();
    const isEditMode = !!employeeId;

    const { hasPermission, isLoading } = usePermission("menu.employees");

    const permissionNeeded = isEditMode ? "employee.edit" : "employee.create";
    const canAccess = hasPermission(permissionNeeded);

    const [payload, setPayload] = useState<any>({});
    const [loading, setLoading] = useState(isEditMode);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isEditMode) return;

        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const res = await getEmployeeAction(employeeId);
                if (!res.success) throw new Error("error" in res ? res.error : "Failed to load");
                const src: any = ("employee" in res ? res.employee : null) || {};

                if (mounted) {
                    const mappedPayload = {
                        prefix: src.prefix ?? "",
                        firstName: src.firstName ?? src.name ?? "",
                        lastName: src.lastName ?? "",
                        email: src.email ?? "",
                        phone: src.phone ?? "",
                        birthDate: src.birthDate ? (src.birthDate instanceof Date ? src.birthDate.toISOString().split('T')[0] : String(src.birthDate).split('T')[0]) : "",
                        employeeCode: src.employeeCode ?? "",
                        position: src.positionId ?? src.position ?? "",
                        department: src.departmentId ?? src.department ?? "",
                        company: src.companyId ?? src.company?.id ?? "",
                        responsibilityArea: src.responsibilityArea ?? "",
                        managerId: src.managerId ?? src.manager?.id ?? "",
                        addressLine: src.addressLine ?? "",
                        province: src.province ?? src.provinceName ?? "",
                        district: src.district ?? "",
                        subdistrict: src.subdistrict ?? "",
                        postalCode: src.postalCode ?? src.zipCode ?? "",
                        status: src.status ?? "ACTIVE",
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
    }, [employeeId, isEditMode]);

    async function handleSubmit(payloadData: any) {
        if (!canAccess) return { success: false, error: "No permission" };
        setError(null);
        try {
            let res;
            if (isEditMode) {
                res = await updateEmployeeAction(employeeId, payloadData);
            } else {
                res = await createEmployeeAction(payloadData);
            }

            if (!res.success) {
                const issues = "issues" in res && typeof res.issues === "object" && res.issues !== null
                    ? (res.issues as Record<string, string[]>)
                    : undefined;
                return {
                    success: false,
                    issues,
                    error: "error" in res ? res.error : undefined,
                };
            }

            return { success: true };
        } catch (e: any) {
            return { success: false, error: String(e) };
        }
    }

    const title = isEditMode ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มข้อมูลพนักงานใหม่";

    return (
        <section className="space-y-6">
            <div className="bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="text-center">
                        <h5 className="font-semibold text-3xl my-5 border-b pb-6">
                            {title}
                        </h5>
                    </div>

                    {!isLoading && (!canAccess || error) && (
                        <div>
                            {!canAccess && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {isEditMode ? "คุณไม่มีสิทธิ์แก้ไขพนักงานนี้" : "คุณไม่มีสิทธิ์สร้างพนักงาน"}
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
                                const result = await handleSubmit(body);
                                if (result.success) {
                                    toast.success(isEditMode ? "บันทึกการแก้ไขเรียบร้อยแล้ว" : "สร้างพนักงานเรียบร้อยแล้ว");
                                    router.push(`/employee`);
                                }
                                return result;
                            }}
                            onCancel={() => router.push(`/employee`)}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
