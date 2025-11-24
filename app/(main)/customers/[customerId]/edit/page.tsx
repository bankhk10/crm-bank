"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import CustomerForm from "@/components/features/customers/customer-form";

export default function EditCustomerPage() {
  const { customerId } = useParams() as { customerId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("customer.edit");
  const canEdit = !isLoading && hasPermission("customer.edit");

  const [payload, setPayload] = useState<any>({
    customerCode: "",
    customerType: "DEALER",
    name: "",
    prefix: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    taxId: "",
    addressLine: "",
    province: "",
    district: "",
    subdistrict: "",
    postalCode: "",
    status: "ACTIVE",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        if (!res.ok) throw new Error("Failed to load customer");
        const json = await res.json();
        const src = (json && (json.customer ?? json)) || {};
        if (mounted) {
          setPayload((prev: any) => ({
            ...prev,
            customerCode: src.customerCode ?? "",
            customerType: src.customerType ?? "DEALER",
            name: src.name ?? "",
            prefix: src.prefix ?? "",
            firstName: src.firstName ?? "",
            lastName: src.lastName ?? "",
            email: src.email ?? "",
            phone: src.phone ?? "",
            taxId: src.taxId ?? "",
            addressLine: src.addressLine ?? "",
            province: src.province ?? "",
            district: src.district ?? "",
            subdistrict: src.subdistrict ?? "",
            postalCode: src.postalCode ?? "",
            status: src.status ?? "ACTIVE",
            contactPerson: src.contactPerson ?? "",
            contactPhone: src.contactPhone ?? "",
            contactEmail: src.contactEmail ?? "",
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
  }, [customerId]);

  async function handleUpdate(payloadData: any) {
    if (!canEdit) return { success: false, error: "No permission" };
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
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
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">แก้ไขข้อมูลลูกค้า</h5>
          </div>

          {(!canEdit || error) && (
            <div>
              {!canEdit && (
                <Alert variant="destructive">
                  <AlertDescription>คุณไม่มีสิทธิ์แก้ไขลูกค้านี้</AlertDescription>
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
            <CustomerForm
              initial={payload}
              onSubmit={async (body) => {
                const result = await handleUpdate(body);
                if (result.success) router.push(`/customers`);
                return result;
              }}
              onCancel={() => router.push(`/customers`)}
              submitLabel="บันทึก"
            />
          )}
        </div>
      </div>
    </section>
  );
}
