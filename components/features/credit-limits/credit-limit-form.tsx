"use client";

import React, { useState, useEffect } from "react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import { Button } from "@/components/ui/button";

type CreditLimitPayload = {
  customerId: string;
  limitAmount: number;
  promoAmount?: number;
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
    promoAmount: (initial as any).promoAmount ?? 0,
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
      // Normalize payload types: ensure numeric fields are numbers and dates are serialized
      const submitPayload: any = {
        customerId: payload.customerId,
        limitAmount: Number(payload.limitAmount) || 0,
        promoAmount:
          payload.promoAmount !== undefined && payload.promoAmount !== null
            ? Number((payload as any).promoAmount)
            : undefined,
        notes: payload.notes,
      };

      // Include optional dates if present (serialize to ISO)
      if (payload.effectiveDate) {
        submitPayload.effectiveDate =
          payload.effectiveDate instanceof Date
            ? payload.effectiveDate.toISOString()
            : String(payload.effectiveDate);
      }
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
            disabled
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

        <div>
          <FloatingLabelInput
            label="วงเงินส่งเสริมการขาย (บาท)"
            type="number"
            value={(payload.promoAmount ?? 0).toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, promoAmount: parseFloat(e.target.value) || 0 }));
              clearFieldError("promoAmount");
            }}
            error={fieldErrors.promoAmount?.[0]}
          />
        </div>

        {/* Removed date fields as requested: effectiveDate and expiryDate */}

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
