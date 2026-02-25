"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SaleForm } from "@/modules/sales/features/form/sale-form";
import { createSaleAction } from "@/modules/sales/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { SaleFormData } from "@/modules/sales/types";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function NewSalePage() {
  const router = useRouter();
  const { allowed, isLoading } = usePermission("sale.create");

  const handleSubmit = async (data: SaleFormData) => {
    const res = await createSaleAction(data);

    if (!res.success || !("sale" in res)) {
      throw new Error(res.error || "Failed to create sale");
    }

    const { stockWarnings } = res as any;

    // Show warnings if any
    if (stockWarnings && stockWarnings.length > 0) {
      console.warn("Stock warnings:", stockWarnings);
    }

    // Redirect to sales list page
    toast.success("สร้างรายการขายสำเร็จ");
    router.push(`/sales`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์สร้างรายการขาย</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="space-y-6 container mx-auto py-8">
      <Card>
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl border-b pb-6 leading-snug">
              {/* Desktop / Tablet */}
              <span className="hidden sm:inline">
                สร้างบันทึกการขาย ( Sales note )
              </span>

              {/* Mobile */}
              <span className="inline sm:hidden">
                สร้างบันทึกการขาย
                <br />( Sales note )
              </span>
            </h5>
          </div>
          <SaleForm onSubmit={handleSubmit} />
        </div>
      </Card>
    </section>
  );
}
