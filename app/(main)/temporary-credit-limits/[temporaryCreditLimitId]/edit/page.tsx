"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { TemporaryCreditLimitForm } from "@/features/temporary-credit-limits";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditTemporaryCreditLimitPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.temporaryCreditLimitId as string;

  const [customers, setCustomers] = useState<Array<{ id: string; name: string; customerCode: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [customersRes, itemRes] = await Promise.all([
          fetch("/api/customers?perPage=1000&type=DEALER"),
          fetch(`/api/temporary-credit-limits/${id}`),
        ]);

        if (customersRes.ok) {
          const json = await customersRes.json();
          setCustomers(json.customers ?? []);
        }

        if (itemRes.ok) {
          const json = await itemRes.json();
          const item = json.temporaryCreditLimit;

          if (item.status === "APPROVED") {
            setError("ไม่สามารถแก้ไขวงเงินเครดิตชั่วคราวที่อนุมัติแล้ว");
            return;
          }

          setInitialData({
            customerId: item.customerId,
            requestedAmount: Number(item.requestedAmount),
            expiryDate: new Date(item.expiryDate),
            notes: item.notes || "",
          });
        } else {
          setError("ไม่พบข้อมูลวงเงินเครดิตชั่วคราว");
        }
      } catch (e) {
        console.error("Failed to load data", e);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleUpdate(payload: any) {
    try {
      const res = await fetch(`/api/temporary-credit-limits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, issues: json?.issues, error: json?.error };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: String(e) };
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow-sm sm:rounded-lg p-6">
        <div className="text-center py-8">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              แก้ไขคำขอวงเงินเครดิตชั่วคราว
            </h5>
          </div>

          <TemporaryCreditLimitForm
            initial={initialData}
            customers={customers}
            onSubmit={async (payload) => {
              const result = await handleUpdate(payload);
              if (result.success) {
                router.push("/temporary-credit-limits");
              }
              return result;
            }}
            onCancel={() => router.push("/temporary-credit-limits")}
            submitLabel="บันทึก"
          />
        </div>
      </div>
    </section>
  );
}
