"use client";

import { useRouter } from "next/navigation";
import { CompanyForm } from "@/modules/companies";
import { toast } from "sonner";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewCompanyPage() {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermission("company.create");

  if (!isLoading && !hasPermission("company.create")) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์สร้างบริษัท</AlertDescription>
      </Alert>
    );
  }

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

          // If unique constraint (409), use structured target if available
          const targets: string[] = Array.isArray(json?.target)
            ? json.target
            : [];

          if (targets.length > 0) {
            for (const t of targets) {
              if (!t) continue;
              const f = String(t).replace(/[`"'\s]/g, "").trim();
              if (f.toLowerCase() === "email") {
                issues.email = ["อีเมลนี้ถูกใช้งานแล้ว"];
              } else if (f.toLowerCase() === "companycode") {
                issues.companyCode = ["รหัสบริษัทนี้ถูกใช้งานแล้ว"];
              } else if (f.toLowerCase() === "taxid") {
                issues.taxId = ["เลขประจำตัวผู้เสียภาษีนี้ถูกใช้งานแล้ว"];
              } else {
                issues[f] = [`${f} นี้ถูกใช้งานแล้ว`];
              }
            }
          } else {
            // Fallback: parse error message
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
              issues.email = ["อีเมลนี้ถูกใช้งานแล้ว"];
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
                toast.success("สร้างบริษัทเรียบร้อยแล้ว");
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
