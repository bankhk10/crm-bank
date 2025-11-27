"use client";

import React, { useState } from "react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import DatePicker from "@/components/custom/DatePicker";
import { Button } from "@/components/ui/button";
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

export default function TemporaryCreditLimitForm({
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
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // Date handling: the `DatePicker` emits a `YYYY-MM-DD` string or `undefined`.
  // The submit handler already handles both `Date` and string values.

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-1">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <FloatingLabelInput
            label="ลูกค้า"
            type="select"
            options={[
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
            disabled={readonly}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="จำนวนเงินที่ขอ (บาท)"
            type="number"
            value={payload.requestedAmount.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, requestedAmount: parseFloat(e.target.value) || 0 }));
              clearFieldError("requestedAmount");
            }}
            required
            error={fieldErrors.requestedAmount?.[0]}
            disabled={readonly}
          />
        </div>

        <div>
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
            <p className="mt-1 text-sm text-red-600">{fieldErrors.expiryDate[0]}</p>
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
            disabled={readonly}
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
      </div>
    </form>
  );
}
