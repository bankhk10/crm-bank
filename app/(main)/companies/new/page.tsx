"use client";

import React from "react";
import { useRouter } from "next/navigation";
import CompanyForm from "@/components/features/companies/company-form";

export default function NewCompanyPage() {
  const router = useRouter();

  async function handleCreate(payload: any) {
    try {
      const res = await fetch("/api/companies", {
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
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">สร้างบริษัทใหม่</h5>
          </div>

          <CompanyForm
            onSubmit={async (payload) => {
              const result = await handleCreate(payload);
              if (result.success) {
                router.push("/companies");
              }
              return result;
            }}
            onCancel={() => router.push("/companies")}
            submitLabel="บันทึก"
          />
        </div>
      </div>
    </section>
  );
}
