"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import TemporaryCreditLimitForm from "../../../../components/features/temporary-credit-limits/temporary-credit-limit-form";

export default function NewTemporaryCreditLimitPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; customerCode: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/customers?perPage=1000&type=DEALER");
        if (res.ok) {
          const json = await res.json();
          setCustomers(json.customers ?? []);
        }
      } catch (e) {
        console.error("Failed to load customers", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCreate(payload: any) {
    try {
      const res = await fetch("/api/temporary-credit-limits", {
        method: "POST",
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

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              สร้างคำขอวงเงินเครดิตชั่วคราว
            </h5>
          </div>

          {loading ? (
            <div className="text-center py-8">กำลังโหลดข้อมูลลูกค้า...</div>
          ) : (
            <TemporaryCreditLimitForm
              customers={customers}
              onSubmit={async (payload: any) => {
                const result = await handleCreate(payload);
                if (result.success) {
                  router.push("/temporary-credit-limits");
                }
                return result;
              }}
              onCancel={() => router.push("/temporary-credit-limits")}
              submitLabel="บันทึก"
            />
          )}
        </div>
      </div>
    </section>
  );
}
