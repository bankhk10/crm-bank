"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SaleFormV2 } from "@/components/features/sales/sale-form-v2";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { SaleFormData } from "@/types/sales";
import { Card } from "@/components/ui/card";
import { SaleForm } from "@/components/features/sales";

export default function NewSalePage() {
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("sale.create");

  const handleSubmit = async (data: SaleFormData) => {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create sale");
    }

    const result = await res.json();

    // Show warnings if any
    if (result.stockWarnings && result.stockWarnings.length > 0) {
      console.warn("Stock warnings:", result.stockWarnings);
    }

    // Redirect to sale detail page
    router.push(`/sales/${result.sale.id}`);
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
          <SaleFormV2 onSubmit={handleSubmit} />
        </div>
      </Card>
    </section>
  );
}
