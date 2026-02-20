"use client";

import { useRouter } from "next/navigation";
import CompanyForm from "@/modules/companies/features/form/company-form";
import { createCompanyAction } from "@/modules/companies/server/actions";
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
      const res = await createCompanyAction(payload);
      if (!res.success) {
        return {
          success: false,
          issues: typeof res.issues === "object" && res.issues !== null ? (res.issues as Record<string, string[]>) : undefined,
          error: res.error
        };
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
