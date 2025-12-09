"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import CustomerFormDealer from "@/components/features/customers/customer-form-dealer";
import CustomerFormSubdealer from "@/components/features/customers/customer-form-subdealer";
import CustomerFormFarmer from "@/components/features/customers/customer-form-farmer";
import CustomerFormBroker from "@/components/features/customers/customer-form-broker";

type CustomerType = "DEALER" | "SUBDEALER" | "FARMER" | "BROKER";

export default function NewCustomerPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<CustomerType | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = searchParams?.get("type")?.toUpperCase();
    if (!t) return;
    if (t === "DEALER" || t === "SUBDEALER" || t === "FARMER" || t === "BROKER") {
      setSelectedType(t as CustomerType);
    }
  }, [searchParams]);

  async function handleCreate(payload: any) {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));

        if (res.status === 409) {
          const errMsg: string = json?.error || "";
          const issues: Record<string, string[]> = {};

          const m = errMsg.match(/fields:\s*\(([^)]+)\)/i);
          if (m && m[1]) {
            const raw = m[1];
            const fields = raw
              .split(",")
              .map((s) => s.replace(/[`"'\s]/g, "").trim());
            for (const f of fields) {
              if (!f) continue;
              if (f.toLowerCase() === "customercode") {
                issues.customerCode = ["รหัสลูกค้านี้ถูกใช้งานแล้ว"];
              } else if (f.toLowerCase() === "email") {
                issues.email = ["อีเมลนี้ถูกใช้งานแล้ว"];
              } else {
                issues[f] = [`${f} นี้ถูกใช้งานแล้ว`];
              }
            }
          }

          return {
            success: false,
            issues: Object.keys(issues).length ? issues : json?.issues,
            error: json?.error,
          };
        }

        return { success: false, issues: json?.issues, error: json?.error };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: String(e) };
    }
  }

  const typeLabels: Record<CustomerType, string> = {
    DEALER: "ตัวแทนจำหน่าย",
    SUBDEALER: "ตัวแทนจำหน่ายย่อย",
    FARMER: "เกษตรกร",
    BROKER: "นายหน้า",
  };

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              สร้างลูกค้าใหม่
            </h5>
          </div>

          {!selectedType ? (
            <div>
              <p className="mb-4 text-center text-gray-600">
                กรุณาเลือกประเภทลูกค้าก่อน
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.keys(typeLabels) as CustomerType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className="p-4 border rounded-lg hover:shadow-md text-left"
                  >
                    <div className="text-lg font-semibold">{typeLabels[t]}</div>
                    <div className="text-sm text-gray-500">
                      สร้างข้อมูลสำหรับ {typeLabels[t]}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push("/customers")}
                  className="px-4 py-2 bg-gray-500 text-white rounded-3xl"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedType === "DEALER" && (
                <CustomerFormDealer
                  onSubmit={async (payload) => {
                    const result = await handleCreate(payload);
                    if (result.success) router.push("/customers");
                    return result;
                  }}
                  onCancel={() => setSelectedType(null)}
                  submitLabel="บันทึก"
                />
              )}

              {selectedType === "SUBDEALER" && (
                <CustomerFormSubdealer
                  onSubmit={async (payload) => {
                    const result = await handleCreate(payload);
                    if (result.success) router.push("/customers");
                    return result;
                  }}
                  onCancel={() => setSelectedType(null)}
                  submitLabel="บันทึก"
                />
              )}

              {selectedType === "FARMER" && (
                <CustomerFormFarmer
                  onSubmit={async (payload) => {
                    const result = await handleCreate(payload);
                    if (result.success) router.push("/customers");
                    return result;
                  }}
                  onCancel={() => setSelectedType(null)}
                  submitLabel="บันทึก"
                />
              )}

              {selectedType === "BROKER" && (
                <CustomerFormBroker
                  onSubmit={async (payload) => {
                    const result = await handleCreate(payload);
                    if (result.success) router.push("/customers");
                    return result;
                  }}
                  onCancel={() => setSelectedType(null)}
                  submitLabel="บันทึก"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
