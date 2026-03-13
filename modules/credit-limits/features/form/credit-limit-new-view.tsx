"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import CreditLimitForm from "./credit-limit-form";
import { createCreditLimitAction } from "@/modules/credit-limits/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { toast } from "sonner";

export default function CreditLimitNewView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { hasPermission, isLoading: checkingPermission } = usePermission("creditlimit.create");
    const canCreate = !checkingPermission && hasPermission("creditlimit.create");

    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                // Fetch dealers
                const res = await getCustomersAction({ perPage: 1000, typeFilter: "DEALER" });
                if (mounted) {
                    setCustomers(res.customers ?? []);
                }
            } catch (e: any) {
                setError(String(e?.message ?? e));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleCreate = async (payload: any) => {
        if (!canCreate) return { success: false, error: "No permission" };
        return await createCreditLimitAction(payload);
    };

    if (checkingPermission) {
        return (
            <div className="p-6 text-center">กำลังตรวจสอบสิทธิ์...</div>
        );
    }

    return (
        <section className="space-y-6">
            <div className="bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="text-center">
                        <h5 className="font-semibold text-3xl my-5 border-b pb-6 text-slate-800">
                            สร้างวงเงินใหม่
                        </h5>
                    </div>

                    {!canCreate && !checkingPermission && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>คุณไม่มีสิทธิ์สร้างวงเงินใหม่</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 bg-slate-100 rounded w-full" />
                            <div className="h-40 bg-slate-100 rounded w-full" />
                        </div>
                    ) : (
                        <CreditLimitForm
                            initial={{ customerId: searchParams?.get("customerId") ?? undefined }}
                            customers={customers}
                            onSubmit={async (payload) => {
                                const result = await handleCreate(payload);
                                if (result.success) {
                                    toast.success("สร้างวงเงินเรียบร้อยแล้ว");
                                    router.push("/credit-limits");
                                    router.refresh();
                                }
                                return result;
                            }}
                            onCancel={() => router.push("/credit-limits")}
                            submitLabel="บันทึก"
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
