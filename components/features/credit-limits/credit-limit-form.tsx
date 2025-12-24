"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CreditLimitPayload = {
  customerId: string;
  limitAmount: number;
  promoAmount?: number;
  usedAmount?: number;
  availableAmount?: number;
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
    usedAmount: initial.usedAmount ?? 0,
    availableAmount: initial.availableAmount ?? 0,
    effectiveDate: initial.effectiveDate ?? new Date(),
    expiryDate: initial.expiryDate,
    notes: initial.notes ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  // keep display text for numeric inputs so user can clear the field while typing
  const [limitAmountText, setLimitAmountText] = useState<string>(
    String(initial.limitAmount ?? 0)
  );
  const [promoAmountText, setPromoAmountText] = useState<string>(
    String(initial.promoAmount ?? 0)
  );

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
      // parse display text to numbers; allow empty as 0
      const parsedLimit = limitAmountText === "" ? 0 : Number(limitAmountText);
      const parsedPromo = promoAmountText === "" ? 0 : Number(promoAmountText);

      const body: any = {
        customerId: payload.customerId,
        limitAmount: parsedLimit,
        promoAmount: parsedPromo,
        notes: payload.notes,
      };

      // keep payload in sync with parsed values
      setPayload((p) => ({
        ...p,
        limitAmount: parsedLimit,
        promoAmount: parsedPromo,
      }));

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

        {/* Used Amount (Read-only) */}
        <div>
          <Label className={labelText}>ใช้วงเงินไปแล้ว (บาท)</Label>
          <Input
            type="text"
            className={`${inputClass} bg-gray-100`}
            value={new Intl.NumberFormat("th-TH", {
              minimumFractionDigits: 2,
            }).format(payload.usedAmount || 0)}
            readOnly
            disabled
          />
        </div>

        {/* Available Amount (Read-only) */}
        <div>
          <Label className={labelText}>คงเหลือ (บาท)</Label>
          <Input
            type="text"
            className={`${inputClass} bg-gray-100 font-semibold text-green-700`}
            value={new Intl.NumberFormat("th-TH", {
              minimumFractionDigits: 2,
            }).format(payload.availableAmount || 0)}
            readOnly
            disabled
          />
        </div>

        {/* limitAmount */}
        <div>
          <Label className={labelText}>วงเงิน (บาท)</Label>
          <Input
            type="number"
            className={inputClass}
            value={limitAmountText}
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned = raw.replace(/^0+(?=\d)/, "");
              // allow empty string while typing
              setLimitAmountText(cleaned === "" ? "" : cleaned);
              clearError("limitAmount");
            }}
            onBlur={() => {
              // ensure display shows 0 instead of empty and sync payload
              if (limitAmountText === "") setLimitAmountText("0");
              const num = limitAmountText === "" ? 0 : Number(limitAmountText);
              setPayload((p) => ({ ...p, limitAmount: num }));
            }}
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          />
        </div>

        {/* promoAmount */}
        <div>
          <Label className={labelText}>วงเงินส่งเสริมการขาย (บาท)</Label>
          <Input
            type="number"
            className={inputClass}
            value={promoAmountText}
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned = raw.replace(/^0+(?=\d)/, "");
              setPromoAmountText(cleaned === "" ? "" : cleaned);
              clearError("promoAmount");
            }}
            onBlur={() => {
              if (promoAmountText === "") setPromoAmountText("0");
              const num = promoAmountText === "" ? 0 : Number(promoAmountText);
              setPayload((p) => ({ ...p, promoAmount: num }));
            }}
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
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
