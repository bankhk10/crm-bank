"use client";

import React, { useState, useEffect } from "react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/custom/DatePicker";

type CreditLimitPayload = {
  customerId: string;
  limitAmount: number;
  effectiveDate: Date;
  expiryDate?: Date;
  notes?: string;
};

type SubmitResult = {
  success: boolean;
  issues?: Record<string, string[]>;
  error?: string;
};

interface Props {
  initial?: Partial<CreditLimitPayload>;
  customers?: Array<{ id: string; name: string; customerCode: string }>;
  onSubmit: (payload: CreditLimitPayload) => Promise<SubmitResult>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function CreditLimitForm({
  initial = {},
  customers = [],
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
}: Props) {
  const [payload, setPayload] = useState<CreditLimitPayload>({
    customerId: initial.customerId ?? "",
    limitAmount: initial.limitAmount ?? 0,
    effectiveDate: initial.effectiveDate ?? new Date(),
    expiryDate: initial.expiryDate,
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
    <form onSubmit={handleSubmit} className="p-6 space-y-1">
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <FloatingLabelInput
            label="ลูกค้า"
            type="select"
            options={[
              { value: "", label: "เลือกลูกค้า" },
              ...customers.map((c) => ({
                value: c.id,
                label: `${c.customerCode} - ${c.name}`,
              })),
            ]}
            value={payload.customerId}
            onChange={(
              e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
            ) => {
              setPayload((p) => ({ ...p, customerId: e.target.value }));
              clearFieldError("customerId");
            }}
            required
            error={fieldErrors.customerId?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="วงเงิน (บาท)"
            type="number"
            value={payload.limitAmount.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, limitAmount: parseFloat(e.target.value) || 0 }));
              clearFieldError("limitAmount");
            }}
            required
            error={fieldErrors.limitAmount?.[0]}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            วันที่เริ่มใช้งาน <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={payload.effectiveDate}
            onChange={(date: string | undefined) => {
              if (date) {
                setPayload((p) => ({ ...p, effectiveDate: new Date(date) }));
                clearFieldError("effectiveDate");
              }
            }}
          />
          {fieldErrors.effectiveDate?.[0] && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.effectiveDate[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            วันหมดอายุ (ถ้ามี)
          </label>
          <DatePicker
            value={payload.expiryDate}
            onChange={(date: string | undefined) => {
              setPayload((p) => ({ ...p, expiryDate: date ? new Date(date) : undefined }));
              clearFieldError("expiryDate");
            }}
          />
          {fieldErrors.expiryDate?.[0] && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.expiryDate[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <FloatingLabelInput
            label="หมายเหตุ"
            value={payload.notes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, notes: e.target.value }));
              clearFieldError("notes");
            }}
            error={fieldErrors.notes?.[0]}
          />
        </div>

        <div className="md:col-span-2 pt-6 border-t my-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
              type="button"
              onClick={onCancel}
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
      </div>
    </form>
  );
}
