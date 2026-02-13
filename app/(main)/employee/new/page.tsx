"use client";

import { EmployeeForm } from "@/features/employee";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewEmployeePage() {
  const router = useRouter();

  async function handleCreate(payload: any) {
    try {
      const res = await fetch(`/api/rbac/employees/create-with-user`, {
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
      <Card>
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl border-b pb-6">
              เพิ่มข้อมูลพนักงานใหม่
            </h5>
          </div>
          <EmployeeForm

            onSubmit={async (body) => {
              const result = await handleCreate(body);
              if (result.success) {
                toast.success("สร้างพนักงานเรียบร้อยแล้ว");
                router.push(`/employee`);
              }
              return result;
            }}
            onCancel={() => router.push(`/employee`)}
          />
        </div>
      </Card>
    </section>
  );
}
