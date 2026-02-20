"use client";

import { useRouter } from "next/navigation";
import ShippingCompanyForm from "./shipping-company-form";
import type { ShippingCompanyPayload } from "../_types";

interface Props {
    shippingCompanyId: string;
    initialData: Partial<ShippingCompanyPayload>;
    customerOptions: Array<{ value: string; label: string }>;
    canEdit: boolean;
}

export function ShippingCompanyEditView({
    shippingCompanyId,
    initialData,
    customerOptions,
    canEdit,
}: Props) {
    const router = useRouter();

    async function handleUpdate(payloadData: ShippingCompanyPayload) {
        if (!canEdit) return { success: false, error: "No permission" };

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

                    {!canEdit ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                            คุณไม่มีสิทธิ์แก้ไขบริษัทขนส่งนี้
                        </div>
                    ) : (
                        <ShippingCompanyForm
                            initial={initialData}
                            customerOptions={customerOptions}
                            onSubmit={async (body) => {
                                const result = await handleUpdate(body);
                                if (result.success) {
                                    router.push("/shipping-companies");
                                    router.refresh(); // Refresh server data
                                }
                                return result;
                            }}
                            onCancel={() => router.push("/shipping-companies")}
                            submitLabel="บันทึก"
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
