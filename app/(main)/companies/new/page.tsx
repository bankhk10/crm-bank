"use client";

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

        // If unique constraint (409), map to field-level errors for the form
        if (res.status === 409) {
          const errMsg: string = json?.error || "";
          const issues: Record<string, string[]> = {};

          // Try to parse fields from message like: "Unique constraint failed on the fields: (`email`)"
          const m = errMsg.match(/fields:\s*\(([^)]+)\)/i);
          if (m && m[1]) {
            const raw = m[1];
            const fields = raw
              .split(",")
              .map((s) => s.replace(/[`"'\s]/g, "").trim());
            for (const f of fields) {
              if (!f) continue;
              if (f.toLowerCase() === "email") {
                issues.email = ["อีเมลนี้ถูกใช้งานแล้ว"];
              } else {
                issues[f] = [`${f} นี้ถูกใช้งานแล้ว`];
              }
            }
          } else if (/email/i.test(errMsg)) {
            // Fallback: if message mentions email, set email error
            issues.email = ["อีเมลนี้ถูกใช้งานแล้ว"];
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

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              สร้างบริษัทใหม่
            </h5>
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
