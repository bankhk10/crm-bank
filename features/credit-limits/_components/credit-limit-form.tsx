"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CreditLimitPayload, SubmitResult } from "../_types/types";

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
      const parsedLimit = limitAmountText === "" ? 0 : Number(limitAmountText);
      const parsedPromo = promoAmountText === "" ? 0 : Number(promoAmountText);

      const body: any = {
        customerId: payload.customerId,
        limitAmount: parsedLimit,
        promoAmount: parsedPromo,
        notes: payload.notes,
      };

      // Sync payload
      setPayload((p) => ({
        ...p,
        limitAmount: parsedLimit,
        promoAmount: parsedPromo,
      }));

      // In real payload, dates are Date objects. 
      // API expects ISO strings if JSONified? 
      // The prop `onSubmit` takes `CreditLimitPayload` which has `Date`.
      // The caller handles stringification.
      // Copy dates
      body.effectiveDate = payload.effectiveDate;
      body.expiryDate = payload.expiryDate;

      const res = await onSubmit(body);
      if (!res.success) {
        if (res.issues) setFieldErrors(res.issues);
        setError(res.error ?? "เกิดข้อผิดพลาด");
      }
    } finally {
      setLoading(false);
    }
  }

  // Helper to find customer
  const currentCustomer = customers.find((c) => c.id === payload.customerId);
  const customerDisplay = currentCustomer
    ? `${currentCustomer.customerCode} - ${currentCustomer.name}`
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-200 py-3 px-4 rounded-2xl">
        ข้อมูลวงเงินเครดิตลูกค้า
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label className={labelText}>ลูกค้า</Label>
          <Input
            value={customerDisplay}
            readOnly
            disabled
            className={`${inputClass} w-full border rounded-xl px-3 py-3`}
          />
          {fieldErrors.customerId && (
            <p className="text-red-600 text-sm">{fieldErrors.customerId}</p>
          )}
        </div>

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

        <div>
          <Label className={labelText}>วงเงิน (บาท)</Label>
          <Input
            type="number"
            className={inputClass}
            value={limitAmountText}
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned = raw.replace(/^0+(?=\d)/, "");
              setLimitAmountText(cleaned === "" ? "" : cleaned);
              clearError("limitAmount");
            }}
            onBlur={() => {
              if (limitAmountText === "") setLimitAmountText("0");
              const num = limitAmountText === "" ? 0 : Number(limitAmountText);
              setPayload((p) => ({ ...p, limitAmount: num }));
            }}
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          />
        </div>

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

        <div className="md:col-span-2">
          <Label className={labelText}>หมายเหตุ</Label>
          <textarea
            rows={3}
            value={payload.notes || ""}
            onChange={(e) =>
              setPayload((p) => ({ ...p, notes: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2 text-base mt-1"
          />
        </div>
      </div>

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
