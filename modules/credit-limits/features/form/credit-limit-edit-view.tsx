"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import CreditLimitForm from "./credit-limit-form";
import { updateCreditLimitAction, getCreditLimitAction } from "@/modules/credit-limits/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { toast } from "sonner";

export default function CreditLimitEditView() {
    const { creditLimitId } = useParams() as { creditLimitId: string };
    const router = useRouter();
    const { hasPermission, isLoading: checkingPermission } = usePermission("creditlimit.edit");
    const canEdit = !checkingPermission && hasPermission("creditlimit.edit");

    const [payload, setPayload] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const [creditLimitRes, customersRes] = await Promise.all([
                    getCreditLimitAction(creditLimitId),
                    getCustomersAction({ perPage: 1000, typeFilter: "DEALER" }),
                ]);

                if (!creditLimitRes.success) throw new Error(creditLimitRes.error || "Failed to load credit limit");
                
                const src = creditLimitRes.creditLimit;

                if (mounted) {
                    setCustomers(customersRes.customers ?? []);
                    setPayload({
                        customerId: src.customerId ?? "",
                        limitAmount: Number(src.limitAmount) ?? 0,
                        promoAmount: src.promoAmount ? Number(src.promoAmount) : 0,
                        usedAmount: Number(src.usedAmount) ?? 0,
                        availableAmount: Number(src.availableAmount) ?? 0,
                        effectiveDate: src.effectiveDate ? new Date(src.effectiveDate) : new Date(),
                        expiryDate: src.expiryDate ? new Date(src.expiryDate) : undefined,
                        notes: src.notes ?? "",
                    });
                }
            } catch (e: any) {
                setError(String(e?.message ?? e));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [creditLimitId]);

    const handleUpdate = async (payloadData: any) => {
        if (!canEdit) return { success: false, error: "No permission" };
        return await updateCreditLimitAction(creditLimitId, payloadData);
    };

    if (checkingPermission) {
        return <div className="p-6 text-center">กำลังตรวจสอบสิทธิ์...</div>;
    }

    return (
        <section className="space-y-6">
            <div className="bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="text-center">
                        <h5 className="font-semibold text-3xl my-5 border-b pb-6 text-slate-800">
                            แก้ไขข้อมูลวงเงิน
                        </h5>
                    </div>

                    {!canEdit && !checkingPermission && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>คุณไม่มีสิทธิ์แก้ไขวงเงินนี้</AlertDescription>
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
                    ) : payload && (
                        <CreditLimitForm
                            initial={payload}
                            customers={customers}
                            onSubmit={async (body) => {
                                const result = await handleUpdate(body);
                                if (result.success) {
                                    toast.success("อัปเดตข้อมูลวงเงินเรียบร้อยแล้ว");
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
