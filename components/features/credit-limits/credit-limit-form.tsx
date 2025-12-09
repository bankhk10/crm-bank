"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

const labelText = "mx-2 text-sm font-bold text-gray-900";
const inputClass = "mt-1 h-11 text-base placeholder:text-gray-500";

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
    promoAmount: initial.promoAmount ?? 0,
    effectiveDate: initial.effectiveDate ?? new Date(),
    expiryDate: initial.expiryDate,
    notes: initial.notes ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const clearError = (f: string) =>
    setFieldErrors((p) => {
      const n = { ...p };
      delete n[f];
      return n;
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const body: any = {
        customerId: payload.customerId,
        limitAmount: Number(payload.limitAmount),
        promoAmount:
          payload.promoAmount !== undefined
            ? Number(payload.promoAmount)
            : undefined,
        notes: payload.notes,
      };

      if (payload.effectiveDate)
        body.effectiveDate = payload.effectiveDate.toISOString();

      if (payload.expiryDate)
        body.expiryDate = payload.expiryDate.toISOString();

      const res = await onSubmit(body);
      if (!res.success) {
        if (res.issues) setFieldErrors(res.issues);
        setError(res.error ?? "เกิดข้อผิดพลาด");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* ---------------- HEADER ---------------- */}
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-200 py-3 px-4 rounded-2xl">
        ข้อมูลวงเงินเครดิตลูกค้า
      </h3>

      {/* ---------------- FORM GRID ---------------- */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* ลูกค้า */}
        <div className="md:col-span-2">
          <Label className={labelText}>ลูกค้า</Label>
          <Input
            value={
              customers.find((c) => c.id === payload.customerId)
                ? `${
                    customers.find((c) => c.id === payload.customerId)!
                      .customerCode
                  } - ${
                    customers.find((c) => c.id === payload.customerId)!.name
                  }`
                : ""
            }
            readOnly
            disabled
            className={`${inputClass} w-full border rounded-xl px-3 py-3`}
          />
          {fieldErrors.customerId && (
            <p className="text-red-600 text-sm">{fieldErrors.customerId}</p>
          )}
        </div>

        {/* limitAmount */}
        <div>
          <Label className={labelText}>วงเงิน (บาท)</Label>
          <Input
            type="number"
            className={inputClass}
            value={payload.limitAmount}
            onChange={(e) => {
              setPayload((p) => ({
                ...p,
                limitAmount: Number(e.target.value),
              }));
              clearError("limitAmount");
            }}
          />
        </div>

        {/* promoAmount */}
        <div>
          <Label className={labelText}>วงเงินส่งเสริมการขาย (บาท)</Label>
          <Input
            type="number"
            className={inputClass}
            value={payload.promoAmount ?? 0}
            onChange={(e) =>
              setPayload((p) => ({ ...p, promoAmount: Number(e.target.value) }))
            }
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <Label className={labelText}>หมายเหตุ</Label>
          <textarea
            rows={3}
            value={payload.notes}
            onChange={(e) =>
              setPayload((p) => ({ ...p, notes: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2 text-base mt-1"
          />
        </div>
      </div>

      {/* ---------------- ACTION BUTTONS ---------------- */}
      <div className="pt-6 border-t flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          type="button"
          className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
          onClick={onCancel}
        >
          ยกเลิก
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
        >
          {loading ? "กำลังบันทึก..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
