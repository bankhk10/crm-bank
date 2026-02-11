"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import { ShippingCompanyForm } from "@/features/shipping-companies";

export default function EditShippingCompanyPage() {
    const { shippingCompanyId } = useParams() as { shippingCompanyId: string };
    const router = useRouter();
    const { hasPermission, isLoading } = usePermission("shipping-company.edit");
    const canEdit =
        !isLoading &&
        (hasPermission("shipping-company.edit") ||
            hasPermission("shipping-company.manage") ||
            hasPermission("menu.shipping-companies"));

    const [payload, setPayload] = useState<any>({
        name: "",
        phone: "",
        address: "",
        notes: "",
        status: "ACTIVE",
        customerIds: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/shipping-companies/${shippingCompanyId}`);
                if (!res.ok) throw new Error("Failed to load shipping company");
                const json = await res.json();
                const src = (json && (json.shippingCompany ?? json)) || {};
                if (mounted) {
                    setPayload((prev: any) => ({
                        ...prev,
                        name: src.name ?? "",
                        phone: src.phone ?? "",
                        address: src.address ?? "",
                        notes: src.notes ?? "",
                        status: src.status ?? "ACTIVE",
                        customerIds: src.customerList?.map((c: any) => c.id) ?? [],
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
    }, [shippingCompanyId]);

    async function handleUpdate(payloadData: any) {
        if (!canEdit) return { success: false, error: "No permission" };
        setSaving(true);
        setError(null);
        setFieldErrors({});
        try {
            const res = await fetch(`/api/shipping-companies/${shippingCompanyId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadData),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                return { success: false, issues: json?.issues, error: json?.error };
            }

            return { success: true };
        } catch (e: any) {
            return { success: false, error: String(e) };
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-6">
            <div className="bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="text-center">
                        <h5 className="font-semibold text-3xl my-5 border-b pb-6">
                            แก้ไขข้อมูลบริษัทขนส่ง
                        </h5>
                    </div>

                    {(!canEdit || error) && (
                        <div>
                            {!canEdit && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        คุณไม่มีสิทธิ์แก้ไขบริษัทขนส่งนี้
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
                        <ShippingCompanyForm
                            initial={payload}
                            onSubmit={async (body) => {
                                const result = await handleUpdate(body);
                                if (result.success) router.push(`/shipping-companies`);
                                return result;
                            }}
                            onCancel={() => router.push(`/shipping-companies`)}
                            submitLabel="บันทึก"
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
