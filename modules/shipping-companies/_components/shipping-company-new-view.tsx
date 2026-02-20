"use client";

import { useRouter } from "next/navigation";
import ShippingCompanyForm from "./shipping-company-form";
import type { ShippingCompanyPayload } from "../_types";

interface Props {
    customerOptions: Array<{ value: string; label: string }>;
}

export function ShippingCompanyNewView({ customerOptions }: Props) {
    const router = useRouter();

    async function handleCreate(payload: ShippingCompanyPayload) {
        try {
            const res = await fetch("/api/shipping-companies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));

                if (res.status === 409) {
                    const errMsg: string = json?.error || "";
                    const issues: Record<string, string[]> = {};

                    const m = errMsg.match(/fields:\s*\(([^)]+)\)/i);
                    if (m && m[1]) {
                        const raw = m[1];
                        const fields = raw
                            .split(",")
                            .map((s) => s.replace(/[`"'\s]/g, "").trim());
                        for (const f of fields) {
                            if (!f) continue;
                            issues[f] = [`${f} นี้ถูกใช้งานแล้ว`];
                        }
                    }

                    return {
                        success: false,
                        issues: Object.keys(issues).length ? issues : json?.issues,
                        error: json?.error,
                    };
                }

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
                            สร้างบริษัทขนส่งใหม่
                        </h5>
                    </div>

                    <ShippingCompanyForm
                        customerOptions={customerOptions}
                        onSubmit={async (payload) => {
                            const result = await handleCreate(payload);
                            if (result.success) {
                                router.push("/shipping-companies");
                                router.refresh();
                            }
                            return result;
                        }}
                        onCancel={() => router.push("/shipping-companies")}
                        submitLabel="บันทึก"
                    />
                </div>
            </div>
        </section>
    );
}
