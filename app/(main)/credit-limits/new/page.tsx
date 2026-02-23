"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { CreditLimitForm, createCreditLimitAction } from "@/modules/credit-limits";

export default function NewCreditLimitPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; customerCode: string }>>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/customers?perPage=1000");
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
    return createCreditLimitAction(payload);
  }

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              สร้างวงเงินใหม่
            </h5>
          </div>

          {loading ? (
            <div className="text-center py-8">กำลังโหลดข้อมูลลูกค้า...</div>
          ) : (
            <CreditLimitForm
              initial={{ customerId: searchParams?.get("customerId") ?? undefined }}
              customers={customers}
              onSubmit={async (payload) => {
                const result = await handleCreate(payload);
                if (result.success) {
                  router.push("/credit-limits");
                }
                return result;
              }}
              onCancel={() => router.push("/credit-limits")}
              submitLabel="บันทึก"
            />
          )}
        </div>
      </div>
    </section>
  );
}
