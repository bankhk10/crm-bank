"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import CreditLimitForm from "@/components/features/credit-limits/credit-limit-form";

export default function EditCreditLimitPage() {
  const { creditLimitId } = useParams() as { creditLimitId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } =
    usePermission("creditlimit.edit");
  const canEdit = !isLoading && hasPermission("creditlimit.edit");

  const [payload, setPayload] = useState<any>({
    customerId: "",
    limitAmount: 0,
    effectiveDate: new Date(),
    expiryDate: undefined,
    notes: "",
  });
  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string; customerCode: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [creditLimitRes, customersRes] = await Promise.all([
          fetch(`/api/credit-limits/${creditLimitId}`),
          fetch("/api/customers?perPage=1000"),
        ]);

        if (!creditLimitRes.ok) throw new Error("Failed to load credit limit");

        const creditLimitJson = await creditLimitRes.json();
        const src =
          (creditLimitJson &&
            (creditLimitJson.creditLimit ?? creditLimitJson)) ||
          {};

        if (customersRes.ok) {
          const customersJson = await customersRes.json();
          setCustomers(customersJson.customers ?? []);
        }

        if (mounted) {
          setPayload((prev: any) => ({
            ...prev,
            customerId: src.customerId ?? "",
            limitAmount: Number(src.limitAmount) ?? 0,
            promoAmount: src.promoAmount ?? undefined,
            usedAmount: Number(src.usedAmount) ?? 0,
            availableAmount: Number(src.availableAmount) ?? 0,
            effectiveDate: src.effectiveDate
              ? new Date(src.effectiveDate)
              : new Date(),
            expiryDate: src.expiryDate ? new Date(src.expiryDate) : undefined,
            notes: src.notes ?? "",
          }));
        }
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [creditLimitId]);

  async function handleUpdate(payloadData: any) {
    if (!canEdit) return { success: false, error: "No permission" };
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch(`/api/credit-limits/${creditLimitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadData),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, issues: json?.issues, error: json?.error };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: String(e) };
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              แก้ไขข้อมูลวงเงิน
            </h5>
          </div>

          {(!canEdit || error) && (
            <div>
              {!canEdit && (
                <Alert variant="destructive">
                  <AlertDescription>
                    คุณไม่มีสิทธิ์แก้ไขวงเงินนี้
                  </AlertDescription>
                </Alert>
              )}
              {error && (
                <div className="mt-3">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-2/5 bg-slate-200 rounded" />
              <div className="mt-4 h-4 w-3/5 bg-slate-200 rounded" />
            </div>
          ) : (
            <CreditLimitForm
              initial={payload}
              customers={customers}
              onSubmit={async (body) => {
                const result = await handleUpdate(body);
                if (result.success) router.push(`/credit-limits`);
                return result;
              }}
              onCancel={() => router.push(`/credit-limits`)}
              submitLabel="บันทึก"
            />
          )}
        </div>
      </div>
    </section>
  );
}
