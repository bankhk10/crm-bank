"use client";

import { useRouter } from "next/navigation";
import ShippingCompanyForm from "./shipping-company-form";
import type { ShippingCompanyPayload } from "../../types";
import { createShippingCompanyAction } from "../../server/actions";

interface Props {
    customerOptions: Array<{ value: string; label: string }>;
}

export function ShippingCompanyNewView({ customerOptions }: Props) {
    const router = useRouter();

    async function handleCreate(payload: ShippingCompanyPayload) {
        try {
            const result = await createShippingCompanyAction(payload);

            if (!result.success) {
                return {
                    success: false,
                    issues: (result as any).issues,
                    error: result.error,
                };
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
