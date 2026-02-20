"use client";

import React, { useState } from "react";
import { FormInput, FormSelect, FormTextarea } from "@/components/custom/form-components";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import type { ShippingCompanyPayload } from "../_types";
import { MultiSelect } from "@/components/custom/multi-select";
import { PhoneInput } from "@/components/custom/PhoneInput";
import FormActions from "@/components/custom/form-actions";

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
    customerOptions?: Array<{ value: string; label: string }>;
}

export default function ShippingCompanyForm({
    initial = {},
    onSubmit,
    onCancel,
    submitLabel,
    customerOptions = [],
}: Props) {
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
        if (loading) return;

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
                setLoading(false);
            }
        } catch (error) {
            const err = error as Error;
            setError(err.message || String(err));
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

                <PhoneInput
                    label="เบอร์โทร"
                    value={payload.phone ?? ""}
                    onChange={(value) => {
                        setPayload((p) => ({ ...p, phone: value }));
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
                label="ที่อยู่ (เลขที่, ถนน, ฯลฯ)"
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

            {/* Customer Selection */}
            <div className="space-y-2">
                <label className="text-base font-medium mx-2">
                    ลูกค้าที่ใช้บริการขนส่ง
                </label>
                <MultiSelect
                    options={customerOptions}
                    defaultValue={payload.customerIds ?? []}
                    onValueChange={(selected) => {
                        setPayload((p) => ({ ...p, customerIds: selected }));
                        clearFieldError("customerIds");
                    }}
                    placeholder="เลือกลูกค้า (สามารถเลือกได้หลายราย)"
                />
                {fieldErrors.customerIds?.[0] && (
                    <p className="text-sm text-red-600">{fieldErrors.customerIds[0]}</p>
                )}
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

            {/* Error Display */}
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Action Buttons */}
            <FormActions
                loading={loading}
                onCancel={onCancel}
                submitLabel={submitLabel}
            />
            <div className="w-full h-12 sm:hidden"></div>
        </form>
    );
}
