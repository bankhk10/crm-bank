"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/components/custom/form-components";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { X, Save } from "lucide-react";
import type { ShippingCompanyPayload } from "../_types";
import { MultiSelect } from "@/components/custom/multi-select";

export interface SubmitResult {
    success: boolean;
    issues?: Record<string, string[]>;
    error?: string;
}

interface Props {
    initial?: Partial<ShippingCompanyPayload>;
    onSubmit: (payload: ShippingCompanyPayload) => Promise<SubmitResult>;
    onCancel?: () => void;
    submitLabel?: string;
}

export default function ShippingCompanyForm({
    initial = {},
    onSubmit,
    onCancel,
    submitLabel,
}: Props) {
    const router = useRouter();
    const [payload, setPayload] = useState<ShippingCompanyPayload>({
        name: initial.name ?? "",
        phone: initial.phone ?? "",
        address: initial.address ?? "",
        addressLine: initial.addressLine ?? "",
        province: initial.province ?? "",
        district: initial.district ?? "",
        subdistrict: initial.subdistrict ?? "",
        postalCode: initial.postalCode ? String(initial.postalCode) : "",
        notes: initial.notes ?? "",
        status: initial.status ?? "ACTIVE",
        customerIds: initial.customerIds ?? [],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [customers, setCustomers] = useState<Array<{ value: string; label: string }>>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);

    // Fetch customers for multi-select
    useEffect(() => {
        async function fetchCustomers() {
            try {
                const res = await fetch("/api/customers?perPage=1000");
                if (res.ok) {
                    const data = await res.json();
                    const customerOptions = data.customers.map((c: any) => ({
                        value: c.id,
                        label: `${c.customerCode} - ${c.name}`,
                    }));
                    setCustomers(customerOptions);
                }
            } catch (err) {
                console.error("Failed to fetch customers:", err);
            } finally {
                setLoadingCustomers(false);
            }
        }
        fetchCustomers();
    }, []);

    const clearFieldError = (field: string) => {
        setFieldErrors((prev) => {
            if (!prev || !(field in prev)) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Client-side validation
        const newErrors: Record<string, string[]> = {};
        if (!payload.name) newErrors.name = ["จำเป็นต้องกรอกข้อมูล"];
        if (!payload.province) newErrors.province = ["จำเป็นต้องเลือกข้อมูล"];
        if (!payload.district) newErrors.district = ["จำเป็นต้องเลือกข้อมูล"];
        if (!payload.subdistrict) newErrors.subdistrict = ["จำเป็นต้องเลือกข้อมูล"];
        if (!payload.postalCode) newErrors.postalCode = ["จำเป็นต้องมีข้อมูล"];

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const res = await onSubmit(payload);
            if (!res.success) {
                if (res.issues) {
                    setFieldErrors(res.issues);
                    setError(
                        Object.values(res.issues).flat()[0] ?? res.error ?? "เกิดข้อผิดพลาด"
                    );
                } else {
                    setError(res.error ?? "เกิดข้อผิดพลาด");
                }
            }
        } catch (error) {
            const err = error as Error;
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Info Section */}
            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                ข้อมูลบริษัทขนส่ง
            </h3>
            <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
                <FormInput
                    label="ชื่อบริษัทขนส่ง"
                    value={payload.name}
                    onChange={(e) => {
                        setPayload((p) => ({ ...p, name: e.target.value }));
                        clearFieldError("name");
                    }}
                    required
                    error={fieldErrors.name?.[0]}
                    containerClassName="md:col-span-2"
                />

                <FormInput
                    label="เบอร์โทร"
                    value={payload.phone ?? ""}
                    onChange={(e) => {
                        setPayload((p) => ({ ...p, phone: e.target.value }));
                        clearFieldError("phone");
                    }}
                    error={fieldErrors.phone?.[0]}
                />

                <FormSelect
                    label="สถานะการใช้งาน"
                    value={payload.status ?? "ACTIVE"}
                    onChange={(v) => {
                        setPayload((p) => ({ ...p, status: v }));
                        clearFieldError("status");
                    }}
                    options={[
                        { value: "ACTIVE", label: "ใช้งาน" },
                        { value: "INACTIVE", label: "ไม่ใช้งาน" },
                    ]}
                    placeholder="เลือกสถานะ"
                    groupLabel="สถานะ"
                    error={fieldErrors.status?.[0]}
                />
            </div>

            <FormInput
                label="ที่อยู่ (บ้านเลขที่, ถนน, ฯลฯ)"
                placeholder="123/45 หมู่ 6"
                value={payload.addressLine ?? ""}
                onChange={(e) => {
                    setPayload((p) => ({ ...p, addressLine: e.target.value }));
                    clearFieldError("addressLine");
                }}
                disabled={loading}
                containerClassName="md:col-span-2 mt-6"
            />

            <div className="md:col-span-2">
                <ThaiAddressPicker
                    value={{
                        province: payload.province || undefined,
                        district: payload.district || undefined,
                        subdistrict: payload.subdistrict || undefined,
                        postalCode: payload.postalCode || undefined,
                    }}
                    onChange={(next) => {
                        setPayload((p) => ({ ...p, ...next }));
                        clearFieldError("province");
                        clearFieldError("district");
                        clearFieldError("subdistrict");
                        clearFieldError("postalCode");
                    }}
                    required
                    errors={{
                        province: fieldErrors.province?.[0],
                        district: fieldErrors.district?.[0],
                        subdistrict: fieldErrors.subdistrict?.[0],
                        postalCode: fieldErrors.postalCode?.[0],
                    }}
                />
            </div>

            <FormTextarea
                label="หมายเหตุ"
                value={payload.notes ?? ""}
                onChange={(e) => {
                    setPayload((p) => ({ ...p, notes: e.target.value }));
                    clearFieldError("notes");
                }}
                error={fieldErrors.notes?.[0]}
                rows={3}
            />

            {/* Customer Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    ลูกค้าที่ใช้บริการขนส่ง
                </label>
                {loadingCustomers ? (
                    <div className="text-sm text-gray-500">กำลังโหลดข้อมูลลูกค้า...</div>
                ) : (
                    <MultiSelect
                        options={customers}
                        defaultValue={payload.customerIds ?? []}
                        onValueChange={(selected) => {
                            setPayload((p) => ({ ...p, customerIds: selected }));
                            clearFieldError("customerIds");
                        }}
                        placeholder="เลือกลูกค้า (สามารถเลือกได้หลายราย)"
                    />
                )}
                {fieldErrors.customerIds?.[0] && (
                    <p className="text-sm text-red-600">{fieldErrors.customerIds[0]}</p>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="sm:pt-2 mt-8 sm:mt-8 space-y-6">
                <div className="flex justify-center sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-6">
                    <Button
                        size="lg"
                        className="flex-1 sm:flex-none sm:w-32 bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
                        type="button"
                        onClick={onCancel ?? (() => router.back())}
                        disabled={loading}
                    >
                        <X className="h-4 w-4" />
                        ยกเลิก
                    </Button>
                    <Button
                        size="lg"
                        className="flex-1 sm:flex-none sm:w-32 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span>กำลังบันทึก...</span>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>{submitLabel || "บันทึก"}</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <div className="w-full h-12 sm:hidden"></div>
        </form>
    );
}
