"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import CompanyForm from "@/modules/companies/features/form/company-form";
import { createCompanyAction, updateCompanyAction, getCompanyAction } from "@/modules/companies/server/actions";
import { toast } from "sonner";

interface CompanyFormWrapperProps {
    companyId?: string;
}

export function CompanyFormWrapper({ companyId }: CompanyFormWrapperProps) {
    const router = useRouter();
    const isEditMode = !!companyId;

    const permissionNeeded = isEditMode ? "company.edit" : "company.create";
    const { hasPermission, isLoading: checkingPermission } = usePermission(permissionNeeded);
    const canAccess = hasPermission(permissionNeeded);

    const [payload, setPayload] = useState<any>({
        name: "",
        companyCode: "",
        shortName: "",
        email: "",
        phone: "",
        taxId: "",
        addressLine: "",
        province: "",
        district: "",
        subdistrict: "",
        postalCode: "",
        status: "ACTIVE",
    });

    const [loading, setLoading] = useState(isEditMode);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isEditMode) return;

        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const res = await getCompanyAction(companyId);
                if (!res.success || !res.company) throw new Error(res.error || "Failed to load company");

                const src = res.company;
                if (mounted) {
                    setPayload((prev: any) => ({
                        ...prev,
                        name: src.name ?? "",
                        companyCode: src.companyCode ?? "",
                        shortName: src.shortName ?? "",
                        email: src.email ?? "",
                        phone: src.phone ?? "",
                        taxId: src.taxId ?? "",
                        addressLine: src.addressLine ?? "",
                        province: src.province ?? "",
                        district: src.district ?? "",
                        subdistrict: src.subdistrict ?? "",
                        postalCode: src.postalCode ?? "",
                        status: src.status ?? "ACTIVE",
                    }));
                }
            } catch (e: any) {
                setError(String(e?.message ?? e));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [companyId, isEditMode]);

    async function handleSubmit(payloadData: any) {
        if (!canAccess) return { success: false, error: "No permission" };
        setError(null);
        try {
            let res;
            if (isEditMode) {
                res = await updateCompanyAction(companyId, payloadData);
            } else {
                res = await createCompanyAction(payloadData);
            }

            if (!res.success) {
                return {
                    success: false,
                    issues: typeof res.issues === "object" && res.issues !== null ? (res.issues as Record<string, string[]>) : undefined,
                    error: res.error
                };
            }

            return { success: true };
        } catch (e: any) {
            return { success: false, error: String(e) };
        }
    }

    const title = isEditMode ? "แก้ไขข้อมูลบริษัท" : "สร้างบริษัทใหม่";

    return (
        <section className="space-y-6">
            <div className="bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="text-center">
                        <h5 className="font-semibold text-3xl my-5 border-b pb-6">
                            {title}
                        </h5>
                    </div>

                    {!checkingPermission && (!canAccess || error) && (
                        <div>
                            {!canAccess && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {isEditMode ? "คุณไม่มีสิทธิ์แก้ไขบริษัทนี้" : "คุณไม่มีสิทธิ์สร้างบริษัท"}
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
                        <CompanyForm
                            initial={payload}
                            onSubmit={async (body) => {
                                const result = await handleSubmit(body);
                                if (result.success) {
                                    toast.success(isEditMode ? "บันทึกการแก้ไขเรียบร้อยแล้ว" : "สร้างบริษัทเรียบร้อยแล้ว");
                                    router.push(`/companies`);
                                }
                                return result;
                            }}
                            onCancel={() => router.push(`/companies`)}
                            submitLabel="บันทึก"
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
