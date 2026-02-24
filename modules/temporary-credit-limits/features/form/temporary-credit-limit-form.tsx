"use client";

import React, { useState } from "react";
import DatePicker from "@/components/custom/DatePicker";
import { Button } from "@/components/ui/button";
import {
    FormInput,
    FormSelect,
    FormTextarea,
} from "@/components/custom/form-components";
import type { TemporaryCreditLimitFormData } from "@/types/temporary-credit-limit";

type SubmitResult = {
    success: boolean;
    issues?: Record<string, string[]>;
    error?: string;
};

interface Props {
    initial?: Partial<TemporaryCreditLimitFormData>;
    customers?: Array<{ id: string; name: string; customerCode: string }>;
    onSubmit: (payload: TemporaryCreditLimitFormData) => Promise<SubmitResult>;
    onCancel?: () => void;
    submitLabel?: string;
    readonly?: boolean;
}

export function TemporaryCreditLimitForm({
    initial = {},
    customers = [],
    onSubmit,
    onCancel,
    submitLabel = "บันทึก",
    readonly = false,
}: Props) {
    const [payload, setPayload] = useState<
        Omit<TemporaryCreditLimitFormData, "expiryDate"> & {
            expiryDate?: string | Date | undefined;
        }
    >({
        customerId: initial.customerId ?? "",
        requestedAmount: initial.requestedAmount ?? 0,
        expiryDate: initial.expiryDate ?? new Date(),
        notes: initial.notes ?? "",
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
        if (readonly) return;
        if (loading) return;

        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const submitPayload: any = {
                customerId: payload.customerId,
                requestedAmount: Number(payload.requestedAmount) || 0,
                notes: payload.notes,
            };

            if (payload.expiryDate) {
                submitPayload.expiryDate =
                    payload.expiryDate instanceof Date
                        ? payload.expiryDate.toISOString()
                        : String(payload.expiryDate);
            }

            const res = await onSubmit(submitPayload);
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

    const customerOptions = customers.map((c) => ({
        value: c.id,
        label: `${c.customerCode} - ${c.name}`,
    }));

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                ข้อมูลคำขอวงเงิน
            </h3>

            <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
                <FormSelect
                    label="ลูกค้า"
                    value={payload.customerId}
                    onChange={(v) => {
                        setPayload((p) => ({ ...p, customerId: v }));
                        clearFieldError("customerId");
                    }}
                    options={customerOptions}
                    placeholder="เลือกลูกค้า"
                    groupLabel="ลูกค้า"
                    disabled={readonly}
                    error={fieldErrors.customerId?.[0]}
                    containerClassName="md:col-span-2"
                />

                <FormInput
                    label="จำนวนเงินที่ขอ (บาท)"
                    type="number"
                    value={String(payload.requestedAmount ?? 0)}
                    onChange={(e) => {
                        setPayload((p) => ({
                            ...p,
                            requestedAmount: parseFloat(e.target.value) || 0,
                        }));
                        clearFieldError("requestedAmount");
                    }}
                    disabled={readonly}
                    error={fieldErrors.requestedAmount?.[0]}
                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                    required
                />

                <div className="mt-0">
                    <DatePicker
                        label="วันหมดอายุ"
                        value={payload.expiryDate as string | Date | undefined}
                        onChange={(v) => {
                            setPayload((p) => ({ ...p, expiryDate: v ? v : undefined }));
                            clearFieldError("expiryDate");
                        }}
                        placeholder=""
                        disabled={readonly}
                    />
                    {fieldErrors.expiryDate?.[0] && (
                        <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.expiryDate[0]}
                        </p>
                    )}
                </div>

                <FormTextarea
                    label="หมายเหตุ"
                    value={payload.notes ?? ""}
                    onChange={(e) => {
                        setPayload((p) => ({ ...p, notes: e.target.value }));
                        clearFieldError("notes");
                    }}
                    disabled={readonly}
                    error={fieldErrors.notes?.[0]}
                    containerClassName="md:col-span-2"
                    rows={3}
                />
            </div>

            {!readonly && (
                <div className="md:col-span-2 pt-6 border-t my-2">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            size="lg"
                            className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            size="lg"
                            className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "กำลังบันทึก..." : submitLabel}
                        </Button>
                    </div>
                </div>
            )}
        </form>
    );
}
